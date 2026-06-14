import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props {
  prompt: string;
  onPress: () => void;
}

export function DailyPrompt({ prompt, onPress }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ marginHorizontal: 16 }}>
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 20,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 11,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Today's question
          </Text>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 18,
              fontWeight: '500',
              lineHeight: 26,
            }}
          >
            {prompt}
          </Text>
        </View>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.brandPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
