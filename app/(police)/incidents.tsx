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
import { fetchPoliceIncidentsForMap } from "../../src/auth/api";
import type { PoliceIncidentForMap } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

function levelFromStatus(status: string): "critical" | "high" | "medium" | "low" {
  const s = status.toUpperCase();
  if (s === "SUBMITTED" || s === "COMMUNITY_CONFIRMED") return "medium";
  if (s === "POLICE_VERIFIED" || s === "UNDER_INVESTIGATION") return "high";
  if (s === "RESOLVED") return "low";
  return "low";
}

const levelColors: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#22C55E",
};

const levelBg: Record<string, string> = {
  critical: "#FEE2E2",
  high: "#FFEDD5",
  medium: "#FEF9C3",
  low: "#DCFCE7",
};

export default function PoliceIncidentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setPoliceIncidents } = useAppDataCache();

  const {
    data: incidentsData,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "policeIncidents",
    async () => {
      const res = await fetchPoliceIncidentsForMap();
      return res.incidents ?? [];
    },
    setPoliceIncidents
  );

  const incidents = incidentsData ?? [];

  const officerLat = user?.officerLocation?.latitude ?? null;
  const officerLng = user?.officerLocation?.longitude ?? null;

  const formatDistanceKm = useMemo(
    () =>
      (inc: PoliceIncidentForMap) => {
        if (officerLat == null || officerLng == null) return null;
        const R = 6371;
        const dLat = ((inc.latitude - officerLat) * Math.PI) / 180;
        const dLng = ((inc.longitude - officerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((officerLat * Math.PI) / 180) *
            Math.cos((inc.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return `${d.toFixed(1)} km`;
      },
    [officerLat, officerLng]
  );

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView
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
                <Ionicons name="megaphone" size={24} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.heading}>Incident Reports</Text>
                <Text style={styles.subheading}>
                  {incidents.length} recent report{incidents.length === 1 ? "" : "s"} in your area
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={refresh} style={styles.refreshIconBtn}>
               <Ionicons name="refresh" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading && !incidents.length && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.loadingText}>Syncing activity feed...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {incidents.map((inc) => {
            const level = levelFromStatus(inc.status);
            const bg = levelBg[level];
            const color = levelColors[level];
            return (
              <TouchableOpacity
                key={inc.id}
                style={styles.incidentCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(police)/incident-report",
                    params: { id: inc.id },
                  })
                }
              >
                <View style={styles.cardTop}>
                  <View style={[styles.levelBadge, { backgroundColor: bg }]}>
                    <View style={[styles.levelDot, { backgroundColor: color }]} />
                    <Text style={[styles.levelText, { color }]}>
                      {inc.status.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.timeTag}>
                    <Ionicons name="time-outline" size={12} color="#94A3B8" />
                    <Text style={styles.timeText}>
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <Text style={styles.incidentTitle}>
                  {inc.locationLabel || inc.locationAddress || inc.crimeCategory.replace(/_/g, " ")}
                </Text>

                <View style={styles.cardMeta}>
                   <View style={styles.metaRow}>
                     <Ionicons name="location-outline" size={14} color="#64748B" />
                     <Text style={styles.metaText} numberOfLines={1}>
                       {inc.locationAddress || "Unknown Location"}
                     </Text>
                   </View>
                   <View style={styles.metaRow}>
                     <Ionicons name="navigate-circle-outline" size={14} color="#1D4ED8" />
                     <Text style={[styles.metaText, { color: "#1D4ED8", fontWeight: "600" }]}>
                       {formatDistanceKm(inc) ?? "—"} away
                     </Text>
                   </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.categoryBox}>
                    <Text style={styles.categoryText}>{inc.crimeCategory.replace(/_/g, " ")}</Text>
                  </View>
                  
                  <View style={styles.footerRight}>
                    {inc.isPoliceVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
                        <Text style={styles.confirmedText}>Verified</Text>
                      </View>
                    )}
                    <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  
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

  // Loading/Error
  loadingState: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
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

  // Incident Card
  incidentCard: {
    backgroundColor: "#fff",
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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  incidentTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  cardMeta: {
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
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
  categoryBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F8FAFF",
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textTransform: "capitalize",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confirmedText: { 
    fontSize: 11, 
    color: "#16A34A", 
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});