import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { CrimeBookLoader } from "../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../src/components/common/LoadingState";
import { useAuth } from "../../src/auth/AuthContext";
import { SosWatcherOverlay } from "../../src/components/police/SosWatcherOverlay";

export default function PoliceLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState fullScreen message="Loading…" />;
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "POLICE_OFFICER" && user.role !== "POLICE_COMMAND") {
    return <Redirect href="/(citizen)/home" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: "slide_from_right" }} />
      <SosWatcherOverlay />
    </View>
  );
}
