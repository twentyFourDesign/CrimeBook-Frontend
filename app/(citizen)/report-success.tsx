import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from "react-native";
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
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const caseId = displayCaseId ?? "—";
  const reportStatus = status ?? "SUBMITTED";

  useEffect(() => {
    if (newBadge) {
      try {
        const parsed = JSON.parse(newBadge);
        setBadge(parsed);
        // Show modal after a tiny delay so the screen settles
        setTimeout(() => setShowBadgeModal(true), 800);
      } catch (e) {
        console.error("Failed to parse badge", e);
      }
    }
  }, [newBadge]);

  useEffect(() => {
    if (showBadgeModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showBadgeModal]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />

      {newBadge && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Multiple bursts for "Exploding" effect */}
          <ConfettiCannon
            count={80}
            origin={{ x: -20, y: 0 }}
            fadeOut={true}
            fallSpeed={2500}
            explosionSpeed={400}
          />
          <ConfettiCannon
            count={80}
            origin={{ x: 400, y: 0 }}
            fadeOut={true}
            fallSpeed={2500}
            explosionSpeed={400}
          />
          <ConfettiCannon
            count={100}
            origin={{ x: 200, y: 200 }}
            fadeOut={true}
            fallSpeed={2000}
            explosionSpeed={300}
          />
        </View>
      )}

      <View
        style={[
          styles.container,
          {
            paddingHorizontal: REPORT_H_PAD,
            paddingTop: Math.max(insets.top, 20) + 40,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
      >
        <View style={styles.successCircle}>
          <View style={styles.innerCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Report Secured</Text>
        <Text style={styles.subtitle}>
          Your intelligence has been broadcasted to local authorities and recorded in the secure ledger.
        </Text>

        <View style={styles.caseCard}>
          <View style={styles.caseRow}>
            <View style={styles.caseMeta}>
              <Text style={styles.caseLabel}>CASE ID</Text>
              <Text style={styles.caseValue}>#{caseId}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{reportStatus}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.infoText}>~15m Response</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />
              <Text style={styles.infoText}>Encrypted</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/(citizen)/community")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Veiw Community Feed</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace("/(citizen)/home")}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Back to Command Center</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent visible={showBadgeModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.badgeModal,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotation }
                ]
              }
            ]}
          >
            <View style={styles.congratsBurst}>
              <ConfettiCannon count={40} origin={{ x: 150, y: 0 }} />
            </View>

            <View style={styles.badgeIconWrapper}>
              <View style={styles.badgeRing}>
                <Ionicons name={badge?.iconUrl || "ribbon"} size={64} color="#F59E0B" />
              </View>
            </View>

            <Text style={styles.badgeCongrats}>NEW BADGE EARNED!</Text>
            <Text style={styles.badgeTitle}>{badge?.name}</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{badge?.pointsValue} REPUTATION</Text>
            </View>

            <Text style={styles.badgeDesc}>{badge?.description}</Text>

            <TouchableOpacity style={styles.claimBtn} onPress={() => setShowBadgeModal(false)}>
              <Text style={styles.claimBtnText}>Excellent</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewProfileBtn} onPress={() => {
              setShowBadgeModal(false);
              router.push("/(citizen)/profile");
            }}>
              <Text style={styles.viewProfileText}>View Collection</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { flex: 1, alignItems: "center" },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  innerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#1E293B", marginBottom: 12, textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontWeight: "500",
  },
  caseCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  caseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  caseMeta: { gap: 4 },
  caseLabel: { fontSize: 10, fontWeight: "800", color: "#94A3B8", letterSpacing: 1 },
  caseValue: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  statusText: { fontSize: 12, fontWeight: "800", color: "#15803D" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 20 },
  infoGrid: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  actionColumn: { width: "100%", gap: 16 },
  primaryBtn: {
    backgroundColor: "#1E293B",
    paddingVertical: 18,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "700", color: "#64748B" },

  // Enhanced Badge Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  badgeModal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  congratsBurst: { position: "absolute", top: 0, left: 0, right: 0, height: 100 },
  badgeIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  badgeRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#FDE68A",
  },
  badgeCongrats: {
    fontSize: 12,
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 2,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 10,
  },
  pointsBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  pointsText: { fontSize: 12, fontWeight: "900", color: "#166534" },
  badgeDesc: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: "500",
  },
  claimBtn: {
    width: "100%",
    backgroundColor: "#1E293B",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  claimBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  viewProfileBtn: {
    paddingVertical: 12,
  },
  viewProfileText: { fontSize: 14, fontWeight: "700", color: "#94A3B8" },
});
