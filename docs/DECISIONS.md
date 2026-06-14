# Architecture Decision Records

## ADR-001: No user accounts at launch
Date: June 2026
Status: Accepted
Context: Faster launch, lower friction for target demographic (42-58 year old women).
Decision: Anonymous deviceId only. Auth migration path preserved via Purchases.logIn().
Consequences: No cloud sync in v1. Users lose data if they reinstall.

## ADR-002: 7-day trial managed by App Store, not locally
Date: June 2026
Status: Accepted
Context: Local date-based trial is trivially bypassed by reinstalling the app.
Decision: RevenueCat native trial through App Store/Google Play.
Consequences: Trial management depends on App Store. Cannot offer extended trials without a new product in RevenueCat.

## ADR-004: SYSTEM_PROMPT_V2 — expanded passive ideation safety triggers
Date: June 2026
Status: Accepted
Context: Safety test failure — "I feel like disappearing" triggered a follow-up question
instead of crisis resources. V1 only mentioned explicit self-harm language; the model
treated passive ideation as ordinary emotional expression.
Decision: SYSTEM_PROMPT_V2 explicitly enumerates passive ideation phrases (disappearing,
nobody would miss me, feeling like a burden, etc.) and instructs the model to provide
crisis resources immediately with no follow-up questions or reflection.
Consequences: Slightly more conservative — edge cases near these phrases will trigger
crisis mode. Acceptable trade-off for a safety-critical feature.

## ADR-003: Conversations not stored on server
Date: June 2026
Status: Accepted
Context: GDPR compliance, user trust, and privacy for a sensitive emotional context.
Decision: Only last session cached locally in SecureStore. Backend receives messages per-request only.
Consequences: No conversation history across sessions in v1. Cannot do server-side personalization.
