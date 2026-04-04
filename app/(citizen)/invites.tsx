"use client";

import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";
import { fetchMyInvites, respondToGroupInvite } from "../../src/auth/api";
import type { GroupInvite } from "../../src/auth/types";
import { Skeleton } from "../../src/components/common/Skeleton";

export default function InvitesScreen() {
  const router = useRouter();
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async (mode?: "refresh") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetchMyInvites();
      setInvites(res.invites);
    } catch (e) {
      console.error("Failed to load invites:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRespond = async (id: string, accept: boolean, groupId: string) => {
    try {
      setRespondingId(id);
      const res = await respondToGroupInvite(id, accept);
      if (res.success) {
        if (accept) {
          router.push(`/(citizen)/group/${groupId}`);
        } else {
          Alert.alert("Success", "Invite declined.");
          load();
        }
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Response failed");
    } finally {
      setRespondingId(null);
    }
  };

  const pendingInvites = invites.filter((i) => i.status === "PENDING" || !i.status);
  const historyInvites = invites.filter((i) => i.status && i.status !== "PENDING");

  return (
    <CitizenShell>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Group Invites</Text>
        </View>

        <Text style={styles.sectionTitle}>Pending Requests</Text>
        {loading && !refreshing ? (
          [1, 2].map((i) => (
            <View key={i} style={styles.inviteCard}>
              <View style={styles.inviteInfo}>
                <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))
        ) : pendingInvites.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="mail-open-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No pending invites at the moment.</Text>
          </View>
        ) : (
          pendingInvites.map((inv) => (
            <View key={inv.id} style={styles.inviteCard}>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteGroupName}>{inv.group.name}</Text>
                <Text style={styles.inviteMeta}>Invited by @{inv.inviter.username}</Text>
              </View>
              <View style={styles.inviteActions}>
                {respondingId === inv.id ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => onRespond(inv.id, false, inv.groupId)}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => onRespond(inv.id, true, inv.groupId)}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        {historyInvites.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Invite History</Text>
            {historyInvites.map((inv) => (
              <View key={inv.id} style={[styles.inviteCard, { opacity: 0.7 }]}>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteGroupName}>{inv.group.name}</Text>
                  <Text style={styles.inviteStatus}>
                    Status: {inv.status} · {new Date(inv.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons
                  name={inv.status === "ACCEPTED" ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={inv.status === "ACCEPTED" ? "#16A34A" : "#B91C1C"}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  inviteInfo: { flex: 1, marginRight: 16 },
  inviteGroupName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  inviteMeta: { fontSize: 13, color: "#64748B", marginTop: 2 },
  inviteStatus: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  inviteActions: { flexDirection: "row", gap: 10, alignItems: "center" },
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
  emptyCard: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
