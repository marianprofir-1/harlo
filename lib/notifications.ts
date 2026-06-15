import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';
  await AsyncStorage.setItem(KEYS.NOTIFICATIONS_ASKED, 'true');
  return granted;
}

// Record the hour the user opens the app — used for notification time personalization
export async function trackOpenTime(): Promise<void> {
  try {
    const hour = new Date().getHours();
    const raw = await AsyncStorage.getItem(KEYS.OPEN_TIMES);
    const times: number[] = raw ? JSON.parse(raw) : [];
    times.unshift(hour);
    await AsyncStorage.setItem(KEYS.OPEN_TIMES, JSON.stringify(times.slice(0, 14)));
  } catch { /* non-critical */ }
}

// Find the hour the user most commonly opens the app (needs 5+ data points)
async function getPreferredHour(): Promise<{ hour: number; minute: number }> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.OPEN_TIMES);
    if (!raw) return { hour: 8, minute: 30 };
    const times: number[] = JSON.parse(raw);
    if (times.length < 5) return { hour: 8, minute: 30 };

    // Find mode hour
    const counts: Record<number, number> = {};
    for (const t of times) counts[t] = (counts[t] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const mode = parseInt(sorted[0][0]);
    return { hour: mode, minute: 0 };
  } catch { return { hour: 8, minute: 30 }; }
}

export async function scheduleDefaultNotifications(dailyQuestion?: string): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { hour, minute } = await getPreferredHour();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Harlo',
      body: dailyQuestion ?? 'Harlo has a question for you today.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Harlo', body: "How's the quiet tonight?" },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
