import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  extensionNumber: 1 | 2;
  onContinue: () => void;
  onDecline: () => void;
}

const MESSAGES: Record<1 | 2, string> = {
  1: "You've shared a lot tonight. There's more space here if you need it.",
  2: 'This conversation has meant something. Would you like a little more time?',
};

export function ContinuePrompt({ extensionNumber, onContinue, onDecline }: Props) {
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
          marginBottom: 20,
        }}
      >
        {MESSAGES[extensionNumber]}
      </Text>

      <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
        <TouchableOpacity
          onPress={onDecline}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '500' }}>
            I'm done for tonight
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: theme.brandPrimary,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
