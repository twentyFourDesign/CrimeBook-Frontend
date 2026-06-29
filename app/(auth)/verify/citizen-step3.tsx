import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert } from "react-native";
import { CrimeBookLoader } from "../../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";
import { useVerificationDraft } from "../../../src/verification/VerificationDraftContext";
import { useAuth } from "../../../src/auth/AuthContext";

export default function CitizenStep3() {
  const router = useRouter();
  const { draft, submit, submitting, submitError } = useVerificationDraft();
  const { refreshUser } = useAuth();

  const onSubmit = async () => {
    if (!draft.fullName.trim() || !draft.idNumber.trim()) {
      Alert.alert("Missing info", "Go back and complete your ID details.");
      return;
    }
    if (!draft.street.trim() || !draft.city.trim() || !draft.zip.trim()) {
      Alert.alert("Missing address", "Go back and complete your address.");
      return;
    }
    try {
      await submit();
      await refreshUser();
      router.replace("/(auth)/verify/citizen-review");
    } catch (e) {
      Alert.alert("Could not submit", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenBackButton />
          <View>
            <Text style={styles.heading}>Identification Verification</Text>
            <Text style={styles.step}>Step 3 of 3</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Selfie matching can be added later. For now, confirm to send your application for review.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Review & submit</Text>
        <Text style={styles.sectionDesc}>
          We will verify your details against our records. You will be notified when the review is complete.
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Name: </Text>
            {draft.fullName || "—"}
          </Text>
          <Text style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Address: </Text>
            {[draft.street, draft.city, draft.zip].filter(Boolean).join(", ") || "—"}
          </Text>
        </View>

        {submitError ? <Text style={styles.err}>{submitError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
          ) : (
            <Text style={styles.buttonText}>Submit for review →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: "700", color: "#111" },
  step: { fontSize: 12, color: "#888", marginTop: 1 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  progressSegment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#E2E8F0" },
  progressActive: { backgroundColor: "#2563EB" },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 24,
    alignItems: "flex-start" },
  infoIcon: { fontSize: 14 },
  infoText: { flex: 1, fontSize: 12, color: "#555", lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#666", lineHeight: 20, marginBottom: 16 },
  summary: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0" },
  summaryLine: { fontSize: 14, color: "#334155", marginBottom: 8 },
  summaryLabel: { fontWeight: "700", color: "#0F172A" },
  err: { color: "#B91C1C", fontSize: 13, marginBottom: 8 },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" } });
