export type IdentityVerificationStatus = "none" | "pending" | "approved" | "rejected";

export type OnboardingIntent = "STANDARD_CITIZEN" | "VERIFIED_COMMUNITY" | "POLICE";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  role:
    | "CITIZEN"
    | "VERIFIED_COMMUNITY_MEMBER"
    | "POLICE_OFFICER"
    | "POLICE_COMMAND"
    | "ENTERPRISE_SECURITY"
    | "SYSTEM_ADMIN";
  isEmailVerified: boolean;
  onboardingIntent: OnboardingIntent | null;
  identityVerificationStatus: IdentityVerificationStatus;
  trustScore: number;
  reputationPoints: number;
  communityVerification: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: string;
  } | null;
  policeApplication: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: string;
  } | null;
  officerLocation?: {
    latitude: number | null;
    longitude: number | null;
  } | null;
};

export type IdDocumentType = "national_id" | "passport" | "drivers_license";

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface GroupInvite {
  id: string;
  groupId: string;
  inviterId: string;
  email: string;
  status: InviteStatus;
  createdAt: string;
  updatedAt: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
  };
  inviter: {
    id: string;
    name: string;
    username: string;
  };
}

export type VerificationSubmitBody = {
  idDocumentType: IdDocumentType;
  idDocumentUrl?: string;
  applicant: {
    fullName: string;
    idNumber: string;
    address: { street: string; city: string; zip: string };
    phone?: string;
  };
};

export type MyReportItem = {
  id: string;
  caseId?: string | null;
  crimeCategory: string;
  otherCrimeType?: string | null;
  title: string | null;
  status: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  latitude?: number;
  longitude?: number;
  locationAddress: string | null;
  locationLabel: string | null;
  isPoliceVerified?: boolean;
  reporterResolutionStatus?: "PENDING" | "CONFIRMED" | "DISPUTED";
};

export type PoliceIncidentForMap = {
  id: string;
  crimeCategory: string;
  otherCrimeType?: string | null;
  status: string;
  latitude: number;
  longitude: number;
  locationAddress: string | null;
  locationLabel: string | null;
  createdAt: string;
  description?: string;
  communityConfirmCount?: number;
  isPoliceVerified?: boolean;
  credibilityScore?: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
};

export type FeedReportItem = {
  id: string;
  crimeCategory: string;
  otherCrimeType?: string | null;
  title: string | null;
  status: string;
  description: string;
  createdAt: string;
  locationAddress: string | null;
  locationLabel: string | null;
  latitude: number;
  longitude: number;
  communityConfirmCount: number;
  isPoliceVerified: boolean;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  myVote: VoteType | null;
};

/** GET /api/citizen/reports/[id] — community view (any signed-in user) */
export type CommunityReportPayload = {
  id: string;
  isOwnReport: boolean;
  crimeCategory: string;
  otherCrimeType?: string | null;
  title: string | null;
  description: string;
  status: string;
  visibility: string;
  isAnonymous: boolean;
  latitude: number;
  longitude: number;
  locationAddress: string | null;
  locationLabel: string | null;
  locationPrecision: string;
  incidentTime: string;
  isHappeningNow: boolean;
  communityConfirmCount: number;
  isPoliceVerified: boolean;
  createdAt: string;
  myConfirmation: {
    isConfirmed: boolean;
    comment: string | null;
    createdAt: string;
  } | null;
  reporterResolutionStatus?: "PENDING" | "CONFIRMED" | "DISPUTED";
  reporterConfirmedAt?: string | null;
  reporterResolutionNotes?: string | null;
};

export type ReportConfirmationListItem = {
  id: string;
  isConfirmed: boolean;
  comment: string | null;
  createdAt: string;
  user: { id: string; displayName: string };
};

export type PoliceCaseItem = {
  id: string;
  caseNumber: string;
  status: string;
  priority: number;
  notes: string | null;
  createdAt: string;
  report: {
    id: string;
    crimeCategory: string;
    otherCrimeType?: string | null;
    title: string | null;
    locationAddress: string | null;
    locationLabel: string | null;
    latitude: number;
    longitude: number;
    incidentTime: string;
  };
};

/** Single-case detail from GET /api/police/cases/[id] */
export type PoliceCaseDetail = {
  id: string;
  caseNumber: string;
  status: string;
  reportId: string;
};

export type CitizenProfilePayload = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  trustScore: number;
  reputationPoints: number;
  citizenProfile: {
    homeAddress: string | null;
    homeLatitude: number | null;
    homeLongitude: number | null;
    occupation: string | null;
    preferredLanguage: string;
  } | null;
};

