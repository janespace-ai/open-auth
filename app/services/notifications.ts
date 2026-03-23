import { INotificationService } from "./interfaces";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export class NotificationService implements INotificationService {
  private tapHandlers = new Set<(data: Record<string, unknown>) => void>();

  constructor() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      for (const handler of this.tapHandlers) {
        try {
          handler(data as Record<string, unknown>);
        } catch {
          /* handler error */
        }
      }
    });
  }

  async registerPushToken(pairId: string): Promise<void> {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // TODO: Send token + pairId to relay server
    if (__DEV__) {
      console.log(`[Notifications] Push token registered: ${token} for pairId: ${pairId}`);
    }
  }

  async showLocalNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  }

  onNotificationTap(handler: (data: Record<string, unknown>) => void): () => void {
    this.tapHandlers.add(handler);
    return () => {
      this.tapHandlers.delete(handler);
    };
  }
}
