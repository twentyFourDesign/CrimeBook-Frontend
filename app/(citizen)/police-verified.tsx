import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { IncidentFeedList } from "../../src/components/community/IncidentFeedList";
import { submitReportVote } from "../../src/auth/api";
import type { FeedReportItem, VoteType } from "../../src/auth/types";
import { useFeedSegment } from "../../src/hooks/useFeedSegment";

export default function PoliceVerifiedScreen() {
  const router = useRouter();
  const {
    data: reports,
    loading,
    revalidating,
    error,
    refresh,
    setData,
  } = useFeedSegment("verified");

  const handleVote = async (reportId: string, voteType: VoteType) => {
    const report = (reports ?? []).find((r) => r.id === reportId);
    if (!report) return;

    const newVote = report.myVote === voteType ? null : voteType;
    const updated = (reports ?? []).map((r) => {
      if (r.id !== reportId) return r;
      let up = r.upvoteCount;
      let down = r.downvoteCount;
      if (r.myVote === "UPVOTE") up--;
      if (r.myVote === "DOWNVOTE") down--;
      if (newVote === "UPVOTE") up++;
      if (newVote === "DOWNVOTE") down++;
      return { ...r, upvoteCount: up, downvoteCount: down, myVote: newVote };
    });
    setData(updated);

    try {
      await submitReportVote(reportId, newVote);
    } catch {
      refresh();
    }
  };

  const refreshAll = useCallback(() => refresh(), [refresh]);

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refreshAll} />}
      >
        <View style={styles.topBar}>
          <ScreenBackButton fallbackHref="/(citizen)/community" />
        </View>

        <View style={styles.titleRow}>
          <Ionicons name="shield-checkmark" size={28} color="#16A34A" />
          <Text style={styles.title}>Police Verified</Text>
        </View>
        <Text style={styles.subtitle}>
          Incidents officially confirmed by law enforcement
        </Text>

        <TouchableOpacity
          style={styles.archiveLink}
          onPress={() => router.push("/(citizen)/crime-archive")}
        >
          <Ionicons name="library-outline" size={18} color="#0F766E" />
          <Text style={styles.archiveLinkText}>View historical crime archive</Text>
          <Ionicons name="chevron-forward" size={16} color="#0F766E" />
        </TouchableOpacity>

        <IncidentFeedList
          reports={(reports ?? []) as FeedReportItem[]}
          loading={loading}
          error={error}
          showVerifiedBadge
          emptyMessage="No police-verified incidents yet. Verified cases will appear here once confirmed."
          onVote={handleVote}
        />
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingBottom: 32 },
  topBar: { marginTop: 8, marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 16, lineHeight: 20 },
  archiveLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  archiveLinkText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#0F766E" },
});
