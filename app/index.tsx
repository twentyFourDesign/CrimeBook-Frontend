import { Redirect } from "expo-router";
import { View } from "react-native";
import { CrimeBookLoader } from "../src/components/common/CrimeBookLoader";
import { LoadingState } from "../src/components/common/LoadingState";
import { useAuth } from "../src/auth/AuthContext";
import { getPostAuthRoute } from "../src/auth/routing";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <CrimeBookLoader size="medium" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/onboarding-1" />;
  }

  return <Redirect href={getPostAuthRoute(user)} />;
}
