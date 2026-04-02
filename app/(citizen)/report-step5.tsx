import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { uploadCrimeMediaFile } from "../../src/auth/api";

const MAX_FILES = 8;

export default function ReportStep5() {
  const router = useRouter();
  const { draft, updateDraft, setDraft } = useReportDraft();
  const [note, setNote] = useState(draft.evidenceNote);
  const [busy, setBusy] = useState(false);

  const addFromPicker = async (mode: "camera" | "library") => {
    if (draft.media.length >= MAX_FILES) {
      Alert.alert("Limit reached", `You can attach up to ${MAX_FILES} files.`);
      return;
    }

    if (mode === "camera") {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) {
        Alert.alert("Permission needed", "Camera access is required to take a photo.");
        return;
      }
    } else {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!lib.granted) {
        Alert.alert("Permission needed", "Photo library access is required to pick files.");
        return;
      }
    }

    setBusy(true);
    try {
      const result =
        mode === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              quality: 0.85,
              videoMaxDuration: 120,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              quality: 0.85,
              allowsMultipleSelection: true,
              selectionLimit: MAX_FILES - draft.media.length,
              videoMaxDuration: 120,
            });

      if (result.canceled || !result.assets?.length) return;

      let count = draft.media.length;
      for (const asset of result.assets) {
        if (count >= MAX_FILES) break;
        const isVideo = asset.type === "video";
        const name =
          asset.fileName ?? (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`);
        const mime = asset.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg");
        const uploaded = await uploadCrimeMediaFile({
          uri: asset.uri,
          name,
          mimeType: mime,
          folder: "reports",
        });
        setDraft((d) => ({ ...d, media: [...d.media, uploaded] }));
        count += 1;
      }
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => {
    setDraft((d) => ({
      ...d,
      media: d.media.filter((_, i) => i !== index),
    }));
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
            <Text style={styles.heading}>Report Incident</Text>
            <Text style={styles.step}>Step 5 of 6</Text>
          </View>
        </View>

        <ReportProgress currentStep={5} />

        <Text style={styles.sectionTitle}>Evidence (optional)</Text>
        <Text style={styles.sectionDesc}>
          Photos and videos are uploaded securely, then linked to your report.
        </Text>

        <View style={styles.uploadRow}>
          <TouchableOpacity
            style={[styles.uploadCard, busy && styles.uploadDisabled]}
            activeOpacity={0.85}
            disabled={busy}
            onPress={() => addFromPicker("camera")}
          >
            {busy ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadLabel}>Take photo / video</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadCard, busy && styles.uploadDisabled]}
            activeOpacity={0.85}
            disabled={busy}
            onPress={() => addFromPicker("library")}
          >
            {busy ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.uploadIcon}>📤</Text>
                <Text style={styles.uploadLabel}>Library</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {draft.media.length > 0 && (
          <View style={styles.thumbRow}>
            {draft.media.map((m, i) => (
              <View key={`${m.path}-${i}`} style={styles.thumbWrap}>
                {m.mimeType.startsWith("video/") ? (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoIcon}>🎬</Text>
                  </View>
                ) : (
                  <Image source={{ uri: m.url }} style={styles.thumb} />
                )}
                <TouchableOpacity style={styles.removeX} onPress={() => removeAt(i)} hitSlop={8}>
                  <Text style={styles.removeXText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional: describe evidence"
          placeholderTextColor="#BBB"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            updateDraft({ evidenceNote: note.trim() });
            router.push("/(citizen)/report-step6");
          }}
        >
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { fontSize: 18, color: "#111" },
  heading: { fontSize: 16, fontWeight: "700", color: "#111" },
  step: { fontSize: 12, color: "#888", marginTop: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: "#888", marginBottom: 20 },
  uploadRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  uploadCard: {
    flex: 1,
    minHeight: 120,
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  uploadDisabled: { opacity: 0.6 },
  uploadIcon: { fontSize: 36, marginBottom: 10 },
  uploadLabel: { fontSize: 13, fontWeight: "600", color: "#555", textAlign: "center" },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  thumbWrap: { position: "relative" },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#E2E8F0" },
  videoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: { fontSize: 28 },
  removeX: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  removeXText: { color: "#fff", fontSize: 16, fontWeight: "700", lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 28,
    backgroundColor: "#FAFAFA",
  },
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
