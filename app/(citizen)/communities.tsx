import { useCallback } from "react";
import {
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
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { LoadingState } from "../../src/components/common/LoadingState";
import { fetchCommunityGroups } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

export default function CommunitiesScreen() {
  const router = useRouter();
  const { setCommunityGroups } = useAppDataCache();
  const {
    data: groups,
    loading,
    revalidating,
    error,
    refresh,
  } = useCachedData(
    "communityGroups",
    async () => {
      const res = await fetchCommunityGroups();
      return res.groups ?? [];
    },
    setCommunityGroups
  );

  const joined = (groups ?? []).filter((g) => g.isMember);
  const discover = (groups ?? []).filter((g) => !g.isMember);

  const refreshAll = useCallback(() => refresh(), [refresh]);

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refreshAll} />}
      >
        <View style={styles.topBar}>
          <ScreenBackButton fallbackHref="/(citizen)/community" />
        </View>

        <Text style={styles.title}>Neighborhoods</Text>
        <Text style={styles.subtitle}>Connect with local groups and stay informed</Text>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/(citizen)/create-group")}
        >
          <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
          <Text style={styles.createBtnText}>Create a group</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <LoadingState message="Loading neighborhoods…" />
        ) : (
          <>
            {joined.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>My groups</Text>
                {joined.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.groupCard}
                    onPress={() => router.push(`/(citizen)/group/${g.id}`)}
                  >
                    <View style={styles.groupIcon}>
                      <Text style={styles.groupIconText}>{g.name[0]}</Text>
                    </View>
                    <View style={styles.groupBody}>
                      <Text style={styles.groupTitle}>{g.name}</Text>
                      <Text style={styles.groupMeta}>{g.memberCount} members · {g.radiusKm}km radius</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={styles.sectionTitle}>Discover</Text>
            {discover.length === 0 ? (
              <Text style={styles.emptyText}>No groups to discover yet. Create the first one!</Text>
            ) : (
              discover.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/(citizen)/group/${g.id}`)}
                >
                  <View style={[styles.groupIcon, { backgroundColor: "#F1F5F9" }]}>
                    <Text style={[styles.groupIconText, { color: "#475569" }]}>{g.name[0]}</Text>
                  </View>
                  <View style={styles.groupBody}>
                    <Text style={styles.groupTitle}>{g.name}</Text>
                    {g.description ? (
                      <Text style={styles.groupDesc} numberOfLines={2}>{g.description}</Text>
                    ) : null}
                    <Text style={styles.groupMeta}>{g.memberCount} members · {g.radiusKm}km</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingBottom: 32 },
  topBar: { marginTop: 8, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 20, lineHeight: 20 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#2563EB" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12, marginTop: 8 },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  groupIconText: { fontSize: 20, fontWeight: "700", color: "#2563EB" },
  groupBody: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  groupDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },
  groupMeta: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  errorText: { fontSize: 13, color: "#DC2626", marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center", paddingVertical: 24 },
});
