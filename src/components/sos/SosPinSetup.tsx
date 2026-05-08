/**
 * SosPinSetup — first-time PIN setup flow presented on the SOS screen.
 *
 * Flow:
 *  Step 1: Enter cancellation PIN → confirm cancellation PIN
 *  Step 2: Enter duress PIN → confirm duress PIN
 *  Step 3: Submit → saved
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PinKeypad } from "./PinKeypad";
import { setSosPins } from "../../auth/api";

type Step =
  | "cancel_enter"
  | "cancel_confirm"
  | "duress_enter"
  | "duress_confirm"
  | "saving"
  | "done";

interface SosPinSetupProps {
  onComplete: () => void;
}

export function SosPinSetup({ onComplete }: SosPinSetupProps) {
  const [step, setStep] = useState<Step>("cancel_enter");
  const [cancellationPin, setCancellationPin] = useState("");
  const [duressPin, setDuressPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCancelEnter = (pin: string) => {
    setCancellationPin(pin);
    setError(null);
    setStep("cancel_confirm");
  };

  const handleCancelConfirm = (pin: string) => {
    if (pin !== cancellationPin) {
      setError("PINs don't match. Try again.");
      setStep("cancel_enter");
      setCancellationPin("");
      return;
    }
    setError(null);
    setStep("duress_enter");
  };

  const handleDuressEnter = (pin: string) => {
    if (pin === cancellationPin) {
      setError("Duress PIN must be different from cancellation PIN.");
      setStep("duress_enter");
      return;
    }
    setDuressPin(pin);
    setError(null);
    setStep("duress_confirm");
  };

  const handleDuressConfirm = async (pin: string) => {
    if (pin !== duressPin) {
      setError("Duress PINs don't match. Try again.");
      setStep("duress_enter");
      setDuressPin("");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setSosPins({ cancellationPin, duressPin });
      setStep("done");
      setTimeout(onComplete, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save PINs. Try again.");
      setStep("cancel_enter");
      setCancellationPin("");
      setDuressPin("");
    } finally {
      setSaving(false);
    }
  };

  if (step === "done") {
    return (
      <View style={styles.doneBox}>
        <View style={styles.doneIcon}>
          <Ionicons name="shield-checkmark" size={40} color="#10B981" />
        </View>
        <Text style={styles.doneTitle}>SOS PINs Saved</Text>
        <Text style={styles.doneSub}>Your safety codes are set.</Text>
      </View>
    );
  }

  if (saving) {
    return (
      <View style={styles.doneBox}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.doneSub}>Saving PINs…</Text>
      </View>
    );
  }

  const configs: Record<Step, { title: string; subtitle: string } | null> = {
    cancel_enter: {
      title: "Set your Safety PIN",
      subtitle: "This PIN cancels the SOS normally when you're safe.",
    },
    cancel_confirm: {
      title: "Confirm Safety PIN",
      subtitle: "Re-enter the same PIN to confirm.",
    },
    duress_enter: {
      title: "Set your Duress Code",
      subtitle:
        "This secret code cancels the visible SOS but keeps police tracking you silently — use it if you're under threat.",
    },
    duress_confirm: {
      title: "Confirm Duress Code",
      subtitle: "Re-enter the duress code to confirm.",
    },
    saving: null,
    done: null,
  };

  const config = configs[step];
  const stepIndex =
    step === "cancel_enter"
      ? 1
      : step === "cancel_confirm"
      ? 2
      : step === "duress_enter"
      ? 3
      : step === "duress_confirm"
      ? 4
      : 0;

  return (
    <>
      <View style={styles.setupCard}>
        <View style={styles.setupHeader}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
          <Text style={styles.setupTitle}>SOS Security Setup</Text>
        </View>
        <Text style={styles.setupBody}>
          Create one Safety PIN and one Duress PIN. Duress PIN silently keeps emergency help active.
        </Text>
        <View style={styles.progressRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < stepIndex ? styles.progressDotActive : styles.progressDotIdle,
              ]}
            />
          ))}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {config && (
        <PinKeypad
          visible
          title={config.title}
          subtitle={config.subtitle}
          onSubmit={
            step === "cancel_enter"
              ? handleCancelEnter
              : step === "cancel_confirm"
              ? handleCancelConfirm
              : step === "duress_enter"
              ? handleDuressEnter
              : handleDuressConfirm
          }
          resetKey={step}
          errorMessage={error}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  setupCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  setupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  setupTitle: { fontWeight: "800", color: "#1E3A8A", fontSize: 14 },
  setupBody: { fontSize: 13, color: "#1E40AF", lineHeight: 19, marginTop: 6 },
  progressRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  progressDot: { width: 18, height: 4, borderRadius: 999 },
  progressDotActive: { backgroundColor: "#2563EB" },
  progressDotIdle: { backgroundColor: "#BFDBFE" },
  error: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  doneBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  doneTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  doneSub: { fontSize: 14, color: "#64748B" },
});
