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
          refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.heading}>Incidents</Text>
              <Text style={styles.subheading}>
                {(incidents ?? []).length} recent reports
              </Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Loading incidents…</Text>
            </View>
          )}

          {error && !loading && <Text style={styles.errorText}>{error}</Text>}

          {!loading &&
            (incidents ?? []).map((inc) => {
              const level = levelFromStatus(inc.status);
              const bg = levelBg[level];
              const color = levelColors[level];
              return (
                <TouchableOpacity
                  key={inc.id}
                  style={styles.incidentCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/(police)/incident-report",
                      params: { id: inc.id },
                    })
                  }
                >
                  <View style={styles.incidentLeft}>
                    <View style={styles.incidentInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.incidentTitle}>
                          {inc.locationLabel || inc.locationAddress || "Unknown location"}
                        </Text>
                        <View style={[styles.levelBadge, { backgroundColor: bg }]}>
                          <Text style={[styles.levelText, { color }]}>
                            {inc.status.toLowerCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.metaText}>
                        {formatDistanceKm(inc) ?? "—"} •{" "}
                        {new Date(inc.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.incidentRight}>
                    {inc.isPoliceVerified && (
                      <Text style={styles.confirmedText}>✓ Police verified</Text>
                    )}
                    <Text style={styles.chevron}>›</Text>
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
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  heading: { fontSize: 20, fontWeight: "700", color: "#111" },
  subheading: { fontSize: 12, color: "#888", marginTop: 2 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChevron: { fontSize: 14, color: "#0F172A" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#333" },
  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentLeft: { flex: 1 },
  incidentInfo: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  incidentTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  levelText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  metaText: { fontSize: 11, color: "#888" },
  incidentRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  confirmedText: { fontSize: 11, color: "#22C55E", fontWeight: "600" },
  chevron: { fontSize: 20, color: "#CBD5E1" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  loadingText: { fontSize: 12, color: "#64748B" },
  errorText: { fontSize: 12, color: "#DC2626", marginBottom: 12 },
});