import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";
import {
  fetchCommunityReport,
  fetchReportConfirmations,
  submitReportConfirmation,
} from "../../../src/auth/api";
import type { CommunityReportPayload, ReportConfirmationListItem } from "../../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export default function CommunityReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = String(id ?? "");

  const [report, setReport] = useState<CommunityReportPayload | null>(null);
  const [confirmations, setConfirmations] = useState<ReportConfirmationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<boolean>(true);
  const [commentDraft, setCommentDraft] = useState("");

  const load = useCallback(
    async (mode?: "refresh") => {
      if (!reportId) return;
      setError(null);
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      try {
        const [{ report: r }, { items }] = await Promise.all([
          fetchCommunityReport(reportId),
          fetchReportConfirmations(reportId),
        ]);
        setReport(r);
        setConfirmations(items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load report");
        setReport(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [reportId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const openModal = (isConfirm: boolean) => {
    setPendingConfirm(isConfirm);
    setCommentDraft("");
    setModalOpen(true);
  };

  const submit = async () => {
    if (!reportId || submitting) return;
    setSubmitting(true);
    try {
      await submitReportConfirmation(reportId, {
        isConfirmed: pendingConfirm,
        comment: commentDraft.trim() || undefined,
      });
      setModalOpen(false);
      await load("refresh");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <ScreenBackButton fallbackHref="/(citizen)/community" />
        <Text style={styles.topTitle}>Incident</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        )}

        {error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {report && (
          <>
            <View style={styles.card}>
              <Text style={styles.category}>{formatEnum(report.crimeCategory)}</Text>
              <Text style={styles.title}>
                {report.title?.trim() || formatEnum(report.crimeCategory)}
              </Text>
              {report.locationLabel || report.locationAddress ? (
                <Text style={styles.loc}>
                  📍 {report.locationLabel || report.locationAddress}
                </Text>
              ) : null}
              <Text style={styles.body}>{report.description}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  🕐 {new Date(report.incidentTime).toLocaleString()}
                </Text>
                {report.isPoliceVerified && (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>Police verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.confirmLine}>
                ● {report.communityConfirmCount} community confirmations
              </Text>
            </View>

            {!report.isOwnReport && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() => openModal(true)}
                  disabled={submitting}
                >
                  <Text style={styles.btnPrimaryText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOutline]}
                  onPress={() => openModal(false)}
                  disabled={submitting}
                >
                  <Text style={styles.btnOutlineText}>Dispute</Text>
                </TouchableOpacity>
              </View>
            )}

            {report.isOwnReport && (
              <Text style={styles.hint}>This is your report — others can confirm or dispute it.</Text>
            )}

            {report.myConfirmation && (
              <Text style={styles.yourVote}>
                Your response: {report.myConfirmation.isConfirmed ? "Confirmed" : "Disputed"}
                {report.myConfirmation.comment ? ` — “${report.myConfirmation.comment}”` : ""}
              </Text>
            )}

            <Text style={styles.sectionTitle}>Community responses</Text>
            {confirmations.length === 0 ? (
              <Text style={styles.muted}>No responses yet.</Text>
            ) : (
              confirmations.map((c) => (
                <View key={c.id} style={styles.confRow}>
                  <Text style={styles.confName}>{c.user.displayName}</Text>
                  <Text style={styles.confBadge}>{c.isConfirmed ? "Confirmed" : "Disputed"}</Text>
                  {c.comment ? <Text style={styles.confComment}>{c.comment}</Text> : null}
                  <Text style={styles.confTime}>
                    {new Date(c.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingConfirm ? "Confirm this report?" : "Dispute this report?"}
            </Text>
            <Text style={styles.modalHint}>Optional comment (max 2000 characters)</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Add context…"
              value={commentDraft}
              onChangeText={setCommentDraft}
              maxLength={2000}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline, { flex: 1 }]}
                onPress={() => setModalOpen(false)}
                disabled={submitting}
              >
                <Text style={styles.btnOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: "#F8FAFF",
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  muted: { color: "#888", fontSize: 14 },
  errorText: { color: "#B91C1C", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  category: { fontSize: 12, fontWeight: "700", color: "#2563EB", textTransform: "uppercase" },
  title: { fontSize: 20, fontWeight: "700", color: "#111", marginTop: 4 },
  loc: { fontSize: 14, color: "#555", marginTop: 8 },
  body: { fontSize: 15, color: "#333", marginTop: 12, lineHeight: 22 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  meta: { fontSize: 13, color: "#888" },
  verifiedPill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedPillText: { fontSize: 12, fontWeight: "700", color: "#2563EB" },
  confirmLine: { marginTop: 10, fontSize: 14, fontWeight: "600", color: "#111" },
  actions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#2563EB" },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  btnOutlineText: { color: "#334155", fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 14, color: "#64748B", marginBottom: 12 },
  yourVote: { fontSize: 14, color: "#0F172A", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 10 },
  confRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  confName: { fontWeight: "700", color: "#111" },
  confBadge: { fontSize: 12, color: "#2563EB", marginTop: 2 },
  confComment: { fontSize: 14, color: "#475569", marginTop: 6 },
  confTime: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  modalHint: { fontSize: 13, color: "#888", marginTop: 8 },
  input: {
    marginTop: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
});
