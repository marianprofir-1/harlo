import { useEffect, useRef } from 'react';
import { View, Text, Animated, useColorScheme } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

function TypingDots({ color }: { color: string }) {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.3)).current;
  const a3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            Animated.delay(600),
          ])
        ),
      ]);

    const anims = [pulse(a1, 0), pulse(a2, 200), pulse(a3, 400)];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [a1, a2, a3]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }}>
      {[a1, a2, a3].map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: color,
            opacity: anim,
          }}
        />
      ))}
    </View>
  );
}

export function ChatBubble({ role, content, isTyping = false }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];
  const isUser = role === 'user';

  const bubbleBg = isUser ? theme.userBubble : theme.aiBubble;
  const textColor = isUser ? theme.userBubbleText : theme.aiBubbleText;

  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginBottom: 10,
      }}
    >
      <View
        style={{
          backgroundColor: bubbleBg,
          borderRadius: 20,
          borderBottomRightRadius: isUser ? 4 : 20,
          borderBottomLeftRadius: isUser ? 20 : 4,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {isTyping ? (
          <TypingDots color={textColor} />
        ) : (
          <Text
            style={{
              color: textColor,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            {content}
          </Text>
        )}
      </View>
    </View>
  );
}
