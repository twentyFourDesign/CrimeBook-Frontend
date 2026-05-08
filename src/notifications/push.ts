import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "../auth/AuthContext";
import { registerDeviceToken } from "../auth/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      if (!user) return;

      try {
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

        const tokenResult = await Notifications.getDevicePushTokenAsync();
        const nativeToken = String(tokenResult.data ?? "").trim();
        if (!nativeToken) return;
        if (registeredTokenRef.current === nativeToken) return;

        await registerDeviceToken({
          token: nativeToken,
          platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
        });

        registeredTokenRef.current = nativeToken;
      } catch (e) {
        console.warn("[push] registration failed", e);
      }
    };

    setup();
  }, [user]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Foreground notifications are displayed by setNotificationHandler above.
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      // Keep listener for deep-link/navigation handling from tapped notifications.
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
}
