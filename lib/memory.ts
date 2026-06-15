import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './storage';

export interface SessionMemory {
  date: string;       // "2026-06-14" — ISO date only
  dayNumber: number;
  moments: string[];  // 2-3 substantive user messages
}

export async function saveSessionMemory(memory: SessionMemory): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_MEMORIES);
    const all: SessionMemory[] = raw ? JSON.parse(raw) : [];
    // Replace today's entry if exists, then prepend
    const filtered = all.filter(m => m.date !== memory.date);
    filtered.unshift(memory);
    await AsyncStorage.setItem(KEYS.SESSION_MEMORIES, JSON.stringify(filtered.slice(0, 30)));
  } catch { /* non-critical */ }
}

export async function getYesterdayMemory(): Promise<SessionMemory | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_MEMORIES);
    if (!raw) return null;
    const all: SessionMemory[] = JSON.parse(raw);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().split('T')[0];
    return all.find(m => m.date === yd) ?? null;
  } catch { return null; }
}

export async function getWeekMemories(): Promise<SessionMemory[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_MEMORIES);
    if (!raw) return [];
    const all: SessionMemory[] = JSON.parse(raw);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return all.filter(m => m.date >= cutoffStr);
  } catch { return []; }
}

// Extract 2-3 memorable user messages from a session for storage
export function extractMoments(messages: Array<{ role: string; content: string }>): string[] {
  return messages
    .filter(m => m.role === 'user')
    .map(m => m.content.trim())
    .filter(c => c.length > 20)
    .slice(0, 3);
}

// Build context string appended to the system prompt — includes memory and day phase
export function buildMemoryContext(memory: SessionMemory | null, dayNumber: number): string {
  const parts: string[] = [];

  if (memory?.moments.length) {
    const quoted = memory.moments.map(m => `"${m}"`).join(' — ');
    parts.push(`YESTERDAY'S CONVERSATION: The user shared: ${quoted}. If it feels natural today, you can gently reference this — but don't force it.`);
  }

  const phase =
    dayNumber <= 7
      ? 'CONVERSATION PHASE: Present focus (day 1-7). Stay close to what they feel right now. Listen more than reflect.'
      : dayNumber <= 14
        ? 'CONVERSATION PHASE: Discovery (day 8-14). Help them notice patterns. What keeps coming up? What surprises them?'
        : 'CONVERSATION PHASE: Future self (day 15+). Gently invite reflection on who they are becoming in this new chapter.';
  parts.push(phase);

  return parts.join('\n\n');
}
