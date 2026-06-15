import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';
import { KEYS } from '../lib/storage';
import {
  checkAccess,
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '../lib/revenuecat';
import { trackEvent } from '../lib/analytics';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export default function PaywallScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];
  const bottomPad = Platform.OS === 'ios' ? 40 : 24;

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedTrial, setCompletedTrial] = useState(false);

  useEffect(() => {
    trackEvent('paywall_shown');
    getOfferings().then(setOffering);
    // Check if trial was completed to show the right headline
    checkAccess().then(({ isInTrial }) => setCompletedTrial(!isInTrial));
  }, []);

  const handlePurchase = useCallback(async (pkg: PurchasesPackage) => {
    setLoading(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch {
      // purchasePackage handles user-cancelled; other errors are from the store
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleRestore = useCallback(async () => {
    setLoading(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        trackEvent('subscription_restored');
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLater = useCallback(async () => {
    // Grant 1 more day, then block again
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await AsyncStorage.setItem('harlo_paywall_snooze', tomorrow.toISOString());
    trackEvent('paywall_dismissed');
    router.replace('/(tabs)');
  }, [router]);

  // Get package references from offering
  const annualPkg = offering?.annual ?? offering?.availablePackages.find(p => p.packageType === 'ANNUAL') ?? null;
  const monthlyPkg = offering?.monthly ?? offering?.availablePackages.find(p => p.packageType === 'MONTHLY') ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
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

        {/* Annual option */}
        <TouchableOpacity
          onPress={() => annualPkg && handlePurchase(annualPkg)}
          disabled={loading || !annualPkg}
          activeOpacity={0.85}
          style={{
            backgroundColor: theme.brandPrimary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            opacity: !annualPkg ? 0.6 : 1,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                {annualPkg?.product.priceString ?? '$47.99'} / year
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
          onPress={() => monthlyPkg && handlePurchase(monthlyPkg)}
          disabled={loading || !monthlyPkg}
          activeOpacity={0.85}
          style={{
            borderWidth: 1.5,
            borderColor: theme.brandPrimary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            opacity: !monthlyPkg ? 0.6 : 1,
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
            {monthlyPkg?.product.priceString ?? '$6.99'} / month
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

        {loading && (
          <ActivityIndicator color={theme.brandPrimary} style={{ marginBottom: 16 }} />
        )}

        {/* Maybe later */}
        <TouchableOpacity onPress={handleLater} activeOpacity={0.65} style={{ marginBottom: 12 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: 'center' }}>
            Maybe later
          </Text>
        </TouchableOpacity>

        {/* Restore purchase */}
        <TouchableOpacity onPress={handleRestore} activeOpacity={0.65}>
          <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
            Restore Purchase
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
