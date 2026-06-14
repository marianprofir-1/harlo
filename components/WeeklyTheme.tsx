import { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props {
  title: string;
  body: string;
}

export function WeeklyTheme({ title, body }: Props) {
  const [expanded, setExpanded] = useState(false);
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity
      onPress={() => setExpanded(prev => !prev)}
      activeOpacity={0.8}
      style={{ marginHorizontal: 16 }}
    >
      <View
        style={{
          backgroundColor: theme.surfaceAlt,
          borderRadius: 20,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 6,
              }}
            >
              This week
            </Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 15,
                fontWeight: '600',
                lineHeight: 22,
              }}
            >
              {title}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.textSecondary}
            style={{ marginTop: 20 }}
          />
        </View>

        {expanded && (
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 22,
              marginTop: 14,
            }}
          >
            {body}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
