import { Redirect, Slot, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { citizenNeedsVerification } from "../../src/auth/routing";

/** Citizen routes: `Slot` (same pattern as police layout) — avoids native Stack mount issues on Fabric. */
export default function CitizenLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.role === "POLICE_OFFICER" || user.role === "POLICE_COMMAND") {
    const leaf = String(segments[segments.length - 1] ?? "");
    const inReportFlow =
      leaf.startsWith("report-step") || leaf === "report-success" || leaf === "create-alert";
    if (inReportFlow) {
      return <Slot />;
    }
    return <Redirect href="/(police)/home" />;
  }

  if (user.role === "CITIZEN" && user.onboardingIntent === "POLICE") {
    const pa = user.policeApplication;
    if (!pa || pa.status === "REJECTED") {
      return <Redirect href="/(auth)/verify/police-step1" />;
    }
    if (pa.status === "PENDING") {
      return <Redirect href="/(auth)/verify/police-review" />;
    }
  }

  if (user.role === "CITIZEN" && user.onboardingIntent == null) {
    return <Redirect href="/(auth)/choose-role" />;
  }

  if (citizenNeedsVerification(user)) {
    return <Redirect href="/(auth)/verify/citizen-step1" />;
  }

  return <Slot />;
}
