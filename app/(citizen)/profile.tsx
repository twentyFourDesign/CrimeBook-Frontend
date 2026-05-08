import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { Skeleton } from "../../src/components/common/Skeleton";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import {
  fetchCitizenProfile,
  fetchMyBadgesAndPoints,
  fetchPrivacySettings,
  updateCitizenProfile,
  updatePrivacySettings,
  uploadCrimeMediaFile,
  fetchMyInvites,
  respondToGroupInvite,
  fetchMyReports,
} from "../../src/auth/api";
import type { CitizenProfilePayload, UserBadgeEntry, GroupInvite, MyReportItem } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import { useTheme } from "../../src/theme/ThemeContext";
import { ThemeToggle } from "../../src/components/common/ThemeToggle";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();

  if (!user) return null;

  const { setCitizenProfile } = useAppDataCache();
  const { resetDraft } = useReportDraft();
  const { colors, isDark } = useTheme();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [userBadges, setUserBadges] = useState<UserBadgeEntry[]>([]);
  const [privacyAnonymous, setPrivacyAnonymous] = useState(false);
  const [privacyApproxLocation, setPrivacyApproxLocation] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [myReports, setMyReports] = useState<MyReportItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeLat, setHomeLat] = useState("");
  const [homeLng, setHomeLng] = useState("");
  const [occupation, setOccupation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const applyProfileToForm = useCallback((p: CitizenProfilePayload) => {
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

  const {
    data: profile,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "citizenProfile",
    async () => {
      const [{ profile: p }, badgesRes, privRes, invitesRes, reportsRes] = await Promise.all([
        fetchCitizenProfile(),
        fetchMyBadgesAndPoints().catch(() => ({ userBadges: [], reputationPoints: 0 })),
        fetchPrivacySettings().catch(() => null),
        fetchMyInvites().catch(() => ({ invites: [] })),
        fetchMyReports().catch(() => ({ reports: [] })),
      ]);

      // Side effects for non-cached states (UI only)
      setUserBadges(badgesRes.userBadges);
      if (privRes?.settings) {
        setPrivacyAnonymous(privRes.settings.defaultAnonymousReporting);
        setPrivacyApproxLocation(privRes.settings.locationPrecision === "approximate");
      }
      setInvites(invitesRes.invites);
      setMyReports(reportsRes.reports);
      applyProfileToForm(p);
      refreshUser().catch(() => { });

      return p;
    },
    setCitizenProfile
  );

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
        <Modal
          visible={isMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <Pressable style={[styles.menuOverlay, { backgroundColor: "rgba(0,0,0,0.05)" }]} onPress={() => setIsMenuOpen(false)}>
            <View style={styles.menuContent}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Account</Text>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(citizen)/my-reports"); }}>
                <Ionicons name="document-text-outline" size={20} color="#64748B" />
                <Text style={styles.menuItemText}>My Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(citizen)/community"); }}>
                <Ionicons name="people-outline" size={20} color="#64748B" />
                <Text style={styles.menuItemText}>Community Groups</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  router.push("/(citizen)/sos?setupPins=1");
                }}
              >
                <Ionicons name="key-outline" size={20} color="#2563EB" />
                <Text style={[styles.menuItemText, { color: "#2563EB" }]}>Reset SOS PINs</Text>
              </TouchableOpacity>

              {user?.identityVerificationStatus !== "approved" && (
                <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(auth)/verification"); }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#2563EB" />
                  <Text style={[styles.menuItemText, { color: "#2563EB" }]}>Identity Verification</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  resetDraft();
                  router.push("/(citizen)/report-step1");
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#059669" />
                <Text style={[styles.menuItemText, { color: "#059669" }]}>Create Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  router.push("/(citizen)/invites");
                }}
              >
                <Ionicons name="people-outline" size={20} color="#1E293B" />
                <Text style={styles.menuItemText}>Group Invites</Text>
                {invites.some(i => i.status === "PENDING" || !i.status) && (
                  <View style={styles.menuBadge} />
                )}
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={async () => { 
                setIsMenuOpen(false); 
                await signOut();
                router.replace("/(auth)/login");
              }}>
                <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
                <Text style={[styles.menuItemText, { color: "#B91C1C" }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={revalidating} onRefresh={refresh} tintColor={colors.accent} />}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
            <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.menuBtn}>
              <View style={{ position: "relative" }}>
                <Ionicons name="menu-outline" size={28} color={colors.text} />
                {invites.some(i => i.status === "PENDING" || !i.status) && (
                  <View style={styles.menuBadgeFloating} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={{ gap: 20 }}>
              <View style={styles.avatarRow}>
                <Skeleton width={96} height={96} circle />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="60%" height={20} />
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="50%" height={12} />
                </View>
              </View>
              <Skeleton width="40%" height={24} borderRadius={8} />
              {[1, 2].map((i) => (
                <View key={i} style={{ gap: 10 }}>
                  <Skeleton width="30%" height={16} />
                  <Skeleton width="100%" height={40} borderRadius={12} />
                </View>
              ))}
            </View>
          )}

          {error && (
            <View style={styles.errBox}>
              <Text style={styles.errText}>{error}</Text>
              <TouchableOpacity onPress={refresh} style={styles.retry}>
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
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{profile.name}</Text>
                    {user?.identityVerificationStatus === "approved" && (
                      <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.username}>@{profile.username}</Text>
                  {user?.identityVerificationStatus !== "approved" ? (
                    <Text style={[styles.miniStatus, user?.identityVerificationStatus === "pending" && styles.miniStatusPending]}>
                      {user?.identityVerificationStatus === "pending" ? "• Verification in progress" : "• Not Verified"}
                    </Text>
                  ) : (
                    <Text style={styles.miniStatusVerified}> Verified Citizen</Text>
                  )}
                  <View style={styles.scoreRow}>
                    <View style={styles.scoreChip}>
                      <Ionicons name="shield-outline" size={12} color="#475569" />
                      <Text style={styles.scoreText}>Trust {profile.trustScore.toFixed(0)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.scoreChip, { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }]}
                      onPress={() => router.push("/achievement-vault")}
                    >
                      <Ionicons name="flash-outline" size={12} color="#0369A1" />
                      <Text style={[styles.scoreText, { color: "#0369A1" }]}>{profile.reputationPoints} pts</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Subtle Verification logic moved to miniStatus */}

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.section}>Recent Reports</Text>
                <TouchableOpacity onPress={() => router.push("/(citizen)/my-reports")}>
                  <Text style={styles.viewAllBtn}>View all</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reportsScroll}
                style={styles.reportsScrollContainer}
              >
                {loading ? (
                  [1, 2].map((i) => <View key={i} style={styles.reportCardSkeleton}><Skeleton width={140} height={100} borderRadius={12} /></View>)
                ) : myReports.length === 0 ? (
                  <View style={styles.emptyReportCard}>
                    <Text style={styles.emptyReportText}>No reports yet</Text>
                  </View>
                ) : (
                  myReports.slice(0, 5).map((rep) => (
                    <TouchableOpacity
                      key={rep.id}
                      style={styles.reportCard}
                      onPress={() => router.push(`/(citizen)/report-detail/${rep.id}`)}
                    >
                      <View style={[styles.reportStatusDot, { backgroundColor: rep.status === "RESOLVED" ? "#16A34A" : "#F59E0B" }]} />
                      <Text style={styles.reportCardCategory} numberOfLines={1}>{rep.crimeCategory}</Text>
                      <Text style={styles.reportCardTitle} numberOfLines={2}>{rep.title || rep.description}</Text>
                      <Text style={styles.reportCardDate}>{new Date(rep.createdAt).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.section}>Achievement Vault</Text>
                <View style={styles.badgeCountBadge}>
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
                  <View style={styles.emptyBadgeCard}>
                    <Ionicons name="lock-closed-outline" size={24} color="#CBD5E1" />
                    <Text style={styles.emptyBadgeText}>No badges yet</Text>
                  </View>
                ) : (
                  userBadges.map((ub) => (
                    <View key={ub.id} style={styles.achievementCard}>
                      <View style={styles.badgeIconBg}>
                        <Ionicons name={ub.badge.iconUrl as any || "ribbon-outline"} size={28} color="#2563EB" />
                      </View>
                      <Text style={styles.badgeName} numberOfLines={1}>{ub.badge.name}</Text>
                      <Text style={styles.badgeDesc} numberOfLines={2}>{ub.badge.description}</Text>
                      <View style={styles.badgePointsPill}>
                        <Text style={styles.badgePointsText}>+{ub.badge.pointsValue} XP</Text>
                      </View>
                    </View>
                  ))
                )}
                {userBadges.length >= 0 && (
                  <TouchableOpacity style={styles.earnMoreCard} onPress={() => router.push("/achievement-vault")}>
                    <Ionicons name="add-circle-outline" size={24} color="#64748B" />
                    <Text style={styles.earnMoreText}>Earn More</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Group Invites moved to its own screen */}

              <Text style={styles.section}>Privacy defaults</Text>
              <Text style={styles.privacyHint}>
                Applied when you submit reports (you can still override in the form when available).
              </Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Default anonymous reporting</Text>
                <Switch
                  value={privacyAnonymous}
                  onValueChange={async (v) => {
                    setPrivacyAnonymous(v);
                    try {
                      setPrivacyLoading(true);
                      await updatePrivacySettings({ defaultAnonymousReporting: v });
                    } catch (e) {
                      setPrivacyAnonymous(!v);
                      Alert.alert("Error", e instanceof Error ? e.message : "Could not save");
                    } finally {
                      setPrivacyLoading(false);
                    }
                  }}
                  disabled={privacyLoading}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Approximate location precision</Text>
                <Switch
                  value={privacyApproxLocation}
                  onValueChange={async (v) => {
                    setPrivacyApproxLocation(v);
                    try {
                      setPrivacyLoading(true);
                      await updatePrivacySettings({
                        locationPrecision: v ? "approximate" : "exact",
                      });
                    } catch (e) {
                      setPrivacyApproxLocation(!v);
                      Alert.alert("Error", e instanceof Error ? e.message : "Could not save");
                    } finally {
                      setPrivacyLoading(false);
                    }
                  }}
                  disabled={privacyLoading}
                />
              </View>

              <Text style={[styles.section, { color: colors.text }]}>Account</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Display name</Text>
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textTertiary} />

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

              <Text style={[styles.section, { color: colors.text }]}>Appearance</Text>
              <View style={[styles.reportCard, { width: "100%", marginBottom: 20, backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? "#1F1F1F" : "#F3F0FF", justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={isDark ? colors.accent : "#F59E0B"} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Dark Mode</Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary }}>{isDark ? "Uber-style Dark" : "Classic Light"}</Text>
                    </View>
                  </View>
                  <ThemeToggle />
                </View>
              </View>

              <Text style={[styles.section, { color: colors.text }]}>More</Text>

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

            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  menuBtn: {
    padding: 4,
  },
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
  scoreRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  scoreChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scoreText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  nameRow: { flexDirection: "row", alignItems: "center" },

  miniStatus: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  miniStatusPending: {
    color: "#D97706",
  },
  miniStatusVerified: {
    fontSize: 11,
    color: "#16A34A",
    marginTop: 2,
    fontWeight: "600",
  },

  section: { fontSize: 16, fontWeight: "700", color: "#111", marginTop: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  viewAllBtn: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  reportsScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reportsScroll: {
    paddingRight: 40,
    gap: 12,
  },
  reportCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  reportCardSkeleton: { width: 140, marginRight: 12 },
  reportStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  reportCardCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  reportCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    height: 36,
    lineHeight: 18,
  },
  reportCardDate: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 8,
  },
  emptyReportCard: {
    width: 160,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyReportText: {
    fontSize: 12,
    color: "#94A3B8",
  },

  privacyHint: { fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 18 },
  badgesScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  badgesScroll: {
    paddingRight: 40,
    gap: 12,
    paddingVertical: 8,
  },
  achievementCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 14,
    height: 28,
  },
  badgePointsPill: {
    marginTop: 10,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePointsText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#16A34A",
  },
  emptyBadgeCard: {
    width: 140,
    height: 140,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyBadgeText: { fontSize: 11, color: "#94A3B8", marginTop: 8 },
  earnMoreCard: {
    width: 100,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  earnMoreText: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  badgeCountBadge: {
    backgroundColor: "#2563EB",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  switchLabel: { flex: 1, fontSize: 14, color: "#111", fontWeight: "600" },
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

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContent: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  menuBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    marginLeft: "auto",
  },
  menuBadgeFloating: {
    position: "absolute",
    top: 2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#fff",
  },
  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteInfo: { flex: 1 },
  inviteGroupName: { fontSize: 15, fontWeight: "700", color: "#111" },
  inviteMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  inviteActions: { flexDirection: "row", gap: 8 },
  declineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  declineText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  acceptText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
