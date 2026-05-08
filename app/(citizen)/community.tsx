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
import { 
  fetchCitizenAppeals, 
  fetchCommunityGroups, 
  fetchFeedReports,
  submitReportVote,
  submitReportComment
} from "../../src/auth/api";
import type { CommunityGroup, FeedReportItem, PublicAppealItem, VoteType } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export default function Community() {
  const router = useRouter();
  const { resetDraft } = useReportDraft();
  const { setFeedReports, setCommunityGroups, setPublicAppeals } = useAppDataCache();

  // 1. Incident Feed
  const {
    data: reports,
    loading: reportsLoading,
    revalidating: reportsRevalidating,
    error: reportsError,
    refresh: refreshReports,
  } = useCachedData(
    "feedReports",
    async () => {
      const res = await fetchFeedReports();
      return res.reports ?? [];
    },
    setFeedReports
  );

  // 2. Public Appeals
  const {
    data: appeals,
    loading: appealsLoading,
    revalidating: appealsRevalidating,
    error: appealsError,
    refresh: refreshAppeals,
  } = useCachedData(
    "publicAppeals",
    async () => {
      const res = await fetchCitizenAppeals();
      return res.appeals ?? [];
    },
    setPublicAppeals
  );

  // 3. Community Groups
  const {
    data: groupsData,
    loading: groupsLoading,
    revalidating: groupsRevalidating,
    error: groupsError,
    refresh: refreshGroups,
  } = useCachedData(
    "communityGroups",
    async () => {
      const res = await fetchCommunityGroups();
      return res.groups ?? [];
    },
    setCommunityGroups
  );

  const groups = groupsData ?? [];
  const loading = reportsLoading && appealsLoading && groupsLoading;
  const isAnyRevalidating = reportsRevalidating || appealsRevalidating || groupsRevalidating;

  const refreshAll = useCallback(() => {
    refreshReports();
    refreshAppeals();
    refreshGroups();
  }, [refreshReports, refreshAppeals, refreshGroups]);

  const handleVote = async (reportId: string, voteType: VoteType) => {
    const report = (reports ?? []).find(r => r.id === reportId);
    if (!report) return;

    const newVote = report.myVote === voteType ? null : voteType;
    
    // Optimistic update
    const updatedReports = (reports ?? []).map(r => {
      if (r.id !== reportId) return r;
      
      let up = r.upvoteCount;
      let down = r.downvoteCount;
      
      // Remove old vote
      if (r.myVote === "UPVOTE") up--;
      if (r.myVote === "DOWNVOTE") down--;
      
      // Add new vote
      if (newVote === "UPVOTE") up++;
      if (newVote === "DOWNVOTE") down++;
      
      return { ...r, upvoteCount: up, downvoteCount: down, myVote: newVote };
    });
    setFeedReports(updatedReports);

    try {
      await submitReportVote(reportId, newVote);
    } catch (e) {
      // Revert on error
      refreshReports();
    }
  };


  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isAnyRevalidating} onRefresh={refreshAll} />}
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
            style={styles.settingsHeaderBtn}
            onPress={() => alert("Community settings coming soon")}
          >
            <Ionicons name="settings-outline" size={22} color="#475569" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newAlertBtnFull}
          onPress={() => {
            resetDraft();
            router.push("/(citizen)/report-step1");
          }}
        >
          <Ionicons name="megaphone" size={18} color="#fff" />
          <Text style={styles.newAlertTextFull}>Report Incident</Text>
        </TouchableOpacity>


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
                  <View style={styles.groupMetaInner}>
                    <Ionicons name="people-outline" size={14} color="#64748B" />
                    <Text style={styles.groupMetaText}>{g.memberCount}</Text>
                    <View style={styles.metaDot} />
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.groupMetaText}>{g.radiusKm}km</Text>
                  </View>
                  <Text style={styles.joinActionText}>View Details</Text>
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
                <View style={styles.appealBadge}>
                  <Ionicons name="alert-circle" size={14} color="#92400E" />
                  <Text style={styles.appealBadgeText}>POLICE APPEAL</Text>
                </View>
                <Text style={styles.appealTitle}>{a.title}</Text>
                <Text style={styles.appealCase}>Case #{a.caseNumber}</Text>
                <Text style={styles.appealBody} numberOfLines={3}>
                  {a.description}
                </Text>
                <View style={styles.appealFooter}>
                  <Ionicons name="time-outline" size={12} color="#A8A29E" />
                  <Text style={styles.appealMeta}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </Text>
                </View>
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
                <View style={styles.incidentTop}>
                  <Skeleton width={40} height={40} borderRadius={10} />
                  <View style={{ flex: 1, gap: 6, marginLeft: 12 }}>
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="40%" height={12} />
                  </View>
                </View>
                <View style={styles.incidentBottom}>
                   <Skeleton width="40%" height={10} />
                   <Skeleton width="30%" height={10} />
                </View>
              </View>
            ))}
          </View>
        )}

        {reportsError && !loading && (
          <Text style={styles.errorText}>{reportsError}</Text>
        )}

        {!loading &&
          (reports ?? []).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.incidentCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/(citizen)/community-report/${item.id}`)}
            >
              <View style={styles.incidentTop}>
                <View style={[styles.categoryIcon, { backgroundColor: item.isPoliceVerified ? "#F0FDF4" : "#F8FAFC" }]}>
                  <Ionicons 
                    name={item.isPoliceVerified ? "shield-checkmark" : "alert-circle-outline"} 
                    size={22} 
                    color={item.isPoliceVerified ? "#16A34A" : "#64748B"} 
                  />
                </View>
                <View style={styles.incidentInfo}>
                  <Text style={styles.incidentTitle} numberOfLines={1}>
                    {item.title?.trim() || 
                     (item.crimeCategory === "OTHER" && item.otherCrimeType 
                       ? `Other: ${item.otherCrimeType}` 
                       : formatEnum(item.crimeCategory))}
                  </Text>
                  {item.locationLabel || item.locationAddress ? (
                    <View style={styles.incidentLocationRow}>
                      <Ionicons name="location-outline" size={12} color="#94A3B8" />
                      <Text style={styles.incidentLocation} numberOfLines={1}>
                        {item.locationLabel || item.locationAddress}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {item.isPoliceVerified && <View style={styles.verifiedTag}><Ionicons name="checkmark-circle" size={14} color="#16A34A" /></View>}
              </View>

              <View style={styles.incidentDivider} />

              <View style={styles.incidentBottom}>
                <View style={styles.socialActions}>
                  <TouchableOpacity 
                    style={[styles.socialBtn, item.myVote === "UPVOTE" && styles.socialBtnActiveUp]}
                    onPress={() => handleVote(item.id, "UPVOTE")}
                  >
                    <Ionicons 
                      name={item.myVote === "UPVOTE" ? "thumbs-up" : "thumbs-up-outline"} 
                      size={16} 
                      color={item.myVote === "UPVOTE" ? "#fff" : "#1D4ED8"} 
                    />
                    <Text style={[styles.socialBtnText, item.myVote === "UPVOTE" && styles.socialBtnTextActive]}>
                      {item.upvoteCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.socialBtn, item.myVote === "DOWNVOTE" && styles.socialBtnActiveDown]}
                    onPress={() => handleVote(item.id, "DOWNVOTE")}
                  >
                    <Ionicons 
                      name={item.myVote === "DOWNVOTE" ? "thumbs-down" : "thumbs-down-outline"} 
                      size={16} 
                      color={item.myVote === "DOWNVOTE" ? "#fff" : "#B91C1C"} 
                    />
                    <Text style={[styles.socialBtnText, item.myVote === "DOWNVOTE" && styles.socialBtnTextActive]}>
                      {item.downvoteCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.socialBtn}
                    onPress={() => router.push(`/(citizen)/community-report/${item.id}`)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#64748B" />
                    <Text style={styles.socialBtnText}>{item.commentCount}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color="#94A3B8" />
                  <Text style={styles.metaText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
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
  newAlertBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  newAlertTextFull: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  appealCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
    shadowColor: "#92400E",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  appealBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 12,
  },
  appealBadgeText: { 
    fontSize: 10, 
    fontWeight: "800", 
    color: "#92400E",
    letterSpacing: 0.5,
  },
  appealTitle: { fontSize: 17, fontWeight: "700", color: "#451a03" },
  appealCase: { fontSize: 13, fontWeight: "600", color: "#92400E", marginTop: 4, marginBottom: 8 },
  appealBody: { fontSize: 14, color: "#78350f", lineHeight: 22, opacity: 0.9 },
  appealFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(146, 64, 14, 0.1)",
    gap: 6,
  },
  appealMeta: { fontSize: 12, fontWeight: "600", color: "#A8A29E" },
  mutedAppeals: { fontSize: 13, color: "#94A3B8", marginBottom: 12, textAlign: "center" },
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  incidentTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  incidentInfo: { flex: 1 },
  incidentTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  incidentLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  incidentLocation: { fontSize: 12, color: "#64748B", flex: 1 },
  incidentDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  incidentBottom: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "500", color: "#94A3B8" },
  confirmationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  confirmationPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  confidenceText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  verifiedTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
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
  groupMetaInner: { flexDirection: "row", alignItems: "center", flex: 1 },
  groupMetaText: { fontSize: 12, fontWeight: "600", color: "#64748B", marginLeft: 4 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  joinActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  socialActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  socialBtnActiveUp: {
    backgroundColor: "#1D4ED8",
  },
  socialBtnActiveDown: {
    backgroundColor: "#B91C1C",
  },
  socialBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  socialBtnTextActive: {
    color: "#fff",
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
