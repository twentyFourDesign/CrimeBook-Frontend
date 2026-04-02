import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";

const incidents = [
  { id: "1", title: "Armed Robbery Alert", location: "Main St & 5th Ave", time: "8 min ago", distance: "0.3 mi", confidence: 72 },
  { id: "2", title: "Assault", location: "Broadway & 42nd", time: "22 min ago", distance: "0.8 mi", confidence: 85 },
  { id: "3", title: "Suspicious Activity", location: "Central park West", time: "45 min ago", distance: "1.2 mi", confidence: 54 },
];

const alerts = [{ id: "1", title: "Suspicious vehical near Central Park", location: "Main G.", time: "1 hr ago" }];

export default function Community() {
  const router = useRouter();

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Community</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Your Neighborhood hub</Text>
          </View>
          <TouchableOpacity
            style={styles.newAlertBtn}
            onPress={() => router.replace("/(citizen)/create-alert")}
          >
            <Text style={styles.newAlertText}>🔔 New Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { icon: "🔔", value: "3", label: "Pending" },
            { icon: "✅", value: "28", label: "Alerts" },
            { icon: "❌", value: "4", label: "Disputed" },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Incident Validation</Text>
        {incidents.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.incidentCard}
            onPress={() =>
              router.push({ pathname: "/(citizen)/incident-review", params: { id: item.id } })
            }
          >
            <View style={styles.incidentLeft}>
              <View style={styles.alertDot} />
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentTitle}>{item.title}</Text>
                <Text style={styles.incidentLocation}>📍 {item.location}</Text>
                <View style={styles.incidentMeta}>
                  <Text style={styles.metaText}>
                    🕐 {item.time} {item.distance}
                  </Text>
                  <Text style={styles.confidence}>● {item.confidence}% confidence</Text>
                </View>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Community Alerts</Text>
        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Text style={{ fontSize: 16 }}>🔔</Text>
            </View>
            <View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMeta}>
                📍 {alert.location} {alert.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  verifiedBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  newAlertBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  newAlertText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  incidentLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  alertDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  incidentInfo: { flex: 1 },
  incidentTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  incidentLocation: { fontSize: 12, color: "#888", marginBottom: 6 },
  incidentMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 11, color: "#AAA" },
  confidence: { fontSize: 11, color: "#22C55E", fontWeight: "600" },
  chevron: { fontSize: 20, color: "#CBD5E1", marginLeft: 8 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  alertTitle: { fontSize: 13, fontWeight: "600", color: "#111" },
  alertMeta: { fontSize: 11, color: "#AAA", marginTop: 2 },
});
