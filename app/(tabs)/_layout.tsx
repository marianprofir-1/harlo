import { useEffect, useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import { HarloSessionProvider } from '../../contexts/HarloSession';
import { getYesterdayMemory, buildMemoryContext } from '../../lib/memory';
import { loadContent, getDailyPrompt } from '../../lib/content';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

async function getDayNumber(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.FIRST_OPEN_DATE);
    if (!stored) return 1;
    const start = new Date(stored);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const now = new Date();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((nowDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  } catch { return 1; }
}

function buildOnboardingPart(answers: Record<string, string>): string {
  const parts: string[] = [];
  if (answers.whenLeft) parts.push(`Child left home: ${answers.whenLeft}`);
  if (answers.currentFeeling) parts.push(`Current feeling: ${answers.currentFeeling}`);
  if (answers.need) parts.push(`User needs: ${answers.need}`);
  return parts.join('. ');
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [onboardingContext, setOnboardingContext] = useState<string | undefined>(undefined);
  const [tomorrowQuestion, setTomorrowQuestion] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);

  useEffect(() => {
    async function loadContext() {
      try {
        const [day, answersRaw, content, memory] = await Promise.all([
          getDayNumber(),
          AsyncStorage.getItem(KEYS.ONBOARDING_ANSWERS),
          loadContent(),
          getYesterdayMemory(),
        ]);

        setDayNumber(day);
        setTomorrowQuestion(getDailyPrompt(content, day + 1));

        const parts: string[] = [];

        if (answersRaw) {
          try {
            const answers = JSON.parse(answersRaw) as Record<string, string>;
            const onboarding = buildOnboardingPart(answers);
            if (onboarding) parts.push(onboarding);
          } catch { /* ignore */ }
        }

        const memCtx = buildMemoryContext(memory, day);
        if (memCtx) parts.push(memCtx);

        setOnboardingContext(parts.join('\n\n') || undefined);
      } catch { /* context won't be personalized — non-critical */ }
    }

    loadContext();
  }, []);

  return (
    <HarloSessionProvider
      onboardingContext={onboardingContext}
      tomorrowQuestion={tomorrowQuestion}
      dayNumber={dayNumber}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.brandPrimary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={(focused ? 'home' : 'home-outline') as IoniconName}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={(focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline') as IoniconName}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={(focused ? 'bar-chart' : 'bar-chart-outline') as IoniconName}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </HarloSessionProvider>
  );
}
