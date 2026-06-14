import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// INCREMENT THIS when data structure changes
// Add a migration function below when you do
export const STORAGE_VERSION = 1;
const VERSION_KEY = 'harlo_storage_version';

// Keys — all in one place, never use magic strings elsewhere
export const KEYS = {
  STORAGE_VERSION:      'harlo_storage_version',
  ONBOARDING_COMPLETE:  'harlo_onboarding_complete',
  ONBOARDING_ANSWERS:   'harlo_onboarding_answers',
  NOTIFICATIONS_ASKED:  'harlo_notifications_asked',
  DISCLAIMER_DISMISSED: 'harlo_disclaimer_dismissed',
  MOOD_LOG:             'harlo_mood_log',
  DATA_SHARING_CONSENT: 'harlo_data_sharing_consent',
  FIRST_OPEN_DATE:      'harlo_first_open_date',
  // SecureStore keys (sensitive data):
  DEVICE_ID:            'harlo_device_id',
  SUBSCRIPTION_STATUS:  'harlo_subscription_status',
  CONVERSATION_CACHE:   'harlo_conversation_cache',
} as const;

// Run on every app start — checks version and migrates if needed
export async function initStorage(): Promise<void> {
  const storedVersion = await AsyncStorage.getItem(VERSION_KEY);
  const version = storedVersion ? parseInt(storedVersion) : 0;

  if (version < 1) {
    await migrateToV1();
  }
  // Add: if (version < 2) { await migrateToV2(); }

  await AsyncStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
}

async function migrateToV1(): Promise<void> {
  // V1 is the initial version — nothing to migrate from
  // This function exists as a template for future migrations
  console.log('[Storage] Initialized at version 1');
}

// GDPR: Delete all user data
export async function deleteAllUserData(): Promise<void> {
  const asyncKeys = Object.values(KEYS).filter(k =>
    !['harlo_device_id', 'harlo_subscription_status', 'harlo_conversation_cache'].includes(k)
  );
  await AsyncStorage.multiRemove(asyncKeys);
  await SecureStore.deleteItemAsync(KEYS.CONVERSATION_CACHE);
  // Note: keep deviceId and subscription status for RevenueCat restore
  // User can contact support to delete those
}
