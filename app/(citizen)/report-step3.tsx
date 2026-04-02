import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";

export default function ReportStep3() {
  const router = useRouter();
  const { draft, updateDraft } = useReportDraft();
  const [location, setLocation] = useState(draft.locationText);

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
            <Text style={styles.step}>Step 3 of 6</Text>
          </View>
        </View>

        <ReportProgress currentStep={3} />

        <Text style={styles.sectionTitle}>Incident Location</Text>
        <Text style={styles.sectionDesc}>Describe where the incident occurred</Text>

        <Text style={styles.fieldLabel}>Address or area</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Main St & 5th Ave"
          placeholderTextColor="#BBB"
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.mapBox}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <View style={styles.mapPin}>
            <Text style={{ fontSize: 20 }}>📍</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !location.trim() && styles.buttonDisabled]}
          onPress={() => {
            if (!location.trim()) return;
            updateDraft({ locationText: location.trim() });
            router.push("/(citizen)/report-step4");
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
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111",
    marginBottom: 14,
    backgroundColor: "#FAFAFA",
  },
  mapBox: {
    height: 180,
    backgroundColor: "#E8F4E8",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  mapEmoji: { fontSize: 72, opacity: 0.5 },
  mapPin: { position: "absolute" },
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#A0BCEF" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
