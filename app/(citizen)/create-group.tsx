import { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View } from "react-native";
import { CrimeBookLoader } from "../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../src/components/common/LoadingState";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../src/components/common/ScreenBackButton";
import { createCommunityGroup } from "../../src/auth/api";

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [radiusKm, setRadiusKm] = useState("2");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location permission is required to create a neighborhood group.");
          setLocLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude });
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not determine your current location.");
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter a group name.");
      return;
    }
    if (!location) {
      Alert.alert("Location", "We need your location to create the group.");
      return;
    }

    setLoading(true);
    try {
      const radius = parseFloat(radiusKm);
      const res = await createCommunityGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: isNaN(radius) ? 2 : radius });

      Alert.alert("Success", "Your neighborhood group has been created!");
      router.replace(`/(citizen)/group/${res.group.id}`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Create Group</Text>
        </View>

        <Text style={styles.subtitle}>Start a new neighborhood group to keep your community safe and informed.</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Oak Ridge Neighbors"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this group about?"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Monitoring Radius (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="2"
              keyboardType="decimal-pad"
              value={radiusKm}
              onChangeText={setRadiusKm}
            />
            <Text style={styles.hint}>Reports within this distance will be prioritized for members.</Text>
          </View>

          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>Group Location</Text>
            {locLoading ? (
              <CrimeBookLoader size="small" ballColor="#2563EB" />
            ) : location ? (
              <Text style={styles.locationValue}>
                📌 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} (Current)
              </Text>
            ) : (
              <Text style={styles.locationError}>Location not acquired</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.createBtn, (loading || locLoading || !location) && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading || locLoading || !location}
          >
            {loading ? <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" /> : <Text style={styles.createBtnText}>Create Group</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 20 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#334155" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  hint: { fontSize: 12, color: "#94A3B8" },
  locationCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE" },
  locationLabel: { fontSize: 12, fontWeight: "700", color: "#2563EB", marginBottom: 4, textTransform: "uppercase" },
  locationValue: { fontSize: 14, color: "#1E293B" },
  locationError: { fontSize: 14, color: "#EF4444" },
  createBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnDisabled: { opacity: 0.6 } });
