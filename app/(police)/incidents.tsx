import { useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
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
import { useTheme } from "../../src/theme/ThemeContext";

const STATUS_META: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  SUBMITTED: { label: "New", color: "#D97706", bg: "#FEF9C3", darkBg: "#1F1800" },
  COMMUNITY_CONFIRMED: { label: "Confirmed", color: "#2563EB", bg: "#EFF6FF", darkBg: "#0D1F3C" },
  POLICE_VERIFIED: { label: "Verified", color: "#16A34A", bg: "#DCFCE7", darkBg: "#0A2010" },
  UNDER_INVESTIGATION: { label: "Active", color: "#7C3AED", bg: "#F5F3FF", darkBg: "#1E1B4B" },
  POLICE_RESOLVED: { label: "Resolved", color: "#16A34A", bg: "#DCFCE7", darkBg: "#0A2010" },
  RESOLVED: { label: "Closed", color: "#94A3B8", bg: "#F1F5F9", darkBg: "#141414" },
  REJECTED: { label: "Rejected", color: "#DC2626", bg: "#FEE2E2", darkBg: "#200805" },
};

const CATEGORY_ICONS: Record<string, string> = {
  ROBBERY: "bag-remove", ASSAULT: "body", KIDNAPPING: "person-remove",
  DOMESTIC_VIOLENCE: "home", DRUG_ACTIVITY: "medical", TRAFFIC_CRIME: "car",
  FRAUD: "card", MISSING_PERSON: "search", VANDALISM: "hammer",
  SUSPICIOUS_ACTIVITY: "eye", OTHER: "alert-circle",
};

