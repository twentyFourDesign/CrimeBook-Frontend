import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { getPostAuthRoute } from "../../src/auth/routing";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const inVerifyFlow = segments.includes("verify");
  const atChooseRole = segments.includes("choose-role");
  /** Logged-in user is still on OTP until `replace` runs — without this, layout redirects to citizen-step1 before choose-role. */
  const atOtp = segments.includes("otp");

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user) {
    if (inVerifyFlow || atChooseRole || atOtp) {
      return <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: "slide_from_right" }} />;
    }
    return <Redirect href={getPostAuthRoute(user)} />;
  }

  if (inVerifyFlow || atChooseRole) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: "slide_from_right" }} />
  );
}