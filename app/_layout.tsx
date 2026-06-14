import '../global.css';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppProvider, useApp } from '../contexts/AppContext';
import { getOrCreateDeviceId } from '../lib/identity';
import { initStorage, KEYS } from '../lib/storage';
import { initAnalytics, trackEvent } from '../lib/analytics';
import { initRevenueCat, checkAccess } from '../lib/revenuecat';
import { requestNotificationPermission, scheduleDefaultNotifications } from '../lib/notifications';

// Sync system color-scheme preference to the `dark` class on <html>.
// Required because tailwind.config.js uses darkMode: 'class', which avoids a
// react-native-css-interop bug where colorScheme.set() throws in 'media' mode
// when NativeWind injects its stylesheet into <head> at runtime.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = (dark: boolean) =>
    document.documentElement.classList.toggle('dark', dark);
  apply(mq.matches);
  mq.addEventListener('change', (e) => apply(e.matches));
}

function RootNavigator() {
  const router = useRouter();
  const { setDeviceId } = useApp();
  const [isReady, setIsReady] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        await initStorage();
        const id = await getOrCreateDeviceId();
        setDeviceId(id);
        await initAnalytics(id);
        trackEvent('app_opened');

        const done = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
        if (!done) {
          setDestination('/onboarding/welcome');
          return;
        }

        // Initialize RevenueCat and check subscription access
        try {
          await initRevenueCat(id);
          const { hasAccess } = await checkAccess();

          if (!hasAccess) {
            // Check if user snoozed the paywall ("maybe later")
            const snooze = await AsyncStorage.getItem('harlo_paywall_snooze');
            const snoozeExpired = !snooze || new Date(snooze) <= new Date();
            if (snoozeExpired) {
              setDestination('/paywall');
              return;
            }
          }
        } catch {
          // RevenueCat failure — grant access silently, never block user
        }

        // Ask for notification permission on day 2+ (not day 1)
        const notifAsked = await AsyncStorage.getItem(KEYS.NOTIFICATIONS_ASKED);
        const firstOpen = await AsyncStorage.getItem(KEYS.FIRST_OPEN_DATE);
        if (!notifAsked && firstOpen) {
          const start = new Date(firstOpen);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 1) {
            const granted = await requestNotificationPermission();
            if (granted) await scheduleDefaultNotifications();
          }
        }

      } catch (e) {
        console.warn('[RootLayout] Init error:', e);
      } finally {
        setIsReady(true);
      }
    }
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate after the Stack is mounted (second effect fires post-render)
  useEffect(() => {
    if (isReady && destination) {
      router.replace(destination as Parameters<typeof router.replace>[0]);
    }
  }, [isReady, destination, router]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </ErrorBoundary>
  );
}
