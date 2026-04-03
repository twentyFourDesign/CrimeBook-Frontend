import {
  ApiResponse,
  AppUser,
  AuthTokens,
  CitizenProfilePayload,
  CrimeMediaUploadResult,
  FeedReportItem,
  MyReportItem,
  OfficerProfilePayload,
  OnboardingIntent,
  PoliceIncidentForMap,
  PoliceCaseTimelinePayload,
  PoliceCaseItem,
  PoliceCaseDetail,
  ReportDetailPayload,
  VerificationSubmitBody,
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

  const payload = (await response.json()) as ApiResponse<T>;
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

  const payload = (await response.json()) as ApiResponse<T>;
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

  const payload = (await response.json()) as ApiResponse<T>;
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
  folder: "reports" | "verification" | "avatars";
}) {
  const form = new FormData();
  form.append("folder", input.folder);
  form.append(
    "file",
    { uri: input.uri, name: input.name, type: input.mimeType } as unknown as Blob
  );
  return requestAuthenticatedMultipart<CrimeMediaUploadResult>("/api/media/upload", form);
}

export function fetchPoliceIncidentsForMap() {
  return requestAuthenticated<{ incidents: PoliceIncidentForMap[] }>("/api/police/incidents", {
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
