import AsyncStorage from '@react-native-async-storage/async-storage';
import { initStorage, STORAGE_VERSION, KEYS } from '../lib/storage';

// AsyncStorage is mocked in jest.setup.js

describe('Storage schema versioning', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('sets storage version on first init', async () => {
    await initStorage();
    const version = await AsyncStorage.getItem(KEYS.STORAGE_VERSION);
    expect(version).toBe(String(STORAGE_VERSION));
  });

  test('does not throw on re-init with same version', async () => {
    await initStorage();
    await expect(initStorage()).resolves.not.toThrow();
  });
});
