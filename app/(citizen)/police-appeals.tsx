import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { LoadingState } from "../../src/components/common/LoadingState";
import { fetchCitizenAppeals } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

export default function PoliceAppealsScreen() {
  const { setPublicAppeals } = useAppDataCache();
  const {
    data: appeals,
    loading,
    revalidating,
    error,
    refresh,
  } = useCachedData(
    "publicAppeals",
    async () => {
      const res = await fetchCitizenAppeals();
      return res.appeals ?? [];
    },
    setPublicAppeals
  );

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

        <View style={styles.titleRow}>
          <Ionicons name="megaphone" size={26} color="#7C3AED" />
          <Text style={styles.title}>Police Appeals</Text>
        </View>
        <Text style={styles.subtitle}>
          Public requests for information on open investigations
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <LoadingState message="Loading appeals…" />
        ) : !appeals?.length ? (
          <Text style={styles.emptyText}>No active police appeals right now.</Text>
        ) : (
          appeals.map((a) => (
            <View key={a.id} style={styles.appealCard}>
              <View style={styles.appealBadge}>
                <Ionicons name="alert-circle" size={14} color="#92400E" />
                <Text style={styles.appealBadgeText}>POLICE APPEAL</Text>
              </View>
              <Text style={styles.appealTitle}>{a.title}</Text>
              <Text style={styles.appealCase}>Case #{a.caseNumber}</Text>
              <Text style={styles.appealBody}>{a.description}</Text>
              <View style={styles.appealFooter}>
                <Ionicons name="time-outline" size={12} color="#A8A29E" />
                <Text style={styles.appealMeta}>
                  {new Date(a.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingBottom: 32 },
  topBar: { marginTop: 8, marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 20, lineHeight: 20 },
  appealCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
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
  appealBody: { fontSize: 14, color: "#78350f", lineHeight: 22 },
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
  errorText: { fontSize: 13, color: "#DC2626", marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center", paddingVertical: 32 },
});
