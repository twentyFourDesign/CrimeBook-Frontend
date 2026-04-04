import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { fetchMyReports } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import type { MyReportItem } from "../../src/auth/types";

export default function MapScreen() {
  const { setCitizenReports } = useAppDataCache();

  const {
    data: reportsData,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "citizenReports",
    async () => {
      const res = await fetchMyReports();
      return res.reports ?? [];
    },
    setCitizenReports
  );

  const reports = reportsData ?? [];

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
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
        >
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

        {/* Floating Header */}
        <View style={styles.floatingHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Safety Map</Text>
            {revalidating && <ActivityIndicator size="small" color="#2563EB" style={{ marginLeft: 8 }} />}
          </View>
          {!loading && !error && points.length > 0 && (
            <Text style={styles.subtitle}>
              {points.length} incident{points.length === 1 ? "" : "s"} reported by you
            </Text>
          )}
        </View>

        {error ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  errorOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "center",
  },
});
