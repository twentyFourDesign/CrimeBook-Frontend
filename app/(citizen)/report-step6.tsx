import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform } from "react-native";
import { CrimeBookLoader } from "../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../src/components/common/LoadingState";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { CRIME_LABELS } from "../../src/report/constants";
import { readTokens } from "../../src/auth/storage";
import { submitIncidentReport } from "../../src/report/api";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";
import { ReportFooter } from "../../src/components/report/ReportFooter";
import { useAuth } from "../../src/auth/AuthContext";
import {
  computeAuthenticityScore,
  type AuthenticityAnalysis } from "../../src/report/authenticityEngine";

const ANALYSIS_STEPS = [
  "Extracting media forensic signatures...",
  "Triangulating GPS coordinates...",
  "Running NLP pattern analysis...",
  "Cross-checking temporal integrity...",
  "Generating authenticity certificate...",
];

const STEP_TIMINGS = [0, 700, 1400, 2100, 2800, 3600];

export default function ReportStep6() {
  const router = useRouter();
  const layout = useReportScreenLayout();
  const { draft, resetDraft } = useReportDraft();
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysis, setAnalysis] = useState<AuthenticityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignals, setShowSignals] = useState(false);
  const [showFlags, setShowFlags] = useState(false);

  const crimeLabel = draft.crimeSlug === "other" 
    ? `Other: ${draft.otherCrimeType}` 
    : draft.crimeSlug ? CRIME_LABELS[draft.crimeSlug] ?? draft.crimeSlug : "—";
  const when = new Date(draft.incidentTimeIso).toLocaleString();

  const onSubmit = async () => {
    setError(null);
    if (!draft.crimeSlug || !draft.description.trim()) {
      setError("Please complete all required steps.");
      return;
    }

    setAnalyzing(true);
    setAnalysisStep(0);

    // Start step animation — each step fires at the defined timing
    STEP_TIMINGS.slice(1, -1).forEach((ms, idx) => {
      setTimeout(() => setAnalysisStep(idx + 1), ms);
    });

    // Fetch live GPS in parallel with the animation
    let currentLat: number | null = null;
    let currentLon: number | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced });
        currentLat = pos.coords.latitude;
        currentLon = pos.coords.longitude;
      }
    } catch {
      // Fail silently — GPS unavailable doesn't block submission
    }

    // Run the full scoring engine
    const result = await computeAuthenticityScore(draft, user, currentLat, currentLon);
    setAnalysis(result);

    // Wait for the last animation step, then show result
    setTimeout(() => {
      setAnalysisStep(ANALYSIS_STEPS.length); // triggers result screen
    }, STEP_TIMINGS[STEP_TIMINGS.length - 1]);
  };

  const finalizeSubmission = async () => {
    const tokens = await readTokens();
    if (!tokens?.accessToken) {
      setError("Please log in again.");
      setAnalyzing(false);
      return;
    }

    let fullDescription = draft.description.trim();
    if (draft.evidenceNote.trim()) {
      fullDescription += `\n\nEvidence note: ${draft.evidenceNote.trim()}`;
    }

    setSubmitting(true);
    try {
      const res = await submitIncidentReport(tokens.accessToken, {
        crimeSlug: draft.crimeSlug as string,
        otherCrimeType: draft.crimeSlug === "other" ? draft.otherCrimeType : undefined,
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
                mediaType: m.mediaType }))
            : undefined,
        authenticityAnalysis: analysis });
      resetDraft();
      router.replace({
        pathname: "/(citizen)/report-success",
        params: {
          displayCaseId: res.report.displayCaseId,
          status: res.report.status,
          newBadge: res.newBadge ? JSON.stringify(res.newBadge) : undefined } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not submit report");
      setAnalyzing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const showingResult = analysisStep >= ANALYSIS_STEPS.length && analysis !== null;

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={6} />
        <ReportProgress currentStep={6} />

        <Text style={styles.sectionTitle}>Review Report</Text>
        <Text style={styles.sectionDesc}>Confirm the details before submitting</Text>

        <View style={styles.reviewCard}>
          <ReviewRow label="Crime Type" value={crimeLabel} border />
          <ReviewRow label="When" value={when} border />
          <ReviewRow label="Location" value={draft.locationText || "—"} border />
          <ReviewRow
            label="Description"
            value={draft.description || "—"}
            border
            numberOfLines={4}
          />
          <ReviewRow label="Evidence note" value={draft.evidenceNote || "—"} border />
          <ReviewRow
            label="Attachments"
            value={draft.media.length ? `${draft.media.length} file(s)` : "—"}
            border
          />
          <ReviewRow label="Anonymous" value={draft.isAnonymous ? "Yes" : "No"} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

      </ScrollView>

      {!analyzing && (
        <ReportFooter>
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.buttonText}>Submit report</Text>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </ReportFooter>
      )}

      {/* ─── Analysis Overlay ─── */}
      {analyzing && (
        <View style={styles.analysisOverlay}>
          <View style={styles.analysisCard}>
            {!showingResult ? (
              /* ─── Loading Phase ─── */
              <>
                <View style={styles.engineHeader}>
                  <Ionicons name="hardware-chip-outline" size={28} color="#2563EB" />
                  <Text style={styles.engineTitle}>AI Forensic Engine</Text>
                </View>

                <View style={styles.stepsContainer}>
                  {ANALYSIS_STEPS.map((step, idx) => (
                    <View key={idx} style={styles.stepRow}>
                      <View
                        style={[
                          styles.stepDot,
                          idx < analysisStep && styles.stepDotDone,
                          idx === analysisStep && styles.stepDotActive,
                        ]}
                      >
                        {idx < analysisStep ? (
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        ) : idx === analysisStep ? (
                          <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          idx < analysisStep && styles.stepTextDone,
                          idx === analysisStep && styles.stepTextActive,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.round(
                          ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100
                        )}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressPct}>
                  {Math.round(((analysisStep + 1) / ANALYSIS_STEPS.length) * 100)}% complete
                </Text>
              </>
            ) : (
              /* ─── Result Phase ─── */
              <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
                {/* Header */}
                <View style={styles.resultHeader}>
                  <Ionicons name="shield-checkmark" size={40} color={analysis!.gradeColor} />
                  <View>
                    <Text style={styles.resultTitle}>Verification Complete</Text>
                    <Text style={[styles.gradeLabel, { color: analysis!.gradeColor }]}>
                      {analysis!.grade}
                    </Text>
                  </View>
                </View>

                {/* Score Ring */}
                <View style={[styles.scoreRing, { borderColor: analysis!.gradeColor }]}>
                  <View style={styles.scoreTextContainer}>
                    <Text style={[styles.scoreValue, { color: analysis!.gradeColor }]}>
                      {analysis!.finalScore}
                    </Text>
                    <Text style={styles.scoreSlash}>/</Text>
                    <Text style={styles.scoreTotal}>100</Text>
                  </View>
                </View>

                {/* Signal Breakdown */}
                <CollapsibleHeader
                  title="SIGNAL ANALYSIS"
                  isOpen={showSignals}
                  onToggle={() => setShowSignals(!showSignals)}
                />
                {showSignals && (
                  <View style={styles.collapsibleContent}>
                    {Object.values(analysis!.signals).map((sig) => (
                      <SignalBar key={sig.label} signal={sig} />
                    ))}
                  </View>
                )}

                {/* Flags */}
                <CollapsibleHeader
                  title="FORENSIC FLAGS"
                  isOpen={showFlags}
                  onToggle={() => setShowFlags(!showFlags)}
                />
                {showFlags && (
                  <View style={styles.collapsibleContent}>
                    <View style={styles.flagsContainer}>
                      {analysis!.allFlags.map((flag, idx) => (
                        <View key={idx} style={styles.flagPill}>
                          <Text style={styles.flagText}>{flag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Engine Trace */}
                <Text style={styles.mlNote}>
                  REPORT_HASH: {analysis!.reportHash}
                  {"\n"}ENGINE: crimebook-neural v4.2 · {new Date().toISOString()}
                </Text>

                {/* CTA */}
                <TouchableOpacity
                  style={[styles.button, { marginTop: 20, marginBottom: 8 }]}
                  onPress={finalizeSubmission}
                  disabled={submitting}
                >
                  {submitting ? (
                    <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
                  ) : (
                    <Text style={styles.buttonText}>Proceed to Submit</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────

function ReviewRow({
  label,
  value,
  border,
  numberOfLines }: {
  label: string;
  value: string;
  border?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={[styles.reviewRow, border && styles.reviewRowBorder]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={numberOfLines}>
        {value}
      </Text>
    </View>
  );
}

function SignalBar({ signal }: { signal: { label: string; score: number; detail: string } }) {
  const color =
    signal.score >= 70 ? "#059669" : signal.score >= 40 ? "#D97706" : "#DC2626";
  return (
    <View style={styles.signalRow}>
      <View style={styles.signalMeta}>
        <Text style={styles.signalLabel}>{signal.label}</Text>
        <Text style={styles.signalDetail}>{signal.detail}</Text>
      </View>
      <View style={styles.signalBarContainer}>
        <View style={[styles.signalBarFill, { width: `${signal.score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.signalScore, { color }]}>{signal.score}</Text>
    </View>
  );
}

function CollapsibleHeader({
  title,
  isOpen,
  onToggle }: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.collapsibleHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.collapsibleTitle}>{title}</Text>
      <Ionicons
        name={isOpen ? "chevron-up" : "chevron-down"}
        size={16}
        color="#94A3B8"
      />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: "#888", marginBottom: 20 },

  // Review Card
  reviewCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    overflow: "hidden" },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12 },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  reviewLabel: { fontSize: 13, color: "#888", fontWeight: "500", flexShrink: 0 },
  reviewValue: { fontSize: 13, color: "#111", fontWeight: "600", flex: 1, textAlign: "right" },

  // Buttons
  error: { color: "#DC2626", marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  submitRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  // Overlay
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1000 },
  analysisCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    maxHeight: "90%" },

  // Loading Phase
  engineHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  engineTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  stepsContainer: { width: "100%", marginBottom: 20, gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center" },
  stepDotDone: { backgroundColor: "#059669" },
  stepDotActive: { backgroundColor: "#2563EB" },
  stepText: { fontSize: 13, color: "#94A3B8", flex: 1 },
  stepTextDone: { color: "#059669", fontWeight: "600" },
  stepTextActive: { color: "#1E293B", fontWeight: "700" },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    marginTop: 8 },
  progressBarFill: { height: "100%", backgroundColor: "#2563EB", borderRadius: 3 },
  progressPct: { fontSize: 11, color: "#94A3B8", marginTop: 6, alignSelf: "flex-end" },

  // Result Phase
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20, width: "100%" },
  resultTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  gradeLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },

  scoreRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
    backgroundColor: "#fff",
    // Subtle shadow for premium feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2 },
  scoreTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center" },
  scoreValue: {
    fontSize: 48,
    fontWeight: "900",
    includeFontPadding: false },
  scoreSlash: {
    fontSize: 20,
    color: "#CBD5E1",
    marginHorizontal: 4,
    fontWeight: "600" },
  scoreTotal: {
    fontSize: 20,
    color: "#94A3B8",
    fontWeight: "600" },

  // Signal Bars
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 8 },
  collapsibleTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.5 },
  collapsibleContent: {
    width: "100%",
    paddingTop: 8,
    paddingBottom: 16 },
  signalRow: { width: "100%", marginBottom: 14 },
  signalMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  signalLabel: { fontSize: 12, fontWeight: "700", color: "#334155" },
  signalDetail: {
    fontSize: 10,
    color: "#94A3B8",
    flex: 1,
    textAlign: "right",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
  signalBarContainer: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden" },
  signalBarFill: { height: "100%", borderRadius: 3 },
  signalScore: { fontSize: 11, fontWeight: "700", alignSelf: "flex-end", marginTop: 2 },

  // Flags
  flagsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 4,
    alignSelf: "flex-start" },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
    width: "100%" },
  flagPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0" },
  flagText: { fontSize: 9, fontWeight: "700", color: "#475569" },

  // Engine trace
  mlNote: {
    fontSize: 9,
    color: "#CBD5E1",
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 14 } });
