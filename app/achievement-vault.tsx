import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../src/theme/ThemeContext";
import { useAuth } from "../src/auth/AuthContext";
import { fetchAchievements } from "../src/auth/api";
import { CitizenShell } from "../src/components/citizen/CitizenShell";
import { PoliceShell } from "../src/components/police/PoliceShell";

const { width } = Dimensions.get("window");

export default function AchievementVaultScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetchAchievements();
      setData(res);
    } catch (err) {
      console.error("Failed to load achievements", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const Shell = user?.role?.includes("POLICE") ? PoliceShell : CitizenShell;

  return (
    <Shell>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Achievement Vault</Text>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.pointsCircle, { backgroundColor: colors.accent + '20' }]}>
            <FontAwesome5 name="medal" size={32} color={colors.accent} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>Total Reputation</Text>
            <Text style={[styles.pointsValue, { color: colors.accent }]}>
              {data?.reputationPoints || 0} <Text style={styles.pts}>PTS</Text>
            </Text>
          </View>
          <View style={styles.trustScore}>
             <Text style={[styles.trustLabel, { color: colors.textSecondary }]}>Trust Score</Text>
             <Text style={[styles.trustValue, { color: colors.success }]}>{data?.trustScore || 0}%</Text>
          </View>
        </View>

        {/* Progress Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Goals</Text>
        <View style={styles.goalsContainer}>
          {data?.goals.map((goal: any) => (
            <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: goal.isEarned ? colors.success + '20' : colors.accent + '10' }]}>
                  <Ionicons 
                    name={goal.icon as any} 
                    size={20} 
                    color={goal.isEarned ? colors.success : colors.textSecondary} 
                  />
                </View>
                <View style={styles.goalText}>
                  <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                  <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>{goal.description}</Text>
                </View>
                {goal.isEarned && (
                  <Ionicons name="checkmark-done-circle" size={24} color={colors.success} />
                )}
              </View>
              
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                   <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                     {goal.current} / {goal.target}
                   </Text>
                   <Text style={[styles.progressPercent, { color: colors.accent }]}>
                     {Math.round(goal.progress * 100)}%
                   </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: goal.isEarned ? colors.success : colors.accent,
                        width: `${goal.progress * 100}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Badges Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acheivement Badges</Text>
        <View style={styles.badgeGrid}>
          {data?.userBadges.length > 0 ? data.userBadges.map((ub: any) => (
            <TouchableOpacity key={ub.id} style={styles.badgeItem}>
              <View style={[styles.badgeIconLarge, { backgroundColor: colors.surface, borderColor: colors.accent + '40' }]}>
                <FontAwesome5 name="award" size={30} color={colors.accent} />
              </View>
              <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                {ub.badge.name.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={[styles.badgeDate, { color: colors.textSecondary }]}>
                {new Date(ub.earnedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )) : (
             <View style={styles.emptyState}>
                <Ionicons name="lock-closed" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No badges earned yet</Text>
             </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pointsCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  heroInfo: { flex: 1 },
  pointsLabel: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  pointsValue: { fontSize: 24, fontWeight: "900" },
  pts: { fontSize: 14, fontWeight: "700" },
  trustScore: { alignItems: "flex-end" },
  trustLabel: { fontSize: 11, fontWeight: "600" },
  trustValue: { fontSize: 18, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16, marginTop: 8 },
  goalsContainer: { gap: 16, marginBottom: 32 },
  goalCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  goalText: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: "700" },
  goalDesc: { fontSize: 12, marginTop: 1 },
  progressSection: { gap: 8 },
  progressInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressText: { fontSize: 12, fontWeight: "700" },
  progressPercent: { fontSize: 12, fontWeight: "800" },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  badgeItem: { width: (width - 72) / 3, alignItems: "center", gap: 8 },
  badgeIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  badgeName: { fontSize: 11, fontWeight: "800", textAlign: "center" },
  badgeDate: { fontSize: 10, fontWeight: "600" },
  emptyState: { width: "100%", alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600" },
});
