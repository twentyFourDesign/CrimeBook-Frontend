import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LoadingState } from "../common/LoadingState";
import type { FeedReportItem, VoteType } from "../../auth/types";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  getCategoryLabel,
  getCategoryMeta,
} from "./feed-helpers";

type Props = {
  reports: FeedReportItem[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showVerifiedBadge?: boolean;
  onVote?: (reportId: string, voteType: VoteType) => void;
};

export function IncidentFeedList({
  reports,
  loading,
  error,
  emptyMessage = "Nothing here yet.",
  showVerifiedBadge = false,
  onVote,
}: Props) {
  const router = useRouter();

  if (loading) {
    return <LoadingState message="Loading incidents…" size="medium" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!reports.length) {
    return <Text style={styles.emptyText}>{emptyMessage}</Text>;
  }

  return (
    <>
      {reports.map((item) => {
        const iconName = (CATEGORY_ICONS[item.crimeCategory] ?? "document-text-outline") as keyof typeof Ionicons.glyphMap;
        const colors = CATEGORY_COLORS[item.crimeCategory] ?? CATEGORY_COLORS.OTHER;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.incidentCard}
            activeOpacity={0.7}
            onPress={() => router.push(`/(citizen)/community-report/${item.id}`)}
          >
            <View style={styles.incidentTop}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.bg }]}>
                <Ionicons name={iconName} size={22} color={colors.fg} />
              </View>
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentTitle} numberOfLines={1}>
                  {getCategoryLabel(item)}
                </Text>
                <Text style={styles.incidentMeta} numberOfLines={1}>
                  {getCategoryMeta(item)}
                </Text>
              </View>
              {(showVerifiedBadge || item.isPoliceVerified) && (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
                </View>
              )}
            </View>

            <View style={styles.incidentDivider} />

            <View style={styles.incidentBottom}>
              {onVote ? (
                <View style={styles.socialActions}>
                  <TouchableOpacity
                    style={[styles.socialBtn, item.myVote === "UPVOTE" && styles.socialBtnActiveUp]}
                    onPress={() => onVote(item.id, "UPVOTE")}
                  >
                    <Ionicons
                      name={item.myVote === "UPVOTE" ? "thumbs-up" : "thumbs-up-outline"}
                      size={16}
                      color={item.myVote === "UPVOTE" ? "#fff" : "#1D4ED8"}
                    />
                    <Text style={[styles.socialBtnText, item.myVote === "UPVOTE" && styles.socialBtnTextActive]}>
                      {item.upvoteCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialBtn, item.myVote === "DOWNVOTE" && styles.socialBtnActiveDown]}
                    onPress={() => onVote(item.id, "DOWNVOTE")}
                  >
                    <Ionicons
                      name={item.myVote === "DOWNVOTE" ? "thumbs-down" : "thumbs-down-outline"}
                      size={16}
                      color={item.myVote === "DOWNVOTE" ? "#fff" : "#B91C1C"}
                    />
                    <Text style={[styles.socialBtnText, item.myVote === "DOWNVOTE" && styles.socialBtnTextActive]}>
                      {item.downvoteCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => router.push(`/(citizen)/community-report/${item.id}`)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#64748B" />
                    <Text style={styles.socialBtnText}>{item.commentCount}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.metaItem}>
                  <Ionicons name="document-text-outline" size={12} color="#94A3B8" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    Tap to view details
                  </Text>
                </View>
              )}

              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                <Text style={styles.metaText}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  incidentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  incidentTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  incidentInfo: { flex: 1 },
  incidentTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  incidentMeta: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  incidentDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  incidentBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  metaText: { fontSize: 12, fontWeight: "500", color: "#94A3B8" },
  verifiedTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  socialActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  socialBtnActiveUp: { backgroundColor: "#1D4ED8" },
  socialBtnActiveDown: { backgroundColor: "#B91C1C" },
  socialBtnText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  socialBtnTextActive: { color: "#fff" },
  errorText: { fontSize: 13, color: "#DC2626", marginBottom: 12 },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 32,
    lineHeight: 22,
  },
});
