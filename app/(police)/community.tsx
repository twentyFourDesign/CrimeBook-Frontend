import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchFeedReports } from "../../src/auth/api";
import type { FeedReportItem } from "../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export default function PoliceFeedScreen() {
  const [reports, setReports] = useState<FeedReportItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const { reports } = await fetchFeedReports();
        setReports(reports);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load feed");
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const total = reports?.length ?? 0;
  const verifiedCount = useMemo(
    () => (reports ?? []).filter((r) => r.isPoliceVerified).length,
    [reports]
  );

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>Live citizen reports and alerts across your jurisdiction.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Verified</Text>
            <Text style={styles.statValue}>{verifiedCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Unverified</Text>
            <Text style={styles.statValue}>{Math.max(total - verifiedCount, 0)}</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Loading reports…</Text>
          </View>
        )}

        {error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {!loading &&
          (reports ?? []).map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {r.title?.trim() || formatEnum(r.crimeCategory)}
                </Text>
                <Text style={[styles.statusBadge, r.isPoliceVerified && styles.statusBadgeVerified]}>
                  {formatEnum(r.status)}
                </Text>
              </View>
              <Text style={styles.cardMeta}>
                🕐 {new Date(r.createdAt).toLocaleString()}
              </Text>
              {r.locationLabel || r.locationAddress ? (
                <Text style={styles.cardMeta}>
                  📍 {r.locationLabel || r.locationAddress}
                </Text>
              ) : null}
              <Text style={styles.cardBody} numberOfLines={3}>
                {r.description}
              </Text>
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>● {r.communityConfirmCount} confirmations</Text>
                {r.isPoliceVerified && <Text style={styles.footerVerified}>Police verified</Text>}
              </View>
            </View>
          ))}
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 6, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0F172A",
  },
  statLabel: { fontSize: 11, color: "#9CA3AF" },
  statValue: { fontSize: 17, fontWeight: "700", color: "#E5E7EB", marginTop: 2 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  loadingText: { fontSize: 12, color: "#64748B" },
  errorText: { fontSize: 12, color: "#DC2626", marginBottom: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
    backgroundColor: "#FEF3C7",
    textTransform: "capitalize",
  },
  statusBadgeVerified: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
  },
  cardMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardBody: { fontSize: 13, color: "#374151", marginTop: 8, lineHeight: 20 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  footerText: { fontSize: 11, color: "#6B7280" },
  footerVerified: { fontSize: 11, color: "#16A34A", fontWeight: "600" },
});
