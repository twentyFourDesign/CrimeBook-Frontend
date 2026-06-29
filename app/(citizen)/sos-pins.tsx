import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { LoadingState } from "../../src/components/common/LoadingState";
import { SosPinSetup } from "../../src/components/sos/SosPinSetup";
import { SosTrustedContactsSection } from "../../src/components/sos/SosTrustedContactsSection";
import { checkSosPinsSet } from "../../src/auth/api";

export default function SosPinsSettingsScreen() {
  const router = useRouter();
  const [pinsConfigured, setPinsConfigured] = useState<boolean | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupKey, setSetupKey] = useState(0);

  const loadStatus = useCallback(async () => {
    try {
      const { pinsConfigured: configured } = await checkSosPinsSet();
      setPinsConfigured(configured);
      return configured;
    } catch {
      setPinsConfigured(false);
      return false;
    }
  }, []);

  useEffect(() => {
    loadStatus().then((configured) => {
      if (!configured) setShowSetup(true);
    });
  }, [loadStatus]);

  const startSetup = () => {
    setSetupKey((k) => k + 1);
    setShowSetup(true);
  };

  const handleComplete = async () => {
    setShowSetup(false);
    await loadStatus();
  };

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ScreenBackButton fallbackHref="/(citizen)/profile" />
          <Text style={styles.title}>SOS Settings</Text>
        </View>

        <Text style={styles.body}>
          Configure your Safety PIN, Duress Code, and choose family or friends to email when SOS is triggered.
        </Text>

        {pinsConfigured === null ? (
          <LoadingState size="medium" message="Loading SOS settings…" />
        ) : showSetup ? (
          <>
            <SosPinSetup key={setupKey} onComplete={handleComplete} />
            <TouchableOpacity style={styles.skipSetupBtn} onPress={() => setShowSetup(false)}>
              <Text style={styles.skipSetupText}>Skip for now — manage contacts</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons
                name={pinsConfigured ? "shield-checkmark" : "shield-outline"}
                size={22}
                color={pinsConfigured ? "#059669" : "#D97706"}
              />
              <Text style={styles.statusTitle}>
                {pinsConfigured ? "PINs configured" : "PINs not configured"}
              </Text>
            </View>
            <Text style={styles.statusSub}>
              {pinsConfigured
                ? "You can reset your Safety PIN and Duress Code at any time."
                : "Set up both PINs before activating SOS."}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={startSetup}>
              <Ionicons name="key-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>
                {pinsConfigured ? "Reset SOS PINs" : "Set up SOS PINs"}
              </Text>
            </TouchableOpacity>
            {!pinsConfigured ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => router.push("/(citizen)/sos")}>
                <Text style={styles.linkBtnText}>Back to SOS</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {!showSetup ? <SosTrustedContactsSection /> : null}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },
  body: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 20 },
  statusCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  statusSub: { fontSize: 13, color: "#64748B", lineHeight: 20 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkBtnText: { color: "#64748B", fontWeight: "600" },
  skipSetupBtn: { alignItems: "center", paddingVertical: 16 },
  skipSetupText: { color: "#64748B", fontWeight: "600", fontSize: 13 } });
