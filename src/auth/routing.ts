import { AppUser } from "./types";

export function citizenNeedsVerification(user: AppUser): boolean {
  if (user.role !== "CITIZEN") return false;
  if (user.onboardingIntent === "STANDARD_CITIZEN" || user.onboardingIntent === "POLICE") return false;
  if (user.identityVerificationStatus === "approved") return false;
  return user.identityVerificationStatus === "none" || user.identityVerificationStatus === "rejected";
}

/** Where logged-out entry and post-login index should send the user. */
export function getPostAuthRoute(user: AppUser) {
  if (user.role === "POLICE_OFFICER" || user.role === "POLICE_COMMAND") {
    return "/(police)/home" as const;
  }

  if (user.role === "CITIZEN" && user.onboardingIntent === "POLICE") {
    const pa = user.policeApplication;
    if (pa?.status === "PENDING") {
      return "/(auth)/verify/police-review" as const;
    }
    if (pa?.status === "REJECTED") {
      return "/(auth)/verify/police-step1" as const;
    }
    if (!pa) {
      return "/(auth)/verify/police-step1" as const;
    }
  }

  if (user.role === "VERIFIED_COMMUNITY_MEMBER") {
    return "/(citizen)/home" as const;
  }

  if (user.role !== "CITIZEN") {
    return "/(citizen)/home" as const;
  }

  if (user.identityVerificationStatus === "pending") {
    return "/(auth)/verify/citizen-review" as const;
  }

  if (user.onboardingIntent === "STANDARD_CITIZEN") {
    return "/(citizen)/home" as const;
  }

  if (user.identityVerificationStatus === "none" || user.identityVerificationStatus === "rejected") {
    if (user.onboardingIntent == null) {
      return "/(auth)/choose-role" as const;
    }
    if (user.onboardingIntent === "VERIFIED_COMMUNITY") {
      return "/(auth)/verify/citizen-step1" as const;
    }
    return "/(citizen)/home" as const;
  }

  return "/(citizen)/home" as const;
}

/** @deprecated Prefer getPostAuthRoute — kept for any call sites that only branch on role. */
export function getRoleHomeRoute(user: AppUser) {
  return getPostAuthRoute(user);
}
