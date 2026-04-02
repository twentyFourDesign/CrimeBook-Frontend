import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useVerificationDraft } from "../../../src/verification/VerificationDraftContext";
import type { IdDocumentType } from "../../../src/auth/types";
import { uploadCrimeMediaFile } from "../../../src/auth/api";

const DOC_TYPES: { key: IdDocumentType; label: string }[] = [
  { key: "national_id", label: "National ID" },
  { key: "passport", label: "Passport" },
  { key: "drivers_license", label: "Driver's license" },
];

export default function CitizenStep1() {
  const router = useRouter();
  const { draft, setDraft } = useVerificationDraft();
  const [uploading, setUploading] = useState(false);

  const pickIdDocument = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Permission needed", "Photo library access is required to upload your ID.");
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
      const name = asset.fileName ?? `id_${Date.now()}.jpg`;
      const mime = asset.mimeType ?? "image/jpeg";
      const uploaded = await uploadCrimeMediaFile({
        uri: asset.uri,
        name,
        mimeType: mime,
        folder: "verification",
      });
      setDraft((d) => ({ ...d, idDocumentUrl: uploaded.url }));
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  };

  const onContinue = () => {
    if (!draft.fullName.trim() || !draft.idNumber.trim()) {
      Alert.alert("Missing info", "Please enter your full name and ID number.");
      return;
    }
    if (!draft.idDocumentUrl) {
      Alert.alert("ID photo", "Please upload a photo of your government ID.");
      return;
    }
    router.push("/(auth)/verify/citizen-step2");
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Identification Verification</Text>
            <Text style={styles.step}>Step 1 of 3</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Verification helps maintain community trust. Your details are stored securely.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Government-issued ID</Text>
        <Text style={styles.sectionDesc}>Choose ID type and enter details as shown on the document.</Text>

        <Text style={styles.fieldLabel}>ID type</Text>
        <View style={styles.chipRow}>
          {DOC_TYPES.map(({ key, label }) => {
            const on = draft.idDocumentType === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setDraft((d) => ({ ...d, idDocumentType: key }))}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.uploadBox}
          onPress={pickIdDocument}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator size="large" />
          ) : draft.idDocumentUrl ? (
            <>
              <Image source={{ uri: draft.idDocumentUrl }} style={styles.idPreview} />
              <Text style={styles.uploadText}>Tap to replace</Text>
            </>
          ) : (
            <>
              <Text style={styles.uploadIcon}>📎</Text>
              <Text style={styles.uploadText}>Tap to upload ID photo</Text>
              <Text style={styles.uploadHint}>Stored in your Supabase crime-media bucket</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="As shown on ID"
          placeholderTextColor="#AAA"
          value={draft.fullName}
          onChangeText={(fullName) => setDraft((d) => ({ ...d, fullName }))}
        />

        <Text style={styles.fieldLabel}>ID number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter ID number"
          placeholderTextColor="#AAA"
          value={draft.idNumber}
          onChangeText={(idNumber) => setDraft((d) => ({ ...d, idNumber }))}
        />

        <TouchableOpacity style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  backArrow: { fontSize: 20, color: "#111" },
  heading: { fontSize: 16, fontWeight: "700", color: "#111" },
  step: { fontSize: 12, color: "#888", marginTop: 1 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  progressSegment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#E2E8F0" },
  progressActive: { backgroundColor: "#2563EB" },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoIcon: { fontSize: 14 },
  infoText: { flex: 1, fontSize: 12, color: "#555", lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#666", lineHeight: 20, marginBottom: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FAFAFA",
  },
  chipOn: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  chipTextOn: { color: "#2563EB" },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  uploadIcon: { fontSize: 28, marginBottom: 8 },
  uploadText: { fontSize: 14, fontWeight: "600", color: "#333" },
  uploadHint: { fontSize: 12, color: "#999", marginTop: 4, textAlign: "center", paddingHorizontal: 12 },
  idPreview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
    resizeMode: "cover",
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111",
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
