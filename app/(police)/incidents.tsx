import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";

export default function PoliceIncidentsScreen() {
  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Incidents</Text>
        <Text style={styles.subtitle}>Assigned and nearby incidents will show here.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No incident list wired yet</Text>
          <Text style={styles.cardBody}>
            This tab is meant for active incidents — hook it to your cases / reports API.
          </Text>
        </View>
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 6, marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 8 },
  cardBody: { fontSize: 14, color: "#64748B", lineHeight: 22 },
});

