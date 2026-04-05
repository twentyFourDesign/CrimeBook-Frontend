import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentsForMap } from "../../src/auth/api";
import type { PoliceIncidentForMap } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import { useTheme } from "../../src/theme/ThemeContext";

const levelColors: Record<string, string> = {
  critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#22C55E",
};

function levelFromStatus(status: string): "critical" | "high" | "medium" | "low" {
  const s = status.toUpperCase();
  if (s === "SUBMITTED" || s === "COMMUNITY_CONFIRMED") return "medium";
  if (s === "POLICE_VERIFIED" || s === "UNDER_INVESTIGATION") return "high";
  if (s === "RESOLVED") return "low";
  return "low";
}

function getConfidence(score?: number | null) {
  if (score == null) return null;
  if (score >= 70) return { label: "High", color: "#16A34A" };
  if (score >= 40) return { label: "Med", color: "#D97706" };
  return { label: "Low", color: "#DC2626" };
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const CATEGORY_ICONS: Record<string, string> = {
  ROBBERY: "bag-remove", ASSAULT: "body", KIDNAPPING: "person-remove",
  DOMESTIC_VIOLENCE: "home", DRUG_ACTIVITY: "medical", TRAFFIC_CRIME: "car",
  FRAUD: "card", MISSING_PERSON: "search", VANDALISM: "hammer",
  SUSPICIOUS_ACTIVITY: "eye", OTHER: "alert-circle",
};

export default function PoliceHome() {
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
  const total = incidents.length;
  const activeCount = useMemo(() => incidents.filter((i) => !["RESOLVED", "REJECTED", "ARCHIVED"].includes(i.status.toUpperCase())).length, [incidents]);
  const resolvedToday = useMemo(() => {
    const today = new Date().toDateString();
    return incidents.filter((i) => new Date(i.createdAt).toDateString() === today && i.status.toUpperCase() === "RESOLVED").length;
  }, [incidents]);

  const priorityAlerts = useMemo(() => incidents.slice(0, 5), [incidents]);
  const nearbyIncidents = useMemo(() => incidents.slice(5, 12), [incidents]);
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

  const animBg = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F8FAFF", "#000000"] });
  const animSurface = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FFFFFF", "#141414"] });
  const animBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F1F5F9", "#2A2A2A"] });
  const animSosBg = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FFF1F2", "#200805"] });
  const animSosBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FECDD3", "#3A1008"] });

  return (
    <PoliceShell>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: animBg }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} tintColor={colors.accent} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Command Center</Text>
            <View style={styles.dutyRow}>
              <View style={styles.greenDot} />
              <Text style={[styles.dutyLabel, { color: colors.textTertiary }]}>On Duty</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/(police)/profile")} style={styles.avatarBtn}>
            <Ionicons name="person-circle" size={34} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <Animated.View style={[styles.statsRow, { backgroundColor: animSurface, borderColor: animBorder }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.text }]}>{activeCount}</Text>
            <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.text }]}>{total}</Text>
            <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Total</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.success }]}>{resolvedToday}</Text>
            <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Resolved</Text>
          </View>
        </Animated.View>

        {/* ── SOS ── */}
        <Animated.View style={[styles.sosBannerWrap, { backgroundColor: animSosBg, borderColor: animSosBorder }]}>
          <TouchableOpacity style={styles.sosBannerInner} activeOpacity={0.85} onPress={() => router.push("/(police)/sos-active")}>
            <View style={styles.sosLeft}>
              <View style={styles.sosDot} />
              <View>
                <Text style={[styles.sosTitle, { color: isDark ? "#F87171" : "#881337" }]}>SOS Alerts Active</Text>
                <Text style={[styles.sosSub, { color: isDark ? "#FCA5A5" : "#BE123C" }]}>Tap to view emergency requests</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#F87171" : "#991B1B"} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Priority Alerts ── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority Alerts</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={[styles.sectionAction, { color: colors.accent }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading && !incidents.length ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading…</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.listCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
          {priorityAlerts.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No priority alerts right now</Text>
            </View>
          ) : null}
          {priorityAlerts.map((inc, idx) => {
            const level = levelFromStatus(inc.status);
            const conf = getConfidence(inc.credibilityScore);
            const icon = (CATEGORY_ICONS[inc.crimeCategory] ?? "alert-circle") as any;
            return (
              <TouchableOpacity
                key={inc.id}
                style={[styles.alertRow, idx < priorityAlerts.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                activeOpacity={0.55}
                onPress={() => router.push({ pathname: "/(police)/incident-report", params: { id: inc.id } })}
              >
                <View style={[styles.alertStrip, { backgroundColor: levelColors[level] }]} />
                <View style={[styles.alertIcon, { backgroundColor: levelColors[level] + "20" }]}>
                  <Ionicons name={icon} size={16} color={levelColors[level]} />
                </View>
                <View style={styles.alertBody}>
                  <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>
                    {inc.crimeCategory.replace(/_/g, " ")}
                  </Text>
                  <Text style={[styles.alertSub, { color: colors.textTertiary }]} numberOfLines={1}>
                    {inc.locationLabel || inc.locationAddress || "Unknown location"}
                  </Text>
                </View>
                <View style={styles.alertRight}>
                  <Text style={[styles.alertTime, { color: colors.textTertiary }]}>{timeAgo(inc.createdAt)}</Text>
                  {conf && <Text style={[styles.alertConf, { color: conf.color }]}>{conf.label}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.borderStrong} />
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── Nearby Activity ── */}
        <View style={[styles.sectionRow, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Activity</Text>
        </View>

        <Animated.View style={[styles.listCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
          {nearbyIncidents.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No nearby incidents</Text>
            </View>
          ) : null}
          {nearbyIncidents.map((inc, idx) => {
            const level = levelFromStatus(inc.status);
            const icon = (CATEGORY_ICONS[inc.crimeCategory] ?? "alert-circle") as any;
            const dist = distKm(inc);
            return (
              <TouchableOpacity
                key={inc.id}
                style={[styles.nearbyRow, idx < nearbyIncidents.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                activeOpacity={0.55}
                onPress={() => router.push({ pathname: "/(police)/incident-report", params: { id: inc.id } })}
              >
                <View style={[styles.nearbyIcon, { backgroundColor: levelColors[level] + "18" }]}>
                  <Ionicons name={icon} size={15} color={levelColors[level]} />
                </View>
                <View style={styles.nearbyBody}>
                  <Text style={[styles.nearbyTitle, { color: colors.text }]} numberOfLines={1}>
                    {inc.locationLabel || inc.crimeCategory.replace(/_/g, " ")}
                  </Text>
                  <Text style={[styles.nearbySub, { color: colors.textTertiary }]}>
                    {dist ? `${dist} · ` : ""}{timeAgo(inc.createdAt)}
                  </Text>
                </View>
                <View style={[styles.nearbyDot, { backgroundColor: levelColors[level] }]} />
                <Ionicons name="chevron-forward" size={14} color={colors.borderStrong} />
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </Animated.ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 48 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  greeting: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  dutyRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  dutyLabel: { fontSize: 12, fontWeight: "600" },
  avatarBtn: { padding: 2 },
  statsRow: {
    flexDirection: "row", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    marginBottom: 16, borderWidth: 1, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLbl: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  sosBannerWrap: { borderRadius: 14, marginBottom: 28, borderWidth: 1, overflow: "hidden" },
  sosBannerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 16 },
  sosLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sosDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F43F5E" },
  sosTitle: { fontSize: 14, fontWeight: "700" },
  sosSub: { fontSize: 12, marginTop: 1 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, justifyContent: "center" },
  loadingText: { fontSize: 13 },
  listCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emptyState: { padding: 20, alignItems: "center" },
  emptyText: { fontSize: 13 },
  alertRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingRight: 14, gap: 10 },
  alertStrip: { width: 3, alignSelf: "stretch", borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  alertIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: "700" },
  alertSub: { fontSize: 11, marginTop: 2 },
  alertRight: { alignItems: "flex-end", gap: 3 },
  alertTime: { fontSize: 11, fontWeight: "500" },
  alertConf: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  nearbyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 14, gap: 10 },
  nearbyIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  nearbyBody: { flex: 1 },
  nearbyTitle: { fontSize: 13, fontWeight: "600" },
  nearbySub: { fontSize: 11, marginTop: 1 },
  nearbyDot: { width: 6, height: 6, borderRadius: 3 },
});