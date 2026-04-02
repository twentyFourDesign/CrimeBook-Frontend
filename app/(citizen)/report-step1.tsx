import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import type { ComponentProps } from "react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { ReportContinueButton } from "../../src/components/report/ReportContinueButton";

type IonName = ComponentProps<typeof Ionicons>["name"];

const crimes: { id: string; label: string; icon: IonName }[] = [
  { id: "theft", label: "Theft", icon: "bag-outline" },
  { id: "assault", label: "Assault", icon: "warning-outline" },
  { id: "vehicle", label: "Vehicle Crime", icon: "car-outline" },
  { id: "arson", label: "Arson", icon: "flame-outline" },
  { id: "vandalism", label: "Vandalism", icon: "hammer-outline" },
  { id: "disturbance", label: "Disturbance", icon: "megaphone-outline" },
];

const ACTIVE = "#2563EB";
const ICON_DIM = "#64748B";

export default function ReportStep1() {
  const router = useRouter();
  const layout = useReportScreenLayout();
  const { draft, updateDraft } = useReportDraft();
  const [selected, setSelected] = useState<string | null>(draft.crimeSlug);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={1} />

        <ReportProgress currentStep={1} />

        <Text style={styles.sectionTitle}>Select crime type</Text>
        <Text style={styles.sectionDesc}>Choose the category that best describes the incident</Text>

        <View style={[styles.grid, { gap: layout.gridGap }]}>
          {crimes.map((crime) => {
            const on = selected === crime.id;
            return (
              <TouchableOpacity
                key={crime.id}
                activeOpacity={0.85}
                style={[
                  styles.crimeCard,
                  { width: layout.crimeCellWidth },
                  on && styles.crimeCardActive,
                ]}
                onPress={() => setSelected(crime.id)}
              >
                <View style={styles.crimeIconWrap}>
                  <Ionicons name={crime.icon} size={30} color={on ? ACTIVE : ICON_DIM} />
                </View>
                <Text style={[styles.crimeLabel, on && styles.crimeLabelActive]} numberOfLines={2}>
                  {crime.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ReportContinueButton
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            updateDraft({ crimeSlug: selected });
            router.push("/(citizen)/report-step2");
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#888", marginBottom: 22, lineHeight: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 28,
  },
  crimeCard: {
    minHeight: 122,
    paddingVertical: 16,
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  crimeCardActive: { backgroundColor: "#EFF6FF", borderColor: ACTIVE },
  crimeIconWrap: {
    height: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  crimeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
    lineHeight: 14,
    width: "100%",
  },
  crimeLabelActive: { color: ACTIVE },
});
