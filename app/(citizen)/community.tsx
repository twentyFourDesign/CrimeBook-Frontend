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
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { fetchCitizenAppeals, fetchCommunityGroups, fetchFeedReports } from "../../src/auth/api";
import type { FeedReportItem, PublicAppealItem } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export default function Community() {
  const router = useRouter();
  const { resetDraft } = useReportDraft();
  const { feedReports, setFeedReports } = useAppDataCache();
  const cacheRef = useRef(feedReports);
  cacheRef.current = feedReports;
  const reports = feedReports;
  const [loading, setLoading] = useState(() => feedReports === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appeals, setAppeals] = useState<PublicAppealItem[] | null>(null);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [groups, setGroups] = useState<
    {
      id: string;
      name: string;
      description: string | null;
      memberCount: number;
      latitude: number;
      longitude: number;
      radiusKm: number;
      createdAt: string;
    }[]
  >([]);

  const load = useCallback(
    async (mode?: "refresh") => {
      setError(null);
      setAppealsError(null);
      if (mode === "refresh") setRefreshing(true);
      else if (cacheRef.current === null) setLoading(true);
      try {
        const [{ reports: list }, appealsRes, groupsRes] = await Promise.all([
          fetchFeedReports(),
          fetchCitizenAppeals().catch(() => ({ appeals: [] as PublicAppealItem[] })),
          fetchCommunityGroups().catch(() => ({ groups: [] })),
        ]);
        setFeedReports(list);
        setAppeals(appealsRes.appeals);
        setGroups(groupsRes.groups);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load community feed");
        setFeedReports([]);
        try {
          const { appeals: a } = await fetchCitizenAppeals();
          setAppeals(a);
        } catch (ae) {
          setAppealsError(ae instanceof Error ? ae.message : "Could not load appeals");
          setAppeals([]);
          setGroups([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setFeedReports]
  );

  useEffect(() => {
    load();
  }, [load]);

  const total = reports?.length ?? 0;
  const verifiedCount = useMemo(
    () => (reports ?? []).filter((r) => r.isPoliceVerified).length,
    [reports]
  );

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Community</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Your Neighborhood hub</Text>
          </View>
          <TouchableOpacity
            style={styles.newAlertBtn}
            onPress={() => {
              resetDraft();
              router.push("/(citizen)/report-step1");
            }}
          >
            <Text style={styles.newAlertText}>🔔 New Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📡</Text>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{verifiedCount}</Text>
            <Text style={styles.statLabel}>Police verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{Math.max(total - verifiedCount, 0)}</Text>
            <Text style={styles.statLabel}>Awaiting review</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Neighborhood groups</Text>
        {!loading && groups.length > 0
          ? groups.slice(0, 6).map((g) => (
              <View key={g.id} style={styles.groupCard}>
                <Text style={styles.groupTitle}>{g.name}</Text>
                {g.description ? <Text style={styles.groupDesc}>{g.description}</Text> : null}
                <Text style={styles.groupMeta}>
                  {g.memberCount} members · radius {g.radiusKm} km
                </Text>
              </View>
            ))
          : null}
        {!loading && groups.length === 0 ? (
          <Text style={styles.mutedAppeals}>No groups yet — create one via the API or wait for neighbors.</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Police public appeals</Text>
        {appealsError ? <Text style={styles.errorText}>{appealsError}</Text> : null}
        {!loading && appeals && appeals.length > 0
          ? appeals.slice(0, 8).map((a) => (
              <View key={a.id} style={styles.appealCard}>
                <Text style={styles.appealTitle}>{a.title}</Text>
                <Text style={styles.appealCase}>Case {a.caseNumber}</Text>
                <Text style={styles.appealBody} numberOfLines={4}>
                  {a.description}
                </Text>
                <Text style={styles.appealMeta}>
                  Radius {a.radiusKm} km · {new Date(a.createdAt).toLocaleString()}
                </Text>
              </View>
            ))
          : null}
        {!loading && appeals && appeals.length === 0 ? (
          <Text style={styles.mutedAppeals}>No active appeals right now.</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Live incident feed</Text>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Loading reports…</Text>
          </View>
        )}

        {error && !loading && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {!loading &&
          (reports ?? []).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.incidentCard}
              activeOpacity={0.75}
              onPress={() => router.push(`/(citizen)/community-report/${item.id}`)}
            >
              <View style={styles.incidentLeft}>
                <View style={[styles.alertDot, item.isPoliceVerified && styles.alertDotVerified]} />
                <View style={styles.incidentInfo}>
                  <Text style={styles.incidentTitle}>
                    {item.title?.trim() || formatEnum(item.crimeCategory)}
                  </Text>
                  {item.locationLabel || item.locationAddress ? (
                    <Text style={styles.incidentLocation}>
                      📍 {item.locationLabel || item.locationAddress}
                    </Text>
                  ) : null}
                  <View style={styles.incidentMeta}>
                    <Text style={styles.metaText}>
                      🕐 {new Date(item.createdAt).toLocaleString()}
                    </Text>
                    <Text style={styles.confidence}>
                      ● {item.communityConfirmCount} confirmations
                    </Text>
                  </View>
                </View>
              </View>
              {item.isPoliceVerified && <Text style={styles.verifiedPill}>Police verified</Text>}
            </TouchableOpacity>
          ))}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  verifiedBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  newAlertBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  newAlertText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  appealCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  appealTitle: { fontSize: 15, fontWeight: "700", color: "#92400E" },
  appealCase: { fontSize: 12, color: "#B45309", marginTop: 2, marginBottom: 6 },
  appealBody: { fontSize: 13, color: "#444", lineHeight: 20 },
  appealMeta: { fontSize: 11, color: "#A8A29E", marginTop: 8 },
  mutedAppeals: { fontSize: 13, color: "#94A3B8", marginBottom: 12 },
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  groupTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  groupDesc: { fontSize: 13, color: "#555", marginTop: 4 },
  groupMeta: { fontSize: 12, color: "#888", marginTop: 6 },
  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  incidentLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  alertDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  incidentInfo: { flex: 1 },
  incidentTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  incidentLocation: { fontSize: 12, color: "#888", marginBottom: 6 },
  incidentMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 11, color: "#AAA" },
  confidence: { fontSize: 11, color: "#22C55E", fontWeight: "600" },
  verifiedPill: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  alertTitle: { fontSize: 13, fontWeight: "600", color: "#111" },
  alertMeta: { fontSize: 11, color: "#AAA", marginTop: 2 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  loadingText: { fontSize: 12, color: "#64748B" },
  errorText: { fontSize: 12, color: "#DC2626", marginBottom: 12 },
  alertDotVerified: {
    backgroundColor: "#BBF7D0",
  },
});
