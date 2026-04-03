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
  crimeCategory: string;
  title: string | null;
  status: string;
  description: string;
  createdAt: string;
  locationAddress: string | null;
  locationLabel: string | null;
};

export type PoliceIncidentForMap = {
  id: string;
  crimeCategory: string;
  status: string;
  latitude: number;
  longitude: number;
  locationAddress: string | null;
  locationLabel: string | null;
  createdAt: string;
  description?: string;
  communityConfirmCount?: number;
  isPoliceVerified?: boolean;
};

export type FeedReportItem = {
  id: string;
  crimeCategory: string;
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
    title: string | null;
    locationAddress: string | null;
    locationLabel: string | null;
    latitude: number;
    longitude: number;
    incidentTime: string;
  };
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

export type ReportDetailPayload = {
  id: string;
  caseId: string | null;
  crimeCategory: string;
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
