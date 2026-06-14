import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTENT_VERSION = 'v1';
const CONTENT_URL = `${process.env.EXPO_PUBLIC_PROXY_URL}/content_${CONTENT_VERSION}.json`;

export interface DailyPrompt {
  day: number;
  prompt: string;
}

export interface WeeklyTheme {
  week: number;
  title: string;
  body: string;
}

export interface HarloContent {
  version: string;
  dailyPrompts: DailyPrompt[];
  weeklyThemes: WeeklyTheme[];
}

export async function loadContent(): Promise<HarloContent> {
  try {
    const response = await fetch(CONTENT_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('fetch failed');
    const remote: HarloContent = await response.json();
    await AsyncStorage.setItem('harlo_content_cache', JSON.stringify({ data: remote, cachedAt: Date.now() }));
    return remote;
  } catch {
    try {
      const cached = await AsyncStorage.getItem('harlo_content_cache');
      if (cached) return JSON.parse(cached).data;
    } catch { /* fall through */ }
    return BUNDLE_CONTENT;
  }
}

export function getDailyPrompt(content: HarloContent, dayNumber: number): string {
  const prompt = content.dailyPrompts.find(p => p.day === dayNumber);
  if (!prompt) {
    const cycled = content.dailyPrompts[(dayNumber - 1) % content.dailyPrompts.length];
    return cycled?.prompt ?? "What's been on your mind today?";
  }
  return prompt.prompt;
}

export function getCurrentWeekTheme(content: HarloContent, dayNumber: number): WeeklyTheme | null {
  const weekNumber = Math.ceil(dayNumber / 7);
  return content.weeklyThemes.find(t => t.week === weekNumber) ?? null;
}

const BUNDLE_CONTENT: HarloContent = {
  version: 'bundle_v1',
  dailyPrompts: [
    { day: 1, prompt: 'What does the quiet feel like today?' },
    { day: 2, prompt: 'What\'s something you did today that was purely for you?' },
    { day: 3, prompt: 'When you think about your child right now, what feeling comes up first?' },
    { day: 4, prompt: 'What part of your day surprised you — good or hard?' },
    { day: 5, prompt: 'Who checked in on you this week? And who didn\'t?' },
    { day: 6, prompt: 'What would you tell yourself six months from now?' },
    { day: 7, prompt: 'You\'ve been here 7 days. What\'s shifted, even slightly?' },
  ],
  weeklyThemes: [
    {
      week: 1,
      title: 'Why you feel guilty for being proud',
      body: 'Most parents feel two things at once when their child leaves: pride that they raised someone capable enough to go, and grief that they\'re gone. Both are real. Both make sense. You don\'t have to choose.',
    },
  ],
};
