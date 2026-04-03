import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio, ResizeMode, Video } from "expo-av";
import { PoliceShell } from "../../../src/components/police/PoliceShell";
import { fetchPoliceCaseTimeline } from "../../../src/auth/api";
import type { PoliceCaseTimelinePayload } from "../../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

function isLikelyVideo(urlOrName: string) {
  return /\.(mp4|mov|webm|m4v)$/i.test(urlOrName);
}

function isLikelyImage(urlOrName: string) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(urlOrName);
}

function isLikelyAudio(urlOrName: string) {
  return /\.(m4a|mp3|wav|aac|caf|3gp)$/i.test(urlOrName);
}

export default function InvestigationNotesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const caseId = Array.isArray(id) ? id[0] : id;
  const [timeline, setTimeline] = useState<PoliceCaseTimelinePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingEvidenceId, setPlayingEvidenceId] = useState<string | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  const load = useCallback(async () => {
    if (!caseId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchPoliceCaseTimeline(caseId);
      setTimeline(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load investigation timeline");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      const snd = audioRef.current;
      audioRef.current = null;
      if (snd) {
        snd.unloadAsync().catch(() => null);
      }
    };
  }, []);

  const sortedEvidence = useMemo(() => timeline?.evidence ?? [], [timeline?.evidence]);

  const playPauseAudio = async (evidenceId: string, fileUrl: string) => {
    if (playingEvidenceId === evidenceId && audioRef.current) {
      await audioRef.current.pauseAsync().catch(() => null);
      setPlayingEvidenceId(null);
      return;
    }
    if (audioRef.current) {
      await audioRef.current.unloadAsync().catch(() => null);
      audioRef.current = null;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: fileUrl }, { shouldPlay: true });
      audioRef.current = sound;
      setPlayingEvidenceId(evidenceId);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || status.didJustFinish) {
          setPlayingEvidenceId(null);
        }
      });
    } catch {
      setPlayingEvidenceId(null);
    }
  };

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Investigation Notes</Text>
            <Text style={styles.sub}>Case ID: {caseId ?? "—"}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && timeline && (
          <>
            <Text style={styles.section}>Field notes ({timeline.notes.length})</Text>
            {timeline.notes.map((n) => (
              <View key={n.id} style={styles.card}>
                <Text style={styles.cardTitle}>{n.officerName}</Text>
                <Text style={styles.cardText}>{n.content}</Text>
                <Text style={styles.cardMeta}>
                  {formatEnum(n.noteType)} • {new Date(n.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}

            <Text style={styles.section}>Evidence ({sortedEvidence.length})</Text>
            {sortedEvidence.map((e) => {
              const target = `${e.fileName} ${e.fileUrl}`;
              const showImage = e.evidenceType === "PHOTO" || isLikelyImage(target);
              const showVideo = e.evidenceType === "VIDEO" || isLikelyVideo(target);
              const showAudio = e.evidenceType === "STATEMENT" || isLikelyAudio(target);

              return (
                <View key={e.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{e.fileName}</Text>
                  <Text style={styles.cardMeta}>
                    {formatEnum(e.evidenceType)} • {new Date(e.capturedAt).toLocaleString()}
                  </Text>

                  {showImage ? (
                    <Image source={{ uri: e.fileUrl }} style={styles.imagePreview} resizeMode="cover" />
                  ) : null}

                  {showVideo ? (
                    <Video
                      source={{ uri: e.fileUrl }}
                      style={styles.videoPreview}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                    />
                  ) : null}

                  {showAudio ? (
                    <TouchableOpacity
                      style={styles.audioBtn}
                      activeOpacity={0.85}
                      onPress={() => playPauseAudio(e.id, e.fileUrl)}
                    >
                      <Ionicons
                        name={playingEvidenceId === e.id ? "pause-circle-outline" : "play-circle-outline"}
                        size={18}
                        color="#1D4ED8"
                      />
                      <Text style={styles.audioBtnText}>
                        {playingEvidenceId === e.id ? "Pause audio" : "Play audio"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {!showImage && !showVideo && !showAudio ? (
                    <TouchableOpacity
                      style={styles.openBtn}
                      activeOpacity={0.85}
                      onPress={() => Linking.openURL(e.fileUrl).catch(() => null)}
                    >
                      <Text style={styles.openBtnText}>Open attachment</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}

            <Text style={styles.section}>Suspect tags ({timeline.suspects.length})</Text>
            {timeline.suspects.map((s) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.cardTitle}>{s.alias || "Unaliased"}</Text>
                <Text style={styles.cardText}>{s.description}</Text>
                <Text style={styles.cardMeta}>{new Date(s.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { fontSize: 18, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 12, color: "#64748B" },
  center: { paddingVertical: 24, alignItems: "center" },
  error: { color: "#B91C1C", fontSize: 13, marginBottom: 8 },
  section: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 10, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  cardText: { fontSize: 13, color: "#334155", marginTop: 6 },
  cardMeta: { fontSize: 11, color: "#64748B", marginTop: 8 },
  imagePreview: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#E2E8F0",
  },
  videoPreview: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#0F172A",
  },
  audioBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioBtnText: { color: "#1D4ED8", fontSize: 13, fontWeight: "600" },
  openBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F8FAFC",
  },
  openBtnText: { color: "#334155", fontSize: 12, fontWeight: "600" },
});

