import { View, Text, useColorScheme } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  tomorrowQuestion?: string | null;
}

export function GentleClose({ tomorrowQuestion }: Props) {
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

      {tomorrowQuestion && (
        <View
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Tomorrow's question
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {tomorrowQuestion}
          </Text>
        </View>
      )}

      <Text
        style={{
          color: theme.textMuted,
          fontSize: 13,
          marginTop: tomorrowQuestion ? 16 : 12,
        }}
      >
        Come back tomorrow.
      </Text>
    </View>
  );
}
