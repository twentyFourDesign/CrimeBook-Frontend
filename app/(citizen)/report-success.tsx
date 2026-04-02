import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ReportSuccess() {
  const router = useRouter();
  const { displayCaseId, status } = useLocalSearchParams<{
    displayCaseId?: string;
    status?: string;
  }>();

  const caseId = displayCaseId ?? "—";
  const reportStatus = status ?? "SUBMITTED";

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>

        <Text style={styles.title}>Report Submitted</Text>
        <Text style={styles.subtitle}>
          Your report has been submitted successfully. Authorities have been notified.
        </Text>

        <View style={styles.caseCard}>
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Case ID</Text>
            <Text style={styles.caseValue}># {caseId}</Text>
          </View>
          <View style={styles.caseRowBorder} />
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{reportStatus}</Text>
            </View>
          </View>
          <View style={styles.caseRowBorder} />
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Estimated Response</Text>
            <Text style={styles.caseValue}>15–30 min</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace("/(citizen)/community")}>
          <Text style={styles.trackText}>Back to feed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/(citizen)/community")}>
          <Text style={styles.homeText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, alignItems: "center" },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  successCheck: { fontSize: 40, color: "#fff", fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 21, marginBottom: 32, paddingHorizontal: 8 },
  caseCard: {
    width: "100%",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
    overflow: "hidden",
  },
  caseRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  caseRowBorder: { height: 1, backgroundColor: "#E2E8F0" },
  caseLabel: { fontSize: 13, color: "#888" },
  caseValue: { fontSize: 13, fontWeight: "600", color: "#111" },
  statusBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  trackBtn: {
    width: "100%",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  trackText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  homeBtn: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  homeText: { fontSize: 16, fontWeight: "600", color: "#555" },
});
