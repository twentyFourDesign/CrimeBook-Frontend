import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { useAuth } from "../../src/auth/AuthContext";
import { fetchOfficerProfile } from "../../src/auth/api";
import type { OfficerProfilePayload } from "../../src/auth/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PoliceProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<OfficerProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { profile: p } = await fetchOfficerProfile();
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [load, user]);

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator />
          </View>
        )}

        {error && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && profile && (
          <>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials(profile.name)}</Text>
                  </View>
                )}
              </View>
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
  avatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", backgroundColor: "#E2E8F0" },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },
  avatarInitials: { fontSize: 26, fontWeight: "700", color: "#fff" },
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
  signOut: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
