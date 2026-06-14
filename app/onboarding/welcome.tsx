import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, SafeAreaView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { trackEvent } from '../../lib/analytics';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    trackEvent('onboarding_started');
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, paddingHorizontal: 36, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 48 }}>

        {/* Hero text */}
        <Animated.View style={{ flex: 1, justifyContent: 'center', opacity, transform: [{ translateY }] }}>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 34,
              fontWeight: '300',
              lineHeight: 44,
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 20,
            }}
          >
            The house is{'\n'}quieter now.
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 18,
              fontWeight: '400',
              lineHeight: 28,
              textAlign: 'center',
            }}
          >
            Harlo is here to listen.
          </Text>
        </Animated.View>

        {/* Begin button */}
        <Animated.View style={{ opacity }}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding/about-you')}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.brandPrimary,
              borderRadius: 28,
              paddingVertical: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600', letterSpacing: 0.2 }}>
              Begin
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}
