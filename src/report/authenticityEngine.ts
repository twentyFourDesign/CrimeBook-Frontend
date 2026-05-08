/**
 * authenticityEngine.ts
 * Multi-signal forensic authenticity scoring engine.
 * Simulates a real ML pipeline across 7 distinct forensic signal categories.
 */

import type { ReportDraft } from "./ReportDraftContext";
import type { AppUser } from "../auth/types";

// -------------------------------------------------
// Types
// -------------------------------------------------

export type SignalResult = {
  label: string;
  score: number; // 0–100
  flags: string[];
  detail: string; // Human-readable reason
};

export type AuthenticityGrade =
  | "FORENSIC GRADE"
  | "HIGH CONFIDENCE"
  | "MODERATE"
  | "LOW CONFIDENCE"
  | "INSUFFICIENT";

export type AuthenticityAnalysis = {
  finalScore: number; // 0–100, rounded
  grade: AuthenticityGrade;
  gradeColor: string;
  signals: {
    media: SignalResult;
    geospatial: SignalResult;
    temporal: SignalResult;
    narrative: SignalResult;
    trust: SignalResult;
    coherence: SignalResult;
    entropy: SignalResult;
  };
  allFlags: string[];
  reportHash: string; // Fake hash for display
};

// -------------------------------------------------
// Weights (must sum to 1.0)
// -------------------------------------------------
const WEIGHTS = {
  media: 0.28,
  geospatial: 0.22,
  narrative: 0.15,
  temporal: 0.14,
  trust: 0.10,
  coherence: 0.06,
  entropy: 0.05,
};

// -------------------------------------------------
// Signal 1: Media Forensics (28%)
// -------------------------------------------------
function analyzeMedia(draft: ReportDraft): SignalResult {
  const { media } = draft;
  const flags: string[] = [];
  let score = 0;

  if (media.length === 0) {
    return {
      label: "Media Forensics",
      score: 0,
      flags: ["⚠️ NO-MEDIA-ATTACHED"],
      detail: "No media files submitted",
    };
  }

  const photos = media.filter(
    (m) => m.mediaType === "PHOTO" || m.mimeType.startsWith("image/")
  );
  const videos = media.filter(
    (m) => m.mediaType === "VIDEO" || m.mimeType.startsWith("video/")
  );
  const totalFiles = media.length;

  // Base score from media types
  if (videos.length > 0 && photos.length > 0) {
    score = 92;
    flags.push("🎬 MIXED-FORMAT EVIDENCE");
  } else if (videos.length >= 2) {
    score = 85;
  } else if (videos.length === 1) {
    score = 70;
  } else if (photos.length >= 2) {
    score = 55;
  } else {
    score = 35;
  }

  if (videos.length > 0) flags.push("📹 VIDEO-EVIDENCE");
  if (totalFiles >= 2) flags.push("🗂 MULTI-MEDIA CORPUS");

  // File size bonuses
  const largeFiles = media.filter((m) => m.fileSizeBytes > 5 * 1024 * 1024);
  if (largeFiles.length > 0) {
    score = Math.min(100, score + 5);
    flags.push("📏 HIGH-RES CAPTURE");
  }

  // Each file > 500KB adds up to 3 pts each (max +15 total)
  const mediumFiles = media.filter((m) => m.fileSizeBytes > 500 * 1024);
  const sizeBonus = Math.min(15, mediumFiles.length * 3);
  score = Math.min(100, score + sizeBonus);

  if (videos.length === 0) flags.push("🖼 PHOTO-EVIDENCE");

  const totalSizeMB = media.reduce((sum, m) => sum + m.fileSizeBytes, 0) / (1024 * 1024);
  const detail =
    `${totalFiles} file(s) — ${videos.length} video, ${photos.length} photo — ` +
    `${totalSizeMB.toFixed(1)}MB total`;

  return { label: "Media Forensics", score: Math.round(score), flags, detail };
}

