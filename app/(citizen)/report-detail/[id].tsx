import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CitizenShell } from "../../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";
import { fetchReportDetail } from "../../../src/auth/api";
import type { ReportDetailPayload, ReportMediaItem } from "../../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

function openMaps(lat: number, lng: number) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url).catch(() => null);
}

function openUrl(url: string) {
  Linking.openURL(url).catch(() => null);
}

function MediaTile({ m }: { m: ReportMediaItem }) {
  const isPhoto = m.mediaType === "PHOTO";
  const uri = m.thumbnailUrl || m.fileUrl;

  return (
    <TouchableOpacity
      style={styles.mediaTile}
      onPress={() => openUrl(m.fileUrl)}
      activeOpacity={0.85}
    >
      {isPhoto ? (
        <Image source={{ uri }} style={styles.mediaImg} resizeMode="cover" />
      ) : (
        <View style={[styles.mediaImg, styles.mediaPlaceholder]}>
          <Text style={styles.mediaPlaceholderText}>{formatEnum(m.mediaType)}</Text>
          <Text style={styles.mediaTap}>Tap to open</Text>
        </View>
      )}
      <Text style={styles.mediaCaption} numberOfLines={1}>
        {m.fileName}
      </Text>
    </TouchableOpacity>
  );
}

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await fetchReportDetail(id);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CitizenShell>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title} numberOfLines={2}>
            Report
          </Text>
        </View>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator />
          </View>
        )}

        {error && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/(citizen)/my-reports")} style={styles.retry}>
              <Text style={styles.retryText}>Back to list</Text>
            </TouchableOpacity>
          </View>
        )}

        {report && (
          <>
            <View style={styles.statusRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formatEnum(report.status)}</Text>
              </View>
              {report.caseId ? (
                <Text style={styles.caseId}>
                  Case ID: <Text style={styles.caseIdMono}>{report.caseId}</Text>
                </Text>
              ) : null}
            </View>

            <Text style={styles.heading}>{report.title?.trim() || formatEnum(report.crimeCategory)}</Text>
            <Text style={styles.category}>{formatEnum(report.crimeCategory)}</Text>

            <View style={styles.metaCard}>
              <Row label="Submitted" value={new Date(report.createdAt).toLocaleString()} />
              <Row label="Last updated" value={new Date(report.updatedAt).toLocaleString()} />
              <Row label="Incident time" value={new Date(report.incidentTime).toLocaleString()} />
              <Row label="Happening now" value={report.isHappeningNow ? "Yes" : "No"} />
              <Row label="Visibility" value={formatEnum(report.visibility)} />
              <Row label="Anonymous submission" value={report.isAnonymous ? "Yes" : "No"} />
              <Row label="Community confirmations" value={String(report.communityConfirmCount)} />
              <Row label="Police verified" value={report.isPoliceVerified ? "Yes" : "No"} />
              <Row label="Location precision" value={formatEnum(report.locationPrecision)} />
            </View>

            <Text style={styles.section}>Location</Text>
            {report.locationLabel ? <Text style={styles.bodyText}>{report.locationLabel}</Text> : null}
            {report.locationAddress ? <Text style={styles.bodyText}>{report.locationAddress}</Text> : null}
            <Text style={styles.coords}>
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                pointerEvents="none"
                initialRegion={{
                  latitude: report.latitude,
                  longitude: report.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
              </MapView>
            </View>
            <TouchableOpacity style={styles.mapBtn} onPress={() => openMaps(report.latitude, report.longitude)}>
              <Text style={styles.mapBtnText}>Open in Maps</Text>
            </TouchableOpacity>

            <Text style={styles.section}>Description</Text>
            <Text style={styles.description}>{report.description}</Text>

            <Text style={styles.section}>Media ({report.media.length})</Text>
            {report.media.length === 0 ? (
              <Text style={styles.muted}>No files attached.</Text>
            ) : (
              <View style={styles.mediaGrid}>
                {report.media.map((m) => (
                  <MediaTile key={m.id} m={m} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </CitizenShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#111", flex: 1 },
  centerRow: { paddingVertical: 32, alignItems: "center" },
  errBox: { marginBottom: 12 },
  errText: { color: "#B91C1C", fontSize: 14 },
  retry: { marginTop: 8, alignSelf: "flex-start" },
  retryText: { color: "#2563EB", fontWeight: "600" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 },
  badge: { backgroundColor: "#DBEAFE", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#1D4ED8" },
  caseId: { fontSize: 13, color: "#64748B" },
  caseIdMono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
  heading: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 4 },
  category: { fontSize: 14, color: "#64748B", marginBottom: 16 },
  metaCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  rowLabel: { fontSize: 12, color: "#64748B", flex: 1 },
  rowValue: { fontSize: 12, color: "#111", fontWeight: "600", flex: 1, textAlign: "right" },
  section: { fontSize: 16, fontWeight: "700", color: "#111", marginTop: 8, marginBottom: 10 },
  bodyText: { fontSize: 14, color: "#334155", lineHeight: 22, marginBottom: 6 },
  coords: { fontSize: 12, color: "#64748B", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  map: {
    flex: 1,
  },
  mapBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mapBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  description: { fontSize: 15, color: "#334155", lineHeight: 24 },
  muted: { fontSize: 14, color: "#94A3B8" },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  mediaTile: { width: "47%", maxWidth: 200 },
  mediaImg: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: "#E2E8F0" },
  mediaPlaceholder: { alignItems: "center", justifyContent: "center", padding: 8 },
  mediaPlaceholderText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  mediaTap: { fontSize: 10, color: "#2563EB", marginTop: 4 },
  mediaCaption: { fontSize: 10, color: "#64748B", marginTop: 4 },
});
