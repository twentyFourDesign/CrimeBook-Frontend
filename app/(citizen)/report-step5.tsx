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
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { uploadCrimeMediaFile } from "../../src/auth/api";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { ReportContinueButton } from "../../src/components/report/ReportContinueButton";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";

const MAX_FILES = 8;

export default function ReportStep5() {
  const router = useRouter();
  const layout = useReportScreenLayout();
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
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={5} />

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
                <Ionicons name="camera-outline" size={36} color="#2563EB" style={styles.uploadIcon} />
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
                <Ionicons name="images-outline" size={36} color="#2563EB" style={styles.uploadIcon} />
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
                    <Ionicons name="videocam" size={28} color="#93C5FD" />
                  </View>
                ) : (
                  <Image source={{ uri: m.url }} style={styles.thumb} />
                )}
                <TouchableOpacity style={styles.removeX} onPress={() => removeAt(i)} hitSlop={8}>
                  <Ionicons name="close" size={16} color="#fff" />
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

        <ReportContinueButton
          onPress={() => {
            updateDraft({ evidenceNote: note.trim() });
            router.push("/(citizen)/report-step6");
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
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
  uploadIcon: { marginBottom: 10 },
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
});
