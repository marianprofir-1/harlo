import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  Linking,
  useColorScheme,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors } from '../constants/colors';
import { KEYS, deleteAllUserData } from '../lib/storage';
import { disableAnalytics } from '../lib/analytics';
import { trackEvent } from '../lib/analytics';

function SettingRow({
  label,
  sublabel,
  onPress,
  value,
  onValueChange,
  showChevron = false,
  destructive = false,
}: {
  label: string;
  sublabel?: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  showChevron?: boolean;
  destructive?: boolean;
}) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: destructive ? theme.danger : theme.textPrimary, fontSize: 16 }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
            {sublabel}
          </Text>
        )}
      </View>
      {onValueChange !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.brandPrimary }}
          thumbColor="#FFFFFF"
        />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [morningEnabled, setMorningEnabled] = useState(true);
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  useEffect(() => {
    // Load current preferences
    Promise.all([
      AsyncStorage.getItem('harlo_notif_morning'),
      AsyncStorage.getItem('harlo_notif_evening'),
      AsyncStorage.getItem(KEYS.DATA_SHARING_CONSENT),
    ]).then(([morning, evening, consent]) => {
      if (morning !== null) setMorningEnabled(morning === 'true');
      if (evening !== null) setEveningEnabled(evening === 'true');
      if (consent !== null) setDataSharing(consent === 'true');
    });
  }, []);

  const handleMorningToggle = useCallback(async (v: boolean) => {
    setMorningEnabled(v);
    await AsyncStorage.setItem('harlo_notif_morning', String(v));
  }, []);

  const handleEveningToggle = useCallback(async (v: boolean) => {
    setEveningEnabled(v);
    await AsyncStorage.setItem('harlo_notif_evening', String(v));
  }, []);

  const handleDataSharingToggle = useCallback(async (v: boolean) => {
    setDataSharing(v);
    await AsyncStorage.setItem(KEYS.DATA_SHARING_CONSENT, String(v));
    if (!v) disableAnalytics();
  }, []);

  const handleDeleteData = useCallback(() => {
    Alert.alert(
      'Delete my data',
      'This will delete all your Harlo data from this device. Your subscription will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            trackEvent('data_deletion_requested');
            await deleteAllUserData();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );
  }, [router]);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginRight: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600' }}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Notifications */}
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginHorizontal: 24,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          Notifications
        </Text>
        <View
          style={{ backgroundColor: theme.surface, borderRadius: 20, marginHorizontal: 16, overflow: 'hidden' }}
        >
          <SettingRow
            label="Morning prompt"
            sublabel="8:30 AM — a question to start your day"
            value={morningEnabled}
            onValueChange={handleMorningToggle}
          />
          <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 20 }} />
          <SettingRow
            label="Evening check-in"
            sublabel="8:00 PM — a space to reflect"
            value={eveningEnabled}
            onValueChange={handleEveningToggle}
          />
        </View>

        {/* Privacy */}
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginHorizontal: 24,
            marginTop: 28,
            marginBottom: 8,
          }}
        >
          Privacy
        </Text>
        <View
          style={{ backgroundColor: theme.surface, borderRadius: 20, marginHorizontal: 16, overflow: 'hidden' }}
        >
          <SettingRow
            label="Help improve Harlo"
            sublabel="Anonymously share conversation snippets"
            value={dataSharing}
            onValueChange={handleDataSharingToggle}
          />
          <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 20 }} />
          <SettingRow
            label="Delete my data"
            sublabel="Removes all data from this device"
            onPress={handleDeleteData}
            destructive
          />
        </View>

        {/* Legal */}
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginHorizontal: 24,
            marginTop: 28,
            marginBottom: 8,
          }}
        >
          Legal
        </Text>
        <View
          style={{ backgroundColor: theme.surface, borderRadius: 20, marginHorizontal: 16, overflow: 'hidden' }}
        >
          <SettingRow
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://harlo.app/privacy')}
            showChevron
          />
          <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 20 }} />
          <SettingRow
            label="Terms of Service"
            onPress={() => Linking.openURL('https://harlo.app/terms')}
            showChevron
          />
        </View>

        {/* Version */}
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 13,
            textAlign: 'center',
            marginTop: 36,
          }}
        >
          Harlo {version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
