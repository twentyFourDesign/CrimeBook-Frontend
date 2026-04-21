import { ApiResponse, ReportMediaPayload, UserBadgeEntry } from "../auth/types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export type SubmitReportBody = {
  crimeSlug: string;
  description: string;
  title?: string;
  locationText?: string;
  latitude?: number | null;
  longitude?: number | null;
  incidentTime: string;
  isHappeningNow?: boolean;
  isAnonymous: boolean;
  media?: ReportMediaPayload[];
  authenticityAnalysis?: any;
};

export type SubmitReportResult = {
  report: {
    id: string;
    displayCaseId: string;
    status: string;
  };
  newBadge?: UserBadgeEntry;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data as T;
}

export async function submitIncidentReport(
  accessToken: string,
  body: SubmitReportBody
): Promise<SubmitReportResult> {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  return parseResponse<SubmitReportResult>(response);
}
