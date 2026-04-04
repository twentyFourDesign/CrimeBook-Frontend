import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { Skeleton } from "../../src/components/common/Skeleton";
import { fetchMyReports } from "../../src/auth/api";
import type { MyReportItem } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

function formatEnum(value: string) {
  return value.replace(/_/g, " ");
}

export default function CitizenHome() {
  const router = useRouter();
  const { setCitizenReports } = useAppDataCache();

  const {
    data: reportsData,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "citizenReports",
    async () => {
      const res = await fetchMyReports();
      return res.reports ?? [];
    },
    setCitizenReports
  );

  const reports = reportsData ?? [];

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} />}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Track your reports and latest police progress in one place.</Text>

        <TouchableOpacity
          style={styles.sosBanner}
          onPress={() => router.push("/(citizen)/sos")}
          activeOpacity={0.9}
        >
          <Text style={styles.sosBannerTitle}>Emergency SOS</Text>
          <Text style={styles.sosBannerSub}>Share live location with responders</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ gap: 18 }}>
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.statCard, { borderStyle: "solid" }]}>
                  <Skeleton width={40} height={24} style={{ marginBottom: 4 }} />
                  <Skeleton width={80} height={12} />
                </View>
              ))}
            </View>
            <View style={styles.row}>
              <Skeleton width={120} height={20} />
            </View>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.card}>
                <Skeleton width="70%" height={18} style={{ marginBottom: 10 }} />
                <Skeleton width="40%" height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="50%" height={12} style={{ marginBottom: 10 }} />
                <Skeleton width="30%" height={10} />
              </View>
            ))}
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.link}>Retry </Text>
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
  sosBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  sosBannerTitle: { fontSize: 16, fontWeight: "800", color: "#B91C1C" },
  sosBannerSub: { fontSize: 13, color: "#991B1B", marginTop: 4 },
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
