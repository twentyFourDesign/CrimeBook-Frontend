import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { PoliceShell } from "../../../src/components/police/PoliceShell";
import {
  addCaseEvidence,
  addCaseSuspect,
  createPoliceCaseAppeal,
  fetchCaseMessages,
  fetchPoliceCase,
  fetchPoliceIncidentDetail,
  saveCaseNote,
  sendCaseMessage,
  updatePoliceCaseStatus,
  uploadCrimeMediaFile,
} from "../../../src/auth/api";
import type { ReportMessageItem } from "../../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

function isPoliceSenderRole(role: string) {
  return role === "POLICE_OFFICER" || role === "POLICE_COMMAND";
}

const statusOptions = ["Responding", "On Scene", "Investigation"] as const;
const caseStatusOptions = ["Suspect Detailed", "Case Resolved"] as const;

function mapCaseStatusFromDb(status: string): {
  top: (typeof statusOptions)[number];
  bottom: (typeof caseStatusOptions)[number] | "";
} {
  switch (status) {
    case "RESPONDING":
      return { top: "Responding", bottom: "" };
    case "SUSPECT_DETAINED":
    case "SUSPECT_ARRESTED":
      return { top: "Investigation", bottom: "Suspect Detailed" };
    case "CLOSED":
    case "COLD_CASE":
      return { top: "Investigation", bottom: "Case Resolved" };
    case "INVESTIGATING":
      return { top: "Investigation", bottom: "" };
    case "OPEN":
      return { top: "On Scene", bottom: "" };
    default:
      return { top: "On Scene", bottom: "" };
  }
}

function mapUiToCaseStatus(
  top: (typeof statusOptions)[number],
  bottom: (typeof caseStatusOptions)[number] | ""
): string {
  if (bottom === "Case Resolved") return "CLOSED";
  if (bottom === "Suspect Detailed") return "SUSPECT_DETAINED";
  if (top === "Responding") return "RESPONDING";
  if (top === "On Scene") return "INVESTIGATING";
  return "INVESTIGATING";
}

const quickCapture = [
  { icon: "camera-outline" as const, label: "Photo" },
  { icon: "mic-outline" as const, label: "Audio" },
  { icon: "document-text-outline" as const, label: "Document" },
  { icon: "cloud-upload-outline" as const, label: "Upload" },
];

