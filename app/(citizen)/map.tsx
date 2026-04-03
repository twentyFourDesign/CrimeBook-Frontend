import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { fetchMyReports } from "../../src/auth/api";
import type { MyReportItem } from "../../src/auth/types";

export default function MapScreen() {
  const [reports, setReports] = useState<MyReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchMyReports();
      setReports(data.reports ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load map");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const points = useMemo(
    () =>
      reports.filter(
        (r): r is MyReportItem & { latitude: number; longitude: number } =>
          typeof r.latitude === "number" && typeof r.longitude === "number"
      ),
    [reports]
  );

  const initialRegion = useMemo(() => {
    const first = points[0];
    if (!first) {
      return {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };
    }
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [points]);

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
          {points.map((report) => (
            <Marker
              key={report.id}
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              title={report.title?.trim() || report.crimeCategory.replace(/_/g, " ")}
              description={`${report.status.replace(/_/g, " ")} • ${new Date(
                report.createdAt
              ).toLocaleDateString()}`}
            />
          ))}
        </MapView>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Safety map</Text>
        {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && !error ? (
          <Text style={styles.subtitle}>
            Showing {points.length} mapped incidents from your reports ({reports.length} total reports).
          </Text>
        ) : null}
      </View>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 8 },
  map: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748B", lineHeight: 22 },
  errorText: { color: "#B91C1C", fontSize: 14, marginTop: 8 },
});
