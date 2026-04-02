import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";

export default function PoliceLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "POLICE_OFFICER" && user.role !== "POLICE_COMMAND") {
    return <Redirect href="/(citizen)/community" />;
  }

  return <Slot />;
}