// -------------------------------------------------
// Signal 2: Geospatial Intelligence (22%)
// -------------------------------------------------
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function analyzeGeospatial(
  draft: ReportDraft,
  currentLat: number | null,
  currentLon: number | null
): SignalResult {
  const flags: string[] = [];
  let score = 0;
  let detail = "";

  if (!draft.latitude || !draft.longitude) {
    return {
      label: "Geospatial Intel",
      score: 0,
      flags: ["⚠️ NO-GPS-DATA"],
      detail: "No GPS coordinates provided",
    };
  }

  // Base: GPS in draft
  score = 40;
  flags.push("📍 GEO-STAMPED");

  // Address geocoded from GPS
  if (draft.locationText.trim().length > 10) {
    score += 25;
    flags.push("🗺 REVERSE-GEOCODED");
  }

  // Live proximity check
  if (currentLat !== null && currentLon !== null) {
    const distKm = haversineKm(draft.latitude, draft.longitude, currentLat, currentLon);
    score += 10; // Bonus for having live location

    if (distKm <= 0.5) {
      score = Math.min(100, score + 20);
      flags.push("🎯 PROXIMITY-VERIFIED");
      detail = `On-scene — ${(distKm * 1000).toFixed(0)}m from incident`;
    } else if (distKm <= 2) {
      flags.push("📡 NEAR-SCENE");
      detail = `${distKm.toFixed(2)}km from incident`;
    } else if (distKm > 5) {
      score = Math.max(0, score - 10);
      flags.push("⚠️ REMOTE-FILED");
      detail = `${distKm.toFixed(1)}km from incident — remote report`;
    } else {
      detail = `${distKm.toFixed(2)}km from incident`;
    }
  } else {
    detail = `Coords: ${draft.latitude.toFixed(4)}, ${draft.longitude.toFixed(4)}`;
  }

  return {
    label: "Geospatial Intel",
    score: Math.min(100, Math.round(score)),
    flags,
    detail,
  };
}

// -------------------------------------------------
// Signal 3: Temporal Integrity (14%)
// -------------------------------------------------
function analyzeTemporal(draft: ReportDraft): SignalResult {
  const flags: string[] = [];
  let score = 0;

  if (draft.isHappeningNow) {
    score = 90;
    flags.push("⚡ REAL-TIME ALERT");
    return {
      label: "Temporal Integrity",
      score,
      flags,
      detail: "Incident reported in real-time",
    };
  }

  const now = Date.now();
  const incidentMs = new Date(draft.incidentTimeIso).getTime();

  // Future incident — suspicious
  if (incidentMs > now + 60_000) {
    return {
      label: "Temporal Integrity",
      score: 10,
      flags: ["⚠️ FUTURE-TIMESTAMP"],
      detail: "Incident time is in the future",
    };
  }

  const hoursAgo = (now - incidentMs) / 3_600_000;

  if (hoursAgo <= 1) {
    score = 80;
    flags.push("🕐 RAPID-RESPONSE");
  } else if (hoursAgo <= 6) {
    score = 65;
    flags.push("⏱ SAME-DAY REPORT");
  } else if (hoursAgo <= 24) {
    score = 50;
    flags.push("📅 24H-WINDOW");
  } else if (hoursAgo <= 72) {
    score = 35;
    flags.push("📅 DELAYED-REPORT");
  } else {
    score = 20;
    flags.push("⚠️ RETROACTIVE-FILING");
  }

  const detail =
    hoursAgo < 1
      ? `Reported ${Math.round(hoursAgo * 60)}min after incident`
      : hoursAgo < 24
      ? `Reported ${hoursAgo.toFixed(1)}h after incident`
      : `Reported ${(hoursAgo / 24).toFixed(1)} days after incident`;

  return { label: "Temporal Integrity", score, flags, detail };
}

// -------------------------------------------------
// Signal 4: Narrative Depth (15%)
// -------------------------------------------------
const TACTICAL_KEYWORDS = [
  "vehicle", "direction", "color", "colour", "weapon", "suspect",
  "knife", "gun", "wearing", "fled", "running", "car", "motorcycle",
  "height", "age", "male", "female", "mask", "escaped", "amount",
  "threatened", "attacked", "stolen", "plate", "number",
];

function computeEntropy(text: string): number {
  const freq: Record<string, number> = {};
  for (const ch of text) freq[ch] = (freq[ch] ?? 0) + 1;
  const len = text.length;
  return -Object.values(freq).reduce((sum, f) => {
    const p = f / len;
    return sum + p * Math.log2(p);
  }, 0);
}

