import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentsForMap } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

export default function PoliceMapScreen() {
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

  const initialRegion = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
    }
    const first = incidents[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [incidents]);

  const heatmapPoints = useMemo(
    () =>
      (incidents ?? []).map((i) => ({
        latitude: i.latitude,
        longitude: i.longitude,
        weight: 1,
      })),
    [incidents]
  );

  const total = incidents?.length ?? 0;

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} />}
      >
        <View style={styles.mapWrapper}>
          <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
            {heatmapPoints.length > 0 && <Heatmap points={heatmapPoints} radius={40} opacity={0.7} />}
            {(incidents ?? []).slice(0, 50).map((i) => (
              <Marker
                key={i.id}
                coordinate={{ latitude: i.latitude, longitude: i.longitude }}
                title={i.locationLabel ?? undefined}
                description={i.locationAddress ?? undefined}
              />
            ))}
          </MapView>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.title}>Incident heatmap</Text>
          {loading ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" />
              <Text style={styles.subtitle}>Loading incidents…</Text>
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.subtitle}>
              Showing {total} recent incident{total === 1 ? "" : "s"} in your jurisdiction.
            </Text>
          )}
        </View>
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  mapWrapper: {
    height: 320,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C7D7F0",
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748B" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  error: { fontSize: 13, color: "#DC2626" },
});
