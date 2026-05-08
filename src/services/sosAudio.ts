/**
 * sosAudio.ts — Chunked background audio capture service.
 *
 * Uses expo-av (Audio) to record in 12-second chunks.
 * Each chunk is uploaded via the existing /api/media/upload multipart endpoint,
 * then its URL is POSTed to /api/citizen/sos/{sosId}/audio.
 *
 * Works in background on both platforms when configured:
 *   Android: requires FOREGROUND_SERVICE_MICROPHONE permission + a foreground service
 *            (handled by Expo's bare workflow or expo-task-manager with a notification)
 *   iOS:     requires UIBackgroundModes: ["audio"] in Info.plist/app.json
 */

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { postSosAudioChunk } from "../auth/api";
import { readTokens, saveTokens } from "../auth/storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const CHUNK_SECONDS = 12;
const CHUNK_MS = CHUNK_SECONDS * 1000;

class SosAudioService {
  private sosId: string | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private recording: Audio.Recording | null = null;
  private running = false;

  /**
   * Start chunked audio capture for the given SOS alert.
   * Call this right after startCitizenSos() succeeds.
   */
  async start(sosId: string): Promise<void> {
    if (this.running) return;
    this.sosId = sosId;
    this.running = true;

    // Request mic permission
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      console.warn("[SosAudio] Microphone permission denied — audio capture disabled");
      this.running = false;
      return;
    }

    // Configure audio session for background recording (iOS)
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });

    this._startChunk();
  }

  /**
   * Stop all recording and clean up.
   */
  stop(): void {
    this.running = false;
    this.sosId = null;

    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }

    if (this.recording) {
      this.recording.stopAndUnloadAsync().catch(() => null);
      this.recording = null;
    }

    // Reset audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    }).catch(() => null);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _startChunk(): void {
    if (!this.running) return;
    this._recordChunk()
      .catch((err) => console.error("[SosAudio] Chunk error:", err))
      .finally(() => {
        if (this.running) {
          // Schedule next chunk
          this.chunkTimer = setTimeout(() => this._startChunk(), 500);
        }
      });
  }

  private async _recordChunk(): Promise<void> {
    if (!this.running || !this.sosId) return;

    // Start recording
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.LOW_QUALITY, // small file size for chunking
    );
    this.recording = recording;

    // Wait CHUNK_MS
    await new Promise<void>((resolve) => {
      this.chunkTimer = setTimeout(resolve, CHUNK_MS);
    });

    if (!this.running) {
      await recording.stopAndUnloadAsync().catch(() => null);
      this.recording = null;
      return;
    }

    // Stop and get file
    await recording.stopAndUnloadAsync();
    this.recording = null;

    const uri = recording.getURI();
    if (!uri) return;

    // Upload to backend
    await this._uploadChunk(uri);

    // Clean up local temp file
    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => null);
  }

  private async _uploadChunk(localUri: string): Promise<void> {
    if (!this.sosId) return;

    const sosId = this.sosId;

    try {
      // 1. Upload file to Supabase via /api/media/upload
      const tokens = await readTokens();
      if (!tokens) return;

      const fileName = `sos_audio_${sosId}_${Date.now()}.m4a`;
      const form = new FormData();
      form.append("folder", "sos-audio");
      form.append("file", {
        uri: localUri,
        name: fileName,
        type: "audio/m4a",
      } as unknown as Blob);

      let uploadRes = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        body: form,
      });

      // Handle token refresh
      if (uploadRes.status === 401) {
        const { refreshToken } = await import("../auth/api");
        const newTokens = await refreshToken({ refreshToken: tokens.refreshToken });
        await saveTokens(newTokens);
        uploadRes = await fetch(`${API_BASE_URL}/api/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${newTokens.accessToken}` },
          body: form,
        });
      }

      if (!uploadRes.ok) {
        console.error("[SosAudio] Upload failed:", uploadRes.status);
        return;
      }

      const uploadData: { data?: { url?: string } } = await uploadRes.json();
      const chunkUrl = uploadData?.data?.url;
      if (!chunkUrl) return;

      // 2. Register chunk URL with SOS alert
      await postSosAudioChunk(sosId, chunkUrl);
    } catch (err) {
      console.error("[SosAudio] _uploadChunk error:", err);
    }
  }
}

export const sosAudioService = new SosAudioService();