export default function Investigation() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const caseId = Array.isArray(id) ? id[0] : id;
  const [activeStatus, setActiveStatus] = useState<(typeof statusOptions)[number]>("On Scene");
  const [activeCaseStatus, setActiveCaseStatus] = useState<(typeof caseStatusOptions)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [suspectTag, setSuspectTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [caseStatusLoading, setCaseStatusLoading] = useState(true);
  const [refreshingCase, setRefreshingCase] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [threadMessages, setThreadMessages] = useState<ReportMessageItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadSending, setThreadSending] = useState(false);
  const [threadInput, setThreadInput] = useState("");
  const [threadError, setThreadError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [linkedReportId, setLinkedReportId] = useState<string | null>(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealTitle, setAppealTitle] = useState("");
  const [appealDescription, setAppealDescription] = useState("");
  const [appealRadiusKm, setAppealRadiusKm] = useState("5");
  const [appealSaving, setAppealSaving] = useState(false);

  const loadCaseStatus = useCallback(
    async (mode?: "refresh") => {
      if (!caseId) {
        setCaseStatusLoading(false);
        return;
      }
      if (mode === "refresh") setRefreshingCase(true);
      else setCaseStatusLoading(true);
      try {
        const { case: c } = await fetchPoliceCase(caseId);
        setLinkedReportId(c.reportId);
        const mapped = mapCaseStatusFromDb(c.status);
        setActiveStatus(mapped.top);
        setActiveCaseStatus(mapped.bottom);
        if (mode === "refresh") {
          try {
            const { messages } = await fetchCaseMessages(caseId);
            setThreadMessages(messages);
            setThreadError(null);
          } catch {
            /* keep existing thread on refresh failure */
          }
        }
      } catch {
        // keep local defaults if fetch fails
      } finally {
        setCaseStatusLoading(false);
        setRefreshingCase(false);
      }
    },
    [caseId]
  );

  useEffect(() => {
    loadCaseStatus();
  }, [loadCaseStatus]);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    setThreadError(null);
    setThreadLoading(true);
    fetchCaseMessages(caseId)
      .then(({ messages }) => {
        if (!cancelled) setThreadMessages(messages);
      })
      .catch((e) => {
        if (!cancelled) {
          setThreadError(e instanceof Error ? e.message : "Could not load messages");
          setThreadMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setThreadLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  useEffect(() => {
    return () => {
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) {
        rec.stopAndUnloadAsync().catch(() => null);
      }
    };
  }, []);

  const statusControlsDisabled = caseStatusLoading || statusSaving;

  const submitAppeal = async () => {
    if (!caseId || !linkedReportId) {
      Alert.alert("Error", "Case or report not loaded yet.");
      return;
    }
    if (!appealTitle.trim() || !appealDescription.trim()) {
      Alert.alert("Required", "Enter title and description.");
      return;
    }
    const rKm = Number(appealRadiusKm);
    if (!Number.isFinite(rKm) || rKm <= 0 || rKm > 500) {
      Alert.alert("Radius", "Enter a radius between 1 and 500 km.");
      return;
    }
    try {
      setAppealSaving(true);
      const { report } = await fetchPoliceIncidentDetail(linkedReportId);
      await createPoliceCaseAppeal(caseId, {
        title: appealTitle.trim(),
        description: appealDescription.trim(),
        latitude: report.latitude,
        longitude: report.longitude,
        radiusKm: rKm,
      });
      setAppealOpen(false);
      Alert.alert("Published", "Public appeal created.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not create appeal");
    } finally {
      setAppealSaving(false);
    }
  };

  const handleOperationalStatusPress = async (s: (typeof statusOptions)[number]) => {
    if (!caseId || statusControlsDisabled) return;
    setActiveStatus(s);
    setActiveCaseStatus("");
    try {
      setStatusSaving(true);
      await updatePoliceCaseStatus(caseId, mapUiToCaseStatus(s, ""));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not update status";
      Alert.alert("Error", message);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleOutcomeStatusPress = async (s: (typeof caseStatusOptions)[number]) => {
    if (!caseId || statusControlsDisabled) return;
    setActiveCaseStatus(s);
    try {
      setStatusSaving(true);
      await updatePoliceCaseStatus(caseId, mapUiToCaseStatus(activeStatus, s));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not update status";
      Alert.alert("Error", message);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!caseId) {
      Alert.alert("Missing case", "No case ID in the URL.");
      return;
    }

    if (!notes.trim()) {
      Alert.alert("Add some notes", "Please enter a note before saving.");
      return;
    }

    try {
      setSaving(true);
      await saveCaseNote(caseId, notes.trim());
      Alert.alert("Saved", "Investigation notes saved to the case.");
      setNotes("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save notes";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const inferEvidenceType = (mimeType?: string) => {
    if (!mimeType) return "OTHER" as const;
    if (mimeType.startsWith("image/")) return "PHOTO" as const;
    if (mimeType.startsWith("video/")) return "VIDEO" as const;
    if (mimeType.startsWith("audio/")) return "STATEMENT" as const;
    return "DOCUMENT" as const;
  };

  const uploadPickedAsset = async (uri: string, mimeType: string, fileName: string) => {
    if (!caseId) {
      Alert.alert("Missing case", "No case ID in the URL.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadCrimeMediaFile({
        uri,
        name: fileName,
        mimeType,
        folder: "reports",
      });
      await addCaseEvidence({
        caseId,
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSizeBytes: uploaded.fileSizeBytes,
        evidenceType: inferEvidenceType(uploaded.mimeType),
      });
      Alert.alert("Uploaded", "Evidence added to this case.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      Alert.alert("Error", message);
    } finally {
      setUploading(false);
    }
  };

  const stopMicRecordingAndUpload = async () => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsRecordingAudio(false);
    if (!rec) return;
    setUploading(true);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) throw new Error("No audio file produced");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => null);
      const ext = uri.split(".").pop()?.toLowerCase();
      const safeExt = ext && ext.length <= 5 ? ext : "m4a";
      const mime =
        safeExt === "m4a" || safeExt === "mp4"
          ? "audio/mp4"
          : safeExt === "caf"
            ? "audio/x-caf"
            : safeExt === "3gp"
              ? "audio/3gpp"
              : "audio/m4a";
      const fileName = `field-audio-${Date.now()}.${safeExt}`;
      await uploadPickedAsset(uri, mime, fileName);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save recording";
      Alert.alert("Error", message);
    } finally {
      setUploading(false);
    }
  };

  const startMicRecording = async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Microphone access is needed to record audio evidence.");
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setIsRecordingAudio(true);
  };

  const handleAudioQuickCapture = async () => {
    if (uploading && !isRecordingAudio) return;
    if (isRecordingAudio) {
      await stopMicRecordingAndUpload();
      return;
    }
    try {
      await startMicRecording();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not start recording";
      Alert.alert("Error", message);
    }
  };

  const handleQuickCapture = async (label: string) => {
    if (uploading && label !== "Audio") return;
    if (label === "Audio") {
      await handleAudioQuickCapture();
      return;
    }
    if (isRecordingAudio) {
      Alert.alert("Recording in progress", "Stop the audio recording first (tap Audio again).");
      return;
    }
    if (uploading) return;
    if (label === "Photo") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Camera permission is needed to capture a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await uploadPickedAsset(
        asset.uri,
        asset.mimeType || "image/jpeg",
        asset.fileName || `photo-${Date.now()}.jpg`
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.9,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadPickedAsset(
      asset.uri,
      asset.mimeType || "application/octet-stream",
      asset.fileName || `evidence-${Date.now()}`
    );
  };

  const sendReporterMessage = async () => {
    const text = threadInput.trim();
    if (!text || !caseId || threadSending) return;
    setThreadSending(true);
    setThreadError(null);
    try {
      const { message } = await sendCaseMessage(caseId, text);
      setThreadMessages((prev) => [...prev, message]);
      setThreadInput("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not send");
    } finally {
      setThreadSending(false);
    }
  };

  const handleAddTag = async () => {
    if (!caseId) {
      Alert.alert("Missing case", "No case ID in the URL.");
      return;
    }
    if (!suspectTag.trim()) {
      Alert.alert("Add tag", "Enter suspect details before adding.");
      return;
    }
    try {
      setSavingTag(true);
      await addCaseSuspect(caseId, suspectTag.trim());
      setSuspectTag("");
      Alert.alert("Saved", "Suspect tag added.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save suspect tag";
      Alert.alert("Error", message);
    } finally {
      setSavingTag(false);
    }
  };

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshingCase} onRefresh={() => loadCaseStatus("refresh")} />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color="#111827" />
            </TouchableOpacity>
            <View>
              <Text style={styles.heading}>Investigation</Text>
              <Text style={styles.subheading}>Case ID: {caseId ?? "—"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.timelineBtn}
            activeOpacity={0.85}
            onPress={() =>
              caseId
                ? router.push({
                    pathname: "/(police)/investigation-notes/[id]",
                    params: { id: caseId },
                  })
                : null
            }
          >
            <Ionicons name="list-outline" size={16} color="#1D4ED8" />
            <Text style={styles.timelineBtnText}>Investigation Notes Tab</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appealBtn}
            activeOpacity={0.85}
            onPress={() => {
              setAppealTitle("");
              setAppealDescription("");
              setAppealRadiusKm("5");
              setAppealOpen(true);
            }}
          >
            <Ionicons name="megaphone-outline" size={16} color="#B45309" />
            <Text style={styles.appealBtnText}>Public appeal</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Case Status</Text>
          {caseStatusLoading ? (
            <Text style={styles.statusLoadingText}>Loading case status…</Text>
          ) : null}
          <View style={styles.statusRow}>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  activeStatus === s && styles.statusChipActive,
                  statusControlsDisabled && styles.statusChipDisabled,
                ]}
                onPress={() => handleOperationalStatusPress(s)}
                activeOpacity={0.85}
                disabled={statusControlsDisabled}
              >
                <Text style={[styles.statusChipText, activeStatus === s && styles.statusChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.caseStatusRow}>
            {caseStatusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.caseChip,
                  activeCaseStatus === s && styles.caseChipActive,
                  statusControlsDisabled && styles.statusChipDisabled,
                ]}
                onPress={() => handleOutcomeStatusPress(s)}
                activeOpacity={0.85}
                disabled={statusControlsDisabled}
              >
                <Text style={[styles.caseChipText, activeCaseStatus === s && styles.caseChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {statusSaving ? <Text style={styles.statusSavingHint}>Updating status…</Text> : null}

          <Text style={styles.sectionLabel}>Reporter chat</Text>
          <Text style={styles.threadHint}>
            Same thread the reporter sees on their report. Messages are tied to the underlying incident report.
          </Text>
          {threadLoading ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
          {threadError ? <Text style={styles.threadError}>{threadError}</Text> : null}
          <View style={styles.threadList}>
            {threadMessages.map((m) => {
              const fromOfficer = isPoliceSenderRole(m.senderRole);
              return (
                <View
                  key={m.id}
                  style={[styles.msgRow, fromOfficer ? styles.msgRowYou : styles.msgRowOther]}
                >
                  <View style={[styles.msgBubble, fromOfficer ? styles.msgBubbleYou : styles.msgBubbleOther]}>
                    <Text style={styles.msgSender}>
                      {fromOfficer ? "You" : m.senderName} · {formatEnum(m.senderRole)}
                    </Text>
                    <Text style={styles.msgBody}>{m.body}</Text>
                    <Text style={styles.msgTime}>{new Date(m.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.threadComposer}>
            <TextInput
              style={styles.threadInput}
              placeholder="Message the reporter…"
              placeholderTextColor="#9CA3AF"
              value={threadInput}
              onChangeText={setThreadInput}
              multiline
              maxLength={8000}
              editable={!threadSending}
            />
            <TouchableOpacity
              style={[styles.threadSendBtn, threadSending && styles.threadSendBtnDisabled]}
              onPress={sendReporterMessage}
              disabled={threadSending || !threadInput.trim()}
              activeOpacity={0.85}
            >
              {threadSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Field Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add investigation notes..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.sectionLabel}>Quick Capture</Text>
          <View style={styles.captureRow}>
            {quickCapture.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.captureBtn,
                  (uploading || isRecordingAudio) && item.label !== "Audio" && styles.btnDisabled,
                  item.label === "Audio" && isRecordingAudio && styles.captureBtnRecording,
                ]}
                activeOpacity={0.85}
                onPress={() => handleQuickCapture(item.label)}
                disabled={Boolean(
                  (uploading && !isRecordingAudio && item.label !== "Audio") ||
                    (isRecordingAudio && item.label !== "Audio")
                )}
              >
                <Ionicons
                  name={item.label === "Audio" && isRecordingAudio ? "stop-circle" : item.icon}
                  size={22}
                  color={item.label === "Audio" && isRecordingAudio ? "#DC2626" : "#4B5563"}
                  style={styles.captureIcon}
                />
                <Text style={styles.captureLabel}>
                  {item.label === "Audio" && isRecordingAudio ? "Stop" : item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {isRecordingAudio ? (
            <Text style={styles.recordingHint}>Recording… Tap Stop (Audio) again to upload.</Text>
          ) : null}
          {uploading ? <Text style={styles.helperText}>Uploading evidence...</Text> : null}

          <Text style={styles.sectionLabel}>Suspect Tags</Text>
          <View style={styles.suspectRow}>
            <TextInput
              style={styles.suspectInput}
              placeholder="Add suspect description..."
              placeholderTextColor="#9CA3AF"
              value={suspectTag}
              onChangeText={setSuspectTag}
            />
            <TouchableOpacity
              style={[styles.addBtn, savingTag && styles.btnDisabled]}
              activeOpacity={0.9}
              onPress={handleAddTag}
              disabled={savingTag}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, (saving || uploading || isRecordingAudio) && styles.saveBtnDisabled]}
            activeOpacity={0.9}
            disabled={saving || uploading || isRecordingAudio}
            onPress={handleSaveNotes}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Investigation Notes"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={appealOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Public appeal</Text>
            <Text style={styles.modalHint}>Broadcast to the community near the incident location.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              value={appealTitle}
              onChangeText={setAppealTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="What should the public look for?"
              placeholderTextColor="#9CA3AF"
              value={appealDescription}
              onChangeText={setAppealDescription}
              multiline
              textAlignVertical="top"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Radius (km)"
              placeholderTextColor="#9CA3AF"
              value={appealRadiusKm}
              onChangeText={setAppealRadiusKm}
              keyboardType="decimal-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setAppealOpen(false)}
                disabled={appealSaving}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={submitAppeal}
                disabled={appealSaving}
              >
                {appealSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Publish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: { fontSize: 17, fontWeight: "700", color: "#111827" },
  subheading: { fontSize: 12, color: "#6B7280" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10 },
  timelineBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  timelineBtnText: { color: "#1D4ED8", fontSize: 12, fontWeight: "700" },
  appealBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  appealBtnText: { color: "#B45309", fontSize: 12, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  modalHint: { fontSize: 12, color: "#6B7280", marginTop: 6, marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 10,
  },
  modalInputMultiline: { minHeight: 100 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnGhost: { backgroundColor: "#F3F4F6" },
  modalBtnGhostText: { fontWeight: "700", color: "#374151" },
  modalBtnPrimary: { backgroundColor: "#2563EB" },
  modalBtnPrimaryText: { fontWeight: "700", color: "#fff" },
  statusLoadingText: { fontSize: 12, color: "#64748B", marginBottom: 8 },
  statusSavingHint: { fontSize: 12, color: "#64748B", marginTop: -12, marginBottom: 14 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, rowGap: 8, marginBottom: 8 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  statusChipDisabled: { opacity: 0.55 },
  statusChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  statusChipTextActive: { color: "#FFFFFF" },
  caseStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    rowGap: 10,
    marginBottom: 22,
  },
  caseChip: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  caseChipActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  caseChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280", textAlign: "center" },
  caseChipTextActive: { color: "#2563EB" },
  notesInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    height: 110,
    backgroundColor: "#F9FAFB",
    marginBottom: 22,
  },
  captureRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  captureBtn: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  captureIcon: { marginBottom: 4 },
  captureLabel: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  captureBtnRecording: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  recordingHint: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
    marginTop: -14,
    marginBottom: 14,
  },
  suspectRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  suspectInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: -14,
    marginBottom: 14,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  threadHint: { fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 18 },
  threadError: { fontSize: 12, color: "#B91C1C", marginBottom: 8 },
  threadList: { marginBottom: 12 },
  msgRow: { marginBottom: 8, flexDirection: "row" },
  msgRowYou: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  msgBubble: {
    maxWidth: "88%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  msgBubbleYou: { backgroundColor: "#DBEAFE", borderWidth: 1, borderColor: "#BFDBFE" },
  msgBubbleOther: { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  msgSender: { fontSize: 11, fontWeight: "700", color: "#475569", marginBottom: 4 },
  msgBody: { fontSize: 14, color: "#0F172A", lineHeight: 20 },
  msgTime: { fontSize: 10, color: "#94A3B8", marginTop: 6 },
  threadComposer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 22 },
  threadInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  threadSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  threadSendBtnDisabled: { opacity: 0.6 },
});