export type OfficerProfilePayload = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  officerProfile: {
    badgeNumber: string;
    rank: string;
    department: string;
    precinct: string;
    unitCode: string | null;
    isCommandStaff: boolean;
    patrolStatus: string;
    currentLatitude?: number | null;
    currentLongitude?: number | null;
  };
};

export type ReportMediaItem = {
  id: string;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  durationSecs: number | null;
  createdAt: string;
};

export type PoliceMediaItem = {
  id: string;
  fileUrl: string;
  fileName: string;
  evidenceType: string;
  capturedAt: string;
};

export type SuspectTagItem = {
  id: string;
  description: string;
  alias: string | null;
  createdAt: string;
};

export type PoliceNoteItem = {
  id: string;
  content: string;
  noteType: string;
  officerName: string;
  createdAt: string;
};

export type CaseStatusHistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  createdAt: string;
  changedById: string | null;
};

export type PoliceCaseTimelinePayload = {
  notes: PoliceNoteItem[];
  evidence: PoliceMediaItem[];
  suspects: SuspectTagItem[];
  caseStatusHistory: CaseStatusHistoryItem[];
};

export type PublicAppealItem = {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  radiusKm: number;
  expiresAt: string | null;
  createdAt: string;
};

export type UserBadgeEntry = {
  id: string;
  earnedAt: string;
  badge: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    pointsValue: number;
  };
};

export type PoliceSosActiveItem = {
  id: string;
  status: string;
  latitude: number;
  longitude: number;
  isSilent: boolean;
  audioClipUrl: string | null;
  notifiedCount: number;
  createdAt: string;
  // Duress (hostage) fields
  isDuressActive: boolean;
  duressActivatedAt: string | null;
  // Live audio chunk URLs
  liveMediaLinks: string[];
  // Full user info for police
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
    homeAddress: string | null;
    homeLatitude: number | null;
    homeLongitude: number | null;
    occupation: string | null;
  };
  latestLocation: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    loggedAt: string;
  } | null;
};

export type PoliceSosRecordingItem = {
  id: string;
  status: string;
  isDuressActive: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  latitude: number;
  longitude: number;
  audioClipUrl: string | null;
  liveMediaLinks: string[];
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  latestLocation: {
    latitude: number;
    longitude: number;
    loggedAt: string;
  } | null;
};

export type SosUpdateResult = {
  sosId: string;
  status: string;
  resolvedAt: string | null;
  isDuress: false; // always false on client — duress is hidden
};

/** GET/POST /api/citizen/my-reports/[id]/messages — same shape as police case messages */
export type ReportMessageItem = {
  id: string;
  body: string;
  createdAt: string;
  senderName: string;
  senderRole: string;
};

export type ReportStatusHistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  createdAt: string;
  changedById: string | null;
};

export type ReportDetailPayload = {
  id: string;
  caseId: string | null;
  crimeCategory: string;
  otherCrimeType?: string | null;
  title: string | null;
  description: string;
  status: string;
  visibility: string;
  isAnonymous: boolean;
  latitude: number;
  longitude: number;
  locationAddress: string | null;
  locationLabel: string | null;
  locationPrecision: string;
  incidentTime: string;
  isHappeningNow: boolean;
  communityConfirmCount: number;
  isPoliceVerified: boolean;
  createdAt: string;
  updatedAt: string;
  media: ReportMediaItem[];
  caseNumber?: string | null;
  policeMedia?: PoliceMediaItem[];
  assignedOfficer?: {
    name: string;
    badgeNumber: string | null;
  } | null;
  suspectTags?: SuspectTagItem[];
  policeNotes?: PoliceNoteItem[];
  /** Audit trail from GET citizen/my-reports and GET police/incidents */
  statusHistory?: ReportStatusHistoryItem[];
  authenticityAnalysis?: any;
};

/** Matches POST /api/media/upload response & Prisma `MediaType` */
export type CrimeMediaUploadResult = {
  url: string;
  path: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  mediaType: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
};

export type ReportMediaPayload = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  mediaType: CrimeMediaUploadResult["mediaType"];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};

export type CommunityGroup = {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  latitude: number;
  longitude: number;
  radiusKm: number;
  createdAt: string;
  isMember?: boolean;
};

export type CommunityPostMedia = {
  id: string;
  mediaType: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  durationSecs: number | null;
};

export type GroupPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
  };
  media: CommunityPostMedia[];
};

export type GroupMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
};

export type VoteType = "UPVOTE" | "DOWNVOTE";

export interface IncidentVoteResponse {
  counts: {
    UPVOTE: number;
    DOWNVOTE: number;
  };
  myVote: VoteType | null;
}

export interface IncidentComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface IncidentCommentsResponse {
  items: IncidentComment[];
}
