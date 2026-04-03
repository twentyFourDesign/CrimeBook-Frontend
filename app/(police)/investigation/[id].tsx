import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { PoliceShell } from "../../../src/components/police/PoliceShell";
import { addCaseEvidence, addCaseSuspect, saveCaseNote, uploadCrimeMediaFile } from "../../../src/auth/api";

const statusOptions = ["Responding", "On Scene", "Investigation"] as const;
const caseStatusOptions = ["Suspect Detailed", "Case Resolved"] as const;

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

  const handleQuickCapture = async (label: string) => {
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
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

          <Text style={styles.sectionLabel}>Case Status</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, activeStatus === s && styles.statusChipActive]}
                onPress={() => setActiveStatus(s)}
                activeOpacity={0.85}
              >
                <Text style={[styles.statusChipText, activeStatus === s && styles.statusChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.caseStatusRow}>
            {caseStatusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.caseChip, activeCaseStatus === s && styles.caseChipActive]}
                onPress={() => setActiveCaseStatus(s)}
                activeOpacity={0.85}
              >
                <Text style={[styles.caseChipText, activeCaseStatus === s && styles.caseChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
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
                style={[styles.captureBtn, uploading && styles.btnDisabled]}
                activeOpacity={0.85}
                onPress={() => handleQuickCapture(item.label)}
                disabled={uploading}
              >
                <Ionicons name={item.icon} size={22} color="#4B5563" style={styles.captureIcon} />
                <Text style={styles.captureLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
            style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]}
            activeOpacity={0.9}
            disabled={saving || uploading}
            onPress={handleSaveNotes}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Investigation Notes"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  statusChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  statusChipTextActive: { color: "#FFFFFF" },
  caseStatusRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  caseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  caseChipActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  caseChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
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
});

