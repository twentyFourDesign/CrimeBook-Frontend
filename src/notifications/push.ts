import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../auth/AuthContext";
import { registerDeviceToken } from "../auth/api";

export function usePushNotifications() {
  const { user } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      if (!user) return;

      try {
        const Notifications = await import("expo-notifications");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("crimebook_alerts", {
            name: "Crime Alerts",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        }

        const existingPerm = await Notifications.getPermissionsAsync();
        let finalStatus = existingPerm.status;
        if (finalStatus !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }
        if (finalStatus !== "granted") return;

        // Use Expo push token — Expo's infrastructure handles FCM delivery
        // so there is no Firebase sender mismatch between app and backend.
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (!projectId) {
          console.warn("[push] No EAS projectId found in app config");
          return;
        }

        const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
        const expoToken = tokenResult.data?.trim();
        if (!expoToken) return;
        if (registeredTokenRef.current === expoToken) return;

        await registerDeviceToken({
          token: expoToken,
          platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
        });

        registeredTokenRef.current = expoToken;
      } catch (e) {
        console.warn("[push] registration failed", e);
      }
    };

    setup();
  }, [user]);

  useEffect(() => {
    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        receivedSub = Notifications.addNotificationReceivedListener(() => {
          // Foreground notifications displayed by setNotificationHandler above.
        });
        responseSub = Notifications.addNotificationResponseReceivedListener(() => {
          // Deep-link handling from tapped notifications.
        });
      } catch (e) {
        console.warn("[push] listener setup skipped", e);
      }
    })();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);
}
