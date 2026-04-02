import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";

/** Citizen routes: `Slot` (same pattern as police layout) — avoids native Stack mount issues on Fabric. */
export default function CitizenLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.role === "POLICE_OFFICER" || user.role === "POLICE_COMMAND") {
    return <Redirect href="/(police)/home" />;
  }

  return <Slot />;
}