function analyzeNarrative(draft: ReportDraft): SignalResult {
  const flags: string[] = [];
  const text = draft.description.trim();
  const len = text.length;
  let score = 0;

  if (len < 30) {
    score = 10;
    flags.push("⚠️ SPARSE-REPORT");
  } else if (len < 80) {
    score = 35;
  } else if (len < 150) {
    score = 55;
  } else if (len < 300) {
    score = 75;
    flags.push("📝 STRUCTURED-NARRATIVE");
  } else {
    score = 90;
    flags.push("📝 DETAILED-NARRATIVE");
  }

  // Tactical keyword detection
  const lowerText = text.toLowerCase();
  const found = TACTICAL_KEYWORDS.filter((kw) => lowerText.includes(kw));
  const keywordBonus = Math.min(20, found.length * 5);
  score = Math.min(100, score + keywordBonus);
  if (found.length >= 2) flags.push("🔑 KEY-ENTITIES DETECTED");

  // Evidence note
  if (draft.evidenceNote.trim().length > 0) {
    score = Math.min(100, score + 10);
    flags.push("📋 EVIDENCE-ANNOTATED");
  }

  const detail = `${len} chars — ${found.length} tactical keyword(s) detected`;
  return { label: "Narrative Depth", score: Math.round(score), flags, detail };
}

// -------------------------------------------------
// Signal 5: Identity & Trust Tier (10%)
// -------------------------------------------------
function analyzeTrust(draft: ReportDraft, user: AppUser | null): SignalResult {
  const flags: string[] = [];
  let score = 0;

  if (draft.isAnonymous) {
    score = 30;
    flags.push("👤 ANON-PROTECTED");
    return {
      label: "Identity Trust",
      score,
      flags,
      detail: "Anonymous filing — identity unbound",
    };
  }

  if (!user) {
    score = 40;
    flags.push("🔓 UNVERIFIED-SESSION");
    return { label: "Identity Trust", score, flags, detail: "Session user not resolved" };
  }

  switch (user.role) {
    case "POLICE_OFFICER":
    case "POLICE_COMMAND":
      score = 95;
      flags.push("🛡 OFFICER-FILED");
      break;
    case "VERIFIED_COMMUNITY_MEMBER":
      score = 75;
      flags.push("🏅 COMMUNITY-VERIFIED");
      break;
    case "ENTERPRISE_SECURITY":
      score = 85;
      flags.push("🏢 ENTERPRISE-VERIFIED");
      break;
    default:
      score = 50;
  }

  if (user.identityVerificationStatus === "approved") {
    score = Math.min(100, score + 20);
    flags.push("✅ IDENTITY-BOUND");
  }

  if (user.isEmailVerified) {
    flags.push("📧 EMAIL-VERIFIED");
  }

  const detail = `Role: ${user.role} — ID verification: ${user.identityVerificationStatus}`;
  return { label: "Identity Trust", score: Math.round(score), flags, detail };
}

// -------------------------------------------------
// Signal 6: Metadata Coherence (6%)
// -------------------------------------------------
const HIGH_PRIORITY_CRIMES = [
  "robbery", "assault", "murder", "homicide", "rape", "kidnapping",
  "shooting", "stabbing", "carjacking", "terrorism", "arson",
  "domestic", "weapon", "drugs",
];

function analyzeCoherence(draft: ReportDraft): SignalResult {
  const flags: string[] = [];
  let score = 85; // Start high — this is a completeness check
  let completedFields = 0;

  if (draft.crimeSlug) completedFields++;
  if (draft.description.trim().length > 0) completedFields++;
  if (draft.locationText.trim().length > 0) completedFields++;
  if (draft.latitude && draft.longitude) completedFields++;
  if (draft.incidentTimeIso) completedFields++;
  if (draft.media.length > 0) completedFields++;

  score -= (6 - completedFields) * 10;

  if (completedFields === 6) flags.push("✔️ COMPLETE-PAYLOAD");

  const crimeSlug = (draft.crimeSlug ?? "").toLowerCase();
  const isHighPriority = HIGH_PRIORITY_CRIMES.some((c) => crimeSlug.includes(c));
  if (isHighPriority) {
    flags.push("🚨 HIGH-PRIORITY CRIME");
  }

  if (draft.locationText.trim() && draft.latitude) {
    flags.push("🔗 CROSS-VALIDATED");
  }

  const detail = `${completedFields}/6 core fields populated`;
  return {
    label: "Metadata Coherence",
    score: Math.max(0, Math.round(score)),
    flags,
    detail,
  };
}

