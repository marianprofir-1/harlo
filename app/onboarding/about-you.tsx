import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import { trackEvent } from '../../lib/analytics';

const QUESTIONS: { question: string; options: string[]; key: string }[] = [
  {
    key: 'whenLeft',
    question: 'How long ago did your child leave home?',
    options: ['Less than 3 months', '3–12 months', 'Over a year'],
  },
  {
    key: 'currentFeeling',
    question: 'How are you feeling most days right now?',
    options: ['Lost', 'Okay but quiet', 'Surprisingly fine', 'Mix of everything'],
  },
  {
    key: 'need',
    question: 'What do you need most?',
    options: ['Someone to listen', 'To understand what I\'m feeling', 'Ideas for what\'s next', 'Just company'],
  },
];

type Answers = Record<string, string>;

export default function AboutYouScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();

  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slideTo = useCallback((toPage: number) => {
    Animated.spring(slideAnim, {
      toValue: -toPage * width,
      useNativeDriver: true,
      tension: 90,
      friction: 14,
    }).start(() => setPage(toPage));
  }, [slideAnim, width]);

  const saveAndExit = useCallback(async (finalAnswers: Answers) => {
    await AsyncStorage.setItem(KEYS.ONBOARDING_ANSWERS, JSON.stringify(finalAnswers));
    router.push('/onboarding/ready');
  }, [router]);

  const handleSelect = useCallback((option: string) => {
    setSelectedOption(option);
    const key = QUESTIONS[page].key;
    const updated = { ...answers, [key]: option };
    setAnswers(updated);

    setTimeout(() => {
      setSelectedOption(null);
      if (page < QUESTIONS.length - 1) {
        slideTo(page + 1);
      } else {
        saveAndExit(updated);
      }
    }, 420);
  }, [page, answers, slideTo, saveAndExit]);

  const handleSkip = useCallback(() => {
    trackEvent('onboarding_skipped');
    if (page < QUESTIONS.length - 1) {
      slideTo(page + 1);
    } else {
      saveAndExit(answers);
    }
  }, [page, answers, slideTo, saveAndExit]);

  const q = QUESTIONS[page];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>

        {/* Header: progress + skip */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}>
          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === page ? 20 : 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: i === page ? theme.brandPrimary : theme.border,
                }}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.65} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: theme.textMuted, fontSize: 15 }}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Sliding pages */}
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View
            style={{
              flexDirection: 'row',
              width: width * QUESTIONS.length,
              flex: 1,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {QUESTIONS.map((qItem, qIdx) => (
              <View
                key={qIdx}
                style={{ width, flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}
              >
                {/* Question text */}
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 26,
                    fontWeight: '400',
                    lineHeight: 36,
                    marginBottom: 36,
                    letterSpacing: -0.3,
                  }}
                >
                  {qItem.question}
                </Text>

                {/* Options */}
                <View style={{ gap: 12 }}>
                  {qItem.options.map((opt) => {
                    const isSelected = selectedOption === opt && qIdx === page;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => qIdx === page && handleSelect(opt)}
                        activeOpacity={0.75}
                        style={{
                          paddingVertical: 18,
                          paddingHorizontal: 20,
                          borderRadius: 16,
                          backgroundColor: isSelected ? theme.brandPrimary : theme.surface,
                          borderWidth: 1.5,
                          borderColor: isSelected ? theme.brandPrimary : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            fontSize: 16,
                            fontWeight: '500',
                            textAlign: 'center',
                          }}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

      </View>
    </SafeAreaView>
  );
}
