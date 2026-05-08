import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceActiveSos, resolvePoliceSos } from "../../src/auth/api";
import type { PoliceSosActiveItem } from "../../src/auth/types";

const POLL_INTERVAL_MS = 5000;

function elapsed(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}

// ── Pulsing red border animation ─────────────────────────────────────────────
function usePulse() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, []);
  return anim;
}

// ── Audio chunk player ────────────────────────────────────────────────────────
function AudioChunkItem({ url, index }: { url: string; index: number }) {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const toggle = async () => {
    if (playing) {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlaying(false);
    } else {
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      setPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) {
          setPlaying(false);
          soundRef.current = null;
        }
      });
    }
  };

  return (
    <TouchableOpacity style={styles.audioChunk} onPress={toggle} activeOpacity={0.7}>
      <Ionicons
        name={playing ? "stop-circle" : "play-circle"}
        size={22}
        color={playing ? "#EF4444" : "#94A3B8"}
      />
      <Text style={styles.audioChunkText}>Clip {index + 1}</Text>
    </TouchableOpacity>
  );
}

// ── Duress alert card ─────────────────────────────────────────────────────────
function DuressCard({ a, onResolve, resolving }: { a: PoliceSosActiveItem; onResolve: () => void; resolving: boolean }) {
  const pulseAnim = usePulse();
  const borderColor = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: ["#DC2626", "#FCA5A5"] });
  const lat = a.latestLocation?.latitude ?? a.latitude;
  const lng = a.latestLocation?.longitude ?? a.longitude;

  return (
    <Animated.View style={[styles.card, styles.duressCard, { borderColor }]}>
      {/* Duress header banner */}
      <View style={styles.duressBanner}>
        <Ionicons name="warning" size={16} color="#fff" />
        <Text style={styles.duressBannerText}>⚠ DURESS ACTIVE — HOSTAGE / COERCION CONFIRMED</Text>
      </View>

      {/* User info */}
      <View style={styles.cardHeader}>
        <View style={styles.userSection}>
          <View style={[styles.avatarPlaceholder, styles.duressAvatar]}>
            <Text style={styles.avatarInitials}>{a.user.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: "#FEF2F2" }]}>{a.user.name}</Text>
            {a.user.phone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${a.user.phone}`)}>
                <Text style={styles.cardPhone}>📞 {a.user.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {a.user.email ? (
              <Text style={styles.cardSubInfo}>✉ {a.user.email}</Text>
            ) : null}
            {a.user.occupation ? (
              <Text style={styles.cardSubInfo}>💼 {a.user.occupation}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Home address block */}
      {(a.user.homeAddress || a.user.homeLatitude) && (
        <TouchableOpacity
          style={styles.homeAddressBox}
          onPress={() => {
            if (a.user.homeLatitude && a.user.homeLongitude) {
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${a.user.homeLatitude},${a.user.homeLongitude}`
              ).catch(() => null);
            }
          }}
        >
          <Ionicons name="home" size={16} color="#FBBF24" />
          <View style={{ flex: 1 }}>
            <Text style={styles.homeAddressLabel}>HOME ADDRESS</Text>
            <Text style={styles.homeAddressText}>{a.user.homeAddress ?? "Tap to view on map"}</Text>
          </View>
          <Ionicons name="open-outline" size={14} color="#94A3B8" />
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.cardStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DURESS SINCE</Text>
          <Text style={[styles.statValue, { color: "#F87171" }]}>
            {a.duressActivatedAt ? elapsed(a.duressActivatedAt) : "—"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SOS STARTED</Text>
          <Text style={styles.statValue}>{elapsed(a.createdAt)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AUDIO CLIPS</Text>
          <Text style={styles.statValue}>{a.liveMediaLinks.length}</Text>
        </View>
      </View>

      {/* Audio chunks */}
      {a.liveMediaLinks.length > 0 && (
        <View style={styles.audioSection}>
          <Text style={styles.audioSectionTitle}>Live Audio Recordings</Text>
          <View style={styles.audioGrid}>
            {a.liveMediaLinks.map((url, i) => (
              <AudioChunkItem key={url} url={url} index={i} />
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.mapBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => null)}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.mapBtnText}>Live Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resolveBtn, resolving && styles.resolveDisabled]}
          onPress={onResolve}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.resolveBtnText}>Resolved</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Standard SOS card ─────────────────────────────────────────────────────────
function SosCard({ a, onResolve, resolving }: { a: PoliceSosActiveItem; onResolve: () => void; resolving: boolean }) {
  const lat = a.latestLocation?.latitude ?? a.latitude;
  const lng = a.latestLocation?.longitude ?? a.longitude;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{a.user.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{a.user.name}</Text>
            {a.user.phone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${a.user.phone}`)}>
                <Text style={styles.cardPhone}>{a.user.phone}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.cardPhone}>No contact info</Text>
            )}
          </View>
        </View>
        <View style={[styles.typeBadge, a.isSilent ? styles.silentBadge : styles.audibleBadge]}>
          <Ionicons name={a.isSilent ? "mic-off" : "volume-high"} size={12} color="#fff" />
          <Text style={styles.typeText}>{a.isSilent ? "SILENT" : "AUDIBLE"}</Text>
        </View>
      </View>

      {/* User extended info */}
      {(a.user.email || a.user.occupation) && (
        <View style={styles.extInfoRow}>
          {a.user.email ? <Text style={styles.cardSubInfo}>✉ {a.user.email}</Text> : null}
          {a.user.occupation ? <Text style={styles.cardSubInfo}>💼 {a.user.occupation}</Text> : null}
        </View>
      )}

      {/* Home address */}
      {(a.user.homeAddress || a.user.homeLatitude) && (
        <TouchableOpacity
          style={styles.homeAddressBox}
          onPress={() => {
            if (a.user.homeLatitude && a.user.homeLongitude) {
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${a.user.homeLatitude},${a.user.homeLongitude}`).catch(() => null);
            }
          }}
        >
          <Ionicons name="home" size={14} color="#64748B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.homeAddressLabel}>HOME</Text>
            <Text style={[styles.homeAddressText, { color: "#94A3B8" }]}>{a.user.homeAddress ?? "Tap to view"}</Text>
          </View>
          <Ionicons name="open-outline" size={13} color="#475569" />
        </TouchableOpacity>
      )}

      <View style={styles.cardStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>NOTIFIED</Text>
          <Text style={styles.statValue}>{a.notifiedCount} Contacts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME ELAPSED</Text>
          <Text style={styles.statValue}>{elapsed(a.createdAt)}</Text>
        </View>
        {a.liveMediaLinks.length > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AUDIO CLIPS</Text>
              <Text style={styles.statValue}>{a.liveMediaLinks.length}</Text>
            </View>
          </>
        )}
      </View>

      {a.liveMediaLinks.length > 0 && (
        <View style={styles.audioSection}>
          <Text style={styles.audioSectionTitle}>Audio Recordings</Text>
          <View style={styles.audioGrid}>
            {a.liveMediaLinks.map((url, i) => (
              <AudioChunkItem key={url} url={url} index={i} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.mapBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => null)}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.mapBtnText}>Intercept Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resolveBtn, resolving && styles.resolveDisabled]}
          onPress={onResolve}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.resolveBtnText}>Close Alert</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PoliceSosActiveScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PoliceSosActiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const { alerts: list } = await fetchPoliceActiveSos();
      setAlerts(list);
    } catch (e) {
      if (initial) setError(e instanceof Error ? e.message : "Could not load SOS list");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    pollRef.current = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  const onResolve = async (id: string) => {
    setResolving(id);
    try {
      await resolvePoliceSos(id);
      await load(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not resolve");
    } finally {
      setResolving(null);
    }
  };

  const duressAlerts = alerts.filter((a) => a.isDuressActive);
  const normalAlerts = alerts.filter((a) => !a.isDuressActive);

  return (
    <PoliceShell>
      <StatusBar style="light" />
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Emergency Center</Text>
            <View style={styles.alertBadge}>
              <View style={[styles.pulseDot, duressAlerts.length > 0 && styles.pulseDotDuress]} />
              <Text style={[styles.alertCount, duressAlerts.length > 0 && styles.alertCountDuress]}>
                {duressAlerts.length > 0
                  ? `${duressAlerts.length} DURESS • ${normalAlerts.length} SOS`
                  : `${alerts.length} ACTIVE SOS`}
              </Text>
            </View>
          </View>
          <Text style={styles.pollBadge}>Live · 5s</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.centerState}>
              <ActivityIndicator color="#EF4444" size="large" />
              <Text style={styles.stateText}>Scanning for distress signals…</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)}>
                <Text style={styles.retryText}>Retry Scan</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && alerts.length === 0 ? (
            <View style={styles.centerState}>
              <View style={styles.secureIconBox}>
                <Ionicons name="shield-checkmark" size={48} color="#10B981" />
              </View>
              <Text style={styles.stateText}>All residential areas secured.</Text>
              <Text style={styles.stateSubText}>No active SOS transmissions detected.</Text>
            </View>
          ) : null}

          {/* Duress cards first */}
          {duressAlerts.length > 0 && (
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={14} color="#EF4444" />
              <Text style={styles.sectionHeaderText}>DURESS / HOSTAGE SITUATIONS</Text>
            </View>
          )}
          {duressAlerts.map((a) => (
            <DuressCard
              key={a.id}
              a={a}
              onResolve={() => onResolve(a.id)}
              resolving={resolving === a.id}
            />
          ))}

          {/* Normal SOS cards */}
          {normalAlerts.length > 0 && duressAlerts.length > 0 && (
            <View style={styles.sectionHeader}>
              <View style={[styles.pulseDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.sectionHeaderText}>STANDARD SOS</Text>
            </View>
          )}
          {normalAlerts.map((a) => (
            <SosCard
              key={a.id}
              a={a}
              onResolve={() => onResolve(a.id)}
              resolving={resolving === a.id}
            />
          ))}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#334155",
    justifyContent: "center", alignItems: "center",
  },
  headerText: { alignItems: "center", flex: 1 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  alertBadge: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  pulseDotDuress: { backgroundColor: "#DC2626" },
  alertCount: { fontSize: 11, fontWeight: "800", color: "#EF4444", letterSpacing: 1 },
  alertCountDuress: { color: "#FCA5A5" },
  pollBadge: { fontSize: 10, color: "#475569", fontWeight: "700" },
  container: { padding: 20, paddingBottom: 40 },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 10, marginTop: 4,
  },
  sectionHeaderText: {
    fontSize: 10, fontWeight: "800", color: "#64748B", letterSpacing: 1.2,
  },

  centerState: { marginTop: 100, alignItems: "center", gap: 16 },
  secureIconBox: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: "#064E3B",
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  stateText: { fontSize: 16, fontWeight: "800", color: "#fff", textAlign: "center" },
  stateSubText: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
  errorBox: {
    backgroundColor: "#451A1A", borderRadius: 20, padding: 24,
    alignItems: "center", borderWidth: 1, borderColor: "#991B1B",
  },
  errorText: { color: "#FECACA", fontSize: 14, textAlign: "center", marginVertical: 12, fontWeight: "600" },
  retryBtn: { backgroundColor: "#EF4444", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: "#fff", fontWeight: "800" },

  // Cards
  card: {
    backgroundColor: "#1E293B", borderRadius: 24, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: "#334155",
  },
  duressCard: {
    backgroundColor: "#1A0505", borderWidth: 2,
  },
  duressBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#DC2626", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  duressBannerText: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5, flex: 1 },

  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  userSection: { flexDirection: "row", gap: 12, alignItems: "flex-start", flex: 1 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "#334155", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#475569",
  },
  duressAvatar: { backgroundColor: "#7F1D1D", borderColor: "#DC2626" },
  avatarInitials: { fontSize: 18, fontWeight: "800", color: "#F1F5F9" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  cardPhone: { fontSize: 13, color: "#60A5FA", marginTop: 2, fontWeight: "600" },
  cardSubInfo: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "500" },

  extInfoRow: { gap: 2, marginBottom: 12 },

  homeAddressBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#0F172A", borderRadius: 12, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: "#334155",
  },
  homeAddressLabel: { fontSize: 9, fontWeight: "800", color: "#64748B", letterSpacing: 1 },
  homeAddressText: { fontSize: 13, color: "#FBBF24", fontWeight: "600", marginTop: 1 },

  typeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  silentBadge: { backgroundColor: "#475569" },
  audibleBadge: { backgroundColor: "#EF4444" },
  typeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  cardStats: {
    flexDirection: "row", backgroundColor: "#0F172A", borderRadius: 16,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#334155",
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "#334155", marginHorizontal: 12 },
  statLabel: { fontSize: 9, fontWeight: "800", color: "#64748B", letterSpacing: 1, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: "800", color: "#F1F5F9" },

  audioSection: { marginBottom: 16 },
  audioSectionTitle: { fontSize: 10, fontWeight: "800", color: "#64748B", letterSpacing: 1, marginBottom: 8 },
  audioGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  audioChunk: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#0F172A", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#334155",
  },
  audioChunkText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },

  actionGrid: { flexDirection: "row", gap: 12 },
  mapBtn: {
    flex: 1.2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#1D4ED8", paddingVertical: 14, borderRadius: 16,
  },
  mapBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  resolveBtn: {
    flex: 0.8, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#059669", paddingVertical: 14, borderRadius: 16,
  },
  resolveDisabled: { opacity: 0.5 },
  resolveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
