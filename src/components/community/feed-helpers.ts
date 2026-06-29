import type { FeedReportItem } from "../../auth/types";

export function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

export const CATEGORY_ICONS: Record<string, string> = {
  HOMICIDE: "skull-outline",
  ROBBERY: "wallet-outline",
  ASSAULT: "hand-left-outline",
  KIDNAPPING: "person-outline",
  DOMESTIC_VIOLENCE: "home-outline",
  DRUG_ACTIVITY: "medkit-outline",
  TRAFFIC_CRIME: "car-outline",
  FRAUD: "card-outline",
  MISSING_PERSON: "search-outline",
  VANDALISM: "construct-outline",
  SUSPICIOUS_ACTIVITY: "eye-outline",
  OTHER: "document-text-outline",
};

export const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  HOMICIDE: { bg: "#FEF2F2", fg: "#991B1B" },
  ROBBERY: { bg: "#FEF2F2", fg: "#DC2626" },
  ASSAULT: { bg: "#FFF1F2", fg: "#E11D48" },
  KIDNAPPING: { bg: "#FDF2F8", fg: "#DB2777" },
  DOMESTIC_VIOLENCE: { bg: "#FFF7ED", fg: "#EA580C" },
  DRUG_ACTIVITY: { bg: "#F0FDF4", fg: "#16A34A" },
  TRAFFIC_CRIME: { bg: "#EFF6FF", fg: "#2563EB" },
  FRAUD: { bg: "#F5F3FF", fg: "#7C3AED" },
  MISSING_PERSON: { bg: "#ECFEFF", fg: "#0891B2" },
  VANDALISM: { bg: "#FEFCE8", fg: "#CA8A04" },
  SUSPICIOUS_ACTIVITY: { bg: "#F8FAFC", fg: "#475569" },
  OTHER: { bg: "#F1F5F9", fg: "#64748B" },
};

export function getCategoryLabel(item: FeedReportItem) {
  if (item.title?.trim()) return item.title.trim();
  if (item.crimeCategory === "OTHER" && item.otherCrimeType) {
    return `Other: ${item.otherCrimeType}`;
  }
  return formatEnum(item.crimeCategory);
}

export function getCategoryMeta(item: FeedReportItem) {
  const category =
    item.crimeCategory === "OTHER" && item.otherCrimeType
      ? `Other · ${item.otherCrimeType}`
      : formatEnum(item.crimeCategory);
  const confirmations =
    item.communityConfirmCount > 0
      ? `${item.communityConfirmCount} confirmation${item.communityConfirmCount === 1 ? "" : "s"}`
      : "Awaiting confirmations";
  return `${category} · ${confirmations}`;
}

/** Resolved / closed — hidden from live community feed. */
export const LIVE_EXCLUDED_STATUSES = [
  "RESOLVED",
  "POLICE_RESOLVED",
  "REJECTED",
  "ARCHIVED",
] as const;

export function isLiveFeedItem(item: FeedReportItem): boolean {
  if (isArchiveFeedItem(item)) return false;
  return !(LIVE_EXCLUDED_STATUSES as readonly string[]).includes(item.status);
}

/** Client-side guard when API is stale or segment param is ignored. */
export function isArchiveFeedItem(item: FeedReportItem): boolean {
  if (item.status === "ARCHIVED") return true;
  if (item.description?.includes("Nigeria Crime Archive 2010")) return true;
  if (item.otherCrimeType?.includes("State violence toll snapshot")) return true;
  return false;
}

export function filterFeedBySegment(
  reports: FeedReportItem[],
  segment: "live" | "verified" | "archive" | "all"
): FeedReportItem[] {
  if (segment === "archive") {
    return reports.filter((r) => isArchiveFeedItem(r));
  }

  const nonArchive = reports.filter((r) => !isArchiveFeedItem(r));

  if (segment === "live") {
    return nonArchive.filter((r) => isLiveFeedItem(r));
  }

  if (segment === "verified") {
    return nonArchive.filter(
      (r) => r.isPoliceVerified && isLiveFeedItem(r)
    );
  }

  return nonArchive;
}
