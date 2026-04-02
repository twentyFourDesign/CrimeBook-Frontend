import { AppUser } from "./types";

export function citizenNeedsVerification(user: AppUser): boolean {
  if (user.role !== "CITIZEN") return false;
  if (user.identityVerificationStatus === "approved") return false;
  return user.identityVerificationStatus === "none" || user.identityVerificationStatus === "rejected";
}

/** Where logged-out entry and post-login index should send the user. */
export function getPostAuthRoute(user: AppUser) {
  if (user.role === "POLICE_OFFICER" || user.role === "POLICE_COMMAND") {
    return "/(police)/home" as const;
  }

  if (user.role === "VERIFIED_COMMUNITY_MEMBER") {
    return "/(citizen)/community" as const;
  }

  if (user.role !== "CITIZEN") {
    return "/(citizen)/community" as const;
  }

  if (user.identityVerificationStatus === "pending") {
    return "/(auth)/verify/citizen-review" as const;
  }

  if (user.identityVerificationStatus === "none" || user.identityVerificationStatus === "rejected") {
    return "/(auth)/verify/citizen-step1" as const;
  }

  return "/(citizen)/community" as const;
}

/** @deprecated Prefer getPostAuthRoute — kept for any call sites that only branch on role. */
export function getRoleHomeRoute(user: AppUser) {
  return getPostAuthRoute(user);
}
