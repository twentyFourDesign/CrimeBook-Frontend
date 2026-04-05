import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox } from "react-native";
import { AuthProvider } from "../src/auth/AuthContext";
import { AppDataCacheProvider } from "../src/cache/AppDataCacheContext";
import { ReportDraftProvider } from "../src/report/ReportDraftContext";
import { VerificationDraftProvider } from "../src/verification/VerificationDraftContext";
import { ThemeProvider } from "../src/theme/ThemeContext";

// Suppress known Expo Go + Google Maps native warnings that appear during development.
// These are harmless in Expo Go — Google Maps requires a custom dev build. 
// Remove this block once the production build is being used.
LogBox.ignoreLogs([
  "Invalid view returned from registry, expecting AIRGoogleMap",
  "AIRGoogleMap",
  "RNMapsAirModule",
  "TurboModuleRegistry.getEnforcing",
  "Invariant Violation: TurboModuleRegistry",
  "Module RNMaps",
]);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppDataCacheProvider>
            <VerificationDraftProvider>
              <ReportDraftProvider>
                <Slot />
              </ReportDraftProvider>
            </VerificationDraftProvider>
          </AppDataCacheProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
