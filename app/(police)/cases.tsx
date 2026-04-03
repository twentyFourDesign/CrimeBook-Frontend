import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceCases } from "../../src/auth/api";
import type { PoliceCaseItem } from "../../src/auth/types";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  OPEN: { label: "Open", color: "#7C3AED", bg: "#EDE9FE" },
  RESPONDING: { label: "Responding", color: "#2563EB", bg: "#DBEAFE" },
  INVESTIGATING: { label: "Investigating", color: "#D97706", bg: "#FEF3C7" },
  SUSPECT_DETAINED: { label: "Suspect Detained", color: "#0F766E", bg: "#CCFBF1" },
  SUSPECT_ARRESTED: { label: "Suspect Arrested", color: "#1D4ED8", bg: "#DBEAFE" },
  CLOSED: { label: "Closed", color: "#16A34A", bg: "#DCFCE7" },
  COLD_CASE: { label: "Cold Case", color: "#6B7280", bg: "#E5E7EB" },
};

export default function PoliceCasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<PoliceCaseItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const { cases } = await fetchPoliceCases();
        setCases(cases);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load cases");
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 20 }}>📋</Text>
            </View>
            <View>
              <Text style={styles.heading}>Active Cases</Text>
              <Text style={styles.subheading}>
                {(cases ?? []).length} assigned
              </Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Loading cases…</Text>
            </View>
          )}

          {error && !loading && <Text style={styles.errorText}>{error}</Text>}

          {!loading &&
            (cases ?? []).map((c) => {
              const conf = statusConfig[c.status] ?? {
                label: c.status.replace(/_/g, " "),
                color: "#6B7280",
                bg: "#E5E7EB",
              };
              const loc = c.report.locationLabel || c.report.locationAddress || "Unknown location";
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.caseCard}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(police)/investigation")}
                >
                  <View style={styles.caseLeft}>
                    <View style={styles.caseInfo}>
                      <View style={styles.caseTitleRow}>
                        <Text style={styles.caseTitle}>
                          {c.report.title?.trim() || c.caseNumber}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: conf.bg }]}>
                          <Text style={[styles.statusText, { color: conf.color }]}>
                            {conf.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.caseMeta}>
                        📍 {loc}  🕐 {new Date(c.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#E0EAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: { fontSize: 20, fontWeight: "700", color: "#111" },
  subheading: { fontSize: 12, color: "#888", marginTop: 2 },
  caseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  caseLeft: { flex: 1 },
  caseInfo: { flex: 1 },
  caseTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  caseTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "700" },
  caseMeta: { fontSize: 11, color: "#888" },
  chevron: { fontSize: 20, color: "#CBD5E1", marginLeft: 8 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  loadingText: { fontSize: 12, color: "#64748B" },
  errorText: { fontSize: 12, color: "#DC2626", marginBottom: 12 },
});