const CATEGORY_COLORS: Record<string, string> = {
  ROBBERY: "#EF4444", ASSAULT: "#F97316", KIDNAPPING: "#DC2626",
  DOMESTIC_VIOLENCE: "#DB2777", DRUG_ACTIVITY: "#7C3AED", TRAFFIC_CRIME: "#0891B2",
  FRAUD: "#D97706", MISSING_PERSON: "#2563EB", VANDALISM: "#65A30D",
  SUSPICIOUS_ACTIVITY: "#B45309", OTHER: "#64748B",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function getConfidence(score?: number | null) {
  if (score == null) return null;
  if (score >= 70) return { label: "High", color: "#16A34A" };
  if (score >= 40) return { label: "Med", color: "#D97706" };
  return { label: "Low", color: "#DC2626" };
}

export default function PoliceIncidentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setPoliceIncidents } = useAppDataCache();
  const { colors, animValue, isDark } = useTheme();

  const { data: incidentsData, loading, revalidating, error, refresh } = useCachedData(
    "policeIncidents",
    async () => { const res = await fetchPoliceIncidentsForMap(); return res.incidents ?? []; },
    setPoliceIncidents
  );

  const incidents = incidentsData ?? [];
  const officerLat = user?.officerLocation?.latitude ?? null;
  const officerLng = user?.officerLocation?.longitude ?? null;

  function distKm(inc: PoliceIncidentForMap) {
    if (officerLat == null || officerLng == null) return null;
    const R = 6371;
    const dLat = ((inc.latitude - officerLat) * Math.PI) / 180;
    const dLng = ((inc.longitude - officerLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((officerLat * Math.PI) / 180) * Math.cos((inc.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return `${(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)} km`;
  }

  const grouped = useMemo(() => {
    const map = new Map<string, PoliceIncidentForMap[]>();
    incidents.forEach((inc) => {
      const d = new Date(inc.createdAt);
      const today = new Date(); const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      let label: string;
      if (d.toDateString() === today.toDateString()) label = "Today";
      else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
      else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(inc);
    });
    return Array.from(map.entries());
  }, [incidents]);

  const animBg = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F8FAFF", "#000000"] });
  const animTopBar = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F8FAFF", "#000000"] });
  const animSurface = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FFFFFF", "#141414"] });
  const animBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F1F5F9", "#2A2A2A"] });
  const animTopBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#E2E8F0", "#2A2A2A"] });

  return (
    <PoliceShell>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.wrapper}>
        {/* Fixed Header */}
        <Animated.View style={[styles.topBar, { backgroundColor: animTopBar, borderBottomColor: animTopBorder }]}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Incidents</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textTertiary }]}>
              {revalidating ? "Syncing…" : `${incidents.length} report${incidents.length === 1 ? "" : "s"}`}
            </Text>
          </View>
          <TouchableOpacity onPress={refresh} style={[styles.refreshBtn, { backgroundColor: colors.accentSoft }]}>
            {revalidating
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Ionicons name="refresh" size={18} color={colors.accent} />}
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          style={{ flex: 1, backgroundColor: animBg }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} tintColor={colors.accent} />}
        >
          {loading && !incidents.length ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading incident reports…</Text>
            </View>
          ) : null}

          {error && !loading ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && incidents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={colors.borderStrong} />
              <Text style={[styles.emptyTitle, { color: colors.textTertiary }]}>No Incidents</Text>
              <Text style={[styles.emptyText, { color: colors.borderStrong }]}>Pull down to refresh</Text>
            </View>
          ) : null}

          {grouped.map(([dateLabel, items]) => (
            <View key={dateLabel} style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>{dateLabel}</Text>

              <Animated.View style={[styles.groupCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
                {items.map((inc, idx) => {
                  const statusMeta = STATUS_META[inc.status] ?? STATUS_META["SUBMITTED"];
                  const color = CATEGORY_COLORS[inc.crimeCategory] ?? "#64748B";
                  const icon = (CATEGORY_ICONS[inc.crimeCategory] ?? "alert-circle") as any;
                  const conf = getConfidence(inc.credibilityScore);
                  const dist = distKm(inc);
                  const pillBg = isDark ? statusMeta.darkBg : statusMeta.bg;

                  return (
                    <TouchableOpacity
                      key={inc.id}
                      style={[
                        styles.incRow,
                        idx < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                      activeOpacity={0.55}
                      onPress={() => router.push({ pathname: "/(police)/incident-report", params: { id: inc.id } })}
                    >
                      <View style={[styles.incIcon, { backgroundColor: color + "20" }]}>
                        <Ionicons name={icon} size={17} color={color} />
                      </View>
                      <View style={styles.incBody}>
                        <View style={styles.incTopRow}>
                          <Text style={[styles.incCategory, { color: colors.text }]}>
                            {inc.crimeCategory.replace(/_/g, " ")}
                          </Text>
                          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
                            <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                          </View>
                        </View>
                        <Text style={[styles.incLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                          {inc.locationLabel || inc.locationAddress || "Location unknown"}
                        </Text>
                        <View style={styles.incMeta}>
                          <Text style={[styles.incMetaText, { color: colors.textTertiary }]}>{timeAgo(inc.createdAt)}</Text>
                          {dist ? (
                            <><View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} /><Text style={[styles.incMetaText, { color: colors.textTertiary }]}>{dist}</Text></>
                          ) : null}
                          {conf ? (
                            <><View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} /><Text style={[styles.incMetaText, { color: conf.color, fontWeight: "700" }]}>{conf.label}</Text></>
                          ) : null}
                          {inc.isPoliceVerified ? (
                            <><View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} /><Ionicons name="shield-checkmark" size={11} color={colors.success} /></>
                          ) : null}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.borderStrong} />
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  loadingState: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { fontSize: 13 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  errorText: { fontSize: 13, flex: 1 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13 },
  group: { marginBottom: 24 },
  groupLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
  groupCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  incRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 11 },
  incIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  incBody: { flex: 1 },
  incTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  incCategory: { fontSize: 13, fontWeight: "700", flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  incLocation: { fontSize: 12, marginBottom: 4 },
  incMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  incMetaText: { fontSize: 11 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },
});