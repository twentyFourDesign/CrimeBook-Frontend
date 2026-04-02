import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { CRIME_LABELS } from "../../src/report/constants";
import { readTokens } from "../../src/auth/storage";
import { submitIncidentReport } from "../../src/report/api";

export default function ReportStep6() {
  const router = useRouter();
  const { draft, resetDraft } = useReportDraft();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crimeLabel = draft.crimeSlug ? CRIME_LABELS[draft.crimeSlug] ?? draft.crimeSlug : "—";
  const when = new Date(draft.incidentTimeIso).toLocaleString();

  const onSubmit = async () => {
    setError(null);
    if (!draft.crimeSlug || !draft.description.trim()) {
      setError("Please complete all required steps.");
      return;
    }
    const tokens = await readTokens();
    if (!tokens?.accessToken) {
      setError("Please log in again.");
      return;
    }

    let fullDescription = draft.description.trim();
    if (draft.evidenceNote.trim()) {
      fullDescription += `\n\nEvidence note: ${draft.evidenceNote.trim()}`;
    }

    setSubmitting(true);
    try {
      const res = await submitIncidentReport(tokens.accessToken, {
        crimeSlug: draft.crimeSlug,
        description: fullDescription,
        locationText: draft.locationText.trim() || undefined,
        latitude: draft.latitude,
        longitude: draft.longitude,
        incidentTime: draft.incidentTimeIso,
        isHappeningNow: draft.isHappeningNow,
        isAnonymous: draft.isAnonymous,
        media:
          draft.media.length > 0
            ? draft.media.map((m) => ({
                fileUrl: m.url,
                fileName: m.fileName,
                mimeType: m.mimeType,
                fileSizeBytes: m.fileSizeBytes,
                mediaType: m.mediaType,
              }))
            : undefined,
      });
      resetDraft();
      router.replace({
        pathname: "/(citizen)/report-success",
        params: {
          displayCaseId: res.report.displayCaseId,
          status: res.report.status,
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  };

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
            <Text style={styles.step}>Step 6 of 6</Text>
          </View>
        </View>

        <ReportProgress currentStep={6} />

        <Text style={styles.sectionTitle}>Review Report</Text>
        <Text style={styles.sectionDesc}>Confirm the details before submitting</Text>

        <View style={styles.reviewCard}>
          <View style={[styles.reviewRow, styles.reviewRowBorder]}>
            <Text style={styles.reviewLabel}>Crime Type</Text>
            <Text style={styles.reviewValue}>{crimeLabel}</Text>
          </View>
          <View style={[styles.reviewRow, styles.reviewRowBorder]}>
            <Text style={styles.reviewLabel}>When</Text>
            <Text style={styles.reviewValue}>{when}</Text>
          </View>
          <View style={[styles.reviewRow, styles.reviewRowBorder]}>
            <Text style={styles.reviewLabel}>Location</Text>
            <Text style={styles.reviewValue}>{draft.locationText || "—"}</Text>
          </View>
          <View style={[styles.reviewRow, styles.reviewRowBorder]}>
            <Text style={styles.reviewLabel}>Description</Text>
            <Text style={styles.reviewValue} numberOfLines={4}>
              {draft.description || "—"}
            </Text>
          </View>
          <View style={[styles.reviewRow, styles.reviewRowBorder]}>
            <Text style={styles.reviewLabel}>Evidence note</Text>
            <Text style={styles.reviewValue}>{draft.evidenceNote || "—"}</Text>
          </View>
          <View style={[styles.reviewRow, styles.reviewRowBorder]}>
            <Text style={styles.reviewLabel}>Attachments</Text>
            <Text style={styles.reviewValue}>
              {draft.media.length ? `${draft.media.length} file(s)` : "—"}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Anonymous</Text>
            <Text style={styles.reviewValue}>{draft.isAnonymous ? "Yes" : "No"}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Report ✓</Text>
          )}
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
  reviewCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    overflow: "hidden",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  reviewLabel: { fontSize: 13, color: "#888", fontWeight: "500", flexShrink: 0 },
  reviewValue: { fontSize: 13, color: "#111", fontWeight: "600", flex: 1, textAlign: "right" },
  error: { color: "#DC2626", marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
