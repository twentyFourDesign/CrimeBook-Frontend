export type AppUser = {
  id: string;
  email: string;
  name: string;
  role:
    | "CITIZEN"
    | "VERIFIED_COMMUNITY_MEMBER"
    | "POLICE_OFFICER"
    | "POLICE_COMMAND"
    | "ENTERPRISE_SECURITY"
    | "SYSTEM_ADMIN";
  isEmailVerified: boolean;
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
