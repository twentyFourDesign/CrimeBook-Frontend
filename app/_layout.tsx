import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/auth/AuthContext";
import { ReportDraftProvider } from "../src/report/ReportDraftContext";
import { VerificationDraftProvider } from "../src/verification/VerificationDraftContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VerificationDraftProvider>
          <ReportDraftProvider>
            <Slot />
          </ReportDraftProvider>
        </VerificationDraftProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
