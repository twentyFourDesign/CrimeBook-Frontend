import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentDetail, takePoliceIncident } from "../../src/auth/api";
import type { ReportDetailPayload, ReportMediaItem } from "../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
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
  const [error, setError] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setError(null);
      setLoading(true);
      try {
        const res = await fetchPoliceIncidentDetail(String(id));
        setIncident(res.report);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load incident");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const title =
    incident?.title?.trim() ||
    (incident ? formatEnum(incident.crimeCategory) : "Incident Report");

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.heading}>Incident Report</Text>
          </View>

          {loading && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          )}

          {error && !loading && (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ color: "#DC2626", fontSize: 13, marginBottom: 4 }}>{error}</Text>
            </View>
          )}

          {incident && (
            <>
              <View style={styles.titleCard}>
                <View style={styles.incidentIconBox}>
                  <Ionicons name="flame-outline" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.incidentTitle}>{title}</Text>
                  <Text style={styles.incidentMeta}>
                    {new Date(incident.incidentTime).toLocaleString()}
                  </Text>
                  <Text style={styles.incidentMeta}>
                    Status: {formatEnum(incident.status)}
                    {incident.caseId ? ` • Case ID ${incident.caseId}` : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={16} color="#111827" />
                  <Text style={styles.sectionTitle}>Location</Text>
                </View>
                <View style={styles.mapBox}>
                  <Ionicons name="map-outline" size={56} color="#9CA3AF" />
                  <View style={styles.mapPinDot} />
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationText}>
                    {incident.locationLabel || incident.locationAddress || "Unknown location"}
                  </Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.timeText}>
                      {new Date(incident.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={16} color="#111827" />
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
                <Text style={styles.descText}>{incident.description}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="camera-outline" size={16} color="#111827" />
                  <Text style={styles.sectionTitle}>Evidence</Text>
                </View>
                {incident.media.length === 0 ? (
                  <Text style={{ fontSize: 13, color: "#6B7280" }}>No files attached.</Text>
                ) : (
                  <View style={styles.evidenceRow}>
                    {incident.media.map((m) => (
                      <MediaTile key={m.id} m={m} />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {incident && (
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
                <Text style={styles.acceptText}>Accept Case</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: { fontSize: 17, fontWeight: "700", color: "#111827" },
  titleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  incidentTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  incidentMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  mapBox: {
    height: 140,
    backgroundColor: "#E8F4E8",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  mapPinDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  locationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationText: { fontSize: 12, color: "#4B5563" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 12, color: "#9CA3AF" },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionBtnActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  actionIcon: { marginBottom: 4 },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  actionLabelActive: { color: "#FFFFFF" },
  descText: { fontSize: 13, color: "#374151", lineHeight: 21 },
  evidenceRow: { flexDirection: "row", gap: 12 },
  evidenceBox: {
    width: 72,
    height: 72,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  mediaPlaceholderText: {
    fontSize: 10,
    color: "#4B5563",
    textAlign: "center",
  },
  reporterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  reporterLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  reporterText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  confidencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  confidence: { fontSize: 13, color: "#16A34A", fontWeight: "600" },
  acceptBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});

