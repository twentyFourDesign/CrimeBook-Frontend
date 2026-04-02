import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { ReportContinueButton } from "../../src/components/report/ReportContinueButton";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";

export default function ReportStep3() {
  const router = useRouter();
  const layout = useReportScreenLayout();
  const { draft, updateDraft } = useReportDraft();
  const [location, setLocation] = useState(draft.locationText);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={3} />

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
          <Ionicons name="map-outline" size={80} color="#86A78C" style={styles.mapBgIcon} />
          <View style={styles.mapPin}>
            <Ionicons name="location" size={28} color="#2563EB" />
          </View>
        </View>

        <ReportContinueButton
          disabled={!location.trim()}
          onPress={() => {
            if (!location.trim()) return;
            updateDraft({ locationText: location.trim() });
            router.push("/(citizen)/report-step4");
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
  mapBgIcon: { opacity: 0.45 },
  mapPin: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
