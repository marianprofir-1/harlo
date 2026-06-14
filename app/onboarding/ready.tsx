import { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import { trackEvent } from '../../lib/analytics';

function Checkbox({
  checked,
  onToggle,
  label,
  sublabel,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  sublabel?: string;
}) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: checked ? theme.brandPrimary : theme.border,
          backgroundColor: checked ? theme.brandPrimary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 22 }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20, marginTop: 2 }}>
            {sublabel}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ReadyScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [consent, setConsent] = useState(false);

  const handleLetsGo = async () => {
    await AsyncStorage.setItem(KEYS.DATA_SHARING_CONSENT, consent ? 'true' : 'false');
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
    trackEvent('onboarding_completed');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 60,
        paddingBottom: 48,
        justifyContent: 'space-between',
      }}>

        {/* Main content */}
        <View style={{ flex: 1, justifyContent: 'center', gap: 40 }}>
          {/* Headline block */}
          <View>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 30,
                fontWeight: '400',
                lineHeight: 40,
                letterSpacing: -0.3,
                marginBottom: 14,
              }}
            >
              Your 7-day free trial{'\n'}starts now.
            </Text>
            <Text
              style={{
                color: theme.brandPrimary,
                fontSize: 16,
                fontWeight: '500',
                marginBottom: 10,
              }}
            >
              No card needed.
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              Show up when you can.{'\n'}There's no pressure here.
            </Text>
          </View>

          {/* Consent checkbox */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Checkbox
              checked={consent}
              onToggle={() => setConsent(prev => !prev)}
              label="Help improve Harlo by anonymously sharing conversation snippets."
              sublabel="You can change this anytime in Settings."
            />
          </View>
        </View>

        {/* Let's go button */}
        <TouchableOpacity
          onPress={handleLetsGo}
          activeOpacity={0.8}
          style={{
            backgroundColor: theme.brandPrimary,
            borderRadius: 28,
            paddingVertical: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600', letterSpacing: 0.2 }}>
            Let's go
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
