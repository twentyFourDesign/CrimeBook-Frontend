import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View } from "react-native";
import { CrimeBookLoader } from "../../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../../src/components/police/PoliceShell";
import { fetchPoliceActiveSos } from "../../../src/auth/api";
import type { PoliceSosActiveItem } from "../../../src/auth/types";

function elapsed(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}

export default function PoliceSosAlertDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [alerts, setAlerts] = useState<PoliceSosActiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchPoliceActiveSos();
      setAlerts(res.alerts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load SOS details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const alert = useMemo(() => alerts.find((a) => a.id === id) ?? null, [alerts, id]);

  return (
    <PoliceShell>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SOS Alert Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <CrimeBookLoader size="large" ballColor="#EF4444" />
            <Text style={styles.centerText}>Loading alert...</Text>
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

        {!loading && !error && !alert ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>This SOS is no longer active.</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.replace("/(police)/sos-active")}
            >
              <Text style={styles.retryText}>Open SOS Center</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {alert ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.badge, alert.isDuressActive && styles.duressBadge]}>
              <Text style={styles.badgeText}>
                {alert.isDuressActive ? "DURESS / COERCION" : "ACTIVE SOS"}
              </Text>
            </View>

            <Text style={styles.name}>{alert.user.name}</Text>
            <Text style={styles.meta}>{alert.user.phone ?? "No phone number available"}</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>
                {(alert.latestLocation?.latitude ?? alert.latitude).toFixed(6)},{" "}
                {(alert.latestLocation?.longitude ?? alert.longitude).toFixed(6)}
              </Text>

              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{alert.user.homeAddress ?? "Not provided"}</Text>

              <Text style={styles.label}>Started</Text>
              <Text style={styles.value}>{elapsed(alert.createdAt)}</Text>

              <Text style={styles.label}>Mode</Text>
              <Text style={styles.value}>
                {alert.isDuressActive
                  ? "Duress active"
                  : alert.isSilent
                    ? "Silent SOS"
                    : "Audible SOS"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${
                    alert.latestLocation?.latitude ?? alert.latitude
                  },${alert.latestLocation?.longitude ?? alert.longitude}`
                ).catch(() => null)
              }
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.mapBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#334155" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  centerText: { color: "#CBD5E1", fontSize: 15, fontWeight: "600", textAlign: "center" },
  errorText: { color: "#FCA5A5", fontSize: 14, fontWeight: "700", textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#1D4ED8",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "800" },
  content: { padding: 16, paddingBottom: 28 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#B91C1C",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5" },
  duressBadge: { backgroundColor: "#7F1D1D", borderColor: "#F87171" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  name: { marginTop: 12, color: "#fff", fontSize: 28, fontWeight: "900" },
  meta: { marginTop: 4, color: "#CBD5E1", fontSize: 14, fontWeight: "600" },
  card: {
    marginTop: 18,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    gap: 6 },
  label: { color: "#94A3B8", fontSize: 12, fontWeight: "700", marginTop: 6 },
  value: { color: "#F8FAFC", fontSize: 15, fontWeight: "700" },
  mapBtn: {
    marginTop: 16,
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8 },
  mapBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" } });
