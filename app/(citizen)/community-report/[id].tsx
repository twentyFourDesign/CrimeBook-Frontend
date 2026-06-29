import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";
import { CrimeBookLoader } from "../../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../../src/components/common/LoadingState";
import {
  fetchCommunityReport,
  fetchReportConfirmations,
  submitReportConfirmation,
  resolveReportIncident,
  fetchReportVotes,
  submitReportVote,
  fetchReportComments,
  submitReportComment,
} from "../../../src/auth/api";
import type { 
  CommunityReportPayload, 
  ReportConfirmationListItem, 
  VoteType,
  IncidentComment,
} from "../../../src/auth/types";

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
  const [isResolving, setIsResolving] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<"CONFIRMED" | "DISPUTED">("CONFIRMED");
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [myVote, setMyVote] = useState<VoteType | null>(null);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentSending, setCommentSending] = useState(false);

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

  const loadSocial = useCallback(async () => {
    if (!reportId) return;
    try {
      const { counts, myVote: mv } = await fetchReportVotes(reportId);
      setUpvotes(counts.UPVOTE);
      setDownvotes(counts.DOWNVOTE);
      setMyVote(mv);
    } catch (e) {
      console.error("Votes fetch error", e);
    }

    setCommentsLoading(true);
    try {
      const { items } = await fetchReportComments(reportId);
      setComments(items);
    } catch (e) {
      console.error("Comments fetch error", e);
    } finally {
      setCommentsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
    loadSocial();
  }, [load, loadSocial]);

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

  const onResolve = async () => {
    if (!reportId || isResolving) return;
    setIsResolving(true);
    try {
      await resolveReportIncident(reportId, {
        status: resolveStatus,
        notes: commentDraft.trim() || undefined,
      });
      setResolveModalOpen(false);
      await load("refresh");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process resolution");
    } finally {
      setIsResolving(false);
    }
  };

  const handleVote = async (voteType: VoteType) => {
    if (!reportId) return;
    const newVote = myVote === voteType ? null : voteType;
    try {
      const { counts, myVote: mv } = await submitReportVote(reportId, newVote);
      setUpvotes(counts.UPVOTE);
      setDownvotes(counts.DOWNVOTE);
      setMyVote(mv);
    } catch (e) {
      console.error("Vote error", e);
    }
  };

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text || !reportId || commentSending) return;
    setCommentSending(true);
    try {
      const { comment } = await submitReportComment(reportId, text);
      setComments((prev) => [comment, ...prev]);
      setCommentInput("");
    } catch (e) {
      console.error("Comment error", e);
    } finally {
      setCommentSending(false);
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

      {loading && !report ? (
        <LoadingState fullScreen message="Loading incident details…" />
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        {error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {report && (
          <>
            <View style={styles.card}>
              <Text style={styles.category}>
                {report.crimeCategory === "OTHER" && report.otherCrimeType 
                  ? `Other: ${report.otherCrimeType}` 
                  : formatEnum(report.crimeCategory)}
              </Text>
              <Text style={styles.title}>
                {report.title?.trim() || 
                 (report.crimeCategory === "OTHER" && report.otherCrimeType 
                   ? `Other: ${report.otherCrimeType}` 
                   : formatEnum(report.crimeCategory))}
              </Text>
              {report.locationLabel || report.locationAddress ? (
                <View style={styles.locationCard}>
                  <View style={styles.locationIconWrap}>
                    <Ionicons name="location" size={20} color="#2563EB" />
                  </View>
                  <View style={styles.locationTextWrap}>
                    <Text style={styles.locationHeading}>Incident location</Text>
                    <Text style={styles.loc}>
                      {report.locationLabel || report.locationAddress}
                    </Text>
                  </View>
                </View>
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

            {report.status === "POLICE_RESOLVED" && report.isOwnReport && (
              <View style={styles.resolvePromptCard}>
                <View style={styles.resolveHeader}>
                  <Ionicons name="information-circle" size={24} color="#0369A1" />
                  <Text style={styles.resolveTitle}>Police Resolution Pending</Text>
                </View>
                <Text style={styles.resolveText}>
                  The police have marked this incident as resolved. Do you confirm that the situation is settled?
                </Text>
                <View style={styles.resolveActions}>
                  <TouchableOpacity
                    style={[styles.resolveBtn, styles.resolveBtnConfirm]}
                    onPress={() => {
                      setResolveStatus("CONFIRMED");
                      setCommentDraft("");
                      setResolveModalOpen(true);
                    }}
                  >
                    <Text style={styles.resolveBtnText}>Yes, Resolved</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveBtn, styles.resolveBtnDispute]}
                    onPress={() => {
                      setResolveStatus("DISPUTED");
                      setCommentDraft("");
                      setResolveModalOpen(true);
                    }}
                  >
                    <Text style={[styles.resolveBtnText, { color: "#1E293B" }]}>Still Ongoing</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.socialActionRow}>
              <TouchableOpacity 
                style={[styles.voteBtn, myVote === "UPVOTE" && styles.voteBtnActive]} 
                onPress={() => handleVote("UPVOTE")}
              >
                <Ionicons 
                  name={myVote === "UPVOTE" ? "thumbs-up" : "thumbs-up-outline"} 
                  size={18} 
                  color={myVote === "UPVOTE" ? "#fff" : "#2563EB"} 
                />
                <Text style={[styles.voteBtnText, myVote === "UPVOTE" && styles.voteBtnTextActive]}>
                  {upvotes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.voteBtn, myVote === "DOWNVOTE" && styles.voteBtnActiveDown]} 
                onPress={() => handleVote("DOWNVOTE")}
              >
                <Ionicons 
                  name={myVote === "DOWNVOTE" ? "thumbs-down" : "thumbs-down-outline"} 
                  size={18} 
                  color={myVote === "DOWNVOTE" ? "#fff" : "#DC2626"} 
                />
                <Text style={[styles.voteBtnText, myVote === "DOWNVOTE" && styles.voteBtnTextActive]}>
                  {downvotes}
                </Text>
              </TouchableOpacity>
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

            <Text style={styles.sectionTitle}>Community comments</Text>
            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment…"
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
                editable={!commentSending}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, !commentInput.trim() && styles.commentSendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentInput.trim() || commentSending}
              >
                {commentSending ? <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" /> : <Ionicons name="send" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>

            {commentsLoading && comments.length === 0 ? (
              <LoadingState size="small" message="Loading comments…" />
            ) : null}

            {comments.map((c) => (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarText}>{c.user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.commentUser}>{c.user.name}</Text>
                    <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{c.content}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Verification log</Text>
            {confirmations.length === 0 ? (
              <Text style={styles.muted}>No verifications yet.</Text>
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
      )}

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
                  <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={resolveModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {resolveStatus === "CONFIRMED" ? "Confirm Resolution" : "Dispute Resolution"}
            </Text>
            <Text style={styles.modalHint}>
              {resolveStatus === "CONFIRMED"
                ? "Excellent. Feel free to add any closing comments."
                : "Please explain why you believe the incident is not yet resolved."}
            </Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Add your notes…"
              value={commentDraft}
              onChangeText={setCommentDraft}
              maxLength={2000}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline, { flex: 1 }]}
                onPress={() => setResolveModalOpen(false)}
                disabled={isResolving}
              >
                <Text style={styles.btnOutlineText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, resolveStatus === "CONFIRMED" ? styles.btnPrimary : { backgroundColor: "#B91C1C" }, { flex: 1 }]}
                onPress={onResolve}
                disabled={isResolving}
              >
                {isResolving ? (
                  <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
                ) : (
                  <Text style={styles.btnPrimaryText}>
                    {resolveStatus === "CONFIRMED" ? "Confirm Solved" : "Send Dispute"}
                  </Text>
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
  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 14,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextWrap: { flex: 1 },
  locationHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  loc: { fontSize: 14, color: "#1E293B", lineHeight: 20, fontWeight: "500" },
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

  resolvePromptCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  resolveHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  resolveTitle: { fontSize: 16, fontWeight: "700", color: "#0369A1" },
  resolveText: { fontSize: 14, color: "#0C4A6E", lineHeight: 20, marginBottom: 16 },
  resolveActions: { flexDirection: "row", gap: 12 },
  resolveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resolveBtnConfirm: { backgroundColor: "#0369A1" },
  resolveBtnDispute: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
  resolveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  socialActionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  voteBtnActive: {
    backgroundColor: "#2563EB",
  },
  voteBtnActiveDown: {
    backgroundColor: "#DC2626",
  },
  voteBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  voteBtnTextActive: {
    color: "#fff",
  },
  commentComposer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  commentSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  commentSendBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  commentUser: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  commentDate: {
    fontSize: 11,
    color: "#94A3B8",
  },
  commentContent: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
});
