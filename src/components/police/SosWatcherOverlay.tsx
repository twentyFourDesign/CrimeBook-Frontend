import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchPoliceActiveSos } from "../../auth/api";
import type { PoliceSosActiveItem } from "../../auth/types";

const POLL_MS = 3000;

function getPrimaryAlert(alerts: PoliceSosActiveItem[]) {
  if (alerts.length === 0) return null;
  const sorted = [...alerts].sort((a, b) => {
    if (a.isDuressActive !== b.isDuressActive) return a.isDuressActive ? -1 : 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  return sorted[0];
}

export function SosWatcherOverlay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<PoliceSosActiveItem[]>([]);
  const [ignoredAlertIds, setIgnoredAlertIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const { alerts: list } = await fetchPoliceActiveSos();
        if (!alive) return;
        setAlerts(list);
      } catch {
        // Ignore transient polling failures; next poll will retry.
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const primary = useMemo(() => getPrimaryAlert(alerts), [alerts]);

  useEffect(() => {
    if (!primary) {
      if (ignoredAlertIds.length > 0) {
        setIgnoredAlertIds([]);
      }
      return;
    }
    if (ignoredAlertIds.length === 0) return;
    const hasNewAlert = alerts.some((a) => !ignoredAlertIds.includes(a.id));
    if (hasNewAlert) {
      // New SOS appeared after ignore -> show overlay again.
      setIgnoredAlertIds([]);
    }
  }, [alerts, ignoredAlertIds, primary]);

  const visiblePrimary = useMemo(() => {
    if (!primary) return null;
    if (ignoredAlertIds.length === 0) return primary;
    const remaining = alerts.filter((a) => !ignoredAlertIds.includes(a.id));
    return remaining[0] ?? null;
  }, [alerts, ignoredAlertIds, primary]);

  if (!visiblePrimary) return null;

  const lat = visiblePrimary.latestLocation?.latitude ?? visiblePrimary.latitude;
  const lng = visiblePrimary.latestLocation?.longitude ?? visiblePrimary.longitude;

  return (
    <View style={[styles.overlay, { top: insets.top + 8 }]} pointerEvents="box-none">
      <View style={[styles.card, visiblePrimary.isDuressActive && styles.cardDuress]}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.title}>
              {visiblePrimary.isDuressActive ? "DURESS SOS ACTIVE" : "SOS ACTIVE"}
            </Text>
          </View>
          <Text style={styles.liveText}>LIVE · 3s</Text>
        </View>

        <Text style={styles.nameText}>{visiblePrimary.user.name}</Text>
        <Text style={styles.metaText}>
          {visiblePrimary.user.phone ?? "No phone"} · {alerts.length} active alert
          {alerts.length > 1 ? "s" : ""}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              alerts.length > 1
                ? router.push("/(police)/sos-active")
                : router.push({
                    pathname: "/(police)/sos-alert/[id]",
                    params: { id: visiblePrimary.id },
                  })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Go to location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ignoreBtn}
            onPress={() => setIgnoredAlertIds(alerts.map((a) => a.id))}
            activeOpacity={0.85}
          >
            <Text style={styles.ignoreBtnText}>Ignore</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.quickMap}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            ).catch(() => null)
          }
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={14} color="#FECACA" />
          <Text style={styles.quickMapText}>Quick open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 10,
    right: 10,
    zIndex: 9999,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "#B91C1C",
    borderWidth: 2,
    borderColor: "#FCA5A5",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  cardDuress: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.6,
  },
  liveText: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "800",
  },
  nameText: {
    marginTop: 8,
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  metaText: {
    marginTop: 2,
    color: "#FEE2E2",
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  ignoreBtn: {
    minWidth: 86,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  ignoreBtnText: {
    color: "#E5E7EB",
    fontWeight: "800",
    fontSize: 14,
  },
  quickMap: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickMapText: {
    color: "#FECACA",
    fontSize: 12,
    fontWeight: "700",
  },
});
