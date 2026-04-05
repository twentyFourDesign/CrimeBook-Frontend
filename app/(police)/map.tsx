import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Platform, Dimensions, ScrollView, LayoutAnimation } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentsForMap } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

export default function PoliceMapScreen() {
  const router = useRouter();
  const { setPoliceIncidents } = useAppDataCache();

  const mapRef = useRef<MapView>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRevalidating(true);
    try {
      let ne, sw;
      if (mapRef.current) {
        try {
          const bounds = await mapRef.current.getMapBoundaries();
          ne = `${bounds.northEast.latitude},${bounds.northEast.longitude}`;
          sw = `${bounds.southWest.latitude},${bounds.southWest.longitude}`;
        } catch (boundsErr) { }
      }

      const res = await fetchPoliceIncidentsForMap({ time: timeFilter !== "all" ? timeFilter : "", ne, sw, status: statusFilter, category: categoryFilter });
      setIncidents(res.incidents ?? []);
      setError(null);
    } catch (err: any) {
      console.warn("Heatmap fetch error:", err);
      if (!incidents.length) setError("Failed to sync incidents");
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  }, [timeFilter, statusFilter, categoryFilter, incidents.length]);

  useEffect(() => {
    setLoading(true);
    fetchData();

    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const onRegionChangeComplete = () => {
    fetchData(true);
  };


  const initialRegion = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    const first = incidents[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
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
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          customMapStyle={mapStyle}
          showsMyLocationButton
          showsUserLocation
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {heatmapPoints.length > 0 && (
            <Heatmap
              points={heatmapPoints}
              radius={Platform.OS === 'ios' ? 40 : 20}
              opacity={0.6}
              gradient={{
                colors: ["#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8", "#EF4444"],
                startPoints: [0.01, 0.25, 0.5, 0.75, 1],
                colorMapSize: 256,
              }}
            />
          )}
          {incidents.slice(0, 50).map((i) => (
            <Marker
              key={i.id}
              coordinate={{ latitude: i.latitude, longitude: i.longitude }}
              onPress={() => router.push({ pathname: "/(police)/incident-report", params: { reportId: i.id } })}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerPulse, { backgroundColor: "#EF444433" }]} />
                <View style={styles.markerCore} />
              </View>
              <Callout tooltip>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>{i.crimeCategory}</Text>
                  <Text style={styles.calloutSub} numberOfLines={2}>{i.locationLabel || i.locationAddress}</Text>
                  <View style={styles.calloutArrow} />
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Immersive Floating Header */}
        <View style={styles.floatingHeader}>
          <View style={styles.headerGlass}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="map" size={20} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Operational Heatmap</Text>
                <View style={styles.statusRow}>
                  {revalidating ? <ActivityIndicator size="small" color="#1D4ED8" /> : <View style={styles.liveDot} />}
                  <Text style={styles.headerSubtitle}>
                    {total} incidents active
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleFilters}
              style={styles.refreshBtn}
              activeOpacity={0.7}
            >
              <Feather name="filter" size={20} color={showFilters ? "#1D4ED8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.expandedFilters}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} style={styles.filterRow}>
                {["all", "robbery", "assault", "kidnapping", "domestic_violence", "drug_activity", "traffic_crime"].map((c) => {
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
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && !incidents.length && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#1D4ED8" />
              <Text style={styles.loadingText}>Synchronizing Heatmap...</Text>
            </View>
          </View>
        )}
      </View>
    </PoliceShell>
  );
}

const mapStyle = [
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2E8F0" },
  floatingHeader: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  headerGlass: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  expandedFilters: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 20,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#1D4ED8",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#1D4ED8",
  },

  markerContainer: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  markerPulse: { position: "absolute", width: 24, height: 24, borderRadius: 12 },
  markerCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#fff" },

  calloutBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    width: 200,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  calloutTitle: { fontSize: 14, fontWeight: "800", color: "#1E293B", marginBottom: 4 },
  calloutSub: { fontSize: 11, color: "#64748B", fontWeight: "500", lineHeight: 15 },
  calloutArrow: {
    position: "absolute",
    bottom: -8,
    left: 92,
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F1F5F9",
  },

  legend: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  legendText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  errorOverlay: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    padding: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: { color: "#B91C1C", fontSize: 13, fontWeight: "600", flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  loadingText: { marginTop: 16, fontSize: 14, color: "#1E293B", fontWeight: "800" },
});
