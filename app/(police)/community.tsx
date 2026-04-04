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
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchFeedReports } from "../../src/auth/api";
import type { FeedReportItem } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export default function PoliceFeedScreen() {
  const router = useRouter();
  const { setFeedReports } = useAppDataCache();

  const {
    data: reportsData,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "feedReports",
    async () => {
      const res = await fetchFeedReports();
      return res.reports ?? [];
    },
    setFeedReports
  );

  const reports = reportsData ?? [];

  const total = reports?.length ?? 0;
  const verifiedCount = useMemo(
    () => (reports ?? []).filter((r) => r.isPoliceVerified).length,
    [reports]
  );

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={revalidating} 
              onRefresh={refresh}
              tintColor="#1D4ED8"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="chatbubbles" size={24} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.heading}>Community Feed</Text>
                <Text style={styles.subheading}>
                  Live reports and alerts across your jurisdiction
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={refresh} style={styles.refreshIconBtn}>
               <Ionicons name="refresh" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>TOTAL</Text>
               <Text style={styles.statValue}>{total}</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>VERIFIED</Text>
               <Text style={[styles.statValue, { color: "#16A34A" }]}>{verifiedCount}</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>PENDING</Text>
               <Text style={[styles.statValue, { color: "#D97706" }]}>{Math.max(total - verifiedCount, 0)}</Text>
             </View>
          </View>

          {loading && !reports.length && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.loadingText}>Loading jurisdiction feed...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {reports.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/(police)/incident-report",
                  params: { id: r.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, r.isPoliceVerified && styles.statusBadgeVerified]}>
                  {r.isPoliceVerified && <Ionicons name="shield-checkmark" size={12} color="#166534" style={{ marginRight: 4 }} />}
                  <Text style={[styles.statusText, r.isPoliceVerified && styles.statusTextVerified]}>
                    {formatEnum(r.status).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.timeText}>
                   {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <Text style={styles.cardTitle}>
                {r.title?.trim() || formatEnum(r.crimeCategory)}
              </Text>
              
              <Text style={styles.cardBody} numberOfLines={3}>
                {r.description}
              </Text>

              <View style={styles.cardMeta}>
                 <Ionicons name="location-outline" size={14} color="#64748B" />
                 <Text style={styles.metaText} numberOfLines={1}>
                    {r.locationLabel || r.locationAddress || "Unknown location"}
                 </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.confirmBox}>
                  <Ionicons name="people" size={14} color="#475569" />
                  <Text style={styles.confirmText}>{r.communityConfirmCount} confirmations</Text>
                </View>
                <View style={styles.viewAction}>
                   <Text style={styles.viewActionText}>Investigate</Text>
                   <Ionicons name="arrow-forward" size={14} color="#1D4ED8" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 },
  
  // Header
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24 
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subheading: { fontSize: 13, color: "#64748B", marginTop: 4 },
  refreshIconBtn: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#F1F5F9",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },

  // Loading/Error
  loadingState: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  loadingText: { fontSize: 14, color: "#64748B", marginLeft: 10, fontWeight: "600" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { color: "#DC2626", fontSize: 14, marginLeft: 8, flex: 1 },

  // Card Design
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FEF3C7",
  },
  statusBadgeVerified: {
    backgroundColor: "#DCFCE7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#92400E",
  },
  statusTextVerified: {
    color: "#166534",
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFF",
  },
  confirmBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  viewAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },
});
