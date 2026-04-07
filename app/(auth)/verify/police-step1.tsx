import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { uploadCrimeMediaFile, submitPoliceApplication } from "../../../src/auth/api";
import { useAuth } from "../../../src/auth/AuthContext";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";

export default function PoliceStep1() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [badgeNumber, setBadgeNumber] = useState("");
  const [rank, setRank] = useState("");
  const [department, setDepartment] = useState("");
  const [precinct, setPrecinct] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickDoc = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Permission needed", "Photo library access is required to upload a document.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const name = asset.fileName ?? `police_id_${Date.now()}.jpg`;
      const mime = asset.mimeType ?? "image/jpeg";
      const uploaded = await uploadCrimeMediaFile({
        uri: asset.uri,
        name,
        mimeType: mime,
        folder: "verification",
      });
      setIdDocumentUrl(uploaded.url);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!badgeNumber.trim() || !rank.trim() || !department.trim() || !precinct.trim()) {
      Alert.alert("Missing info", "Please fill badge number, rank, department, and precinct.");
      return;
    }
    try {
      setSubmitting(true);
      await submitPoliceApplication({
        badgeNumber: badgeNumber.trim(),
        rank: rank.trim(),
        department: department.trim(),
        precinct: precinct.trim(),
        unitCode: unitCode.trim() || undefined,
        idDocumentUrl,
      });
      await refreshUser();
      router.replace("/(auth)/verify/police-review");
    } catch (e) {
      Alert.alert("Submit failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenBackButton />
          <View>
            <Text style={styles.heading}>Police officer onboarding</Text>
            <Text style={styles.step}>Department verification</Text>
          </View>
        </View>

        <Text style={styles.blurb}>
          Your application is reviewed by an administrator. You will get access to the officer workspace when approved.
        </Text>

        <Text style={styles.label}>Badge number</Text>
        <TextInput
          style={styles.input}
          value={badgeNumber}
          onChangeText={setBadgeNumber}
          placeholder="e.g. 4521"
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Rank / title</Text>
        <TextInput style={styles.input} value={rank} onChangeText={setRank} placeholder="e.g. Sergeant" placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>Department</Text>
        <TextInput style={styles.input} value={department} onChangeText={setDepartment} placeholder="e.g. City PD" placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>Precinct / station</Text>
        <TextInput style={styles.input} value={precinct} onChangeText={setPrecinct} placeholder="e.g. North division" placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>Unit code (optional)</Text>
        <TextInput style={styles.input} value={unitCode} onChangeText={setUnitCode} placeholder="e.g. K-9" placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>ID or commission card (optional)</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickDoc} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.uploadText}>{idDocumentUrl ? "Document attached ✓" : "Upload image"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit application</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heading: { fontSize: 18, fontWeight: "700", color: "#111" },
  step: { fontSize: 12, color: "#888", marginTop: 2 },
  blurb: { fontSize: 13, color: "#555", lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  uploadText: { fontSize: 14, color: "#2563EB", fontWeight: "600" },
  button: {
    marginTop: 24,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
