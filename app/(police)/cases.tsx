import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { fetchPoliceCases } from "../../src/auth/api";
import type { PoliceCaseItem } from "../../src/auth/types";
import { useAppDataCache } from "../../src/cache/AppDataCacheContext";
import { useCachedData } from "../../src/hooks/useCachedData";
import { useTheme } from "../../src/theme/ThemeContext";

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

import { Ionicons } from "@expo/vector-icons";

export default function PoliceCasesScreen() {
  const router = useRouter();
  const { setPoliceCases } = useAppDataCache();
  const { colors, isDark } = useTheme();

  const {
    data: casesData,
    loading,
    revalidating,
    error,
    refresh
  } = useCachedData(
    "policeCases",
    async () => {
      const res = await fetchPoliceCases();
      return res.cases ?? [];
    },
    setPoliceCases
  );

  const cases = casesData ?? [];

  return (
    <PoliceShell>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
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
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIcon, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}>
                <Ionicons name="briefcase" size={24} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.heading, { color: colors.text }]}>Case Management</Text>
                <Text style={[styles.subheading, { color: colors.textSecondary }]}>
                  {cases.length} investigation{cases.length === 1 ? "" : "s"} assigned to you
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={refresh} style={[styles.refreshIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading && !cases.length && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.loadingText}>Syncing dossier...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {cases.map((c) => {
            const conf = statusConfig[c.status] ?? {
              label: c.status.replace(/_/g, " "),
              color: "#6B7280",
              bg: "#E5E7EB",
            };
            const loc = c.report.locationLabel || c.report.locationAddress || "Unknown location";
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.caseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(police)/investigation/[id]",
                    params: { id: c.id },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.caseNumBox}>
                    <Text style={styles.caseNumText}>{c.caseNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: conf.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: conf.color }]} />
                    <Text style={[styles.statusText, { color: conf.color }]}>
                      {conf.label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.caseTitle, { color: colors.text }]}>
                  {c.report.title?.trim() || 
                   (c.report.crimeCategory === "OTHER" && c.report.otherCrimeType 
                     ? `Other: ${c.report.otherCrimeType}` 
                     : c.report.crimeCategory.replace(/_/g, " "))}
                </Text>

                <View style={styles.cardMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText} numberOfLines={1}>{loc}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>
                      {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.priorityBox}>
                    <Ionicons name="shield" size={12} color="#475569" />
                    <Text style={styles.priorityText}>
                      {c.report.crimeCategory === "OTHER" && c.report.otherCrimeType 
                        ? c.report.otherCrimeType 
                        : c.report.crimeCategory.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <View style={styles.viewBtn}>
                    <Text style={styles.viewBtnText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color="#1D4ED8" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subheading: { fontSize: 13, color: "#64748B", marginTop: 4 },
  refreshIconBtn: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // Loading/Error
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  loadingText: { fontSize: 14, color: "#64748B", marginLeft: 10, fontWeight: "600" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { color: "#DC2626", fontSize: 14, marginLeft: 8, flex: 1 },

  // Case Card
  caseCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  caseNumBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  caseNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  caseTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  cardMeta: {
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFF",
  },
  priorityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textTransform: "capitalize",
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },
});