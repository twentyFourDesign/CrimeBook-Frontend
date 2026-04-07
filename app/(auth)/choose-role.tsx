import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, BackHandler } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/auth/AuthContext";
import { setOnboardingIntent } from "../../src/auth/api";
import type { OnboardingIntent } from "../../src/auth/types";

const roles = [
  {
    id: "citizen" as const,
    intent: "STANDARD_CITIZEN" as OnboardingIntent,
    title: "Citizen",
    subtitle: "Standard user",
    icon: "👤",
    perks: ["Report crimes", "View activity", "Receive safety alerts"],
    badge: null,
  },
  {
    id: "verified_citizen" as const,
    intent: "VERIFIED_COMMUNITY" as OnboardingIntent,
    title: "Verified citizen",
    subtitle: "Community leader",
    icon: "✅",
    perks: ["Validate incident reports", "Neighbourhood alerts", "Moderate community activity"],
    badge: { label: "Requires ID verification", color: "#F59E0B" },
  },
  {
    id: "police" as const,
    intent: "POLICE" as OnboardingIntent,
    title: "Police officer",
    subtitle: "Law enforcement",
    icon: "🛡️",
    perks: ["Respond to incidents", "View live reports", "Case management"],
    badge: { label: "Requires admin approval", color: "#10B981" },
  },
];

export default function ChooseRole() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [selected, setSelected] = useState<(typeof roles)[number]["id"]>("verified_citizen");
  const [loading, setLoading] = useState(false);

  /** After OTP we `replace` here — no stack to pop; avoid unhandled GO_BACK (Android hardware back). */
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }
        router.replace("/(auth)/login");
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  const onContinue = async () => {
    const role = roles.find((r) => r.id === selected);
    if (!role) return;

    try {
      setLoading(true);
      await setOnboardingIntent(role.intent);
      await refreshUser();

      if (role.intent === "STANDARD_CITIZEN") {
        router.replace("/(citizen)/home");
      } else if (role.intent === "VERIFIED_COMMUNITY") {
        router.replace("/(auth)/verify/citizen-step1");
      } else {
        router.replace("/(auth)/verify/police-step1");
      }
    } catch (e) {
      Alert.alert("Could not save choice", e instanceof Error ? e.message : "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <ScreenBackButton fallbackHref="/(auth)/login" />
        <Text style={styles.title}>Choose your role</Text>
      </View>

      {roles.map((role) => (
        <TouchableOpacity
          key={role.id}
          style={[styles.card, selected === role.id && styles.selectedCard]}
          onPress={() => setSelected(role.id)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{role.icon}</Text>
            </View>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
            </View>
            {selected === role.id && <Text style={styles.checkmark}>✓</Text>}
          </View>

          {role.perks.map((perk, i) => (
            <Text key={i} style={styles.perk}>
              • {perk}
            </Text>
          ))}

          {role.badge && (
            <View style={[styles.badge, { borderColor: role.badge.color }]}>
              <Text style={[styles.badgeText, { color: role.badge.color }]}>{role.badge.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={onContinue} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  card: { borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, padding: 16, marginBottom: 14, backgroundColor: "#fff" },
  selectedCard: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E0EAFF", justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 18 },
  cardTitleBlock: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  roleSubtitle: { fontSize: 12, color: "#888" },
  checkmark: { fontSize: 18, color: "#2563EB", fontWeight: "700" },
  perk: { fontSize: 13, color: "#444", lineHeight: 22 },
  badge: { marginTop: 10, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  button: { width: "100%", backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
