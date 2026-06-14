# Why We Built It This Way

## Expo over bare React Native
Faster iteration, EAS Build handles complexity, no native Xcode/Android Studio config needed for most features.

## Cloudflare Workers over a full backend
Zero cold starts, free tier (100k req/day), global edge, no server maintenance. Perfect for a proxy layer.

## RevenueCat over custom subscription logic
Handles App Store + Google Play complexity, trial management, webhooks, and receipt validation.

## PostHog over Mixpanel/Amplitude
EU hosting for GDPR compliance, open source, generous free tier, self-hostable if needed.

## AsyncStorage + SecureStore split
SecureStore (encrypted) for PII and sensitive data (deviceId, conversation cache, subscription status).
AsyncStorage for preferences and non-sensitive data.

## No user accounts at launch
Anonymous deviceId only. Lower friction, faster launch. Auth migration path preserved via RevenueCat.logIn().
