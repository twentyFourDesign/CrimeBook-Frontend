import { ApiResponse, AppUser, AuthTokens } from "./types";

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
