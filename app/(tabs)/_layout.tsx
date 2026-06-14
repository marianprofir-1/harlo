import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import { HarloSessionProvider } from '../../contexts/HarloSession';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function buildOnboardingContext(answers: Record<string, string>): string {
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

  useEffect(() => {
    AsyncStorage.getItem(KEYS.ONBOARDING_ANSWERS).then(raw => {
      if (raw) {
        try {
          const answers = JSON.parse(raw) as Record<string, string>;
          setOnboardingContext(buildOnboardingContext(answers));
        } catch {
          // ignore parse errors
        }
      }
    });
  }, []);

  return (
    <HarloSessionProvider onboardingContext={onboardingContext}>
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
