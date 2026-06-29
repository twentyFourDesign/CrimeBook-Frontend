import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { IncidentFeedList } from "../../src/components/community/IncidentFeedList";
import type { FeedReportItem } from "../../src/auth/types";
import { useFeedSegment } from "../../src/hooks/useFeedSegment";

export default function CrimeArchiveScreen() {
  const {
    data: reports,
    loading,
    revalidating,
    error,
    refresh,
  } = useFeedSegment("archive");

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
          <Ionicons name="library-outline" size={26} color="#0F766E" />
          <Text style={styles.title}>Crime Archive</Text>
        </View>
        <Text style={styles.subtitle}>
          Historical Nigeria violence records (2010–2026). Sourced from official archive data — not live reports.
        </Text>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={18} color="#0F766E" />
          <Text style={styles.noticeText}>
            Locations are approximate (state-level). Some entries are aggregate statistics, not single events.
          </Text>
        </View>

        <IncidentFeedList
          reports={(reports ?? []) as FeedReportItem[]}
          loading={loading}
          error={error}
          showVerifiedBadge
          emptyMessage="No archive records loaded."
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
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F0FDFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  noticeText: { flex: 1, fontSize: 12, color: "#0F766E", lineHeight: 18 },
});
