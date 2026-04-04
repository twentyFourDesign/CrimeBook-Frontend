import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { REPORT_H_PAD } from "../../src/report/reportScreenLayout";
import { useState, useEffect, useRef } from "react";
import ConfettiCannon from "react-native-confetti-cannon";

export default function ReportSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayCaseId, status, newBadge } = useLocalSearchParams<{
    displayCaseId?: string;
    status?: string;
    newBadge?: string;
  }>();

  const [badge, setBadge] = useState<any>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const caseId = displayCaseId ?? "—";
  const reportStatus = status ?? "SUBMITTED";

  useEffect(() => {
    if (newBadge) {
      try {
        const parsed = JSON.parse(newBadge);
        setBadge(parsed);
        // Show modal after a tiny delay so the screen settles
        setTimeout(() => setShowBadgeModal(true), 600);
      } catch (e) {
        console.error("Failed to parse badge", e);
      }
    }
  }, [newBadge]);

  useEffect(() => {
    if (showBadgeModal) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [showBadgeModal]);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />

      {newBadge && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon
            count={60}
            origin={{ x: -10, y: 0 }}
            fadeOut={true}
            fallSpeed={3000}
            explosionSpeed={350}
          />
          <ConfettiCannon
            count={60}
            origin={{ x: 400, y: 0 }}
            fadeOut={true}
            fallSpeed={3000}
            explosionSpeed={350}
          />
        </View>
      )}

      <View
        style={[
          styles.container,
          {
            paddingHorizontal: REPORT_H_PAD,
            paddingTop: Math.max(insets.top, 20) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
      >
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-circle" size={56} color="#fff" />
        </View>

        <Text style={styles.title}>Report Submitted</Text>
        <Text style={styles.subtitle}>
          Your report has been submitted successfully. Authorities have been notified.
        </Text>

        <View style={styles.caseCard}>
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Case ID</Text>
            <Text style={styles.caseValue}># {caseId}</Text>
          </View>
          <View style={styles.caseRowBorder} />
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{reportStatus}</Text>
            </View>
          </View>
          <View style={styles.caseRowBorder} />
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Estimated Response</Text>
            <Text style={styles.caseValue}>15–30 min</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace("/(citizen)/community")}>
          <View style={styles.btnRow}>
            <Ionicons name="newspaper-outline" size={20} color="#fff" />
            <Text style={styles.trackText}>Back to feed</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/(citizen)/home")}>
          <View style={styles.btnRow}>
            <Ionicons name="home-outline" size={20} color="#555" />
            <Text style={styles.homeText}>Back to home</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={showBadgeModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.badgeModal, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
            <View style={styles.badgeIconContainer}>
              <Ionicons name={badge?.iconUrl || "ribbon-outline"} size={64} color="#F59E0B" />
            </View>
            <Text style={styles.badgeCongrats}>Congratulations!</Text>
            <Text style={styles.badgeTitle}>You earned the {badge?.name} badge</Text>
            <Text style={styles.badgePoints}>+{badge?.pointsValue} Reputation Points</Text>
            <Text style={styles.badgeDesc}>{badge?.description}</Text>

            <TouchableOpacity style={styles.viewBadgeBtn} onPress={() => setShowBadgeModal(false)}>
              <Text style={styles.viewBadgeText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.goToProfileBtn} onPress={() => {
              setShowBadgeModal(false);
              router.push("/(citizen)/profile");
            }}>
              <Text style={styles.goToProfileText}>View in Profile</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, alignItems: "center" },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 21, marginBottom: 32, paddingHorizontal: 8 },
  caseCard: {
    width: "100%",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
    overflow: "hidden",
  },
  caseRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  caseRowBorder: { height: 1, backgroundColor: "#E2E8F0" },
  caseLabel: { fontSize: 13, color: "#888" },
  caseValue: { fontSize: 13, fontWeight: "600", color: "#111" },
  statusBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  trackBtn: {
    width: "100%",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trackText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  homeBtn: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  homeText: { fontSize: 16, fontWeight: "600", color: "#555" },

  // Badge Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  badgeModal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  badgeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#FDE68A",
  },
  badgeCongrats: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D97706",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 6,
  },
  badgePoints: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 16,
  },
  badgeDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  viewBadgeBtn: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  viewBadgeText: { fontSize: 15, fontWeight: "600", color: "#4B5563" },
  goToProfileBtn: {
    width: "100%",
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  goToProfileText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
