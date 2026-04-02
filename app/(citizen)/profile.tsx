import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { fetchMyReports } from "../../src/auth/api";
import type { MyReportItem } from "../../src/auth/types";
import { useAuth } from "../../src/auth/AuthContext";

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ");
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState<MyReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchMyReports();
      setReports(data.reports);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CitizenShell>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>
        {user && (
          <View style={styles.card}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>
              Verification: {user.identityVerificationStatus.replace(/_/g, " ")}
            </Text>
          </View>
        )}

        <Text style={styles.section}>Your reports</Text>
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
        {!loading && !error && reports.length === 0 && (
          <Text style={styles.empty}>No reports yet. Use the + button to submit one.</Text>
        )}
        {reports.map((r) => (
          <View key={r.id} style={styles.reportCard}>
            <Text style={styles.reportTitle}>{r.title?.trim() || formatCategory(r.crimeCategory)}</Text>
            <Text style={styles.reportCat}>{formatCategory(r.crimeCategory)}</Text>
            <Text style={styles.reportStatus}>Status: {r.status.replace(/_/g, " ")}</Text>
            {r.locationLabel || r.locationAddress ? (
              <Text style={styles.reportLoc} numberOfLines={2}>
                {r.locationLabel || r.locationAddress}
              </Text>
            ) : null}
            <Text style={styles.reportDate}>{new Date(r.createdAt).toLocaleString()}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 16 },
  card: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#111" },
  meta: { fontSize: 14, color: "#64748B", marginTop: 4 },
  section: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  centerRow: { paddingVertical: 24, alignItems: "center" },
  errBox: { marginBottom: 12 },
  errText: { color: "#B91C1C", fontSize: 14 },
  retry: { marginTop: 8, alignSelf: "flex-start" },
  retryText: { color: "#2563EB", fontWeight: "600" },
  empty: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  reportCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  reportTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  reportCat: { fontSize: 13, color: "#64748B", marginTop: 4 },
  reportStatus: { fontSize: 13, color: "#334155", marginTop: 6 },
  reportLoc: { fontSize: 12, color: "#64748B", marginTop: 4 },
  reportDate: { fontSize: 11, color: "#94A3B8", marginTop: 8 },
  signOut: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  signOutText: { fontSize: 16, fontWeight: "600", color: "#475569" },
});
