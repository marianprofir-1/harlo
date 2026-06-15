import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import {
  loadContent,
  getDailyPrompt,
  getCurrentWeekTheme,
  type HarloContent,
  type WeeklyTheme as WeeklyThemeData,
} from '../../lib/content';
import { getStreak, checkMilestone } from '../../lib/streak';
import { DailyPrompt } from '../../components/DailyPrompt';
import { WeeklyTheme } from '../../components/WeeklyTheme';

const MILESTONE_MESSAGES: Record<number, string> = {
  7:  'Seven days together. That\'s a week of showing up for yourself.',
  30: 'A full month. You\'ve built something real here.',
  60: 'Two months. The quiet has changed.',
  90: 'Three months. Look how far you\'ve come.',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

async function getDayNumber(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.FIRST_OPEN_DATE);
    if (!stored) {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(KEYS.FIRST_OPEN_DATE, today);
      return 1;
    }
    const start = new Date(stored);
    const now = new Date();
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((nowDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  } catch {
    return 1;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [dayNumber, setDayNumber] = useState(1);
  const [content, setContent] = useState<HarloContent | null>(null);
  const [quickText, setQuickText] = useState('');
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    async function load() {
      const [day, c] = await Promise.all([getDayNumber(), loadContent()]);
      setDayNumber(day);
      setContent(c);

      // Streak and milestone (non-blocking)
      getStreak().then(setStreak);
      checkMilestone(day).then(setMilestone);
    }
    load();
  }, []);

  const dailyPromptText = content
    ? getDailyPrompt(content, dayNumber)
    : 'What does the quiet feel like today?';
  const weekTheme: WeeklyThemeData | null = content
    ? getCurrentWeekTheme(content, dayNumber)
    : null;

  const openChatWithPrompt = useCallback((prefill: string) => {
    router.push({ pathname: '/(tabs)/chat', params: { prefill } });
  }, [router]);

  const handleQuickSubmit = useCallback(() => {
    const text = quickText.trim();
    if (!text) return;
    setQuickText('');
    openChatWithPrompt(text);
  }, [quickText, openChatWithPrompt]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: '500',
                  letterSpacing: 0.2,
                  marginBottom: 4,
                }}
              >
                {getGreeting()}
              </Text>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 28,
                  fontWeight: '300',
                  lineHeight: 36,
                  letterSpacing: -0.3,
                }}
              >
                Day {dayNumber} of your journey
              </Text>
              {streak > 1 && (
                <Text
                  style={{
                    color: theme.brandPrimary,
                    fontSize: 13,
                    fontWeight: '500',
                    marginTop: 4,
                  }}
                >
                  {streak} days together
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ paddingTop: 4 }}
            >
              <Ionicons name="settings-outline" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Milestone banner */}
          {milestone && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 8,
                marginBottom: 4,
                backgroundColor: theme.brandPrimary,
                borderRadius: 16,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  Milestone
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 15, lineHeight: 22 }}>
                  {MILESTONE_MESSAGES[milestone] ?? `Day ${milestone}. You kept coming back.`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMilestone(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          )}

          {/* Daily Prompt Card */}
          <View style={{ marginTop: 20 }}>
            <DailyPrompt
              prompt={dailyPromptText}
              onPress={() => openChatWithPrompt(dailyPromptText)}
            />
          </View>

          {/* Quick Entry */}
          <View style={{ marginTop: 16, marginHorizontal: 16 }}>
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TextInput
                ref={inputRef}
                value={quickText}
                onChangeText={setQuickText}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.textMuted}
                style={{
                  flex: 1,
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingVertical: 14,
                }}
                returnKeyType="send"
                onSubmitEditing={handleQuickSubmit}
                blurOnSubmit={false}
                multiline={false}
              />
              {quickText.trim().length > 0 && (
                <TouchableOpacity
                  onPress={handleQuickSubmit}
                  activeOpacity={0.75}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: theme.brandPrimary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Weekly Theme Card */}
          {weekTheme && (
            <View style={{ marginTop: 24 }}>
              <WeeklyTheme
                title={weekTheme.title}
                body={weekTheme.body}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
