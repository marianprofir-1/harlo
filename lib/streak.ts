import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './storage';

interface StreakData {
  count: number;
  lastDate: string; // "2026-06-14"
}

const MILESTONES = [7, 30, 60, 90] as const;

export async function updateAndGetStreak(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = await AsyncStorage.getItem(KEYS.STREAK);

    if (!raw) {
      await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify({ count: 1, lastDate: today }));
      return 1;
    }

    const data: StreakData = JSON.parse(raw);
    if (data.lastDate === today) return data.count; // already updated today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().split('T')[0];

    const newCount = data.lastDate === yd ? data.count + 1 : 1;
    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify({ count: newCount, lastDate: today }));
    return newCount;
  } catch { return 1; }
}

export async function getStreak(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STREAK);
    if (!raw) return 0;
    return (JSON.parse(raw) as StreakData).count;
  } catch { return 0; }
}

// Returns the milestone day if this is the first time reaching it, null otherwise
export async function checkMilestone(dayNumber: number): Promise<number | null> {
  if (!(MILESTONES as readonly number[]).includes(dayNumber)) return null;
  try {
    const raw = await AsyncStorage.getItem(KEYS.MILESTONE_SEEN);
    const seen: number[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(dayNumber)) return null;
    await AsyncStorage.setItem(KEYS.MILESTONE_SEEN, JSON.stringify([...seen, dayNumber]));
    return dayNumber;
  } catch { return null; }
}
