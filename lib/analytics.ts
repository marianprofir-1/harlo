import PostHog from 'posthog-react-native';

// Events tracked — NONE contain user content, PII, or conversation text
// Only behavioral signals for product decisions

export type HarloEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'          // user skipped a question
  | 'chat_session_started'
  | 'message_sent'                // { messageNumber: number }
  | 'session_ended'               // { messageCount: number }
  | 'ai_error'                    // { errorType: AIError }
  | 'paywall_shown'
  | 'paywall_dismissed'
  | 'subscription_started'        // { plan: 'monthly' | 'annual' }
  | 'subscription_restored'
  | 'day_milestone'               // { day: 7 | 14 | 30 }
  | 'mood_check_completed'        // { score: 1-5 } — no context
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'session_continued'           // { extension: 1 | 2 }
  | 'data_deletion_requested';

let posthog: PostHog | null = null;

export async function initAnalytics(deviceId: string): Promise<void> {
  posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
    host: 'https://eu.posthog.com', // EU region for GDPR
  });

  // Identify with anonymous deviceId only — no email, no name
  posthog.identify(deviceId);
}

export function trackEvent(event: HarloEvent, properties?: Record<string, unknown>): void {
  if (!posthog) return;
  // Never log conversation content — enforced by TypeScript event types above
  posthog.capture(event, properties as Record<string, string | number | boolean | null>);
}

export function disableAnalytics(): void {
  posthog?.optOut();
}
