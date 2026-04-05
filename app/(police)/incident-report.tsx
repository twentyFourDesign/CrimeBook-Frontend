import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentDetail, takePoliceIncident } from "../../src/auth/api";
import type { ReportDetailPayload, ReportMediaItem } from "../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

function openDirectionsTo(lat: number, lng: number) {
  const apple = `http://maps.apple.com/?daddr=${lat},${lng}`;
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const androidNav = `google.navigation:q=${lat},${lng}`;
  const url =
    Platform.OS === "ios" ? apple : Platform.OS === "android" ? androidNav : googleWeb;
  Linking.openURL(url).catch(() => {
    Linking.openURL(googleWeb).catch(() => null);
  });
}

function MediaTile({ m }: { m: ReportMediaItem }) {
  const isPhoto = m.mediaType === "PHOTO";
  const uri = m.thumbnailUrl || m.fileUrl;

  return (
    <View style={styles.evidenceBox}>
      {isPhoto ? (
        <Image source={{ uri }} style={styles.mediaImg} resizeMode="cover" />
      ) : (
        <View style={styles.mediaPlaceholder}>
          <Text style={styles.mediaPlaceholderText}>{formatEnum(m.mediaType)}</Text>
        </View>
      )}
    </View>
  );
}

export default function IncidentReport() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [incident, setIncident] = useState<ReportDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);

  const load = useCallback(
    async (mode?: "refresh") => {
      if (!id) return;
      setError(null);
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetchPoliceIncidentDetail(String(id));
        setIncident(res.report);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load incident");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const title =
    incident?.title?.trim() ||
    (incident ? formatEnum(incident.crimeCategory) : "Incident Report");

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load("refresh")}
              tintColor="#1D4ED8"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#1E293B" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.heading}>Case Details</Text>
              {incident && (
                <Text style={styles.subHeading}>#{incident.id.slice(-8).toUpperCase()}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading && !incident && (
            <View style={styles.loadingState}>
              <ActivityIndicator color="#1D4ED8" />
              <Text style={styles.loadingText}>Retrieving intelligence...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {incident && (
            <>
              {/* Title & Status Card */}
              <View style={styles.mainCard}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: "#F1F5F9" }]}>
                    <Text style={styles.statusText}>{formatEnum(incident.status).toUpperCase()}</Text>
                  </View>
                  <View style={styles.timeTag}>
                    <Ionicons name="time-outline" size={12} color="#94A3B8" />
                    <Text style={styles.timeText}>
                      {new Date(incident.incidentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <Text style={styles.incidentTitle}>{title}</Text>

                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{formatEnum(incident.crimeCategory)}</Text>
                </View>
              </View>

              {/* Location Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBox}>
                    <Ionicons name="location" size={16} color="#1D4ED8" />
                  </View>
                  <Text style={styles.sectionTitle}>Dispatch Location</Text>
                </View>

                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    initialRegion={{
                      latitude: incident.latitude,
                      longitude: incident.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}>
                      <View style={styles.markerOutline}>
                        <View style={styles.markerInner} />
                      </View>
                    </Marker>
                  </MapView>
                </View>

                <View style={styles.locationDetails}>
                  <Text style={styles.addressText}>
                    {incident.locationLabel || incident.locationAddress || "Geographic Coordinates"}
                  </Text>
                  <Text style={styles.coordsText}>
                    {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.directionsBtn}
                  activeOpacity={0.8}
                  onPress={() => openDirectionsTo(incident.latitude, incident.longitude)}
                >
                  <Ionicons name="navigate" size={18} color="#FFFFFF" />
                  <Text style={styles.directionsBtnText}>Route to Scene</Text>
                </TouchableOpacity>
              </View>

              {/* Description Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBox}>
                    <Ionicons name="document-text" size={16} color="#1D4ED8" />
                  </View>
                  <Text style={styles.sectionTitle}>Incident Report</Text>
                </View>
                <Text style={styles.descText}>{incident.description}</Text>
              </View>

              {/* Evidence Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBox}>
                    <Ionicons name="images" size={16} color="#1D4ED8" />
                  </View>
                  <Text style={styles.sectionTitle}>Evidence & Media</Text>
                </View>
                {incident.media.length === 0 ? (
                  <View style={styles.emptyMedia}>
                    <Ionicons name="camera-outline" size={24} color="#CBD5E1" />
                    <Text style={styles.emptyMediaText}>No media files attached</Text>
                  </View>
                ) : (
                  <View style={styles.evidenceGrid}>
                    {incident.media.map((m) => (
                      <MediaTile key={m.id} m={m} />
                    ))}
                  </View>
                )}
              </View>

              {/* Action Button */}
              <View style={styles.bottomActions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={async () => {
                    if (!id || taking) return;
                    setTaking(true);
                    try {
                      const res = await takePoliceIncident(String(id));
                      router.replace({
                        pathname: "/(police)/investigation/[id]",
                        params: { id: res.caseId },
                      });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Could not accept case");
                    } finally {
                      setTaking(false);
                    }
                  }}
                  activeOpacity={0.9}
                >
                  {taking ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="#fff" />
                      <Text style={styles.acceptText}>Accept Assignment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  headerText: {
    alignItems: "center",
  },
  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B"
  },
  subHeading: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  // Loading/Error
  loadingState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: { color: "#DC2626", fontSize: 14, marginLeft: 8, flex: 1 },

  // Main Card
  mainCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  incidentTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
    textTransform: "capitalize",
  },

  // Section Cards
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B"
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  map: { flex: 1 },
  markerOutline: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(29, 78, 216, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1D4ED8",
    borderWidth: 2,
    borderColor: "#fff",
  },
  locationDetails: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  coordsText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1D4ED8",
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },

  descText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    fontWeight: "500",
  },

  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  evidenceBox: {
    width: 80,
    height: 80,
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  mediaImg: { width: "100%", height: "100%" },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaPlaceholderText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
  },
  emptyMedia: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyMediaText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },

  bottomActions: {
    marginTop: 24,
  },
  acceptBtn: {
    backgroundColor: "#111827",
    paddingVertical: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  acceptText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800"
  },
});
