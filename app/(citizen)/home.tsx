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
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { Skeleton } from "../../src/components/common/Skeleton";
import { fetchMyReports } from "../../src/auth/api";
import type { MyReportItem } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import { useTheme } from "../../src/theme/ThemeContext";

function formatEnum(value: string) {
  return value.replace(/_/g, " ");
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#D97706", COMMUNITY_CONFIRMED: "#2563EB",
  POLICE_VERIFIED: "#16A34A", UNDER_INVESTIGATION: "#7C3AED",
  RESOLVED: "#16A34A", REJECTED: "#DC2626",
};

export default function CitizenHome() {
  const router = useRouter();
  const { setCitizenReports } = useAppDataCache();
  const { colors, animValue, isDark } = useTheme();

  const { data: reportsData, loading, revalidating, error, refresh } = useCachedData(
    "citizenReports",
    async () => { const res = await fetchMyReports(); return res.reports ?? []; },
    setCitizenReports
  );

  const reports = reportsData ?? [];
  const latest = useMemo(() => reports.slice(0, 3), [reports]);
  const stats = useMemo(() => ({
    total: reports.length,
    underInvestigation: reports.filter((r) => r.status === "UNDER_INVESTIGATION").length,
    resolved: reports.filter((r) => r.status === "RESOLVED").length,
    verified: reports.filter((r) => r.isPoliceVerified).length,
  }), [reports]);

  const animBg = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F8FAFF", "#000000"] });
  const animSurface = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FFFFFF", "#141414"] });
  const animBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#E2E8F0", "#2A2A2A"] });
  const animSosBg = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FEF2F2", "#200805"] });
  const animSosBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FECACA", "#3A1008"] });

  return (
    <CitizenShell>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: animBg }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your reports and police progress.</Text>
          </View>
        </View>

        {/* SOS Banner */}
        <TouchableOpacity onPress={() => router.push("/(citizen)/sos")} activeOpacity={0.85}>
          <Animated.View style={[styles.sosBanner, { backgroundColor: animSosBg, borderColor: animSosBorder }]}>
            <View style={styles.sosLeft}>
              <View style={styles.sosDot} />
              <View>
                <Text style={[styles.sosBannerTitle, { color: isDark ? "#F87171" : "#B91C1C" }]}>Emergency SOS</Text>
                <Text style={[styles.sosBannerSub, { color: isDark ? "#FCA5A5" : "#991B1B" }]}>Share live location with responders</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#F87171" : "#991B1B"} />
          </Animated.View>
        </TouchableOpacity>

        {/* Skeleton loading */}
        {loading && !reports.length ? (
          <View style={{ gap: 12 }}>
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Animated.View key={i} style={[styles.statCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
                  <Skeleton width={40} height={24} style={{ marginBottom: 4 }} />
                  <Skeleton width={80} height={12} />
                </Animated.View>
              ))}
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerBg }]}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={[styles.link, { color: colors.accent }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {[
                { label: "Total", value: stats.total, icon: "document-text-outline", color: colors.accent },
                { label: "Investigating", value: stats.underInvestigation, icon: "search-outline", color: "#7C3AED" },
                { label: "Resolved", value: stats.resolved, icon: "checkmark-circle-outline", color: colors.success },
                { label: "Verified", value: stats.verified, icon: "shield-checkmark-outline", color: "#0891B2" },
              ].map(({ label, value, icon, color }) => (
                <Animated.View key={label} style={[styles.statCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
                  <Ionicons name={icon as any} size={18} color={color} style={{ marginBottom: 6 }} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
                </Animated.View>
              ))}
            </View>

            {/* Latest Reports */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Reports</Text>
              <TouchableOpacity onPress={() => router.push("/(citizen)/my-reports")}>
                <Text style={[styles.link, { color: colors.accent }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {latest.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={36} color={colors.borderStrong} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No reports yet. Tap + to create your first.</Text>
              </View>
            ) : (
              <Animated.View style={[styles.listCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
                {latest.map((r, idx) => {
                  const statusColor = STATUS_COLORS[r.status] ?? colors.textTertiary;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reportRow,
                        idx < latest.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                      onPress={() => router.push(`/(citizen)/report-detail/${r.id}`)}
                      activeOpacity={0.55}
                    >
                      <View style={[styles.reportDot, { backgroundColor: statusColor + "25" }]}>
                        <View style={[styles.reportDotInner, { backgroundColor: statusColor }]} />
                      </View>
                      <View style={styles.reportBody}>
                        <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={1}>
                          {r.title?.trim() || formatEnum(r.crimeCategory)}
                        </Text>
                        <Text style={[styles.reportMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                          {r.locationLabel || r.locationAddress || "Location not set"}
                        </Text>
                        <View style={styles.reportBottom}>
                          <View style={[styles.statusChip, { backgroundColor: statusColor + "20" }]}>
                            <Text style={[styles.statusChipText, { color: statusColor }]}>{formatEnum(r.status)}</Text>
                          </View>
                          <Text style={[styles.reportDate, { color: colors.textTertiary }]}>
                            {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.borderStrong} />
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}
          </>
        )}
      </Animated.ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  sosBanner: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sosLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sosDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F43F5E" },
  sosBannerTitle: { fontSize: 15, fontWeight: "700" },
  sosBannerSub: { fontSize: 12, marginTop: 2 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { fontSize: 13, flex: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: {
    width: "48%", borderWidth: 1, borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  link: { fontWeight: "600", fontSize: 13 },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
  listCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  reportRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  reportDot: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  reportDotInner: { width: 10, height: 10, borderRadius: 5 },
  reportBody: { flex: 1 },
  reportTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  reportMeta: { fontSize: 12, marginBottom: 6 },
  reportBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusChipText: { fontSize: 10, fontWeight: "800" },
  reportDate: { fontSize: 11 },
});
