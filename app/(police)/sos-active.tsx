import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceActiveSos, resolvePoliceSos } from "../../src/auth/api";
import type { PoliceSosActiveItem } from "../../src/auth/types";

export default function PoliceSosActiveScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PoliceSosActiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async (mode?: "refresh") => {
    setError(null);
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    try {
      const { alerts: list } = await fetchPoliceActiveSos();
      setAlerts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load SOS list");
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openMaps = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => null);
  };

  const onResolve = async (id: string) => {
    setResolving(id);
    try {
      await resolvePoliceSos(id);
      await load("refresh");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not resolve");
    } finally {
      setResolving(null);
    }
  };

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
               <View style={styles.pulseDot} />
               <Text style={styles.alertCount}>{alerts.length} ACTIVE SOS</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => load("refresh")} disabled={refreshing}>
             <Ionicons name="refresh" size={20} color={refreshing ? "#4B5563" : "#fff"} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => load("refresh")} 
              tintColor="#EF4444" 
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading && !refreshing && (
            <View style={styles.centerState}>
              <ActivityIndicator color="#EF4444" size="large" />
              <Text style={styles.stateText}>Scanning for distress signals...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
               <Ionicons name="warning" size={24} color="#EF4444" />
               <Text style={styles.errorText}>{error}</Text>
               <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
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

          {!loading &&
            alerts.map((a) => {
              const lat = a.latestLocation?.latitude ?? a.latitude;
              const lng = a.latestLocation?.longitude ?? a.longitude;
              return (
                <View key={a.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.userSection}>
                       <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitials}>{a.user.name[0]}</Text>
                       </View>
                       <View>
                          <Text style={styles.cardTitle}>{a.user.name}</Text>
                          <Text style={styles.cardPhone}>{a.user.phone || "No contact info"}</Text>
                       </View>
                    </View>
                    <View style={[styles.typeBadge, a.isSilent ? styles.silentBadge : styles.audibleBadge]}>
                       <Ionicons name={a.isSilent ? "mic-off" : "volume-high"} size={12} color="#fff" />
                       <Text style={styles.typeText}>{a.isSilent ? "SILENT" : "AUDIBLE"}</Text>
                    </View>
                  </View>

                  <View style={styles.cardStats}>
                     <View style={styles.statBox}>
                        <Text style={styles.statLabel}>NOTIFIED</Text>
                        <Text style={styles.statValue}>{a.notifiedCount} Contacts</Text>
                     </View>
                     <View style={styles.statDivider} />
                     <View style={styles.statBox}>
                        <Text style={styles.statLabel}>TIME ELAPSED</Text>
                        <Text style={styles.statValue}>
                          {Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000)}m ago
                        </Text>
                     </View>
                  </View>

                  <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.mapBtn} onPress={() => openMaps(lat, lng)}>
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={styles.mapBtnText}>Intercept Location</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.resolveBtn, resolving === a.id && styles.resolveDisabled]}
                      onPress={() => onResolve(a.id)}
                      disabled={resolving === a.id}
                    >
                      {resolving === a.id ? (
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
            })}
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    alignItems: "center",
  },
  title: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#fff",
    letterSpacing: 0.5,
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  alertCount: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 1,
  },
  container: { padding: 20, paddingBottom: 40 },
  
  centerState: {
    marginTop: 100,
    alignItems: "center",
    gap: 16,
  },
  secureIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#064E3B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stateText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  stateSubText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },

  errorBox: {
    backgroundColor: "#451A1A",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#991B1B",
  },
  errorText: {
    color: "#FECACA",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 12,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  userSection: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#475569",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F1F5F9",
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: "#fff",
  },
  cardPhone: { 
    fontSize: 13, 
    color: "#94A3B8", 
    marginTop: 2,
    fontWeight: "600",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  silentBadge: {
    backgroundColor: "#475569",
  },
  audibleBadge: {
    backgroundColor: "#EF4444",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },

  cardStats: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#334155",
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F1F5F9",
  },

  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  mapBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1D4ED8",
    paddingVertical: 14,
    borderRadius: 16,
  },
  mapBtnText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 14 
  },
  resolveBtn: {
    flex: 0.8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 16,
  },
  resolveDisabled: { opacity: 0.5 },
  resolveBtnText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 14 
  },
});
