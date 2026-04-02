import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";

export default function ReportStep4() {
  const router = useRouter();
  const { draft, updateDraft } = useReportDraft();
  const [description, setDescription] = useState(draft.description);
  const [anonymous, setAnonymous] = useState(draft.isAnonymous);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Report Incident</Text>
            <Text style={styles.step}>Step 4 of 6</Text>
          </View>
        </View>

        <ReportProgress currentStep={4} />

        <Text style={styles.sectionTitle}>What happened?</Text>
        <Text style={styles.sectionDesc}>Describe the incident in detail</Text>

        <TextInput
          style={styles.textArea}
          placeholder="Provide a detailed description of the incident..."
          placeholderTextColor="#BBB"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={{ fontSize: 16 }}>👤</Text>
            <View>
              <Text style={styles.toggleTitle}>Anonymous report</Text>
              <Text style={styles.toggleSub}>Your identity will be hidden from the public feed</Text>
            </View>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !description.trim() && styles.buttonDisabled]}
          onPress={() => {
            if (!description.trim()) return;
            updateDraft({ description: description.trim(), isAnonymous: anonymous });
            router.push("/(citizen)/report-step5");
          }}
        >
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { fontSize: 18, color: "#111" },
  heading: { fontSize: 16, fontWeight: "700", color: "#111" },
  step: { fontSize: 12, color: "#888", marginTop: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: "#888", marginBottom: 20 },
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#111",
    height: 160,
    backgroundColor: "#FAFAFA",
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 13, fontWeight: "600", color: "#333" },
  toggleSub: { fontSize: 11, color: "#AAA", marginTop: 2 },
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#A0BCEF" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
