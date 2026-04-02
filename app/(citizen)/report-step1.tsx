import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";

const crimes = [
  { id: "theft", label: "Theft", icon: "🏃" },
  { id: "assault", label: "Assault", icon: "👊" },
  { id: "vehicle", label: "Vehicle Crime", icon: "🚗" },
  { id: "arson", label: "Arson", icon: "🔥" },
  { id: "vandalism", label: "Vandalism", icon: "🪨" },
  { id: "disturbance", label: "Disturbance", icon: "📢" },
];

export default function ReportStep1() {
  const router = useRouter();
  const { draft, updateDraft } = useReportDraft();
  const [selected, setSelected] = useState<string | null>(draft.crimeSlug);

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
            <Text style={styles.step}>Step 1 of 6</Text>
          </View>
        </View>

        <ReportProgress currentStep={1} />

        <Text style={styles.sectionTitle}>Select Crime Type</Text>
        <Text style={styles.sectionDesc}>Choose the category that best describes the incident</Text>

        <View style={styles.grid}>
          {crimes.map((crime) => (
            <TouchableOpacity
              key={crime.id}
              style={[styles.crimeCard, selected === crime.id && styles.crimeCardActive]}
              onPress={() => setSelected(crime.id)}
            >
              <Text style={styles.crimeIcon}>{crime.icon}</Text>
              <Text style={[styles.crimeLabel, selected === crime.id && styles.crimeLabelActive]}>
                {crime.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={() => {
            if (!selected) return;
            updateDraft({ crimeSlug: selected });
            router.push("/(citizen)/report-step2");
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  crimeCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  crimeCardActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  crimeIcon: { fontSize: 28, marginBottom: 6 },
  crimeLabel: { fontSize: 11, fontWeight: "600", color: "#555", textAlign: "center" },
  crimeLabelActive: { color: "#2563EB" },
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#A0BCEF" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
