import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View } from "react-native";
import { CrimeBookLoader } from "../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../src/components/common/LoadingState";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceSosHistory } from "../../src/auth/api";
import type { PoliceSosRecordingItem } from "../../src/auth/types";

function fmtAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}

export default function PoliceSosRecordingsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PoliceSosRecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { alerts } = await fetchPoliceSosHistory();
      setAlerts(alerts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load recordings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PoliceShell>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>SOS Recordings</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <CrimeBookLoader size="large" ballColor="#EF4444" />
            <Text style={styles.centerText}>Loading recordings...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {alerts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No SOS recordings yet.</Text>
              </View>
            ) : null}

            {alerts.map((a) => (
              <View key={a.id} style={styles.card}>
                <Text style={styles.name}>{a.user.name}</Text>
                <Text style={styles.meta}>
                  {a.status} · {fmtAgo(a.updatedAt)} · {a.liveMediaLinks.length} clips
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/(police)/sos-alert/[id]",
                        params: { id: a.id } })
                    }
                  >
                    <Text style={styles.detailsText}>Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${
                          a.latestLocation?.latitude ?? a.latitude
                        },${a.latestLocation?.longitude ?? a.longitude}`
                      ).catch(() => null)
                    }
                  >
                    <Text style={styles.mapText}>Map</Text>
                  </TouchableOpacity>
                </View>

                {a.audioClipUrl ? (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => Linking.openURL(a.audioClipUrl!).catch(() => null)}
                  >
                    <Ionicons name="musical-notes" size={14} color="#93C5FD" />
                    <Text style={styles.linkText}>Open primary audio clip</Text>
                  </TouchableOpacity>
                ) : null}

                {a.liveMediaLinks.map((url, i) => (
                  <TouchableOpacity
                    key={`${a.id}-${i}`}
                    style={styles.linkRow}
                    onPress={() => Linking.openURL(url).catch(() => null)}
                  >
                    <Ionicons name="play-circle" size={14} color="#93C5FD" />
                    <Text style={styles.linkText}>Recording {i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#334155" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center" },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 20 },
  centerText: { color: "#CBD5E1", fontWeight: "600" },
  errorText: { color: "#FCA5A5", textAlign: "center" },
  retryBtn: { backgroundColor: "#1D4ED8", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "800" },
  list: { padding: 16, paddingBottom: 30, gap: 12 },
  emptyBox: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16 },
  emptyText: { color: "#94A3B8", fontWeight: "600", textAlign: "center" },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12 },
  name: { color: "#fff", fontSize: 16, fontWeight: "800" },
  meta: { color: "#94A3B8", marginTop: 2, marginBottom: 8, fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, marginBottom: 8 },
  detailsBtn: { backgroundColor: "#2563EB", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  detailsText: { color: "#fff", fontWeight: "800" },
  mapBtn: { backgroundColor: "#0EA5E9", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  mapText: { color: "#fff", fontWeight: "800" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  linkText: { color: "#BFDBFE", fontSize: 13, fontWeight: "600" } });
