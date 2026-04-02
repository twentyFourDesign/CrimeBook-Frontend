import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { ReportContinueButton } from "../../src/components/report/ReportContinueButton";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";

export default function ReportStep2() {
  const router = useRouter();
  const layout = useReportScreenLayout();
  const { draft, updateDraft } = useReportDraft();
  const [happeningNow, setHappeningNow] = useState(draft.isHappeningNow);
  const [manualWhen, setManualWhen] = useState("");

  const onContinue = () => {
    if (happeningNow) {
      updateDraft({ isHappeningNow: true, incidentTimeIso: new Date().toISOString() });
    } else {
      const parsed = Date.parse(manualWhen.trim());
      const iso = Number.isNaN(parsed)
        ? new Date().toISOString()
        : new Date(parsed).toISOString();
      updateDraft({ isHappeningNow: false, incidentTimeIso: iso });
    }
    router.push("/(citizen)/report-step3");
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={2} />

        <ReportProgress currentStep={2} />

        <Text style={styles.sectionTitle}>When did it happen?</Text>
        <Text style={styles.sectionDesc}>
          {happeningNow ? "We’ll use the current time." : "Enter an approximate date/time (any format you prefer)."}
        </Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name="time-outline" size={22} color="#2563EB" />
            <View>
              <Text style={styles.toggleTitle}>Happening now</Text>
              <Text style={styles.toggleSub}>Incident is ongoing</Text>
            </View>
          </View>
          <Switch
            value={happeningNow}
            onValueChange={setHappeningNow}
            trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
            thumbColor="#fff"
          />
        </View>

        {!happeningNow && (
          <>
            <Text style={styles.fieldLabel}>Approximate date & time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Yesterday 4pm, or 2026-04-02 14:30"
              placeholderTextColor="#BBB"
              value={manualWhen}
              onChangeText={setManualWhen}
            />
          </>
        )}

        <ReportContinueButton onPress={onContinue} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: "#888", marginBottom: 20 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleTitle: { fontSize: 13, fontWeight: "600", color: "#333" },
  toggleSub: { fontSize: 11, color: "#AAA", marginTop: 2 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111",
    marginBottom: 24,
    backgroundColor: "#FAFAFA",
  },
});
