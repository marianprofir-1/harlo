import { View, Text, Modal, TouchableOpacity, useColorScheme, Platform } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  visible: boolean;
  onSelect: (score: number) => void;
  onDismiss: () => void;
}

const OPTIONS: { label: string; score: number }[] = [
  { label: 'Much better', score: 5 },
  { label: 'A bit better', score: 4 },
  { label: 'About the same', score: 3 },
  { label: 'A bit harder', score: 2 },
  { label: 'Harder', score: 1 },
];

export function MoodCheckModal({ visible, onSelect, onDismiss }: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];
  // Extra bottom padding for devices with home indicator
  const bottomPad = Platform.OS === 'ios' ? 34 : 16;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View
          style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: bottomPad,
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 17,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            How do you feel now
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 15,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            compared to before?
          </Text>

          {OPTIONS.map((opt, idx) => (
            <TouchableOpacity
              key={opt.score}
              onPress={() => onSelect(opt.score)}
              activeOpacity={0.65}
              style={{
                paddingVertical: 16,
                borderTopWidth: idx === 0 ? 1 : 0,
                borderBottomWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 16,
                  textAlign: 'center',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onDismiss} activeOpacity={0.65} style={{ paddingVertical: 18 }}>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
