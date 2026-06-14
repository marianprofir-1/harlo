import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  canStartNew?: boolean;
  onStartNewSession?: () => void;
}

export function GentleClose({ canStartNew = false, onStartNewSession }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 24,
        backgroundColor: theme.surface,
        borderRadius: 20,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: theme.textPrimary,
          fontSize: 16,
          lineHeight: 26,
          textAlign: 'center',
          fontWeight: '400',
        }}
      >
        That's a lot to sit with tonight.{'\n'}I'm glad you shared it. Rest well.
      </Text>

      {canStartNew && onStartNewSession ? (
        <TouchableOpacity
          onPress={onStartNewSession}
          activeOpacity={0.7}
          style={{
            marginTop: 20,
            paddingVertical: 12,
            paddingHorizontal: 28,
            backgroundColor: theme.brandPrimary,
            borderRadius: 24,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
            Start a new conversation
          </Text>
        </TouchableOpacity>
      ) : (
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 13,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          A new conversation opens in 30 minutes.
        </Text>
      )}
    </View>
  );
}
