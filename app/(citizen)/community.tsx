import { useCallback } from "react";
import {
  Dimensions,
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
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { fetchCitizenAppeals, fetchCommunityGroups } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import { useFeedSegment } from "../../src/hooks/useFeedSegment";

const TILE_WIDTH = (Dimensions.get("window").width - 52) / 2;

const HUB_TILES = [
  {
    id: "communities",
    title: "Neighborhoods",
    subtitle: "Join groups & chat with neighbors",
    icon: "people" as const,
    color: "#2563EB",
    bg: "#EFF6FF",
    route: "/(citizen)/communities",
  },
  {
    id: "live",
    title: "Live Incidents",
    subtitle: "All active reports (not resolved)",
    icon: "pulse" as const,
    color: "#EA580C",
    bg: "#FFF7ED",
    route: "/(citizen)/live-incidents",
  },
  {
    id: "verified",
    title: "Police Verified",
    subtitle: "Officially confirmed cases",
    icon: "shield-checkmark" as const,
    color: "#16A34A",
    bg: "#F0FDF4",
    route: "/(citizen)/police-verified",
  },
  {
    id: "appeals",
    title: "Police Appeals",
    subtitle: "Help solve open investigations",
    icon: "megaphone" as const,
    color: "#7C3AED",
    bg: "#F5F3FF",
    route: "/(citizen)/police-appeals",
  },
] as const;

export default function CommunityHub() {
  const router = useRouter();
  const { resetDraft } = useReportDraft();
  const { setCommunityGroups, setPublicAppeals } = useAppDataCache();

  const { data: liveReports } = useFeedSegment("live");
  const { data: verifiedReports } = useFeedSegment("verified");
  const { data: groups } = useCachedData(
    "communityGroups",
    async () => {
      const res = await fetchCommunityGroups();
      return res.groups ?? [];
    },
    setCommunityGroups
  );
  const { data: appeals } = useCachedData(
    "publicAppeals",
    async () => {
      const res = await fetchCitizenAppeals();
      return res.appeals ?? [];
    },
    setPublicAppeals
  );

  const counts: Record<string, number> = {
    communities: groups?.length ?? 0,
    live: liveReports?.length ?? 0,
    verified: verifiedReports?.length ?? 0,
    appeals: appeals?.length ?? 0,
  };

  const refreshAll = useCallback(() => {
    // tiles load their own data on mount; hub shows cached counts
  }, []);

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} />}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Community</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Your neighborhood safety hub</Text>
          </View>
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

        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.tileGrid}>
          {HUB_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.tile, { width: TILE_WIDTH, backgroundColor: tile.bg }]}
              activeOpacity={0.85}
              onPress={() => router.push(tile.route)}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: tile.color }]}>
                <Ionicons name={tile.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.tileTitle}>{tile.title}</Text>
              <Text style={styles.tileSubtitle} numberOfLines={2}>
                {tile.subtitle}
              </Text>
              {counts[tile.id] > 0 && (
                <View style={styles.countPill}>
                  <Text style={[styles.countText, { color: tile.color }]}>
                    {counts[tile.id]} {counts[tile.id] === 1 ? "item" : "items"}
                  </Text>
                </View>
              )}
              <View style={styles.tileArrow}>
                <Ionicons name="arrow-forward" size={16} color={tile.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.archiveBanner}
          onPress={() => router.push("/(citizen)/crime-archive")}
          activeOpacity={0.85}
        >
          <View style={styles.archiveIcon}>
            <Ionicons name="library-outline" size={22} color="#0F766E" />
          </View>
          <View style={styles.archiveTextWrap}>
            <Text style={styles.archiveTitle}>Historical Crime Archive</Text>
            <Text style={styles.archiveSubtitle}>
              Nigeria violence records 2010–2026 (police-sourced data)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#0F766E" />
        </TouchableOpacity>
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
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
    marginBottom: 28,
    shadowColor: "#2563EB",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  newAlertTextFull: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 14 },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  tile: {
    borderRadius: 20,
    padding: 18,
    minHeight: 168,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  tileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  tileTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  tileSubtitle: { fontSize: 12, color: "#64748B", lineHeight: 17, flex: 1 },
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 10,
  },
  countText: { fontSize: 11, fontWeight: "700" },
  tileArrow: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  archiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#99F6E4",
    gap: 12,
  },
  archiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
  },
  archiveTextWrap: { flex: 1 },
  archiveTitle: { fontSize: 15, fontWeight: "700", color: "#134E4A" },
  archiveSubtitle: { fontSize: 12, color: "#0F766E", marginTop: 2, lineHeight: 17 },
});
