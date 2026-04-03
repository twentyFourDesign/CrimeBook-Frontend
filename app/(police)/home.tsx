import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceIncidentsForMap } from "../../src/auth/api";
import type { PoliceIncidentForMap } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";

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

export default function PoliceHome() {
  const router = useRouter();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<PoliceIncidentForMap[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const { incidents } = await fetchPoliceIncidentsForMap();
        setIncidents(incidents);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load incidents");
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarBox}>
                <Ionicons name="shield-checkmark" size={22} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.dutyText}>On Duty</Text>
                <Text style={styles.dashTitle}>Dashboard</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.activeBadge}>
                <View style={styles.activeDotIcon} />
                <Text style={styles.activeText}>Active</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(police)/profile")} activeOpacity={0.85}>
                <View style={styles.profileIcon}>
                  <Ionicons name="person-circle-outline" size={22} color="#1F2937" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { value: String(activeCount), label: "Active Reports" },
              { value: String(total), label: "Total Recent" },
              { value: String(resolvedToday), label: "Resolved Today" },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Priority Alerts</Text>
          {loading && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ActivityIndicator size="small" />
              <Text style={{ fontSize: 12, color: "#64748B" }}>Loading incidents…</Text>
            </View>
          )}
          {error && !loading && (
            <Text style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>{error}</Text>
          )}
          {priorityAlerts.map((alertRaw) => {
            const level = levelFromStatus(alertRaw.status);
            const alert = { ...alertRaw, level };
            return (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(police)/incident-report",
                  params: { id: alert.id },
                })
              }
            >
              <View style={[styles.alertDot, { backgroundColor: levelColors[alert.level] }]} />
              <View style={styles.alertInfo}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>
                    {alert.locationLabel || alert.locationAddress || alert.crimeCategory}
                  </Text>
                  <View style={[styles.levelBadge, { backgroundColor: levelBg[alert.level] }]}>
                    <Text style={[styles.levelText, { color: levelColors[alert.level] }]}>{alert.level}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaLeft}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.alertMetaText}>
                      {alert.locationLabel || alert.locationAddress || "Unknown location"}
                    </Text>
                    <View style={styles.metaDot} />
                    <Ionicons name="navigate-outline" size={14} color="#64748B" />
                    <Text style={styles.alertMetaText}>
                      {formatDistanceKm(alert) ?? "—"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color="#94A3B8" />
                <Text style={styles.alertTimeText}>
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
          })}

          <Text style={styles.sectionTitle}>Nearby Incidents</Text>
          {nearbyIncidents.map((incRaw) => {
            const level = levelFromStatus(incRaw.status);
            const inc = { ...incRaw, level };
            return (
            <TouchableOpacity
              key={inc.id}
              style={styles.incidentCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(police)/incident-report",
                  params: { id: inc.id },
                })
              }
            >
              <View style={styles.incidentLeft}>
                <View style={styles.incidentInfo}>
                  <View style={styles.incidentTitleRow}>
                    <Text style={styles.incidentTitle}>
                      {inc.locationLabel || inc.locationAddress || "Unknown location"}
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: levelBg[inc.level] }]}>
                      <Text style={[styles.levelText, { color: levelColors[inc.level] }]}>{inc.level}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaLeft}>
                      <Ionicons name="location-outline" size={14} color="#64748B" />
                      <Text style={styles.incidentMetaText}>
                        {inc.locationLabel || inc.locationAddress || "Unknown location"}
                      </Text>
                      <View style={styles.metaDot} />
                      <Ionicons name="navigate-outline" size={14} color="#64748B" />
                      <Text style={styles.incidentMetaText}>
                        {formatDistanceKm(inc) ?? "—"}
                      </Text>
                      <View style={styles.metaDot} />
                      <Ionicons name="time-outline" size={14} color="#94A3B8" />
                      <Text style={styles.incidentMetaText}>
                        {new Date(inc.createdAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text
                style={[
                  styles.verifiedText,
                  { color: inc.isPoliceVerified ? "#22C55E" : "#EF4444" },
                ]}
              >
                {inc.isPoliceVerified ? "✓ Verified" : "✗ Not-Verified"}
              </Text>
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
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#E0EAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 22 },
  dutyText: { fontSize: 11, color: "#888", fontWeight: "500" },
  dashTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  activeDotIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  activeText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2, textAlign: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 10 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  alertDot: { width: 32, height: 32, borderRadius: 16 },
  alertInfo: { flex: 1 },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  alertTitle: { fontSize: 13, fontWeight: "700", color: "#111", flex: 1 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  levelText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  metaLeft: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5F5",
  },
  alertMetaText: { fontSize: 11, color: "#64748B" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  alertTimeText: { fontSize: 11, color: "#94A3B8" },
  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentLeft: { flex: 1 },
  incidentInfo: { flex: 1 },
  incidentTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  incidentTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  incidentMetaText: { fontSize: 11, color: "#64748B" },
  verifiedText: { fontSize: 11, fontWeight: "600", marginLeft: 8 },
});




// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';

// const priorityAlerts = [
//   { id: '1', title: 'Armed Robbery Alert', level: 'critical', location: 'Main St & 5th Ave', dist: '1.5 km', time: '2 min ago' },
//   { id: '2', title: 'Armed Robbery Alert', level: 'high', location: 'Main St & 5th Ave', dist: '1.1 km', time: '5 min ago' },
// ];

// const nearbyIncidents = [
//   { id: '1', title: 'Vehicle Break-in', level: 'medium', location: 'Oak Lane', dist: '1.5 km', time: '5 min ago', verified: true },
//   { id: '2', title: 'Noise Disturbance', level: 'low', location: 'Oak Lane', dist: '1.3 km', time: '6 min ago', verified: false },
//   { id: '3', title: 'Vehicle Break-in', level: 'medium', location: 'Oak Lane', dist: '1.5 km', time: null, verified: true },
// ];

// const levelColors: Record<string, string> = {
//   critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#22C55E',
// };
// const levelBg: Record<string, string> = {
//   critical: '#FEE2E2', high: '#FFEDD5', medium: '#FEF9C3', low: '#DCFCE7',
// };

// export default function Dashboard() {
//   const router = useRouter();

//   return (
//     <View style={styles.wrapper}>
//       <StatusBar style="dark" />
//       <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.headerLeft}>
//             <View style={styles.avatarBox}><Text style={styles.avatarText}>👮</Text></View>
//             <View>
//               <Text style={styles.dutyText}>On Duty</Text>
//               <Text style={styles.dashTitle}>Dashboard</Text>
//             </View>
//           </View>
//           <View style={styles.headerRight}>
//             <View style={styles.activeBadge}><Text style={styles.activeDot}>●</Text><Text style={styles.activeText}>Active</Text></View>
//             <TouchableOpacity onPress={() => router.push('/(police)/profile')}>
//               <View style={styles.profileIcon}><Text style={{ fontSize: 20 }}>👤</Text></View>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Stats */}
//         <View style={styles.statsRow}>
//           {[
//             { value: '4', label: 'Active Cases' },
//             { value: '7', label: 'Nearby' },
//             { value: '3', label: 'Resolved Today' },
//           ].map((s, i) => (
//             <View key={i} style={styles.statCard}>
//               <Text style={styles.statValue}>{s.value}</Text>
//               <Text style={styles.statLabel}>{s.label}</Text>
//             </View>
//           ))}
//         </View>

//         {/* Priority Alerts */}
//         <Text style={styles.sectionTitle}>Priority Alerts</Text>
//         {priorityAlerts.map((alert) => (
//           <TouchableOpacity key={alert.id} style={styles.alertCard} onPress={() => router.push('/(police)/incident-report')}>
//             <View style={[styles.alertDot, { backgroundColor: levelColors[alert.level] }]} />
//             <View style={styles.alertInfo}>
//               <View style={styles.alertTitleRow}>
//                 <Text style={styles.alertTitle}>{alert.title}</Text>
//                 <View style={[styles.levelBadge, { backgroundColor: levelBg[alert.level] }]}>
//                   <Text style={[styles.levelText, { color: levelColors[alert.level] }]}>{alert.level}</Text>
//                 </View>
//               </View>
//               <Text style={styles.alertMeta}>📍 {alert.location}  △ {alert.dist}</Text>
//             </View>
//             <Text style={styles.alertTime}>🕐 {alert.time}</Text>
//           </TouchableOpacity>
//         ))}

//         {/* Nearby Incidents */}
//         <Text style={styles.sectionTitle}>Nearby Incidents</Text>
//         {nearbyIncidents.map((inc) => (
//           <TouchableOpacity key={inc.id} style={styles.incidentCard} onPress={() => router.push('/(police)/incident-report')}>
//             <View style={styles.incidentLeft}>
//               <View style={styles.incidentInfo}>
//                 <View style={styles.incidentTitleRow}>
//                   <Text style={styles.incidentTitle}>{inc.title}</Text>
//                   <View style={[styles.levelBadge, { backgroundColor: levelBg[inc.level] }]}>
//                     <Text style={[styles.levelText, { color: levelColors[inc.level] }]}>{inc.level}</Text>
//                   </View>
//                 </View>
//                 <Text style={styles.incidentMeta}>📍 {inc.location}  △ {inc.dist}{inc.time ? `  🕐 ${inc.time}` : ''}</Text>
//               </View>
//             </View>
//             <Text style={[styles.verifiedText, { color: inc.verified ? '#22C55E' : '#EF4444' }]}>
//               {inc.verified ? '✓ Verified' : '✗ Not-Verified'}
//             </Text>
//           </TouchableOpacity>
//         ))}

//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { flex: 1, backgroundColor: '#F8FAFF' },
//   container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 24 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
//   headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   avatarBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#E0EAFF', justifyContent: 'center', alignItems: 'center' },
//   avatarText: { fontSize: 22 },
//   dutyText: { fontSize: 11, color: '#888', fontWeight: '500' },
//   dashTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
//   headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
//   activeDot: { fontSize: 8, color: '#22C55E' },
//   activeText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
//   profileIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
//   statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   statValue: { fontSize: 22, fontWeight: '700', color: '#111' },
//   statLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
//   sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
//   alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   alertDot: { width: 32, height: 32, borderRadius: 16 },
//   alertInfo: { flex: 1 },
//   alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
//   alertTitle: { fontSize: 13, fontWeight: '700', color: '#111', flex: 1 },
//   levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
//   levelText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
//   alertMeta: { fontSize: 11, color: '#888' },
//   alertTime: { fontSize: 11, color: '#AAA' },
//   incidentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   incidentLeft: { flex: 1 },
//   incidentInfo: { flex: 1 },
//   incidentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
//   incidentTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
//   incidentMeta: { fontSize: 11, color: '#888' },
//   verifiedText: { fontSize: 11, fontWeight: '600', marginLeft: 8 },
// });



// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';

// const actions = [
//   { icon: '🧭', label: 'Navigate' },
//   { icon: '🔍', label: 'Investigate' },
//   { icon: '🚨', label: 'Priority' },
// ];

// export default function IncidentReport() {
//   const router = useRouter();

//   return (
//     <View style={styles.wrapper}>
//       <StatusBar style="dark" />
//       <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//             <Text style={styles.backArrow}>←</Text>
//           </TouchableOpacity>
//           <Text style={styles.heading}>Incident Report</Text>
//         </View>

//         {/* Incident Title Card */}
//         <View style={styles.titleCard}>
//           <View style={styles.incidentIconBox}><Text style={{ fontSize: 18 }}>🔴</Text></View>
//           <View>
//             <Text style={styles.incidentTitle}>Armed Robbery</Text>
//             <Text style={styles.incidentMeta}>March 16, 2026  •  2:42 PM</Text>
//           </View>
//         </View>

//         {/* Location */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionIcon}>📍</Text>
//             <Text style={styles.sectionTitle}>Location</Text>
//           </View>
//           <View style={styles.mapBox}>
//             <Text style={styles.mapEmoji}>🗺️</Text>
//             <View style={styles.mapPinDot} />
//           </View>
//           <View style={styles.locationRow}>
//             <Text style={styles.locationText}>📍 Main St & 5th Ave</Text>
//             <Text style={styles.timeText}>🕐 8 min ago</Text>
//           </View>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.actionRow}>
//           {actions.map((a, i) => (
//             <TouchableOpacity
//               key={i}
//               style={[styles.actionBtn, i === 0 && styles.actionBtnActive]}
//               onPress={() => i === 1 && router.push('/(police)/investigation')}
//             >
//               <Text style={styles.actionIcon}>{a.icon}</Text>
//               <Text style={[styles.actionLabel, i === 0 && styles.actionLabelActive]}>{a.label}</Text>
//             </TouchableOpacity>
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