import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function PoliceHome() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Police Dashboard</Text>
      <Text style={styles.subtitle}>Minimal police home route is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666" },
});
