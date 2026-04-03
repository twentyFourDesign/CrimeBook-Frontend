import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { postSosLocation, startCitizenSos, updateCitizenSos } from "../../src/auth/api";

const PING_MS = 15000;

export default function CitizenSosScreen() {
  const [perm, setPerm] = useState<Location.PermissionStatus | null>(null);
  const [sosId, setSosId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [silent, setSilent] = useState(false);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPing = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerm(status);
    })();
  }, []);

  useEffect(() => {
    return () => {
      clearPing();
    };
  }, [clearPing]);

  const pingOnce = async (id: string) => {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await postSosLocation(id, {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy ?? undefined,
    });
  };

  const startPing = (id: string) => {
    clearPing();
    pingRef.current = setInterval(() => {
      pingOnce(id).catch(() => null);
    }, PING_MS);
  };

  const handleStart = async () => {
    if (perm !== Location.PermissionStatus.GRANTED) {
      Alert.alert("Location required", "Allow location to send SOS.");
      return;
    }
    setBusy(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const res = await startCitizenSos({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        isSilent: silent,
      });
      setSosId(res.sosId);
      await pingOnce(res.sosId).catch(() => null);
      startPing(res.sosId);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not start SOS");
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async (status: "CANCELLED" | "RESPONDED") => {
    if (!sosId) return;
    setBusy(true);
    try {
      clearPing();
      await updateCitizenSos(sosId, status);
      setSosId(null);
      Alert.alert("Ended", status === "CANCELLED" ? "SOS cancelled." : "SOS marked safe.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update SOS");
    } finally {
      setBusy(false);
    }
  };

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ScreenBackButton fallbackHref="/(citizen)/home" />
          <Text style={styles.title}>Emergency SOS</Text>
        </View>

        <Text style={styles.body}>
          Starts a live SOS with your location. Location updates are sent about every {PING_MS / 1000}{" "}
          seconds while active. You can cancel anytime.
        </Text>

        {perm !== Location.PermissionStatus.GRANTED ? (
          <Text style={styles.warn}>Enable location access in system settings to use SOS.</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.toggle, silent && styles.toggleOn]}
          onPress={() => setSilent(!silent)}
          disabled={!!sosId || busy}
        >
          <Text style={styles.toggleText}>Silent mode (discreet)</Text>
        </TouchableOpacity>

        {!sosId ? (
          <TouchableOpacity
            style={[styles.dangerBtn, busy && styles.btnDisabled]}
            onPress={handleStart}
            disabled={busy || perm !== Location.PermissionStatus.GRANTED}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerBtnText}>Start SOS</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.activeBox}>
            <Text style={styles.activeTitle}>SOS active</Text>
            <Text style={styles.activeSub}>Your location is being shared with responders.</Text>
            <TouchableOpacity
              style={[styles.safeBtn, busy && styles.btnDisabled]}
              onPress={() => handleEnd("RESPONDED")}
              disabled={busy}
            >
              <Text style={styles.safeBtnText}>I&apos;m safe — end SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, busy && styles.btnDisabled]}
              onPress={() => handleEnd("CANCELLED")}
              disabled={busy}
            >
              <Text style={styles.cancelBtnText}>Cancel SOS</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },
  body: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 16 },
  warn: { color: "#B91C1C", marginBottom: 12, fontSize: 13 },
  toggle: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  toggleOn: { backgroundColor: "#F1F5F9", borderColor: "#94A3B8" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#334155" },
  dangerBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  dangerBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  activeBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  activeTitle: { fontSize: 18, fontWeight: "800", color: "#991B1B" },
  activeSub: { fontSize: 13, color: "#7F1D1D", marginTop: 6, marginBottom: 16 },
  safeBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  safeBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { color: "#64748B", fontWeight: "600" },
});
