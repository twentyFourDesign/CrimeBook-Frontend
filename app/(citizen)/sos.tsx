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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { ReportFooter } from "../../src/components/report/ReportFooter";
import {
  postSosLocation,
  startCitizenSos,
  cancelSosWithPin,
  checkSosPinsSet,
} from "../../src/auth/api";
import { PinKeypad } from "../../src/components/sos/PinKeypad";
import { SosPinSetup } from "../../src/components/sos/SosPinSetup";
import { sosAudioService } from "../../src/services/sosAudio";

const PING_MS = 15000;

type PendingIntent = "cancel" | "safe";

export default function CitizenSosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ setupPins?: string }>();
  const [perm, setPerm] = useState<Location.PermissionStatus | null>(null);
  const [sosId, setSosId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [silent, setSilent] = useState(false);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // PIN gate
  const [pinsConfigured, setPinsConfigured] = useState<boolean | null>(null); // null = loading
  const [showPinSetup, setShowPinSetup] = useState(false);

  // PIN keypad (for cancellation)
  const [pinVisible, setPinVisible] = useState(false);
  const [pinIntent, setPinIntent] = useState<PendingIntent>("cancel");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // ── Permissions + PIN status ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerm(status);
    })();
  }, []);

  useEffect(() => {
    checkSosPinsSet()
      .then(({ pinsConfigured: configured }) => setPinsConfigured(configured))
      .catch(() => setPinsConfigured(false));
  }, []);

  useEffect(() => {
    if (params.setupPins === "1") {
      setShowPinSetup(true);
    }
  }, [params.setupPins]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  const clearPing = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPing();
      sosAudioService.stop();
    };
  }, [clearPing]);

  // ── Location ping ──────────────────────────────────────────────────────────
  const pingOnce = async (id: string) => {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
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

  // ── Start SOS ──────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (perm !== Location.PermissionStatus.GRANTED) {
      Alert.alert("Location required", "Allow location to send SOS.");
      return;
    }

    // Gate: must have PINs configured first
    if (!pinsConfigured) {
      setShowPinSetup(true);
      return;
    }

    setBusy(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const res = await startCitizenSos({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        isSilent: silent,
      });
      setSosId(res.sosId);
      // Start audio capture (fire-and-forget; silent on permission denial)
      sosAudioService.start(res.sosId).catch(() => null);
      await pingOnce(res.sosId).catch(() => null);
      startPing(res.sosId);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not start SOS");
    } finally {
      setBusy(false);
    }
  };

  // ── PIN cancellation flow ──────────────────────────────────────────────────
  const openPinModal = (intent: PendingIntent) => {
    setPinIntent(intent);
    setPinError(null);
    setPinVisible(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!sosId) return;
    setPinLoading(true);
    setPinError(null);
    try {
      await cancelSosWithPin(sosId, { pin, intent: pinIntent });
      // Success — close everything, go back to normal UI (even if it was duress)
      setPinVisible(false);
      clearPing();
      sosAudioService.stop();
      setSosId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      if (msg.toLowerCase().includes("incorrect") || msg.includes("401")) {
        setPinError("Incorrect PIN. Try again.");
      } else {
        setPinError(msg);
      }
    } finally {
      setPinLoading(false);
    }
  };

  // ── PIN Setup completed ────────────────────────────────────────────────────
  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
    setPinsConfigured(true);
    if (params.setupPins === "1") {
      router.replace("/(citizen)/sos");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <ScreenBackButton fallbackHref="/(citizen)/home" />
          <Text style={styles.title}>Emergency SOS</Text>
        </View>

        <Text style={styles.body}>
          Starts a live SOS with your location. Location updates are sent every{" "}
          {PING_MS / 1000} seconds. Background audio is recorded in short clips
          and securely stored. You can cancel anytime using your Safety PIN.
        </Text>

        {perm !== Location.PermissionStatus.GRANTED ? (
          <Text style={styles.warn}>
            Enable location access in system settings to use SOS.
          </Text>
        ) : null}

        {/* PIN Status indicator */}
        {pinsConfigured === false && !showPinSetup && !sosId && (
          <View style={styles.pinWarning}>
            <Ionicons name="lock-open-outline" size={18} color="#D97706" />
            <Text style={styles.pinWarningText}>
              SOS PINs not set up yet. You must configure them before activating SOS.
            </Text>
          </View>
        )}

        {pinsConfigured === true && !sosId && (
          <View style={styles.pinReady}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
            <Text style={styles.pinReadyText}>Safety PIN & Duress Code configured</Text>
          </View>
        )}

        {/* First-time PIN setup */}
        {showPinSetup && (
          <SosPinSetup onComplete={handlePinSetupComplete} />
        )}

        {!showPinSetup && (
          <TouchableOpacity
            style={[styles.toggle, silent && styles.toggleOn]}
            onPress={() => setSilent(!silent)}
            disabled={!!sosId || busy}
          >
            <Ionicons
              name={silent ? "mic-off" : "mic"}
              size={16}
              color={silent ? "#475569" : "#334155"}
            />
            <Text style={styles.toggleText}>
              Silent mode — {silent ? "ON (discreet)" : "OFF"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Active SOS info */}
        {sosId ? (
          <View style={styles.activeBox}>
            <View style={styles.activeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeTitle}>SOS ACTIVE</Text>
            </View>
            <Text style={styles.activeSub}>
              Your location and audio are being sent to emergency responders.
              Use your Safety PIN to end this session.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Action footer */}
      {!showPinSetup && (
        <ReportFooter style={{ backgroundColor: sosId ? "#FEF2F2" : "#fff" }}>
          {!sosId ? (
            <TouchableOpacity
              style={[styles.dangerBtn, (busy || pinsConfigured === null) && styles.btnDisabled]}
              onPress={handleStart}
              disabled={busy || perm !== Location.PermissionStatus.GRANTED || pinsConfigured === null}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="alert-circle" size={20} color="#fff" />
                  <Text style={styles.dangerBtnText}>Start SOS</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.safeBtn, busy && styles.btnDisabled]}
                onPress={() => openPinModal("safe")}
                disabled={busy}
              >
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                <Text style={styles.safeBtnText}>I'm safe — enter PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelBtn, busy && styles.btnDisabled]}
                onPress={() => openPinModal("cancel")}
                disabled={busy}
              >
                <Text style={styles.cancelBtnText}>Cancel SOS — enter PIN</Text>
              </TouchableOpacity>
            </>
          )}
        </ReportFooter>
      )}

      {/* PIN entry modal */}
      <PinKeypad
        visible={pinVisible}
        title={
          pinIntent === "safe"
            ? "Enter your Safety PIN"
            : "Enter your Safety PIN"
        }
        subtitle="4–8 digit PIN. Enter your Duress Code instead to secretly keep help coming."
        onSubmit={handlePinSubmit}
        onCancel={() => {
          setPinVisible(false);
          setPinError(null);
        }}
        loading={pinLoading}
        errorMessage={pinError}
      />
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },
  body: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 16 },
  warn: { color: "#B91C1C", marginBottom: 12, fontSize: 13 },

  pinWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pinWarningText: { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "600" },

  pinReady: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  pinReadyText: { fontSize: 13, color: "#065F46", fontWeight: "600" },

  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  toggleOn: { backgroundColor: "#F1F5F9", borderColor: "#94A3B8" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#334155" },

  activeBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 8,
  },
  activeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#DC2626",
  },
  activeTitle: { fontSize: 16, fontWeight: "800", color: "#991B1B" },
  activeSub: { fontSize: 13, color: "#7F1D1D", lineHeight: 20 },

  dangerBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dangerBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },

  safeBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  safeBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { color: "#64748B", fontWeight: "600" },
});
