import { useCallback, useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { useAuth } from "../../src/auth/AuthContext";
import { fetchOfficerProfile, updateOfficerProfile, uploadCrimeMediaFile } from "../../src/auth/api";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PoliceProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { setOfficerProfile } = useAppDataCache();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const {
    data: profile,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "officerProfile",
    async () => {
      const { profile: p } = await fetchOfficerProfile();
      await refreshUser().catch(() => {});
      return p;
    },
    setOfficerProfile
  );

  useEffect(() => {
    if (profile?.officerProfile?.currentLatitude) {
      setLatInput(profile.officerProfile.currentLatitude.toString());
    }
    if (profile?.officerProfile?.currentLongitude) {
      setLngInput(profile.officerProfile.currentLongitude.toString());
    }
  }, [profile]);

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
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const uploaded = await uploadCrimeMediaFile({
        uri: asset.uri,
        name: `avatar_${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
        folder: "avatars",
      });
      const res = await updateOfficerProfile({ avatarUrl: uploaded.url });
      setOfficerProfile(res.profile);
      await refreshUser();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveLocation = async () => {
    const la = parseFloat(latInput.trim());
    const lo = parseFloat(lngInput.trim());
    if (Number.isNaN(la) || Number.isNaN(lo)) {
      Alert.alert("Invalid Input", "Please enter valid coordinates.");
      return;
    }
    try {
      const res = await updateOfficerProfile({
        currentLatitude: la,
        currentLongitude: lo,
      });
      setOfficerProfile(res.profile);
      await refreshUser();
      Alert.alert("Success", "Patrol location updated.");
    } catch (e) {
      Alert.alert("Update failed", "Could not save location.");
    }
  };

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={revalidating} 
            onRefresh={refresh}
            tintColor="#1D4ED8"
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.headerCard}>
          <TouchableOpacity 
            style={styles.avatarWrapper} 
            onPress={pickAvatar}
            disabled={uploadingAvatar}
          >
            <View style={styles.avatarCircle}>
              {uploadingAvatar ? (
                <ActivityIndicator color="#fff" />
              ) : profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {profile?.name ? initials(profile.name) : "P"}
                </Text>
              )}
            </View>
            <View style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{profile?.name || "Officer"}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          <View style={styles.badgeTag}>
             <Ionicons name="shield" size={12} color="#1D4ED8" />
             <Text style={styles.badgeText}>Badge #{profile?.officerProfile?.badgeNumber || "—"}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duty Information</Text>
          <View style={styles.infoGrid}>
             <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Rank</Text>
                <Text style={styles.infoValue}>{profile?.officerProfile?.rank || "—"}</Text>
             </View>
             <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Precinct</Text>
                <Text style={styles.infoValue}>{profile?.officerProfile?.precinct || "—"}</Text>
             </View>
             <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{profile?.officerProfile?.department || "Police"}</Text>
             </View>
             <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: "#16A34A" }]}>
                  {profile?.officerProfile?.patrolStatus?.replace(/_/g, " ") || "ACTIVE"}
                </Text>
             </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patrol Coordinates</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={latInput}
                  onChangeText={setLatInput}
                  keyboardType="decimal-pad"
                  placeholder="0.0000"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={lngInput}
                  onChangeText={setLngInput}
                  keyboardType="decimal-pad"
                  placeholder="0.0000"
                />
              </View>
            </View>
            
            <View style={styles.locationActions}>
              <TouchableOpacity 
                style={styles.gpsBtn}
                onPress={async () => {
                  setGpsLoading(true);
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') return;
                    const pos = await Location.getCurrentPositionAsync({});
                    setLatInput(pos.coords.latitude.toString());
                    setLngInput(pos.coords.longitude.toString());
                  } finally {
                    setGpsLoading(false);
                  }
                }}
              >
                {gpsLoading ? <ActivityIndicator size="small" color="#1D4ED8" /> : (
                  <>
                    <Ionicons name="locate" size={16} color="#1D4ED8" />
                    <Text style={styles.gpsBtnText}>Use GPS</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLocation}>
                <Text style={styles.saveBtnText}>Update Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Account</Text>
           <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                 <View style={[styles.menuIcon, { backgroundColor: "#EFF6FF" }]}>
                   <Ionicons name="notifications" size={20} color="#1D4ED8" />
                 </View>
                 <Text style={styles.menuText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
           </TouchableOpacity>

           <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                 <View style={[styles.menuIcon, { backgroundColor: "#F0FDF4" }]}>
                   <Ionicons name="lock-closed" size={20} color="#16A34A" />
                 </View>
                 <Text style={styles.menuText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
           </TouchableOpacity>

           <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
              <Ionicons name="log-out" size={20} color="#DC2626" />
              <Text style={styles.signOutText}>Sign Out Account</Text>
           </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>v2.1.0 • Command Intelligence</Text>
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 60 },
  
  // Header Card
  headerCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#EFF6FF",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  userEmail: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  badgeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoBox: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },

  // Card / Inputs
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  locationActions: {
    flexDirection: "row",
    gap: 12,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
  },
  gpsBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    paddingRight: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },

  // Sign out
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#DC2626",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 32,
    fontWeight: "700",
  },
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