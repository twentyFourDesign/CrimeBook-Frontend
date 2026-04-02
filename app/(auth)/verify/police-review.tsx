import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../../src/auth/AuthContext";

const timeline = [
  { label: "Application submitted", done: true },
  { label: "Department review", active: true },
  { label: "Account activated as officer", done: false },
];

export default function PoliceReview() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🛡️</Text>
            </View>
          </View>

          <Text style={styles.message}>
            Your police officer application is under review. An administrator will verify your badge and department
            details before activating your officer account.
          </Text>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Review timeline</Text>

            {timeline.map((item, i) => (
              <View key={i} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    item.done && styles.timelineDotDone,
                    item.active && styles.timelineDotActive,
                  ]}
                />
                <Text style={[styles.timelineLabel, item.active && styles.timelineLabelActive]}>{item.label}</Text>
              </View>
            ))}

            <Text style={styles.estimatedText}>
              Typical review <Text style={styles.estimatedHighlight}>1–3 business days</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(citizen)/home")}>
            <Text style={styles.buttonText}>Browse app as citizen →</Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>
            Until you are approved, you can use standard citizen features. You will be moved to the officer workspace
            automatically when approved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, alignItems: "center" },
  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  icon: { fontSize: 40 },
  message: { fontSize: 14, color: "#444", textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  timelineCard: { width: "100%", backgroundColor: "#F8FAFF", borderRadius: 14, padding: 18, marginBottom: 28 },
  timelineTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 14 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E2E8F0",
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  timelineDotDone: { backgroundColor: "#CBD5E1", borderColor: "#94A3B8" },
  timelineDotActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  timelineLabel: { fontSize: 13, color: "#888" },
  timelineLabelActive: { color: "#2563EB", fontWeight: "600" },
  estimatedText: { fontSize: 12, color: "#888", marginTop: 4 },
  estimatedHighlight: { color: "#2563EB", fontWeight: "600" },
  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footnote: { fontSize: 12, color: "#999", textAlign: "center" },
});
