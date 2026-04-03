import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { fetchMyReports } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ");
}

export default function MyReportsScreen() {
  const router = useRouter();
  const { citizenReports, setCitizenReports } = useAppDataCache();
  const cacheRef = useRef(citizenReports);
  cacheRef.current = citizenReports;
  const reports = citizenReports ?? [];
  const [loading, setLoading] = useState(() => citizenReports === null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode?: "refresh") => {
    setError(null);
    if (mode === "refresh") {
      setRefreshing(true);
    } else if (cacheRef.current === null) {
      setLoading(true);
    }
    try {
      const data = await fetchMyReports();
      setCitizenReports(data.reports);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setCitizenReports]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CitizenShell>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>My reports</Text>
        </View>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator />
          </View>
        )}

        {error && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity onPress={() => load()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && reports.length === 0 && (
          <Text style={styles.empty}>No reports yet. Use the + button to submit one.</Text>
        )}

        {reports.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.reportCard}
            onPress={() => router.push(`/(citizen)/report-detail/${r.id}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.reportTitle}>{r.title?.trim() || formatCategory(r.crimeCategory)}</Text>
            <Text style={styles.reportCat}>{formatCategory(r.crimeCategory)}</Text>
            <Text style={styles.reportStatus}>Status: {r.status.replace(/_/g, " ")}</Text>
            {r.locationLabel || r.locationAddress ? (
              <Text style={styles.reportLoc} numberOfLines={2}>
                {r.locationLabel || r.locationAddress}
              </Text>
            ) : null}
            <Text style={styles.reportDate}>{new Date(r.createdAt).toLocaleString()}</Text>
            <Text style={styles.chevron}>View details →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111", flex: 1 },
  centerRow: { paddingVertical: 24, alignItems: "center" },
  errBox: { marginBottom: 12 },
  errText: { color: "#B91C1C", fontSize: 14 },
  retry: { marginTop: 8, alignSelf: "flex-start" },
  retryText: { color: "#2563EB", fontWeight: "600" },
  empty: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  reportCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  reportTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  reportCat: { fontSize: 13, color: "#64748B", marginTop: 4 },
  reportStatus: { fontSize: 13, color: "#334155", marginTop: 8, fontWeight: "600" },
  reportLoc: { fontSize: 12, color: "#64748B", marginTop: 6 },
  reportDate: { fontSize: 11, color: "#94A3B8", marginTop: 10 },
  chevron: { fontSize: 13, color: "#2563EB", fontWeight: "600", marginTop: 10 },
});
