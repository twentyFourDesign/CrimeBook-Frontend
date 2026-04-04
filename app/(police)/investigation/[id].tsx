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
  Platform,
  KeyboardAvoidingView,
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
  { icon: "camera-outline" as const, label: "Photo", color: "#1D4ED8" },
  { icon: "mic-outline" as const, label: "Audio", color: "#EF4444" },
  { icon: "document-text-outline" as const, label: "Note", color: "#F59E0B" },
  { icon: "cloud-upload-outline" as const, label: "Upload", color: "#10B981" },
];

export default function InvestigationDetail() {
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
  const [caseLoading, setCaseLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [threadMessages, setThreadMessages] = useState<ReportMessageItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadSending, setThreadSending] = useState(false);
  const [threadInput, setThreadInput] = useState("");
  const [threadError, setThreadError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [linkedReportId, setLinkedReportId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState("");
  
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealTitle, setAppealTitle] = useState("");
  const [appealDescription, setAppealDescription] = useState("");
  const [appealRadiusKm, setAppealRadiusKm] = useState("5");
  const [appealSaving, setAppealSaving] = useState(false);

  const load = useCallback(
    async (mode?: "refresh") => {
      if (!caseId) return;
      if (mode === "refresh") setRefreshing(true);
      else setCaseLoading(true);
      try {
        const { case: c } = await fetchPoliceCase(caseId);
        setLinkedReportId(c.reportId);
        setCaseNumber(c.caseNumber || caseId.slice(-8).toUpperCase());
        const mapped = mapCaseStatusFromDb(c.status);
        setActiveStatus(mapped.top);
        setActiveCaseStatus(mapped.bottom);
        
        const { messages } = await fetchCaseMessages(caseId);
        setThreadMessages(messages);
      } catch (e) {
        console.error(e);
      } finally {
        setCaseLoading(false);
        setRefreshing(false);
      }
    },
    [caseId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleOperationalStatusPress = async (s: (typeof statusOptions)[number]) => {
    if (!caseId || statusSaving) return;
    setActiveStatus(s);
    setActiveCaseStatus("");
    try {
      setStatusSaving(true);
      await updatePoliceCaseStatus(caseId, mapUiToCaseStatus(s, ""));
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Status update failed");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleOutcomeStatusPress = async (s: (typeof caseStatusOptions)[number]) => {
    if (!caseId || statusSaving) return;
    setActiveCaseStatus(s);
    try {
      setStatusSaving(true);
      await updatePoliceCaseStatus(caseId, mapUiToCaseStatus(activeStatus, s));
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Status update failed");
    } finally {
      setStatusSaving(false);
    }
  };

  const submitAppeal = async () => {
    if (!caseId || !linkedReportId) return;
    if (!appealTitle.trim() || !appealDescription.trim()) {
      Alert.alert("Required", "Please fill title and description");
      return;
    }
    setAppealSaving(true);
    try {
      const { report } = await fetchPoliceIncidentDetail(linkedReportId);
      await createPoliceCaseAppeal(caseId, {
        title: appealTitle.trim(),
        description: appealDescription.trim(),
        latitude: report.latitude,
        longitude: report.longitude,
        radiusKm: Number(appealRadiusKm) || 5,
      });
      setAppealOpen(false);
      Alert.alert("Success", "Public appeal broadcasted.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create appeal");
    } finally {
      setAppealSaving(false);
    }
  };

  const sendReporterMessage = async () => {
    const text = threadInput.trim();
    if (!text || !caseId || threadSending) return;
    setThreadSending(true);
    try {
      const { message } = await sendCaseMessage(caseId, text);
      setThreadMessages((prev) => [...prev, message]);
      setThreadInput("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send");
    } finally {
      setThreadSending(false);
    }
  };

  const handleQuickCapture = async (label: string) => {
    if (uploading) return;
    if (label === "Photo") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (res.canceled) return;
      await uploadEvidence(res.assets[0].uri, res.assets[0].mimeType || "image/jpeg", "field_photo.jpg");
    } else if (label === "Upload") {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
      if (res.canceled) return;
      await uploadEvidence(res.assets[0].uri, res.assets[0].mimeType || "image/jpeg", "uploaded_evidence");
    } else if (label === "Audio") {
      if (isRecordingAudio) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } else if (label === "Note") {
      // Focus notes input or open note modal
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecordingAudio(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsRecordingAudio(false);
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (uri) await uploadEvidence(uri, "audio/m4a", "audio_statement.m4a");
    } catch (e) {
      console.error(e);
    }
  };

  const uploadEvidence = async (uri: string, mime: string, name: string) => {
    if (!caseId) return;
    setUploading(true);
    try {
      const uploaded = await uploadCrimeMediaFile({ uri, name, mimeType: mime, folder: "reports" });
      await addCaseEvidence({
        caseId,
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSizeBytes: uploaded.fileSizeBytes,
        evidenceType: mime.startsWith("image") ? "PHOTO" : "OTHER",
      });
      Alert.alert("Success", "Evidence recorded.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.wrapper}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Case Investigation</Text>
            <Text style={styles.subTitle}>#{caseNumber}</Text>
          </View>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => caseId && router.push({ pathname: "/(police)/investigation-notes/[id]", params: { id: caseId } })}
          >
            <Ionicons name="journal-outline" size={20} color="#1D4ED8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
        >
          {caseLoading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#1D4ED8" />
              <Text style={styles.loadingText}>Accessing secure case files...</Text>
            </View>
          ) : (
            <>
              {/* Status Section */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                   <Ionicons name="shield-outline" size={18} color="#1D4ED8" />
                   <Text style={styles.sectionTitle}>Operational Status</Text>
                </View>
                <View style={styles.statusGrid}>
                  {statusOptions.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusChip, activeStatus === s && styles.statusChipActive]}
                      onPress={() => handleOperationalStatusPress(s)}
                      disabled={statusSaving}
                    >
                      <Text style={[styles.statusChipText, activeStatus === s && styles.statusChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[styles.statusGrid, { marginTop: 12 }]}>
                  {caseStatusOptions.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.outcomeChip, activeCaseStatus === s && styles.outcomeChipActive]}
                      onPress={() => handleOutcomeStatusPress(s)}
                      disabled={statusSaving}
                    >
                      <Text style={[styles.outcomeChipText, activeCaseStatus === s && styles.outcomeChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                   <Ionicons name="flash-outline" size={18} color="#F59E0B" />
                   <Text style={styles.sectionTitle}>Quick Capture</Text>
                </View>
                <View style={styles.actionRow}>
                  {quickCapture.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={styles.captureBtn}
                      onPress={() => handleQuickCapture(item.label)}
                      disabled={uploading}
                    >
                      <View style={[styles.captureIconBox, { backgroundColor: item.color + "1A" }]}>
                        <Ionicons 
                          name={item.label === "Audio" && isRecordingAudio ? "stop-circle" : item.icon} 
                          size={24} 
                          color={item.label === "Audio" && isRecordingAudio ? "#EF4444" : item.color} 
                        />
                      </View>
                      <Text style={styles.captureLabel}>{item.label === "Audio" && isRecordingAudio ? "Recording" : item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Chat Section */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                   <Ionicons name="chatbubbles-outline" size={18} color="#10B981" />
                   <Text style={styles.sectionTitle}>Reporter Communication</Text>
                </View>
                <View style={styles.chatBox}>
                  {threadMessages.length === 0 ? (
                    <Text style={styles.emptyChat}>Start a secure thread with the reporter.</Text>
                  ) : (
                    threadMessages.map((m) => {
                      const isMe = isPoliceSenderRole(m.senderRole);
                      return (
                        <View key={m.id} style={[styles.messageRow, isMe ? styles.messageMe : styles.messageOther]}>
                          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                            <Text style={[styles.senderName, isMe ? styles.senderMe : styles.senderOther]}>
                              {isMe ? "YOU" : m.senderName.toUpperCase()}
                            </Text>
                            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{m.body}</Text>
                            <Text style={styles.messageTime}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
                <View style={styles.chatInputRow}>
                   <TextInput
                     style={styles.chatInput}
                     placeholder="Type intelligence..."
                     value={threadInput}
                     onChangeText={setThreadInput}
                     multiline
                   />
                   <TouchableOpacity 
                     style={[styles.sendBtn, !threadInput.trim() && styles.sendBtnDisabled]}
                     onPress={sendReporterMessage}
                     disabled={!threadInput.trim() || threadSending}
                   >
                     {threadSending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                   </TouchableOpacity>
                </View>
              </View>

              {/* Public Appeal */}
              <TouchableOpacity 
                style={styles.appealBanner}
                onPress={() => setAppealOpen(true)}
                activeOpacity={0.9}
              >
                <View style={styles.appealIconBox}>
                   <Ionicons name="megaphone" size={24} color="#fff" />
                </View>
                <View style={styles.appealContent}>
                   <Text style={styles.appealTitle}>Broadcast Public Appeal</Text>
                   <Text style={styles.appealSub}>Request community assistance in this area</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Field Notes Area */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                   <Ionicons name="create-outline" size={18} color="#475569" />
                   <Text style={styles.sectionTitle}>Incident Log Notes</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Record observations, suspect descriptions, or scene details..."
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
                <TouchableOpacity 
                  style={[styles.saveBtn, !notes.trim() && styles.saveBtnDisabled]}
                  onPress={async () => {
                    if (!caseId || !notes.trim() || saving) return;
                    setSaving(true);
                    try {
                      await saveCaseNote(caseId, notes.trim());
                      setNotes("");
                      Alert.alert("Recorded", "Notes added to case log.");
                    } catch (e) {
                      Alert.alert("Error", "Failed to save note");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={!notes.trim() || saving}
                >
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Record Entry</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Appeal Modal */}
        <Modal visible={appealOpen} transparent animationType="slide">
           <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                 <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Public Appeal</Text>
                    <TouchableOpacity onPress={() => setAppealOpen(false)}>
                       <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                 </View>
                 <Text style={styles.modalLabel}>Broadcast Title</Text>
                 <TextInput 
                   style={styles.modalInput} 
                   value={appealTitle} 
                   onChangeText={setAppealTitle}
                   placeholder="e.g. Seeking witnesses for RO-2024..."
                 />
                 <Text style={styles.modalLabel}>Description & Instructions</Text>
                 <TextInput 
                   style={[styles.modalInput, styles.modalArea]} 
                   value={appealDescription} 
                   onChangeText={setAppealDescription}
                   multiline
                   placeholder="Describe what the community should report..."
                 />
                 <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalCancel} onPress={() => setAppealOpen(false)}>
                       <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalSubmit, appealSaving && styles.modalSubmitDisabled]} 
                      onPress={submitAppeal}
                      disabled={appealSaving}
                    >
                       {appealSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Broadcast Now</Text>}
                    </TouchableOpacity>
                 </View>
              </View>
           </View>
        </Modal>
      </KeyboardAvoidingView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { alignItems: "center" },
  title: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  subTitle: { fontSize: 12, fontWeight: "600", color: "#64748B", marginTop: 2 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  container: { padding: 20 },
  loadingBox: { paddingVertical: 100, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748B", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#1E293B", letterSpacing: 0.5 },

  statusGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusChipActive: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
  statusChipText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  statusChipTextActive: { color: "#fff" },

  outcomeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  outcomeChipActive: { backgroundColor: "#D97706", borderColor: "#D97706" },
  outcomeChipText: { fontSize: 13, fontWeight: "700", color: "#B45309" },
  outcomeChipTextActive: { color: "#fff" },

  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  captureBtn: { alignItems: "center", gap: 8 },
  captureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  captureLabel: { fontSize: 11, fontWeight: "700", color: "#64748B" },

  chatBox: {
    maxHeight: 300,
    marginBottom: 16,
    gap: 12,
  },
  emptyChat: { fontSize: 13, color: "#94A3B8", textAlign: "center", fontStyle: "italic", padding: 20 },
  messageRow: { flexDirection: "row", marginBottom: 8 },
  messageMe: { justifyContent: "flex-end" },
  messageOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: "#1D4ED8",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#F1F5F9",
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 9, fontWeight: "900", marginBottom: 4, letterSpacing: 0.5 },
  senderMe: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  senderOther: { color: "#64748B" },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTextMe: { color: "#fff" },
  messageTextOther: { color: "#1E293B" },
  messageTime: { fontSize: 9, color: "rgba(0,0,0,0.3)", marginTop: 4, textAlign: "right" },

  chatInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F8FAFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#94A3B8" },

  appealBanner: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  appealIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  appealContent: { flex: 1 },
  appealTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  appealSub: { fontSize: 11, color: "#94A3B8", marginTop: 2 },

  notesInput: {
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    height: 120,
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: "#1E293B",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  modalLabel: { fontSize: 12, fontWeight: "800", color: "#64748B", marginBottom: 8 },
  modalInput: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    color: "#1E293B",
  },
  modalArea: { height: 120, textAlignVertical: "top" },
  modalFooter: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  modalSubmit: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#1D4ED8",
  },
  modalSubmitDisabled: { opacity: 0.5 },
  modalSubmitText: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
