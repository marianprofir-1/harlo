import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { trackEvent } from './analytics';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!;
const ENTITLEMENT_ID = 'harlo_access';

export async function initRevenueCat(deviceId: string): Promise<void> {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  await Purchases.configure({ apiKey });
  await Purchases.setAttributes({ deviceId });
}

export async function checkAccess(): Promise<{
  hasAccess: boolean;
  isInTrial: boolean;
  expirationDate: Date | null;
}> {
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return { hasAccess: false, isInTrial: false, expirationDate: null };
    const isInTrial = entitlement.periodType === 'TRIAL';
    const expirationDate = entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;
    return { hasAccess: true, isInTrial, expirationDate };
  } catch {
    return { hasAccess: true, isInTrial: false, expirationDate: null };
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(packageToPurchase: unknown): Promise<boolean> {
  try {
    await Purchases.purchasePackage(packageToPurchase as never);
    trackEvent('subscription_started');
    return true;
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) return false;
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
