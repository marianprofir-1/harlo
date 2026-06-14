import { View, Text, Modal, TouchableOpacity, useColorScheme, Platform, ScrollView } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  visible: boolean;
  completedTrial?: boolean;
  onMonthly: () => void;
  onAnnual: () => void;
  onLater: () => void;
  onRestore: () => void;
}

export function PaywallModal({
  visible,
  completedTrial = false,
  onMonthly,
  onAnnual,
  onLater,
  onRestore,
}: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];
  const bottomPad = Platform.OS === 'ios' ? 40 : 24;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: theme.background,
          paddingHorizontal: 28,
          paddingTop: 56,
          paddingBottom: bottomPad,
          justifyContent: 'center',
        }}
        bounces={false}
      >
        {/* Headline */}
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 26,
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: 34,
            marginBottom: 8,
          }}
        >
          {completedTrial
            ? "You've shown up for yourself\n7 days in a row."
            : 'Keep going with Harlo.'}
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 40,
          }}
        >
          {completedTrial
            ? 'Continue your journey with a subscription.'
            : 'A quiet companion for whenever you need one.'}
        </Text>

        {/* Annual option — visually highlighted */}
        <TouchableOpacity
          onPress={onAnnual}
          activeOpacity={0.85}
          style={{
            backgroundColor: theme.brandPrimary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                $47.99 / year
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                $4 / month · Save 43%
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                Best value
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Monthly option */}
        <TouchableOpacity
          onPress={onMonthly}
          activeOpacity={0.85}
          style={{
            borderWidth: 1.5,
            borderColor: theme.brandPrimary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <Text
            style={{
              color: theme.brandPrimary,
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            $6.99 / month
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: theme.textMuted,
            fontSize: 12,
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          Cancel anytime. No questions asked.
        </Text>

        {/* Maybe later */}
        <TouchableOpacity onPress={onLater} activeOpacity={0.65} style={{ marginBottom: 12 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            Maybe later
          </Text>
        </TouchableOpacity>

        {/* Restore purchase */}
        <TouchableOpacity onPress={onRestore} activeOpacity={0.65}>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Restore Purchase
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}
