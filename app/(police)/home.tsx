import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentsForMap } from "../../src/auth/api";
import type { PoliceIncidentForMap } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

const levelColors: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#22C55E",
};

const levelBg: Record<string, string> = {
  critical: "#FEE2E2",
  high: "#FFEDD5",
  medium: "#FEF9C3",
  low: "#DCFCE7",
};

function levelFromStatus(status: string): "critical" | "high" | "medium" | "low" {
  const s = status.toUpperCase();
  if (s === "SUBMITTED" || s === "COMMUNITY_CONFIRMED") return "medium";
  if (s === "POLICE_VERIFIED" || s === "UNDER_INVESTIGATION") return "high";
  if (s === "RESOLVED") return "low";
  return "low";
}

function getConfidenceInfo(score?: number | null) {
  if (score == null) return null;
  if (score >= 70) return { label: "High", color: "#16A34A", bg: "#DCFCE7" };
  if (score >= 40) return { label: "Medium", color: "#F59E0B", bg: "#FEF9C3" };
  return { label: "Low", color: "#EF4444", bg: "#FEE2E2" };
}

export default function PoliceHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { setPoliceIncidents } = useAppDataCache();

  const {
    data: incidentsData,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "policeIncidents",
    async () => {
      const res = await fetchPoliceIncidentsForMap();
      return res.incidents ?? [];
    },
    setPoliceIncidents
  );

  const incidents = incidentsData ?? [];

  const total = incidents?.length ?? 0;
  const activeCount = useMemo(
    () =>
      (incidents ?? []).filter(
        (i) => !["RESOLVED", "REJECTED", "ARCHIVED"].includes(i.status.toUpperCase())
      ).length,
    [incidents]
  );
  const resolvedToday = useMemo(() => {
    const today = new Date().toDateString();
    return (incidents ?? []).filter((i) => {
      const d = new Date(i.createdAt);
      return d.toDateString() === today && i.status.toUpperCase() === "RESOLVED";
    }).length;
  }, [incidents]);

  const priorityAlerts = useMemo(() => (incidents ?? []).slice(0, 3), [incidents]);
  const nearbyIncidents = useMemo(() => (incidents ?? []).slice(3, 8), [incidents]);

  const officerLat = user?.officerLocation?.latitude ?? null;
  const officerLng = user?.officerLocation?.longitude ?? null;

  function formatDistanceKm(inc: PoliceIncidentForMap) {
    if (officerLat == null || officerLng == null) return null;
    const R = 6371; // km
    const dLat = ((inc.latitude - officerLat) * Math.PI) / 180;
    const dLng = ((inc.longitude - officerLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((officerLat * Math.PI) / 180) *
        Math.cos((inc.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return `${d.toFixed(1)} km`;
  }

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={revalidating} 
              onRefresh={refresh}
              tintColor="#1D4ED8"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarBox}>
                <Ionicons name="shield-checkmark" size={24} color="#1D4ED8" />
              </View>
              <View>
                <View style={styles.dutyBadge}>
                  <View style={styles.dutyDot} />
                  <Text style={styles.dutyText}>ON DUTY</Text>
                </View>
                <Text style={styles.dashTitle}>Command Center</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/(police)/profile")} 
              activeOpacity={0.7}
              style={styles.profileBtn}
            >
              <Ionicons name="person-circle-outline" size={32} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconBox}>
                <Ionicons name="radio-outline" size={20} color="#1D4ED8" />
              </View>
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active Reports</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#F1F5F9" }]}>
                <Ionicons name="list-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Total Recent</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statValue}>{resolvedToday}</Text>
              <Text style={styles.statLabel}>Resolved Today</Text>
            </View>
          </View>

          {/* SOS Banner */}
          <TouchableOpacity
            style={styles.sosBanner}
            activeOpacity={0.9}
            onPress={() => router.push("/(police)/sos-active")}
          >
            <View style={styles.sosLeft}>
              <View style={styles.sosIconBox}>
                <Ionicons name="warning" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sosTitle}>Active SOS Alerts</Text>
                <Text style={styles.sosSub}>Emergency assistance requested</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B91C1C" />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Priority Alerts</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.loadingText}>Fetching priority dispatches...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {priorityAlerts.map((alertRaw) => {
            const level = levelFromStatus(alertRaw.status);
            return (
              <TouchableOpacity
                key={alertRaw.id}
                style={styles.priorityCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(police)/incident-report",
                    params: { id: alertRaw.id },
                  })
                }
              >
                <View style={[styles.priorityIndicator, { backgroundColor: levelColors[level] }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {alertRaw.locationLabel || alertRaw.locationAddress || alertRaw.crimeCategory}
                    </Text>
                    <View style={[styles.levelChip, { backgroundColor: levelBg[level] }]}>
                      <Text style={[styles.levelText, { color: levelColors[level] }]}>{level.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-sharp" size={14} color="#64748B" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {alertRaw.locationLabel || "Unknown Area"}
                      </Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                      <Ionicons name="navigate-circle" size={14} color="#1D4ED8" />
                      <Text style={[styles.metaText, { color: "#1D4ED8", fontWeight: "600" }]}>
                        {formatDistanceKm(alertRaw) ?? "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.timeTag}>
                      <Ionicons name="time-outline" size={12} color="#94A3B8" />
                      <Text style={styles.timeText}>
                        {new Date(alertRaw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    {alertRaw.credibilityScore != null && (() => {
                      const conf = getConfidenceInfo(alertRaw.credibilityScore);
                      return conf ? (
                        <View style={[styles.confidenceBadge, { backgroundColor: conf.bg }]}>
                          <Ionicons name="stats-chart" size={10} color={conf.color} />
                          <Text style={[styles.confidenceText, { color: conf.color }]}>
                            {conf.label}
                          </Text>
                        </View>
                      ) : null;
                    })()}
                    <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Nearby Activity</Text>
          </View>

          {nearbyIncidents.map((incRaw) => {
            const level = levelFromStatus(incRaw.status);
            return (
              <TouchableOpacity
                key={incRaw.id}
                style={styles.activityCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(police)/incident-report",
                    params: { id: incRaw.id },
                  })
                }
              >
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIcon, { backgroundColor: levelBg[level] }]}>
                    <Ionicons 
                      name={incRaw.isPoliceVerified ? "shield-checkmark" : "help-buoy-outline"} 
                      size={18} 
                      color={levelColors[level]} 
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {incRaw.locationLabel || incRaw.crimeCategory}
                    </Text>
                    <Text style={styles.activitySub}>
                      {formatDistanceKm(incRaw)} • {new Date(incRaw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  {incRaw.credibilityScore != null && (() => {
                    const conf = getConfidenceInfo(incRaw.credibilityScore);
                    return conf ? (
                      <View style={[styles.confidenceBadge, { backgroundColor: conf.bg }]}>
                        <Text style={[styles.confidenceText, { color: conf.color }]}>{conf.label}</Text>
                      </View>
                    ) : null;
                  })()}
                   <View style={[
                     styles.statusDot, 
                     { backgroundColor: incRaw.isPoliceVerified ? "#22C55E" : "#E2E8F0" }
                   ]} />
                   <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  
  // Header
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24 
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  dutyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 4,
  },
  dutyText: { 
    fontSize: 10, 
    fontWeight: "800", 
    color: "#16A34A",
    letterSpacing: 0.5,
  },
  dashTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  profileBtn: {
    padding: 2,
  },

  // Stats Grid
  statsGrid: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 24 
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statCardPrimary: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: "600" },

  // SOS Banner
  sosBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    shadowColor: "#EF4444",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sosLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sosIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sosTitle: { fontSize: 16, fontWeight: "800", color: "#991B1B" },
  sosSub: { fontSize: 12, color: "#B91C1C", marginTop: 2 },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  seeAllText: { fontSize: 14, color: "#1D4ED8", fontWeight: "600" },

  // Loading/Error
  loadingState: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
  },
  loadingText: { fontSize: 14, color: "#64748B", marginLeft: 10 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { color: "#DC2626", fontSize: 14, marginLeft: 8, flex: 1 },

  // Priority Card
  priorityCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  priorityIndicator: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 10,
  },
  levelChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "900",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "60%",
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFF",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  // Activity Card
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  activitySub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  activityRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
//           ))}
//         </View>

//         {/* Description */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionIcon}>📋</Text>
//             <Text style={styles.sectionTitle}>Description</Text>
//           </View>
//           <Text style={styles.descText}>
//             Two Aspects were fleeing the scene after robbing a convenience store ar gunpoint. One suspect was wearing a dark hoodie. The other had a red cap. No injuries reported. Police Units have been dispatched to the area.
//           </Text>
//         </View>

//         {/* Evidence */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionIcon}>📷</Text>
//             <Text style={styles.sectionTitle}>Evidence</Text>
//           </View>
//           <View style={styles.evidenceRow}>
//             <View style={styles.evidenceBox}><Text style={{ fontSize: 24 }}>📷</Text></View>
//             <View style={styles.evidenceBox}><Text style={{ fontSize: 24 }}>📷</Text></View>
//           </View>
//         </View>

//         {/* Reporter */}
//         <View style={styles.reporterRow}>
//           <View style={styles.reporterLeft}>
//             <Text style={{ fontSize: 16 }}>👤</Text>
//             <Text style={styles.reporterText}>Anonymous Reporter</Text>
//           </View>
//           <Text style={styles.confidence}>● 72%</Text>
//         </View>

//         {/* Accept */}
//         <TouchableOpacity style={styles.acceptBtn} onPress={() => router.push('/(police)/investigation')}>
//           <Text style={styles.acceptText}>Accept Case</Text>
//         </TouchableOpacity>

//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { flex: 1, backgroundColor: '#F8FAFF' },
//   container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
//   header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
//   backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
//   backArrow: { fontSize: 18, color: '#111' },
//   heading: { fontSize: 17, fontWeight: '700', color: '#111' },
//   titleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   incidentIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
//   incidentTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
//   incidentMeta: { fontSize: 12, color: '#888', marginTop: 2 },
//   section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
//   sectionIcon: { fontSize: 14 },
//   sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
//   mapBox: { height: 140, backgroundColor: '#E8F4E8', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
//   mapEmoji: { fontSize: 56, opacity: 0.5 },
//   mapPinDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },
//   locationRow: { flexDirection: 'row', justifyContent: 'space-between' },
//   locationText: { fontSize: 12, color: '#555' },
//   timeText: { fontSize: 12, color: '#888' },
//   actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
//   actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
//   actionBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
//   actionIcon: { fontSize: 20, marginBottom: 4 },
//   actionLabel: { fontSize: 11, fontWeight: '600', color: '#555' },
//   actionLabelActive: { color: '#fff' },
//   descText: { fontSize: 13, color: '#444', lineHeight: 21 },
//   evidenceRow: { flexDirection: 'row', gap: 12 },
//   evidenceBox: { width: 72, height: 72, backgroundColor: '#F0F4FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
//   reporterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   reporterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   reporterText: { fontSize: 13, fontWeight: '600', color: '#333' },
//   confidence: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
//   acceptBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
//   acceptText: { color: '#fff', fontSize: 16, fontWeight: '600' },
// });





// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useState } from 'react';
// import { StatusBar } from 'expo-status-bar';

// const statusOptions = ['Responding', 'On Scene', 'Investigation'];
// const caseStatusOptions = ['Suspect Detailed', 'Case Resolved'];

// const quickCapture = [
//   { icon: '📷', label: 'Photo' },
//   { icon: '🎵', label: 'Audio' },
//   { icon: '📄', label: 'Document' },
//   { icon: '📤', label: 'Upload' },
// ];

// export default function Investigation() {
//   const router = useRouter();
//   const [activeStatus, setActiveStatus] = useState('On Scene');
//   const [activeCaseStatus, setActiveCaseStatus] = useState('');
//   const [notes, setNotes] = useState('');
//   const [suspectTag, setSuspectTag] = useState('');

//   return (
//     <View style={styles.wrapper}>
//       <StatusBar style="dark" />
//       <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//             <Text style={styles.backArrow}>←</Text>
//           </TouchableOpacity>
//           <View>
//             <Text style={styles.heading}>Investigation</Text>
//             <Text style={styles.subheading}>Case # 3</Text>
//           </View>
//         </View>

//         {/* Case Status */}
//         <Text style={styles.sectionLabel}>Case Status</Text>
//         <View style={styles.statusRow}>
//           {statusOptions.map((s) => (
//             <TouchableOpacity
//               key={s}
//               style={[styles.statusChip, activeStatus === s && styles.statusChipActive]}
//               onPress={() => setActiveStatus(s)}
//             >
//               <Text style={[styles.statusChipText, activeStatus === s && styles.statusChipTextActive]}>{s}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//         <View style={styles.caseStatusRow}>
//           {caseStatusOptions.map((s) => (
//             <TouchableOpacity
//               key={s}
//               style={[styles.caseChip, activeCaseStatus === s && styles.caseChipActive]}
//               onPress={() => setActiveCaseStatus(s)}
//             >
//               <Text style={[styles.caseChipText, activeCaseStatus === s && styles.caseChipTextActive]}>{s}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Field Notes */}
//         <Text style={styles.sectionLabel}>Field Notes</Text>
//         <TextInput
//           style={styles.notesInput}
//           placeholder="Add investigation notes..."
//           placeholderTextColor="#BBB"
//           value={notes}
//           onChangeText={setNotes}
//           multiline
//           numberOfLines={4}
//           textAlignVertical="top"
//         />

//         {/* Quick Capture */}
//         <Text style={styles.sectionLabel}>Quick Capture</Text>
//         <View style={styles.captureRow}>
//           {quickCapture.map((item, i) => (
//             <TouchableOpacity key={i} style={styles.captureBtn}>
//               <Text style={styles.captureIcon}>{item.icon}</Text>
//               <Text style={styles.captureLabel}>{item.label}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Suspect Tags */}
//         <Text style={styles.sectionLabel}>👤 Suspect Tags</Text>
//         <View style={styles.suspectRow}>
//           <TextInput
//             style={styles.suspectInput}
//             placeholder="Add suspect description..."
//             placeholderTextColor="#BBB"
//             value={suspectTag}
//             onChangeText={setSuspectTag}
//           />
//           <TouchableOpacity style={styles.addBtn}>
//             <Text style={styles.addBtnText}>+</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity style={styles.saveBtn}>
//           <Text style={styles.saveBtnText}>Save Investigation Notes</Text>
//         </TouchableOpacity>

//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { flex: 1, backgroundColor: '#fff' },
//   container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
//   header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
//   backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
//   backArrow: { fontSize: 18, color: '#111' },
//   heading: { fontSize: 17, fontWeight: '700', color: '#111' },
//   subheading: { fontSize: 12, color: '#888' },
//   sectionLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 10 },
//   statusRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
//   statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
//   statusChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
//   statusChipText: { fontSize: 12, fontWeight: '600', color: '#888' },
//   statusChipTextActive: { color: '#fff' },
//   caseStatusRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
//   caseChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
//   caseChipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
//   caseChipText: { fontSize: 12, fontWeight: '600', color: '#888' },
//   caseChipTextActive: { color: '#2563EB' },
//   notesInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, color: '#111', height: 110, backgroundColor: '#FAFAFA', marginBottom: 22 },
//   captureRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
//   captureBtn: { flex: 1, backgroundColor: '#F8FAFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
//   captureIcon: { fontSize: 22, marginBottom: 4 },
//   captureLabel: { fontSize: 11, fontWeight: '600', color: '#555' },
//   suspectRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
//   suspectInput: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', backgroundColor: '#FAFAFA' },
//   addBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
//   addBtnText: { fontSize: 24, color: '#fff', fontWeight: '300' },
//   saveBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
//   saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
// });