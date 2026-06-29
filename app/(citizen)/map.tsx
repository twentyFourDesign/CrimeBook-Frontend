import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, LayoutAnimation } from "react-native";
import { CrimeBookLoader } from "../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../src/components/common/LoadingState";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import MapView, { Heatmap, PROVIDER_GOOGLE } from "react-native-maps";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { fetchHeatmapReports } from "../../src/auth/api";

type HeatmapPoint = { id: string; latitude: number; longitude: number; weight: number };

export default function MapScreen() {
  if (Platform.OS === "web") {
    return (
      <CitizenShell>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Live Heatmap is not supported on the web platform.</Text>
          <Text>Please test on an iOS or Android device/simulator.</Text>
        </View>
      </CitizenShell>
    );
  }
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  const fetchData = useCallback(async () => {
    try {
      let ne, sw;
      if (mapRef.current) {
        try {
          const bounds = await mapRef.current.getMapBoundaries();
          ne = `${bounds.northEast.latitude},${bounds.northEast.longitude}`;
          sw = `${bounds.southWest.latitude},${bounds.southWest.longitude}`;
        } catch (boundsErr) {
          // Sometimes getMapBoundaries throws if map isn't fully laid out yet
        }
      }

      const res = await fetchHeatmapReports({ time: timeFilter !== "all" ? timeFilter : "", ne, sw, status: statusFilter, category: categoryFilter });
      setPoints(res.incidents ?? []);
      setError(null);
    } catch (err: any) {
      console.warn("Heatmap fetch error:", err);
      // We don't overwrite points on polling error to avoid flashing an empty map
      setError("Syncing...");
    } finally {
      setLoading(false);
    }
  }, [timeFilter, statusFilter, categoryFilter]);

  // Initial fetch and continuous polling
  useEffect(() => {
    setLoading(true);
    fetchData();

    // Every 10 seconds poll for new bounds and new reports
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Refetch when map is moved/panned so we fetch data in new bounds
  const onRegionChangeComplete = () => {
    fetchData();
  };

  const initialRegion = {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15 };

  const gradient = {
    colors: [
      "rgba(0, 255, 255, 0)",
      "#00FFFF",  // rgba(0, 255, 255, 1)
      "#00BFFF",  // rgba(0, 191, 255, 1)
      "#007FFF",  // rgba(0, 127, 255, 1)
      "#003FFF",  // rgba(0, 63, 255, 1)
      "#0000FF",  // rgba(0, 0, 255, 1)
      "#FF0000",  // rgba(255, 0, 0, 1)
    ],
    startPoints: [0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0],
    colorMapSize: 256
  };

  const heatmapPoints = useMemo(() => {
    return points.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      weight: p.weight }));
  }, [points]);

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {heatmapPoints.length > 0 && (
            <Heatmap
              points={heatmapPoints}
              radius={40}
              opacity={0.8}
              gradient={gradient}
            />
          )}
        </MapView>

        {/* Floating Header */}
        <View style={[styles.floatingHeader, { top: Math.max(insets.top, 10) }]}>
          <View style={styles.headerTopRow}>
            <View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Live Safety Map</Text>
                {loading && <CrimeBookLoader size="small" ballColor="#2563EB" />}
              </View>
              <Text style={styles.subtitle}>
                {points.length > 0
                  ? `${points.length} incident${points.length === 1 ? "" : "s"} visible`
                  : "No recent incidents in this area"}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleFilters} style={styles.filterToggleButton}>
              <Feather name="filter" size={20} color={showFilters ? "#2563EB" : "#64748B"} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.expandedFilters}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} style={styles.filterRow}>
                {[
                  "all",
                  "homicide",
                  "assault",
                  "robbery",
                  "burglary",
                  "theft",
                  "vehicle_crime",
                  "arson",
                  "vandalism",
                  "drug_activity",
                  "fraud",
                  "cybercrime",
                  "kidnapping",
                  "missing_person",
                  "domestic_violence",
                  "harassment",
                  "stalking",
                  "traffic_crime",
                  "disturbance",
                  "suspicious_activity",
                  "weapon_violation",
                  "other"
                ].map((c) => {
                  const isActive = categoryFilter === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setCategoryFilter(c)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {c === "all" ? "All" : c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} style={styles.filterRow}>
                {[
                  { id: "active", label: "Active Cases" },
                  { id: "solved", label: "Solved" },
                  { id: "all", label: "Any" },
                ].map((s) => {
                  const isActive = statusFilter === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setStatusFilter(s.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} style={styles.filterRow}>
                {["6h", "24h", "7d", "all"].map((t) => {
                  const isActive = timeFilter === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setTimeFilter(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {t === "all" ? "All Time" : `Last ${t}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
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
    flex: 1 },
  floatingHeader: {
    position: "absolute",
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
    borderColor: "rgba(226, 232, 240, 0.8)" },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between" },
  headerContent: {
    flexDirection: "row",
    alignItems: "center" },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B" },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500" },
  filterToggleButton: {
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12 },
  expandedFilters: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12 },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5 },
  filterRow: {
    marginBottom: 16 },
  filterScroll: {
    gap: 8,
    paddingRight: 20 },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent" },
  filterPillActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6" },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569" },
  filterPillTextActive: {
    color: "#2563EB" },
  errorOverlay: {
    position: "absolute",
    top: 90,
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2" },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "500" } });
