import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import {
  fetchCitizenProfile,
  updateCitizenProfile,
  uploadCrimeMediaFile,
} from "../../src/auth/api";
import type { CitizenProfilePayload } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const { citizenProfile, setCitizenProfile } = useAppDataCache();
  const cacheRef = useRef(citizenProfile);
  cacheRef.current = citizenProfile;
  const [loading, setLoading] = useState(() => citizenProfile === null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CitizenProfilePayload | null>(() => citizenProfile);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeLat, setHomeLat] = useState("");
  const [homeLng, setHomeLng] = useState("");
  const [occupation, setOccupation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const applyProfileToForm = useCallback((p: CitizenProfilePayload) => {
    setProfile(p);
    setName(p.name);
    setPhone(p.phone ?? "");
    setCity(p.city ?? "");
    const cp = p.citizenProfile;
    setHomeAddress(cp?.homeAddress ?? "");
    setHomeLat(cp?.homeLatitude != null ? String(cp.homeLatitude) : "");
    setHomeLng(cp?.homeLongitude != null ? String(cp.homeLongitude) : "");
    setOccupation(cp?.occupation ?? "");
    setPreferredLanguage(cp?.preferredLanguage ?? "en");
  }, []);

  const load = useCallback(
    async (mode?: "refresh") => {
      setError(null);
      if (mode === "refresh") setRefreshing(true);
      else if (cacheRef.current === null) setLoading(true);
      try {
        const { profile: p } = await fetchCitizenProfile();
        setCitizenProfile(p);
        applyProfileToForm(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load profile");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyProfileToForm, setCitizenProfile]
  );

  useEffect(() => {
    load();
  }, [load]);

  const pickAvatar = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Permission needed", "Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileName = asset.fileName ?? `avatar_${Date.now()}.jpg`;
      const mime = asset.mimeType ?? "image/jpeg";
      const uploaded = await uploadCrimeMediaFile({
        uri: asset.uri,
        name: fileName,
        mimeType: mime,
        folder: "avatars",
      });
      const res = await updateCitizenProfile({ avatarUrl: uploaded.url });
      setCitizenProfile(res.profile);
      setProfile(res.profile);
      await refreshUser();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const parseHomeCoords = (): { homeLatitude: number | null; homeLongitude: number | null } | null => {
    const latTrim = homeLat.trim();
    const lngTrim = homeLng.trim();
    if (latTrim === "" && lngTrim === "") {
      return { homeLatitude: null, homeLongitude: null };
    }
    const la = parseFloat(latTrim);
    const lo = parseFloat(lngTrim);
    if (Number.isNaN(la) || Number.isNaN(lo)) {
      return null;
    }
    return { homeLatitude: la, homeLongitude: lo };
  };

  const onSaveHomeLocation = async () => {
    const coords = parseHomeCoords();
    if (coords === null) {
      Alert.alert("Location", "Enter valid home latitude and longitude, or leave both blank to clear.");
      return;
    }
    try {
      setSavingHome(true);
      const res = await updateCitizenProfile({
        homeAddress: homeAddress.trim() || null,
        homeLatitude: coords.homeLatitude,
        homeLongitude: coords.homeLongitude,
      });
      setCitizenProfile(res.profile);
      setProfile(res.profile);
      const cp = res.profile.citizenProfile;
      setHomeLat(cp?.homeLatitude != null ? String(cp.homeLatitude) : "");
      setHomeLng(cp?.homeLongitude != null ? String(cp.homeLongitude) : "");
      await refreshUser();
      Alert.alert("Saved", "Home location has been updated.");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSavingHome(false);
    }
  };

  const onSave = async () => {
    const coords = parseHomeCoords();
    if (coords === null) {
      Alert.alert("Location", "Enter valid home latitude and longitude, or leave both blank.");
      return;
    }
    const { homeLatitude, homeLongitude } = coords;

    try {
      setSaving(true);
      const res = await updateCitizenProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        homeAddress: homeAddress.trim() || null,
        homeLatitude,
        homeLongitude,
        occupation: occupation.trim() || null,
        preferredLanguage: preferredLanguage.trim() || "en",
      });
      setCitizenProfile(res.profile);
      setProfile(res.profile);
      await refreshUser();
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const verifyLabel = user?.identityVerificationStatus.replace(/_/g, " ") ?? "";

  return (
    <CitizenShell>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
        >
          <Text style={styles.title}>Profile</Text>

          {loading && (
            <View style={styles.centerRow}>
              <ActivityIndicator />
            </View>
          )}

          {error && (
            <View style={styles.errBox}>
              <Text style={styles.errText}>{error}</Text>
              <TouchableOpacity onPress={() => load()} style={styles.retry}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && profile && (
            <>
              <View style={styles.avatarRow}>
                <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} disabled={uploadingAvatar}>
                  {uploadingAvatar ? (
                    <ActivityIndicator style={styles.avatarLoader} />
                  ) : profile.avatarUrl ? (
                    <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitials}>{initials(profile.name)}</Text>
                    </View>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Text style={styles.avatarEditText}>Edit</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.avatarMeta}>
                  <Text style={styles.userName}>{profile.name}</Text>
                  <Text style={styles.username}>@{profile.username}</Text>
                  <Text style={styles.trust}>
                    Trust {profile.trustScore.toFixed(0)} · {profile.reputationPoints} pts
                  </Text>
                </View>
              </View>

              <Text style={styles.verifyBadge}>Verification: {verifyLabel}</Text>

              <Text style={styles.section}>Account</Text>
              <Text style={styles.label}>Display name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

              <Text style={styles.label}>Email</Text>
              <Text style={styles.readonly}>{profile.email}</Text>

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City or region" />

              <Text style={styles.section}>Home (optional)</Text>
              <Text style={styles.hint}>Used for safety radius and local alerts — never shown publicly as exact GPS.</Text>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={homeAddress}
                onChangeText={setHomeAddress}
                placeholder="Street, area"
                multiline
              />
              <View style={styles.row2}>
                <View style={styles.row2Item}>
                  <Text style={styles.label}>Home latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={homeLat}
                    onChangeText={setHomeLat}
                    placeholder="e.g. 6.52"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.row2Item}>
                  <Text style={styles.label}>Home longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={homeLng}
                    onChangeText={setHomeLng}
                    placeholder="e.g. 3.37"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.useCurrentBtn, gpsLoading && styles.useCurrentBtnDisabled]}
                disabled={gpsLoading || savingHome}
                activeOpacity={0.85}
                onPress={async () => {
                  setGpsLoading(true);
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== "granted") {
                      Alert.alert(
                        "Location permission",
                        "Allow location access to fill your home coordinates, or enter them manually."
                      );
                      return;
                    }
                    const pos = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.High,
                    });
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setHomeLat(lat.toFixed(6));
                    setHomeLng(lng.toFixed(6));
                  } catch {
                    Alert.alert("Location", "Could not fetch your current location. Try again.");
                  } finally {
                    setGpsLoading(false);
                  }
                }}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#1D4ED8" />
                ) : (
                  <Text style={styles.useCurrentText}>Use my current location</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveHomeBtn, (savingHome || gpsLoading) && styles.saveHomeBtnDisabled]}
                onPress={onSaveHomeLocation}
                disabled={savingHome || gpsLoading}
                activeOpacity={0.9}
              >
                {savingHome ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveHomeBtnText}>Save home location</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.section}>More</Text>
              <Text style={styles.label}>Occupation</Text>
              <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Occupation" />

              <Text style={styles.label}>Preferred language</Text>
              <TextInput
                style={styles.input}
                value={preferredLanguage}
                onChangeText={setPreferredLanguage}
                placeholder="e.g. en"
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save profile</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportsBtn}
                onPress={() => router.push("/(citizen)/my-reports")}
                activeOpacity={0.85}
              >
                <Text style={styles.reportsBtnText}>My reports →</Text>
                <Text style={styles.reportsBtnSub}>View all submissions with photos, location, and status</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 16 },
  centerRow: { paddingVertical: 24, alignItems: "center" },
  errBox: { marginBottom: 12 },
  errText: { color: "#B91C1C", fontSize: 14 },
  retry: { marginTop: 8, alignSelf: "flex-start" },
  retryText: { color: "#2563EB", fontWeight: "600" },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 16 },
  avatarWrap: { position: "relative" },
  avatarImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#E2E8F0" },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#fff" },
  avatarLoader: { width: 96, height: 96 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  avatarEditText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  avatarMeta: { flex: 1 },
  userName: { fontSize: 20, fontWeight: "700", color: "#111" },
  username: { fontSize: 13, color: "#64748B", marginTop: 2 },
  trust: { fontSize: 12, color: "#475569", marginTop: 6 },
  verifyBadge: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 20,
    backgroundColor: "#F1F5F9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  section: { fontSize: 16, fontWeight: "700", color: "#111", marginTop: 8, marginBottom: 10 },
  hint: { fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  readonly: {
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#64748B",
    backgroundColor: "#F8FAFC",
  },
  row2: { flexDirection: "row", gap: 12 },
  row2Item: { flex: 1 },
  useCurrentBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  useCurrentBtnDisabled: { opacity: 0.65 },
  useCurrentText: { fontSize: 13, fontWeight: "600", color: "#1D4ED8" },
  saveHomeBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#0F766E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 180,
    alignItems: "center",
  },
  saveHomeBtnDisabled: { opacity: 0.65 },
  saveHomeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  saveBtn: {
    marginTop: 24,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  reportsBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#EFF6FF",
  },
  reportsBtnText: { fontSize: 17, fontWeight: "700", color: "#1D4ED8" },
  reportsBtnSub: { fontSize: 12, color: "#64748B", marginTop: 6, lineHeight: 18 },
  signOut: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  signOutText: { fontSize: 16, fontWeight: "600", color: "#475569" },
});
