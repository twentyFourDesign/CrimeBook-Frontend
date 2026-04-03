import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PoliceShell } from "../../../src/components/police/PoliceShell";
import { fetchPoliceCaseTimeline } from "../../../src/auth/api";
import type { PoliceCaseTimelinePayload } from "../../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export default function InvestigationNotesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const caseId = Array.isArray(id) ? id[0] : id;
  const [timeline, setTimeline] = useState<PoliceCaseTimelinePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchPoliceCaseTimeline(caseId);
      setTimeline(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load investigation timeline");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Investigation Notes</Text>
            <Text style={styles.sub}>Case ID: {caseId ?? "—"}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && timeline && (
          <>
            <Text style={styles.section}>Field notes ({timeline.notes.length})</Text>
            {timeline.notes.map((n) => (
              <View key={n.id} style={styles.card}>
                <Text style={styles.cardTitle}>{n.officerName}</Text>
                <Text style={styles.cardText}>{n.content}</Text>
                <Text style={styles.cardMeta}>
                  {formatEnum(n.noteType)} • {new Date(n.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}

            <Text style={styles.section}>Evidence ({timeline.evidence.length})</Text>
            {timeline.evidence.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(e.fileUrl).catch(() => null)}
              >
                <Text style={styles.cardTitle}>{e.fileName}</Text>
                <Text style={styles.cardMeta}>
                  {formatEnum(e.evidenceType)} • {new Date(e.capturedAt).toLocaleString()}
                </Text>
                <Text style={styles.link}>Tap to open</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.section}>Suspect tags ({timeline.suspects.length})</Text>
            {timeline.suspects.map((s) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.cardTitle}>{s.alias || "Unaliased"}</Text>
                <Text style={styles.cardText}>{s.description}</Text>
                <Text style={styles.cardMeta}>{new Date(s.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { fontSize: 18, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 12, color: "#64748B" },
  center: { paddingVertical: 24, alignItems: "center" },
  error: { color: "#B91C1C", fontSize: 13, marginBottom: 8 },
  section: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 10, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  cardText: { fontSize: 13, color: "#334155", marginTop: 6 },
  cardMeta: { fontSize: 11, color: "#64748B", marginTop: 8 },
  link: { color: "#2563EB", fontSize: 12, fontWeight: "600", marginTop: 6 },
});

