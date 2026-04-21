import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { router, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { useAuth } from "../../src/auth/AuthContext";
import { fetchOfficerProfile, updateOfficerProfile, uploadCrimeMediaFile, fetchMyBadgesAndPoints } from "../../src/auth/api";
import { UserBadgeEntry } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import { useTheme } from "../../src/theme/ThemeContext";
import { ThemeToggle } from "../../src/components/common/ThemeToggle";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PoliceProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { setOfficerProfile } = useAppDataCache();
  const { colors, animValue, isDark } = useTheme();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userBadges, setUserBadges] = useState<UserBadgeEntry[]>([]);

  const { data: profile, loading, revalidating, error, refresh } = useCachedData(
    "officerProfile",
    async () => { 
      const [{ profile: p }, badgesRes] = await Promise.all([
        fetchOfficerProfile(),
        fetchMyBadgesAndPoints().catch(() => ({ userBadges: [] }))
      ]);
      setUserBadges(badgesRes.userBadges);
      await refreshUser().catch(() => { }); 
      return p; 
    },
    setOfficerProfile
  );

  useEffect(() => {
    if (profile?.officerProfile?.currentLatitude) setLatInput(profile.officerProfile.currentLatitude.toString());
    if (profile?.officerProfile?.currentLongitude) setLngInput(profile.officerProfile.currentLongitude.toString());
  }, [profile]);

  const pickAvatar = async () => {
    if (!profile) return;
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) { Alert.alert("Permission needed", "Photo library access is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const uploaded = await uploadCrimeMediaFile({ uri: asset.uri, name: `avatar_${Date.now()}.jpg`, mimeType: asset.mimeType || "image/jpeg", folder: "avatars" });
      const res = await updateOfficerProfile({ avatarUrl: uploaded.url });
      setOfficerProfile(res.profile);
      await refreshUser();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally { setUploadingAvatar(false); }
  };

  const handleSaveLocation = async () => {
    const la = parseFloat(latInput.trim()); const lo = parseFloat(lngInput.trim());
    if (Number.isNaN(la) || Number.isNaN(lo)) { Alert.alert("Invalid Input", "Please enter valid coordinates."); return; }
    try {
      const res = await updateOfficerProfile({ currentLatitude: la, currentLongitude: lo });
      setOfficerProfile(res.profile); await refreshUser();
      Alert.alert("Success", "Patrol location updated.");
    } catch { Alert.alert("Update failed", "Could not save location."); }
  };

  // Animated theme values
  const animBg = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F8FAFF", "#000000"] });
  const animSurface = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#FFFFFF", "#141414"] });
  const animBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F1F5F9", "#2A2A2A"] });
  const animInput = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#F8FAFF", "#1F1F1F"] });
  const animInputBorder = animValue.interpolate({ inputRange: [0, 1], outputRange: ["#E2E8F0", "#2A2A2A"] });

  return (
    <PoliceShell>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: animBg }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} tintColor={colors.accent} />}
      >
        {/* Profile Card */}
        <Animated.View style={[styles.headerCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} disabled={uploadingAvatar}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
              {uploadingAvatar ? <ActivityIndicator color="#fff" /> :
                profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> :
                  <Text style={styles.avatarInitial}>{profile?.name ? initials(profile.name) : "P"}</Text>}
            </View>
            <View style={[styles.editAvatarBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>{profile?.name || "Officer"}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{profile?.email}</Text>
          <View style={[styles.badgeTag, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="shield" size={12} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.accent }]}>Badge #{profile?.officerProfile?.badgeNumber || "—"}</Text>
          </View>
        </Animated.View>

        {/* Achievement Vault */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: 0 }]}>Achievement Vault</Text>
          <View style={[styles.badgeCountBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeCountText}>{userBadges.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesScroll}
          style={styles.badgesScrollContainer}
        >
          {userBadges.length === 0 ? (
            <Animated.View style={[styles.emptyBadgeCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.textTertiary} />
              <Text style={[styles.emptyBadgeText, { color: colors.textTertiary }]}>No badges yet</Text>
            </Animated.View>
          ) : (
            userBadges.map((ub) => (
              <Animated.View key={ub.id} style={[styles.achievementCard, { backgroundColor: animSurface, borderColor: animBorder }]}>
                <View style={[styles.badgeIconBg, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name={(ub.badge.iconUrl as any) || "ribbon-outline"} size={28} color={colors.accent} />
                </View>
                <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>{ub.badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>{ub.badge.description}</Text>
                <View style={[styles.badgePointsPill, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.badgePointsText, { color: colors.success }]}>+{ub.badge.pointsValue} XP</Text>
                </View>
              </Animated.View>
            ))
          )}
          <TouchableOpacity 
            style={[styles.earnMoreCard, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]} 
            onPress={() => router.push("/achievement-vault")}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.earnMoreText, { color: colors.textSecondary }]}>Earn More</Text>
          </TouchableOpacity>
        </ScrollView>


        {/* ── Duty Info ── */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Duty Information</Text>
        <View style={styles.infoGrid}>
          {[
            { label: "Rank", value: profile?.officerProfile?.rank || "—" },
            { label: "Precinct", value: profile?.officerProfile?.precinct || "—" },
            { label: "Department", value: profile?.officerProfile?.department || "Police" },
            { label: "Status", value: profile?.officerProfile?.patrolStatus?.replace(/_/g, " ") || "ACTIVE", color: colors.success },
          ].map(({ label, value, color }) => (
            <Animated.View key={label} style={[styles.infoBox, { backgroundColor: animSurface, borderColor: animBorder }]}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
              <Text style={[styles.infoValue, { color: color ?? colors.text }]}>{value}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ── Location ── */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Patrol Coordinates</Text>
        <Animated.View style={[styles.card, { backgroundColor: animSurface, borderColor: animBorder }]}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Latitude</Text>
              <Animated.View style={[styles.inputWrap, { backgroundColor: animInput, borderColor: animInputBorder }]}>
                <TextInput style={[styles.input, { color: colors.text }]} value={latInput} onChangeText={setLatInput} keyboardType="decimal-pad" placeholder="0.0000" placeholderTextColor={colors.textTertiary} />
              </Animated.View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Longitude</Text>
              <Animated.View style={[styles.inputWrap, { backgroundColor: animInput, borderColor: animInputBorder }]}>
                <TextInput style={[styles.input, { color: colors.text }]} value={lngInput} onChangeText={setLngInput} keyboardType="decimal-pad" placeholder="0.0000" placeholderTextColor={colors.textTertiary} />
              </Animated.View>
            </View>
          </View>
          <View style={styles.locationActions}>
            <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}
              onPress={async () => {
                setGpsLoading(true);
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") return;
                  const pos = await Location.getCurrentPositionAsync({});
                  setLatInput(pos.coords.latitude.toString());
                  setLngInput(pos.coords.longitude.toString());
                } finally { setGpsLoading(false); }
              }}>
              {gpsLoading ? <ActivityIndicator size="small" color={colors.accent} /> : (
                <><Ionicons name="locate" size={16} color={colors.accent} /><Text style={[styles.gpsBtnText, { color: colors.accent }]}>Use GPS</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSaveLocation}>
              <Text style={styles.saveBtnText}>Update Location</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Account ── */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Account</Text>
        <Animated.View style={[styles.card, { backgroundColor: animSurface, borderColor: animBorder }]}>
          {[
            { icon: "notifications", label: "Notifications", iconBg: colors.accentSoft, iconColor: colors.accent },
            { icon: "lock-closed", label: "Privacy & Security", iconBg: isDark ? "#0A2010" : "#F0FDF4", iconColor: colors.success },
          ].map(({ icon, label, iconBg, iconColor }, i) => (
            <TouchableOpacity key={label} style={[styles.menuRow, i === 0 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
                  <Ionicons name={icon as any} size={20} color={iconColor} />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.borderStrong} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Appearance ── */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Appearance</Text>
        <Animated.View style={[styles.card, { backgroundColor: animSurface, borderColor: animBorder }]}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? "#1F1F1F" : "#F3F0FF" }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? "#276EF1" : "#F59E0B"} />
              </View>
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary }]}>{isDark ? "On" : "Off"}</Text>
              </View>
            </View>
            <ThemeToggle />
          </View>
        </Animated.View>

        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: isDark ? "#200805" : "#FEF2F2", borderColor: isDark ? "#3A1008" : "#FEE2E2" }]} onPress={() => signOut()}>
          <Ionicons name="log-out" size={20} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textTertiary }]}>v2.1.0 • Command Intelligence</Text>
      </Animated.ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 60 },
  headerCard: { alignItems: "center", borderRadius: 20, padding: 24, marginBottom: 28, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontSize: 36, fontWeight: "800", color: "#fff" },
  editAvatarBtn: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  userName: { fontSize: 20, fontWeight: "800" },
  userEmail: { fontSize: 13, marginTop: 4 },
  badgeTag: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  sectionTitle: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2, marginTop: 4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  infoBox: { width: "48%", borderRadius: 14, padding: 14, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: "800" },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuText: { fontSize: 15, fontWeight: "600" },
  menuSub: { fontSize: 11, marginTop: 1 },
  inputRow: { flexDirection: "row", gap: 12, padding: 16, paddingBottom: 0 },
  inputContainer: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  inputWrap: { borderRadius: 10, borderWidth: 1 },
  input: { padding: 12, fontSize: 14, fontWeight: "700" },
  locationActions: { flexDirection: "row", gap: 12, padding: 16 },
  gpsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  gpsBtnText: { fontSize: 14, fontWeight: "700" },
  saveBtn: { flex: 1, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingVertical: 12 },
  saveBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 15, marginBottom: 16, borderWidth: 1 },
  signOutText: { fontSize: 15, fontWeight: "800" },
  versionText: { textAlign: "center", fontSize: 12, marginTop: 8, fontWeight: "600" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 2 },
  badgeCountBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, justifyContent: "center", alignItems: "center" },
  badgeCountText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  badgesScrollContainer: { marginBottom: 24, marginHorizontal: -20 },
  badgesScroll: { paddingHorizontal: 20, gap: 12 },
  achievementCard: { width: 150, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  badgeIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  badgeName: { fontSize: 13, fontWeight: "700", marginBottom: 4, textAlign: "center" },
  badgeDesc: { fontSize: 11, textAlign: "center", lineHeight: 14, marginBottom: 8 },
  badgePointsPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgePointsText: { fontSize: 10, fontWeight: "800" },
  emptyBadgeCard: { width: 150, padding: 24, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", justifyContent: "center", alignItems: "center", gap: 8 },
  emptyBadgeText: { fontSize: 12, fontWeight: "600" },
  earnMoreCard: { width: 120, padding: 16, borderRadius: 16, justifyContent: "center", alignItems: "center", gap: 8, borderStyle: "dashed", borderWidth: 1, borderColor: "#cbd5e1" },
  earnMoreText: { fontSize: 13, fontWeight: "700" },
});