import { View, Text, StyleSheet, TextInput, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { ReportContinueButton } from "../../src/components/report/ReportContinueButton";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";

export default function ReportStep4() {
  const router = useRouter();
  const layout = useReportScreenLayout();
  const { draft, updateDraft } = useReportDraft();
  const [description, setDescription] = useState(draft.description);
  const [anonymous, setAnonymous] = useState(draft.isAnonymous);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={4} />

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
            <Ionicons name="eye-off-outline" size={22} color="#2563EB" />
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

        <ReportContinueButton
          disabled={!description.trim()}
          onPress={() => {
            if (!description.trim()) return;
            updateDraft({ description: description.trim(), isAnonymous: anonymous });
            router.push("/(citizen)/report-step5");
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
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
});
