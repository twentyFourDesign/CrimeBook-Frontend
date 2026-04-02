import { Redirect, Slot, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { getPostAuthRoute } from "../../src/auth/routing";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const inVerifyFlow = segments.includes("verify");

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user) {
    if (inVerifyFlow) {
      return <Slot />;
    }
    return <Redirect href={getPostAuthRoute(user)} />;
  }

  if (inVerifyFlow) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}