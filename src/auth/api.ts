import {
  ApiResponse,
  AppUser,
  AuthTokens,
  CitizenProfilePayload,
  CrimeMediaUploadResult,
  CommunityReportPayload,
  FeedReportItem,
  MyReportItem,
  ReportConfirmationListItem,
  OfficerProfilePayload,
  OnboardingIntent,
  PoliceIncidentForMap,
  PoliceCaseTimelinePayload,
  PoliceCaseItem,
  PoliceCaseDetail,
  PoliceSosActiveItem,
  PublicAppealItem,
  UserBadgeEntry,
  ReportDetailPayload,
  ReportMessageItem,
  VerificationSubmitBody,
  CommunityGroup,
  GroupPost,
  GroupInvite,
  GroupMessage,
  VoteType,
  IncidentVoteResponse,
  IncidentComment,
  IncidentCommentsResponse,
  SosUpdateResult,
} from "./types";
import { readTokens, saveTokens } from "./storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Invalid server response (${response.status})`);
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data as T;
}

export function signup(input: { name: string; email: string; password: string }) {
  return request<{ email: string; requiresOtp: boolean }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifySignupOtp(input: { email: string; code: string }) {
  return request<{ user: AppUser } & AuthTokens>("/api/auth/verify-signup-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginWithPassword(input: { email: string; password: string }) {
  return request<
    | ({ user: AppUser } & AuthTokens)
    | { requiresOtp: boolean; email: string }
  >("/api/auth/login/password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function requestLoginOtp(input: { email: string }) {
  return request<Record<string, never>>("/api/auth/login/otp/request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resendSignupOtp(input: { email: string }) {
  return request<{ sent: boolean }>("/api/auth/resend-signup-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyLoginOtp(input: { email: string; code: string }) {
  return request<{ user: AppUser } & AuthTokens>("/api/auth/login/otp/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refreshToken(input: { refreshToken: string }) {
  return request<AuthTokens>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function requestAuthenticatedMultipart<T>(path: string, form: FormData): Promise<T> {
  const tokens = await readTokens();
  if (!tokens) throw new Error("Not signed in");

  const run = async (accessToken: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

  let response = await run(tokens.accessToken);
  if (response.status === 401) {
    const tokensOut = await refreshToken({ refreshToken: tokens.refreshToken });
    await saveTokens(tokensOut);
    response = await run(tokensOut.accessToken);
  }

  const text = await response.text();
  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Invalid server response (${response.status})`);
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data as T;
}

async function requestAuthenticated<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = await readTokens();
  if (!tokens) throw new Error("Not signed in");

  const run = async (accessToken: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    });

  let response = await run(tokens.accessToken);
  if (response.status === 401) {
    const tokensOut = await refreshToken({ refreshToken: tokens.refreshToken });
    await saveTokens(tokensOut);
    response = await run(tokensOut.accessToken);
  }

  const text = await response.text();
  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Invalid server response (${response.status})`);
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data as T;
}

export function fetchMe(accessToken: string) {
  return request<{ user: AppUser }>("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function logout(refreshTokenValue: string) {
  return request<Record<string, never>>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

export function submitCitizenVerification(body: VerificationSubmitBody) {
  return requestAuthenticated<{ submitted: boolean }>("/api/citizen/verification", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function setOnboardingIntent(intent: OnboardingIntent) {
  return requestAuthenticated<{ user: AppUser }>("/api/users/me/onboarding-intent", {
    method: "PATCH",
    body: JSON.stringify({ intent }),
  });
}

export function submitPoliceApplication(body: {
  badgeNumber: string;
  rank: string;
  department: string;
  precinct: string;
  unitCode?: string;
  idDocumentUrl?: string;
}) {
  return requestAuthenticated<{ submitted: boolean }>("/api/police/apply", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchMyReports() {
  return requestAuthenticated<{ reports: MyReportItem[] }>("/api/citizen/my-reports", {
    method: "GET",
  });
}

export function fetchCitizenProfile() {
  return requestAuthenticated<{ profile: CitizenProfilePayload }>("/api/citizen/profile", {
    method: "GET",
  });
}

export function updateCitizenProfile(body: {
  name?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  homeAddress?: string | null;
  homeLatitude?: number | null;
  homeLongitude?: number | null;
  occupation?: string | null;
  preferredLanguage?: string;
}) {
  return requestAuthenticated<{ user: AppUser; profile: CitizenProfilePayload }>("/api/citizen/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function fetchOfficerProfile() {
  return requestAuthenticated<{ profile: OfficerProfilePayload }>("/api/police/profile", {
    method: "GET",
  });
}

export function updateOfficerProfile(body: {
  avatarUrl?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
}) {
  return requestAuthenticated<{ profile: OfficerProfilePayload }>("/api/police/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function fetchReportDetail(reportId: string) {
  return requestAuthenticated<{ report: ReportDetailPayload }>(`/api/citizen/my-reports/${reportId}`, {
    method: "GET",
  });
}

/** Community feed drill-down: report summary + my confirmation state */
export function fetchCommunityReport(reportId: string) {
  return requestAuthenticated<{ report: CommunityReportPayload }>(`/api/citizen/reports/${reportId}`, {
    method: "GET",
  });
}

export function fetchReportConfirmations(reportId: string) {
  return requestAuthenticated<{ items: ReportConfirmationListItem[] }>(
    `/api/citizen/reports/${reportId}/confirmations`,
    { method: "GET" }
  );
}

export function submitReportConfirmation(
  reportId: string,
  body: { isConfirmed: boolean; comment?: string }
) {
  return requestAuthenticated<{ communityConfirmCount: number }>(
    `/api/citizen/reports/${reportId}/confirmations`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function resolveReportIncident(
  reportId: string,
  body: { status: "CONFIRMED" | "DISPUTED"; notes?: string }
) {
  return requestAuthenticated<{ nextStatus: string }>(
    `/api/citizen/reports/${reportId}/resolve`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function fetchReportMessages(reportId: string) {
  return requestAuthenticated<{ messages: ReportMessageItem[] }>(`/api/citizen/my-reports/${reportId}/messages`, {
    method: "GET",
  });
}

export function sendReportMessage(reportId: string, content: string) {
  return requestAuthenticated<{ message: ReportMessageItem }>(`/api/citizen/my-reports/${reportId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function fetchCaseMessages(caseId: string) {
  return requestAuthenticated<{ messages: ReportMessageItem[] }>(`/api/police/cases/${caseId}/messages`, {
    method: "GET",
  });
}

export function sendCaseMessage(caseId: string, content: string) {
  return requestAuthenticated<{ message: ReportMessageItem }>(`/api/police/cases/${caseId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function fetchPoliceIncidentDetail(reportId: string) {
  return requestAuthenticated<{ report: ReportDetailPayload }>(`/api/police/incidents/${reportId}`, {
    method: "GET",
  });
}

export function takePoliceIncident(reportId: string) {
  return requestAuthenticated<{ caseId: string; caseNumber: string }>(`/api/police/incidents/${reportId}/take`, {
    method: "POST",
  });
}

export function uploadCrimeMediaFile(input: {
  uri: string;
  name: string;
  mimeType: string;
  folder: "reports" | "verification" | "avatars" | "community";
}) {
  const form = new FormData();
  form.append("folder", input.folder);
  form.append(
    "file",
    { uri: input.uri, name: input.name, type: input.mimeType } as unknown as Blob
  );
  return requestAuthenticatedMultipart<CrimeMediaUploadResult>("/api/media/upload", form);
}

export function fetchPoliceIncidentsForMap(query?: { time?: string; ne?: string; sw?: string; status?: string; category?: string }) {
  const params = new URLSearchParams();
  if (query?.time) params.set("time", query.time);
  if (query?.ne) params.set("ne", query.ne);
  if (query?.sw) params.set("sw", query.sw);
  if (query?.status) params.set("status", query.status);
  if (query?.category) params.set("category", query.category);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestAuthenticated<{ incidents: PoliceIncidentForMap[] }>(`/api/police/incidents${suffix}`, {
    method: "GET",
  });
}

export function fetchFeedReports() {
  return requestAuthenticated<{ reports: FeedReportItem[] }>("/api/feed", {
    method: "GET",
  });
}

export function fetchPoliceCases() {
  return requestAuthenticated<{ cases: PoliceCaseItem[] }>("/api/police/cases", {
    method: "GET",
  });
}

export function fetchPoliceCase(caseId: string) {
  return requestAuthenticated<{ case: PoliceCaseDetail }>(`/api/police/cases/${caseId}`, {
    method: "GET",
  });
}

export function updatePoliceCaseStatus(caseId: string, status: string) {
  return requestAuthenticated<{ case: { id: string; status: string } }>(`/api/police/cases/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function saveCaseNote(caseId: string, content: string) {
  return requestAuthenticated<{ noteId: string; createdAt: string }>(
    `/api/police/cases/${caseId}/notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }
  );
}

export function addCaseSuspect(caseId: string, description: string, alias?: string) {
  return requestAuthenticated<{ suspectId: string; description: string; createdAt: string }>(
    `/api/police/cases/${caseId}/suspects`,
    {
      method: "POST",
      body: JSON.stringify({ description, alias }),
    }
  );
}

export function addCaseEvidence(input: {
  caseId: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  evidenceType: "PHOTO" | "VIDEO" | "DOCUMENT" | "OTHER" | "STATEMENT" | "BODYCAM";
  description?: string;
}) {
  const { caseId, ...body } = input;
  return requestAuthenticated<{ evidenceId: string; createdAt: string }>(
    `/api/police/cases/${caseId}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function fetchPoliceCaseTimeline(caseId: string) {
  return requestAuthenticated<PoliceCaseTimelinePayload>(`/api/police/cases/${caseId}/notes`, {
    method: "GET",
  });
}

export function fetchCommunityGroups(query?: { lat?: number; lng?: number; radiusKm?: number }) {
  const q = new URLSearchParams();
  if (query?.lat !== undefined) q.set("lat", String(query.lat));
  if (query?.lng !== undefined) q.set("lng", String(query.lng));
  if (query?.radiusKm !== undefined) q.set("radiusKm", String(query.radiusKm));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return requestAuthenticated<{
    groups: CommunityGroup[];
  }>(`/api/community/groups${suffix}`, { method: "GET" });
}

export function createCommunityGroup(body: {
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}) {
  return requestAuthenticated<{ group: { id: string; name: string } }>("/api/community/groups", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchGroupDetail(groupId: string) {
  return requestAuthenticated<{ group: CommunityGroup }>(`/api/community/groups/${groupId}`, {
    method: "GET",
  });
}

export function joinCommunityGroup(groupId: string) {
  return requestAuthenticated<{ success: boolean }>(`/api/community/groups/${groupId}/join`, {
    method: "POST",
  });
}

export function leaveCommunityGroup(groupId: string) {
  return requestAuthenticated<{ success: boolean }>(`/api/community/groups/${groupId}/leave`, {
    method: "POST",
  });
}

export function fetchGroupPosts(groupId: string) {
  return requestAuthenticated<{ posts: GroupPost[] }>(`/api/community/groups/${groupId}/posts`, {
    method: "GET",
  });
}

export function createGroupPost(
  groupId: string,
  body: {
    content: string;
    imageUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    media?: Array<{
      mediaType: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
      fileUrl: string;
      fileName: string;
      fileSizeBytes: number;
      mimeType: string;
      durationSecs?: number | null;
    }>;
  }
) {
  return requestAuthenticated<{ post: { id: string; createdAt: string } }>(
    `/api/community/groups/${groupId}/posts`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function fetchGroupMessages(groupId: string) {
  return requestAuthenticated<{ messages: GroupMessage[] }>(
    `/api/community/groups/${groupId}/messages`,
    {
      method: "GET",
    }
  );
}

export function sendGroupMessage(groupId: string, content: string) {
  return requestAuthenticated<{ message: GroupMessage }>(
    `/api/community/groups/${groupId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
}

export function inviteToGroup(groupId: string, email: string) {
  return requestAuthenticated<{ success: boolean }>(`/api/community/groups/${groupId}/invites`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function fetchMyInvites() {
  return requestAuthenticated<{ invites: GroupInvite[] }>("/api/users/me/invites", {
    method: "GET",
  });
}

export function respondToGroupInvite(inviteId: string, accept: boolean) {
  return requestAuthenticated<{ success: boolean }>(`/api/users/me/invites/${inviteId}`, {
    method: "PATCH",
    body: JSON.stringify({ accept }),
  });
}

export function fetchMyBadgesAndPoints() {
  return requestAuthenticated<{ userBadges: UserBadgeEntry[]; reputationPoints: number }>(
    "/api/citizen/me/badges",
    { method: "GET" }
  );
}

export function fetchAchievements() {
  return requestAuthenticated<{
    reputationPoints: number;
    trustScore: number;
    userBadges: Array<{ id: string; earnedAt: string; badge: any }>;
    goals: Array<{
      id: string;
      title: string;
      description: string;
      current: number;
      target: number;
      icon: string;
      progress: number;
      isEarned: boolean;
    }>;
  }>("/api/users/me/achievements", { method: "GET" });
}

export function fetchPrivacySettings() {
  return requestAuthenticated<{
    settings: {
      defaultAnonymousReporting: boolean;
      locationSharingEnabled: boolean;
      locationPrecision: string;
      profileVisibility: string;
      dataRetentionConsentAt: string | null;
    };
  }>("/api/citizen/privacy-settings", { method: "GET" });
}

export function updatePrivacySettings(body: {
  defaultAnonymousReporting?: boolean;
  locationSharingEnabled?: boolean;
  locationPrecision?: "exact" | "approximate";
  profileVisibility?: "public" | "members" | "private";
}) {
  return requestAuthenticated<{ settings: Record<string, unknown> }>("/api/citizen/privacy-settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function fetchSafetyRadius() {
  return requestAuthenticated<{ radiusKm: number; updatedAt: string }>("/api/citizen/safety-radius", {
    method: "GET",
  });
}

export function updateSafetyRadius(radiusKm: number) {
  return requestAuthenticated<{ radiusKm: number; updatedAt: string }>("/api/citizen/safety-radius", {
    method: "PATCH",
    body: JSON.stringify({ radiusKm }),
  });
}

export function fetchCitizenAppeals(query?: { lat?: number; lng?: number; radiusKm?: number }) {
  const q = new URLSearchParams();
  if (query?.lat !== undefined) q.set("lat", String(query.lat));
  if (query?.lng !== undefined) q.set("lng", String(query.lng));
  if (query?.radiusKm !== undefined) q.set("radiusKm", String(query.radiusKm));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return requestAuthenticated<{ appeals: PublicAppealItem[] }>(`/api/citizen/appeals${suffix}`, {
    method: "GET",
  });
}

export function startCitizenSos(body: {
  latitude: number;
  longitude: number;
  isSilent?: boolean;
  audioClipUrl?: string | null;
}) {
  return requestAuthenticated<{ sosId: string; status: string; createdAt: string }>("/api/citizen/sos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCitizenSos(sosId: string, status: "CANCELLED" | "RESPONDED") {
  return requestAuthenticated<SosUpdateResult>(
    `/api/citizen/sos/${sosId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

/**
 * Cancel/safe SOS using a PIN.
 * intent = "cancel" maps to CANCELLED; intent = "safe" maps to RESPONDED.
 * The backend returns the same 200 shape regardless of whether it was duress.
 */
export function cancelSosWithPin(
  sosId: string,
  body: { pin: string; intent: "cancel" | "safe" }
) {
  return requestAuthenticated<SosUpdateResult>(
    `/api/citizen/sos/${sosId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

/** Set or update the citizen's SOS cancellation + duress PIN pair. */
export function setSosPins(body: { cancellationPin: string; duressPin: string }) {
  return requestAuthenticated<{ updated: boolean }>("/api/citizen/sos/pin", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Check whether the current user has SOS PINs configured. */
export function checkSosPinsSet() {
  return requestAuthenticated<{ pinsConfigured: boolean }>("/api/citizen/sos/pin/status", {
    method: "GET",
  });
}

/** Append an audio chunk URL (already uploaded to Supabase) to the SOS alert. */
export function postSosAudioChunk(sosId: string, chunkUrl: string) {
  return requestAuthenticated<{ totalChunks: number }>(
    `/api/citizen/sos/${sosId}/audio`,
    {
      method: "POST",
      body: JSON.stringify({ chunkUrl }),
    }
  );
}

export function postSosLocation(
  sosId: string,
  body: { latitude: number; longitude: number; accuracy?: number | null }
) {
  return requestAuthenticated<{ logId: string; loggedAt: string }>(`/api/citizen/sos/${sosId}/location`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function attachSosContacts(
  sosId: string,
  contacts: { name: string; phone: string; email?: string | null }[]
) {
  return requestAuthenticated<{ contactIds: string[]; notifiedCount: number }>(
    `/api/citizen/sos/${sosId}/contacts`,
    {
      method: "POST",
      body: JSON.stringify({ contacts }),
    }
  );
}

export function fetchPoliceActiveSos() {
  return requestAuthenticated<{ alerts: PoliceSosActiveItem[] }>("/api/police/sos/active", {
    method: "GET",
  });
}

export function resolvePoliceSos(sosId: string) {
  return requestAuthenticated<{ sosId: string; status: string; resolvedAt: string | null }>(
    `/api/police/sos/${sosId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "RESPONDED" }),
    }
  );
}

export function createPoliceCaseAppeal(
  caseId: string,
  body: {
    title: string;
    description: string;
    imageUrl?: string | null;
    latitude: number;
    longitude: number;
    radiusKm: number;
    expiresAt?: string | null;
  }
) {
  return requestAuthenticated<{ appeal: PublicAppealItem }>(`/api/police/cases/${caseId}/appeals`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchHeatmapReports(query: { time: string; ne?: string; sw?: string; status?: string; category?: string }) {
  const params = new URLSearchParams();
  if (query.time) params.set("time", query.time);
  if (query.ne) params.set("ne", query.ne);
  if (query.sw) params.set("sw", query.sw);
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestAuthenticated<{
    incidents: Array<{ id: string; latitude: number; longitude: number; weight: number }>;
  }>(`/api/citizen/heatmap${suffix}`, {
    method: "GET",
  });
}

export function fetchReportVotes(reportId: string) {
  return requestAuthenticated<IncidentVoteResponse>(
    `/api/citizen/reports/${reportId}/votes`,
    { method: "GET" }
  );
}

export function submitReportVote(reportId: string, voteType: VoteType | null) {
  return requestAuthenticated<IncidentVoteResponse>(
    `/api/citizen/reports/${reportId}/votes`,
    {
      method: "POST",
      body: JSON.stringify({ voteType }),
    }
  );
}

export function fetchReportComments(reportId: string) {
  return requestAuthenticated<IncidentCommentsResponse>(
    `/api/citizen/reports/${reportId}/comments`,
    { method: "GET" }
  );
}

export function submitReportComment(reportId: string, content: string) {
  return requestAuthenticated<{ comment: IncidentComment }>(
    `/api/citizen/reports/${reportId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
}
