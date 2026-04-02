import { AppUser } from "./types";

export function getRoleHomeRoute(user: AppUser) {
  if (user.role === "POLICE_OFFICER" || user.role === "POLICE_COMMAND") {
    return "/(police)/home" as const;
  }
  return "/(citizen)/community" as const;
}
