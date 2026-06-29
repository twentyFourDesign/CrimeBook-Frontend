import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { IncidentFeedList } from "../../src/components/community/IncidentFeedList";
import { submitReportVote } from "../../src/auth/api";
import type { FeedReportItem, VoteType } from "../../src/auth/types";
import { useFeedSegment } from "../../src/hooks/useFeedSegment";

export default function LiveIncidentsScreen() {
  const {
    data: reports,
    loading,
    revalidating,
    error,
    refresh,
    setData,
  } = useFeedSegment("live");

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

        <Text style={styles.title}>Live Incidents</Text>
        <Text style={styles.subtitle}>
          All active community reports — excluding resolved cases and historical archive data
        </Text>

        <IncidentFeedList
          reports={(reports ?? []) as FeedReportItem[]}
          loading={loading}
          error={error}
          emptyMessage="No live incidents right now. Be the first to report something in your area."
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
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 20, lineHeight: 20 },
});
