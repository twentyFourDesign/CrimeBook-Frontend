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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { Skeleton } from "../../src/components/common/Skeleton";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { fetchCitizenAppeals, fetchCommunityGroups, fetchFeedReports } from "../../src/auth/api";
import type { CommunityGroup, FeedReportItem, PublicAppealItem } from "../../src/auth/types";
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
  const [groups, setGroups] = useState<CommunityGroup[]>([]);

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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.settingsHeaderBtn}
              onPress={() => alert("Community settings coming soon")}
            >
              <Ionicons name="settings-outline" size={22} color="#475569" />
            </TouchableOpacity>
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
        </View>

        <View style={styles.statsRow}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={styles.statCard}>
                <Skeleton width={24} height={24} style={{ marginBottom: 4 }} />
                <Skeleton width={30} height={20} style={{ marginBottom: 4 }} />
                <Skeleton width={60} height={10} />
              </View>
            ))
          ) : (
            <>
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
            </>
          )}
        </View>

        {loading && (
          <View style={{ marginBottom: 24 }}>
            <Skeleton width={150} height={16} style={{ marginBottom: 12 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.myGroupsScroll} contentContainerStyle={styles.myGroupsContent}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.myGroupCard}>
                  <Skeleton width={48} height={48} circle style={{ marginBottom: 10 }} />
                  <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
                  <Skeleton width="50%" height={10} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* My Joined Groups */}
        {groups.filter(g => g.isMember).length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>My Neighborhoods</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.myGroupsScroll}
              contentContainerStyle={styles.myGroupsContent}
            >
              {groups.filter(g => g.isMember).map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.myGroupCard}
                  onPress={() => router.push(`/(citizen)/group/${g.id}`)}
                >
                  <View style={styles.myGroupIcon}>
                    <Text style={styles.myGroupIconText}>{g.name[0]}</Text>
                  </View>
                  <Text style={styles.myGroupTitle} numberOfLines={1}>{g.name}</Text>
                  <Text style={styles.myGroupMembers}>{g.memberCount} members</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Discover Communities</Text>
          <TouchableOpacity
            style={styles.createGroupBtn}
            onPress={() => router.push("/(citizen)/create-group")}
          >
            <Text style={styles.createGroupText}>+ Create Group</Text>
          </TouchableOpacity>
        </View>

        {!loading && groups.filter(g => !g.isMember).length > 0
          ? groups.filter(g => !g.isMember).slice(0, 4).map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.groupCard}
                onPress={() => router.push(`/(citizen)/group/${g.id}`)}
              >
                <View style={styles.groupTop}>
                  <Text style={styles.groupTitle}>{g.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </View>
                {g.description ? <Text style={styles.groupDesc} numberOfLines={2}>{g.description}</Text> : null}
                <View style={styles.groupBottom}>
                  <Text style={styles.groupMeta}>
                    👥 {g.memberCount} · 📍 {g.radiusKm} km radius
                  </Text>
                  <Text style={styles.joinActionText}>View & Join</Text>
                </View>
              </TouchableOpacity>
            ))
          : !loading && groups.filter(g => !g.isMember).length === 0 && (
            <View style={styles.emptyGroupsBox}>
              <Text style={styles.mutedAppeals}>Join or create a group to connect with your neighbors.</Text>
            </View>
          )}

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
          <View style={{ gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.incidentCard}>
                <View style={styles.incidentLeft}>
                  <Skeleton width={32} height={32} circle />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Skeleton width="30%" height={10} />
                      <Skeleton width="25%" height={10} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  createGroupBtn: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createGroupText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
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
  groupTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  groupTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  joinedPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  joinedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },
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
  myGroupsScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  myGroupsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  myGroupCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  myGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  myGroupIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563EB",
  },
  myGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  myGroupMembers: {
    fontSize: 11,
    color: "#64748B",
  },
  groupBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  joinActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  emptyGroupsBox: {
    padding: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    marginBottom: 12,
  },
});
