import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceActiveSos, resolvePoliceSos } from "../../src/auth/api";
import type { PoliceSosActiveItem } from "../../src/auth/types";

export default function PoliceSosActiveScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PoliceSosActiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async (mode?: "refresh") => {
    setError(null);
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    try {
      const { alerts: list } = await fetchPoliceActiveSos();
      setAlerts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load SOS list");
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openMaps = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => null);
  };

  const onResolve = async (id: string) => {
    setResolving(id);
    try {
      await resolvePoliceSos(id);
      await load("refresh");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not resolve");
    } finally {
      setResolving(null);
    }
  };

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Active SOS</Text>
        <Text style={styles.sub}>Live citizen SOS alerts in your area.</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}

        {!loading &&
          alerts.map((a) => {
            const lat = a.latestLocation?.latitude ?? a.latitude;
            const lng = a.latestLocation?.longitude ?? a.longitude;
            return (
              <View key={a.id} style={styles.card}>
                <Text style={styles.cardTitle}>{a.user.name}</Text>
                <Text style={styles.cardMeta}>{a.user.phone ?? "No phone on file"}</Text>
                <Text style={styles.cardMeta}>
                  Notified contacts (stub): {a.notifiedCount} · Silent: {a.isSilent ? "yes" : "no"}
                </Text>
                <Text style={styles.cardMeta}>
                  Since {new Date(a.createdAt).toLocaleString()}
                </Text>
                <TouchableOpacity style={styles.mapBtn} onPress={() => openMaps(lat, lng)}>
                  <Text style={styles.mapBtnText}>Open in Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resolveBtn, resolving === a.id && styles.resolveDisabled]}
                  onPress={() => onResolve(a.id)}
                  disabled={resolving === a.id}
                >
                  <Text style={styles.resolveBtnText}>
                    {resolving === a.id ? "…" : "Mark responded"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

        {!loading && alerts.length === 0 ? (
          <Text style={styles.empty}>No active SOS alerts.</Text>
        ) : null}
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingTop: 48, paddingBottom: 32 },
  back: { marginBottom: 12, alignSelf: "flex-start" },
  backText: { fontSize: 15, color: "#2563EB", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 16 },
  err: { color: "#DC2626", marginBottom: 8 },
  empty: { color: "#64748B", marginTop: 12 },
  card: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#991B1B" },
  cardMeta: { fontSize: 13, color: "#57534E", marginTop: 4 },
  mapBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapBtnText: { color: "#1D4ED8", fontWeight: "700", fontSize: 13 },
  resolveBtn: {
    marginTop: 10,
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  resolveDisabled: { opacity: 0.6 },
  resolveBtnText: { color: "#fff", fontWeight: "700" },
});
