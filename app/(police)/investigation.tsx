import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";

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
  const [activeStatus, setActiveStatus] = useState<(typeof statusOptions)[number]>("On Scene");
  const [activeCaseStatus, setActiveCaseStatus] = useState<(typeof caseStatusOptions)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [suspectTag, setSuspectTag] = useState("");

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
              <Text style={styles.subheading}>Case # 3</Text>
            </View>
          </View>

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
              <TouchableOpacity key={item.label} style={styles.captureBtn} activeOpacity={0.85}>
                <Ionicons name={item.icon} size={22} color="#4B5563" style={styles.captureIcon} />
                <Text style={styles.captureLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Suspect Tags</Text>
          <View style={styles.suspectRow}>
            <TextInput
              style={styles.suspectInput}
              placeholder="Add suspect description..."
              placeholderTextColor="#9CA3AF"
              value={suspectTag}
              onChangeText={setSuspectTag}
            />
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.9}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9}>
            <Text style={styles.saveBtnText}>Save Investigation Notes</Text>
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
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});

