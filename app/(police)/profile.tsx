import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { useAuth } from "../../src/auth/AuthContext";
import { fetchOfficerProfile, updateOfficerProfile, uploadCrimeMediaFile } from "../../src/auth/api";
import type { OfficerProfilePayload } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PoliceProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { officerProfile, setOfficerProfile } = useAppDataCache();
  const cacheRef = useRef(officerProfile);
  cacheRef.current = officerProfile;
  const [profile, setProfile] = useState<OfficerProfilePayload | null>(() => officerProfile);
  const [loading, setLoading] = useState(() => officerProfile === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const load = useCallback(
    async (mode?: "refresh") => {
      setError(null);
      if (mode === "refresh") setRefreshing(true);
      else if (cacheRef.current === null) setLoading(true);
      try {
        const { profile: p } = await fetchOfficerProfile();
        setOfficerProfile(p);
        setProfile(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load profile");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setOfficerProfile]
  );

  useEffect(() => {
    if (user) {
      load();
    }
  }, [load, user]);

  const pickAvatar = async () => {
    if (!profile) return;

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
      const res = await updateOfficerProfile({ avatarUrl: uploaded.url });
      setOfficerProfile(res.profile);
      setProfile(res.profile);
      await refreshUser();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.wrap}
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
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.email}>{profile.email}</Text>
                {profile.officerProfile.badgeNumber ? (
                  <Text style={styles.badgeLine}>
                    Badge <Text style={styles.badgeMono}>{profile.officerProfile.badgeNumber}</Text>
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Account status</Text>
              {user && (
                <>
                  <Text style={styles.statusLine}>Role: {user.role.replace(/_/g, " ")}</Text>
                  <Text style={styles.statusLine}>
                    Police approval:{" "}
                    {user.role === "POLICE_OFFICER" || user.role === "POLICE_COMMAND"
                      ? "Approved"
                      : user.role.replace(/_/g, " ")}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Officer details</Text>
              <Text style={styles.detailsLine}>Rank: {profile.officerProfile.rank}</Text>
              <Text style={styles.detailsLine}>Department: {profile.officerProfile.department}</Text>
              <Text style={styles.detailsLine}>Precinct: {profile.officerProfile.precinct}</Text>
              {profile.officerProfile.unitCode ? (
                <Text style={styles.detailsLine}>Unit: {profile.officerProfile.unitCode}</Text>
              ) : null}
              <Text style={styles.detailsLine}>
                Patrol status: {profile.officerProfile.patrolStatus.replace(/_/g, " ")}
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Contact</Text>
              <Text style={styles.detailsLine}>Phone: {profile.phone || "—"}</Text>
              <Text style={styles.detailsLine}>City: {profile.city || "—"}</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Patrol location (for distance)</Text>
              <Text style={styles.detailsLine}>
                Current:{" "}
                {profile.officerProfile.currentLatitude != null &&
                profile.officerProfile.currentLongitude != null
                  ? `${profile.officerProfile.currentLatitude.toFixed(5)}, ${profile.officerProfile.currentLongitude.toFixed(5)}`
                  : "not set"}
              </Text>
              <Text style={styles.detailsLine}>
                Use Google Maps to pick your on-duty location and paste the coordinates here.
              </Text>
              <TouchableOpacity
                style={[styles.coordUseCurrentBtn, gpsLoading && styles.coordUseCurrentBtnDisabled]}
                disabled={gpsLoading}
                onPress={async () => {
                  setGpsLoading(true);
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== "granted") {
                      Alert.alert(
                        "Location permission",
                        "Allow location access to fetch your patrol coordinates, or enter them manually."
                      );
                      return;
                    }
                    const pos = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.High,
                    });
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLatInput(lat.toString());
                    setLngInput(lng.toString());
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
                  <Text style={styles.coordUseCurrentText}>Use my current location</Text>
                )}
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coordLabel}>Latitude</Text>
                  <TextInput
                    style={styles.coordInput}
                    placeholder="e.g. 12.9716"
                    placeholderTextColor="#9CA3AF"
                    value={latInput}
                    onChangeText={setLatInput}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coordLabel}>Longitude</Text>
                  <TextInput
                    style={styles.coordInput}
                    placeholder="e.g. 77.5946"
                    placeholderTextColor="#9CA3AF"
                    value={lngInput}
                    onChangeText={setLngInput}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.coordSaveBtn}
                onPress={async () => {
                  const la = parseFloat(latInput.trim());
                  const lo = parseFloat(lngInput.trim());
                  if (Number.isNaN(la) || Number.isNaN(lo)) {
                    Alert.alert("Location", "Enter valid latitude and longitude.");
                    return;
                  }
                  try {
                    const res = await updateOfficerProfile({
                      currentLatitude: la,
                      currentLongitude: lo,
                    });
                    setOfficerProfile(res.profile);
                    setProfile(res.profile);
                    await refreshUser();
                    Alert.alert("Updated", "Patrol location saved.");
                  } catch (e) {
                    Alert.alert("Update failed", e instanceof Error ? e.message : "Try again.");
                  }
                }}
              >
                <Text style={styles.coordSaveText}>Save patrol location</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.signOut} onPress={() => signOut()} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 20 },
  centerRow: { paddingVertical: 24, alignItems: "center" },
  errBox: { marginBottom: 12 },
  errText: { color: "#B91C1C", fontSize: 14 },
  retry: { marginTop: 8, alignSelf: "flex-start" },
  retryText: { color: "#2563EB", fontWeight: "600" },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 16 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },
  avatarInitials: { fontSize: 26, fontWeight: "700", color: "#fff" },
  avatarLoader: { width: 80, height: 80 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  avatarEditText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  avatarMeta: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", color: "#111" },
  email: { fontSize: 14, color: "#64748B", marginTop: 4 },
  badgeLine: { fontSize: 13, color: "#1D4ED8", marginTop: 8 },
  badgeMono: { fontFamily: "Menlo", fontWeight: "700" },
  statusCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 16,
  },
  statusTitle: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 4 },
  statusLine: { fontSize: 12, color: "#475569" },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 16,
  },
  detailsTitle: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 6 },
  detailsLine: { fontSize: 12, color: "#475569", marginTop: 2 },
  coordLabel: { fontSize: 11, color: "#6B7280", marginBottom: 4, marginTop: 4 },
  coordInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  coordSaveBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  coordSaveText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  coordUseCurrentBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  coordUseCurrentBtnDisabled: {
    opacity: 0.7,
  },
  coordUseCurrentText: { fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
  signOut: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});


// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';

// const menuItems = [
//   { icon: '⚙️', label: 'Department Settings' },
//   { icon: '📊', label: 'Performance Report' },
//   { icon: '📁', label: 'Case History' },
// ];

// export default function Profile() {
//   const router = useRouter();

//   return (
//     <View style={styles.wrapper}>
//       <StatusBar style="dark" />
//       <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

//         {/* Avatar & Name */}
//         <View style={styles.profileTop}>
//           <View style={styles.avatarCircle}>
//             <Text style={styles.avatarIcon}>⚙️</Text>
//             <View style={styles.verifiedBadge}><Text style={styles.verifiedCheck}>✓</Text></View>
//           </View>
//           <Text style={styles.officerName}>Officer James</Text>
//           <View style={styles.verifiedRow}>
//             <Text style={styles.verifiedText}>✓ Verified officer</Text>
//           </View>
//         </View>

//         {/* Info Grid */}
//         <View style={styles.infoGrid}>
//           {[
//             { label: 'Badge Number', value: '#48291' },
//             { label: 'Department', value: 'Metro City PD' },
//             { label: 'Rank', value: 'Senior Officer' },
//             { label: 'Years of Service', value: '8 Years' },
//           ].map((item, i) => (
//             <View key={i} style={styles.infoItem}>
//               <Text style={styles.infoLabel}>{item.label}</Text>
//               <Text style={styles.infoValue}>{item.value}</Text>
//             </View>
//           ))}
//         </View>

//         {/* Stats */}
//         <View style={styles.statsRow}>
//           {[
//             { value: '47', label: 'Cases Handled' },
//             { value: '4', label: 'Active Cases' },
//             { value: '94%', label: 'Response Rate' },
//             { value: '8 min', label: 'Avg Response' },
//           ].map((s, i) => (
//             <View key={i} style={styles.statCard}>
//               <Text style={styles.statValue}>{s.value}</Text>
//               <Text style={styles.statLabel}>{s.label}</Text>
//             </View>
//           ))}
//         </View>

//         {/* Menu Items */}
//         {menuItems.map((item, i) => (
//           <TouchableOpacity key={i} style={styles.menuItem}>
//             <View style={styles.menuLeft}>
//               <Text style={styles.menuIcon}>{item.icon}</Text>
//               <Text style={styles.menuLabel}>{item.label}</Text>
//             </View>
//             <Text style={styles.menuChevron}>›</Text>
//           </TouchableOpacity>
//         ))}

//         {/* Sign Out */}
//         <TouchableOpacity style={styles.signOutBtn} onPress={() => router.replace('/(auth)/login')}>
//           <Text style={styles.signOutText}>→ Sign Out</Text>
//         </TouchableOpacity>

//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { flex: 1, backgroundColor: '#F8FAFF' },
//   container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
//   profileTop: { alignItems: 'center', marginBottom: 24 },
//   avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#BFDBFE' },
//   avatarIcon: { fontSize: 42 },
//   verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
//   verifiedCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
//   officerName: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 4 },
//   verifiedRow: { flexDirection: 'row', alignItems: 'center' },
//   verifiedText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
//   infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   infoItem: { width: '50%', padding: 12 },
//   infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
//   infoValue: { fontSize: 13, fontWeight: '700', color: '#111' },
//   statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
//   statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   statValue: { fontSize: 16, fontWeight: '700', color: '#111' },
//   statLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },
//   menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
//   menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   menuIcon: { fontSize: 18 },
//   menuLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
//   menuChevron: { fontSize: 20, color: '#CBD5E1' },
//   signOutBtn: { marginTop: 8, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
//   signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
// });