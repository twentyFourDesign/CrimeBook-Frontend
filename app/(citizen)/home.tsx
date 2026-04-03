import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { fetchMyReports } from "../../src/auth/api";
import type { MyReportItem } from "../../src/auth/types";

function formatEnum(value: string) {
  return value.replace(/_/g, " ");
}

export default function CitizenHome() {
  const router = useRouter();
  const [reports, setReports] = useState<MyReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchMyReports();
      setReports(data.reports ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const latest = useMemo(() => reports.slice(0, 3), [reports]);
  const stats = useMemo(() => {
    const total = reports.length;
    const underInvestigation = reports.filter((r) => r.status === "UNDER_INVESTIGATION").length;
    const resolved = reports.filter((r) => r.status === "RESOLVED").length;
    const verified = reports.filter((r) => r.isPoliceVerified).length;
    return { total, underInvestigation, resolved, verified };
  }, [reports]);

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Track your reports and latest police progress in one place.</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.link}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Total reports" value={String(stats.total)} />
              <StatCard label="Under investigation" value={String(stats.underInvestigation)} />
              <StatCard label="Resolved" value={String(stats.resolved)} />
              <StatCard label="Police verified" value={String(stats.verified)} />
            </View>

            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Latest reports</Text>
              <TouchableOpacity onPress={() => router.push("/(citizen)/my-reports")}>
                <Text style={styles.link}>See all</Text>
              </TouchableOpacity>
            </View>

            {latest.length === 0 ? (
              <Text style={styles.emptyText}>No reports yet. Start by creating your first report.</Text>
            ) : (
              latest.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.card}
                  onPress={() => router.push(`/(citizen)/report-detail/${r.id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cardTitle}>{r.title?.trim() || formatEnum(r.crimeCategory)}</Text>
                  <Text style={styles.cardMeta}>Status: {formatEnum(r.status)}</Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {r.locationLabel || r.locationAddress || "Location not set"}
                  </Text>
                  <Text style={styles.cardDate}>{new Date(r.createdAt).toLocaleString()}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </CitizenShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 6, marginTop: 2 },
  subtitle: { fontSize: 14, color: "#64748B", lineHeight: 20, marginBottom: 14 },
  center: { paddingVertical: 24, alignItems: "center" },
  errorBox: { marginVertical: 10 },
  errorText: { color: "#B91C1C", fontSize: 14, marginBottom: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  link: { color: "#2563EB", fontWeight: "600" },
  emptyText: { color: "#94A3B8", fontSize: 14, marginTop: 8 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 6 },
  cardMeta: { fontSize: 12, color: "#475569", marginTop: 2 },
  cardDate: { fontSize: 11, color: "#94A3B8", marginTop: 8 },
});
