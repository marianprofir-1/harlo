import * as Crypto from 'expo-crypto';
import { SYSTEM_PROMPT_V2 } from './prompts';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL!;
const HMAC_SECRET = process.env.EXPO_PUBLIC_HMAC_SECRET!;
// Note: HMAC_SECRET in client is acceptable — it proves the request
// comes from the app, not that the user is authenticated.
// The real API key never leaves the server.

export type Message = { role: 'user' | 'assistant'; content: string };

export type AIError =
  | 'NETWORK_ERROR'    // No internet
  | 'TIMEOUT'          // Request took too long
  | 'RATE_LIMITED'     // Too many requests
  | 'SERVER_ERROR'     // Backend or Anthropic issue
  | 'UNKNOWN';

export class HarloAIError extends Error {
  constructor(public type: AIError, message: string) {
    super(message);
  }
}

async function signRequest(body: string, timestamp: string): Promise<string> {
  const message = `${timestamp}.${body}`;
  const hmac = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${HMAC_SECRET}${message}`,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return hmac;
}

export async function sendToHarlo(
  messages: Message[],
  onboardingContext?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  const systemPrompt = onboardingContext
    ? `${SYSTEM_PROMPT_V2}\n\nUSER CONTEXT: ${onboardingContext}`
    : SYSTEM_PROMPT_V2;

  const bodyPayload = {
    messages: messages.slice(-10), // last 10 messages only — privacy
    system: systemPrompt,
  };
  const bodyString = JSON.stringify(bodyPayload);
  const timestamp = String(Date.now());
  const signature = await signRequest(bodyString, timestamp);

  try {
    const response = await fetch(`${PROXY_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Harlo-Client': 'harlo-mobile-v1',
        'X-Harlo-Signature': signature,
        'X-Harlo-Timestamp': timestamp,
      },
      body: bodyString,
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new HarloAIError('RATE_LIMITED', 'Rate limited');
    }
    if (!response.ok) {
      throw new HarloAIError('SERVER_ERROR', `Status ${response.status}`);
    }

    const data = await response.json() as { text: string };
    return data.text;

  } catch (error) {
    if (error instanceof HarloAIError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new HarloAIError('TIMEOUT', 'Request timed out');
    }
    throw new HarloAIError('NETWORK_ERROR', 'Network unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

// Human-readable error messages in Harlo's voice
export function getErrorMessage(type: AIError): string {
  const messages: Record<AIError, string> = {
    NETWORK_ERROR: 'Harlo is having trouble connecting. Check your connection and try again.',
    TIMEOUT:       'That took longer than expected. Try again in a moment.',
    RATE_LIMITED:  "You're moving fast today. Give it a minute and try again.",
    SERVER_ERROR:  'Something went quiet on our end. Try again shortly.',
    UNKNOWN:       'Something unexpected happened. Try again.',
  };
  return messages[type];
}