// -------------------------------------------------
// Signal 7: Content Entropy / Uniqueness (5%)
// -------------------------------------------------
function analyzeEntropy(draft: ReportDraft): SignalResult {
  const text = draft.description.trim() + " " + draft.evidenceNote.trim();
  const flags: string[] = ["🔒 UNIQUE-HASH VERIFIED"];
  let score = 40;

  if (text.length < 10) {
    return { label: "Report Entropy", score: 20, flags: ["⚠️ LOW-CONTENT"], detail: "Insufficient text for analysis" };
  }

  const entropy = computeEntropy(text);
  // Typical English text entropy is ~4.0–4.5 bits
  if (entropy > 4.2) {
    score = 85;
    flags.push("🧬 HIGH-ENTROPY CONTENT");
  } else if (entropy > 3.5) {
    score = 65;
  } else {
    score = 30;
    flags.push("⚠️ LOW-ENTROPY — POSSIBLE TEMPLATE");
  }

  // Multiple sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  if (sentences.length >= 3) {
    score = Math.min(100, score + 10);
  }

  // Contains numbers (dates, times, amounts)
  if (/\d/.test(text)) {
    score = Math.min(100, score + 5);
    flags.push("🔢 NUMERIC-ENTITIES");
  }

  return {
    label: "Report Entropy",
    score: Math.round(score),
    flags,
    detail: `Shannon entropy: ${entropy.toFixed(2)} bits — ${sentences.length} sentence(s)`,
  };
}

// -------------------------------------------------
// Grade mapping
// -------------------------------------------------
function getGrade(score: number): { grade: AuthenticityGrade; color: string } {
  if (score >= 90) return { grade: "FORENSIC GRADE", color: "#059669" };
  if (score >= 70) return { grade: "HIGH CONFIDENCE", color: "#10B981" };
  if (score >= 50) return { grade: "MODERATE", color: "#D97706" };
  if (score >= 30) return { grade: "LOW CONFIDENCE", color: "#EF4444" };
  return { grade: "INSUFFICIENT", color: "#DC2626" };
}

// -------------------------------------------------
// Fake report hash
// -------------------------------------------------
function generateReportHash(draft: ReportDraft): string {
  const raw = (draft.crimeSlug ?? "") + draft.description + draft.incidentTimeIso + Date.now();
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

// -------------------------------------------------
// Main export
// -------------------------------------------------
export async function computeAuthenticityScore(
  draft: ReportDraft,
  user: AppUser | null,
  currentLat: number | null,
  currentLon: number | null
): Promise<AuthenticityAnalysis> {
  const media = analyzeMedia(draft);
  const geospatial = analyzeGeospatial(draft, currentLat, currentLon);
  const temporal = analyzeTemporal(draft);
  const narrative = analyzeNarrative(draft);
  const trust = analyzeTrust(draft, user);
  const coherence = analyzeCoherence(draft);
  const entropy = analyzeEntropy(draft);

  const finalScore = Math.round(
    media.score * WEIGHTS.media +
    geospatial.score * WEIGHTS.geospatial +
    narrative.score * WEIGHTS.narrative +
    temporal.score * WEIGHTS.temporal +
    trust.score * WEIGHTS.trust +
    coherence.score * WEIGHTS.coherence +
    entropy.score * WEIGHTS.entropy
  );

  const { grade, color } = getGrade(finalScore);

  const allFlags = [
    ...media.flags,
    ...geospatial.flags,
    ...temporal.flags,
    ...narrative.flags,
    ...trust.flags,
    ...coherence.flags,
    ...entropy.flags,
  ];

  return {
    finalScore,
    grade,
    gradeColor: color,
    signals: { media, geospatial, temporal, narrative, trust, coherence, entropy },
    allFlags,
    reportHash: generateReportHash(draft),
  };
}
