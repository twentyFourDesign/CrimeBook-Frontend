import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";

export default function CreateAlert() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [radius, setRadius] = useState("5 km");

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Create Alert</Text>
        </View>

        <Text style={styles.fieldLabel}>Alert Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Suspicious vehicle near park"
          placeholderTextColor="#BBB"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.fieldLabel}>Discription</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the situation in detail...."
          placeholderTextColor="#BBB"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.fieldLabel}>Location</Text>
        <TouchableOpacity style={styles.locationBtn}>
          <View style={styles.locationIconBox}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </View>
          <View>
            <Text style={styles.locationTitle}>Set Alert Location</Text>
            <Text style={styles.locationSub}>Tap to select on map</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Alert Radius</Text>
        <View style={styles.radiusRow}>
          {["1 km", "5 km", "10 km"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.radiusNote}>All citizens within {radius} will be notified</Text>

        <View style={styles.mapPreview}>
          <Text style={styles.mapText}>🗺️</Text>
          <View style={styles.mapDot} />
        </View>

        <TouchableOpacity style={styles.publishBtn}>
          <Text style={styles.publishIcon}>✈️</Text>
          <Text style={styles.publishText}>Publish Alert</Text>
        </TouchableOpacity>
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  heading: { fontSize: 18, fontWeight: "700", color: "#111" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111",
    marginBottom: 18,
    backgroundColor: "#FAFAFA",
  },
  textArea: { height: 100, paddingTop: 13 },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "#FAFAFA",
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  locationTitle: { fontSize: 13, fontWeight: "600", color: "#333" },
  locationSub: { fontSize: 11, color: "#AAA", marginTop: 2 },
  radiusRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  radiusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  radiusBtnActive: { backgroundColor: "#2563EB" },
  radiusBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  radiusBtnTextActive: { color: "#fff" },
  radiusNote: { fontSize: 12, color: "#888", marginBottom: 14 },
  mapPreview: {
    height: 140,
    backgroundColor: "#E8F4E8",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  mapText: { fontSize: 56, opacity: 0.5 },
  mapDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#fff",
  },
  publishBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
  },
  publishIcon: { fontSize: 16 },
  publishText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
