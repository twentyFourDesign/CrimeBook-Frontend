import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { getRoleHomeRoute } from "../../src/auth/routing";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user) {
    return <Redirect href={getRoleHomeRoute(user)} />;
  }

  return <Slot />;
}