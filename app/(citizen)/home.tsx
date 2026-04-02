import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";

export default function CitizenHome() {
  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>
          Your safety dashboard. Use the Feed tab for neighborhood alerts, posts, and the full community hub.
        </Text>
      </View>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22 },
});
