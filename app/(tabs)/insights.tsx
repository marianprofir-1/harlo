import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import { sendToHarlo } from '../../lib/ai';
import { trackEvent } from '../../lib/analytics';

interface MoodEntry {
  score: number;
  date: string;
}

const SCORE_LABELS: Record<number, string> = {
  5: 'Much better',
  4: 'A bit better',
  3: 'About the same',
  2: 'A bit harder',
  1: 'Harder',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ScoreDot({ score }: { score: number }) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];
  const color = score >= 4 ? theme.success : score === 3 ? theme.warning : theme.danger;
  return (
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
  );
}

async function getDayNumber(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.FIRST_OPEN_DATE);
    if (!stored) return 1;
    const start = new Date(stored);
    const now = new Date();
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((nowDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  } catch {
    return 1;
  }
}

function buildReflectionPrompt(moodLog: MoodEntry[]): string {
  const summary = moodLog.slice(0, 30).map(e =>
    `${formatDate(e.date)}: ${SCORE_LABELS[e.score] ?? 'Unknown'}`
  ).join(', ');
  return `This is a special reflection for the user's first month with Harlo. Based on their mood check-in history over 30 days (${summary}), write a warm, honest, 3-4 sentence reflection. Acknowledge what they've been through. Don't promise it gets easier — just honour that they showed up.`;
}

export default function InsightsScreen() {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [moodLog, setMoodLog] = useState<MoodEntry[]>([]);
  const [dayNumber, setDayNumber] = useState(1);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);

  useEffect(() => {
    getDayNumber().then(setDayNumber);
    AsyncStorage.getItem(KEYS.MOOD_LOG).then(raw => {
      if (raw) {
        try { setMoodLog(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
    // Load cached reflection if available
    AsyncStorage.getItem('harlo_month_reflection').then(cached => {
      if (cached) setReflection(cached);
    });
  }, []);

  const handleGenerateReflection = useCallback(async () => {
    if (loadingReflection || moodLog.length === 0) return;
    setLoadingReflection(true);
    trackEvent('day_milestone', { day: 30 });
    try {
      const prompt = buildReflectionPrompt(moodLog);
      const text = await sendToHarlo([{ role: 'user', content: prompt }]);
      setReflection(text);
      await AsyncStorage.setItem('harlo_month_reflection', text);
    } catch {
      // Non-critical — user can retry
    } finally {
      setLoadingReflection(false);
    }
  }, [moodLog, loadingReflection]);

  const showMonthMilestone = dayNumber >= 30;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 28,
            fontWeight: '300',
            lineHeight: 36,
            letterSpacing: -0.3,
            marginBottom: 4,
          }}
        >
          Your journey
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          A record of how you've been feeling.
        </Text>

        {/* Day-30 milestone */}
        {showMonthMilestone && (
          <View
            style={{
              backgroundColor: theme.brandPrimary,
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Your first month
            </Text>
            {reflection ? (
              <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 24 }}>
                {reflection}
              </Text>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
                  You've been here 30 days. Let Harlo reflect on your journey.
                </Text>
                <TouchableOpacity
                  onPress={handleGenerateReflection}
                  disabled={loadingReflection}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {loadingReflection && <ActivityIndicator size="small" color="#FFFFFF" />}
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                    {loadingReflection ? 'Reflecting…' : 'See your reflection'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Mood log */}
        {moodLog.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 20,
              padding: 28,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              Your mood check-ins will appear here after you chat with Harlo.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: theme.surface, borderRadius: 20, overflow: 'hidden' }}>
            {moodLog.map((entry, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: idx < moodLog.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                  gap: 14,
                }}
              >
                <ScoreDot score={entry.score} />
                <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 15 }}>
                  {SCORE_LABELS[entry.score] ?? 'Unknown'}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  {formatDate(entry.date)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
