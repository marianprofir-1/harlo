import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { sendToHarlo, HarloAIError, getErrorMessage, AIError } from '../lib/ai';
import { trackEvent } from '../lib/analytics';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type SessionStatus = 'idle' | 'loading' | 'error' | 'ended';

interface HarloSessionContextType {
  messages: Message[];
  status: SessionStatus;
  errorMessage: string | null;
  sessionEnded: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
  startNewSession: () => void;
}

const HarloSessionContext = createContext<HarloSessionContextType | null>(null);

const MAX_MESSAGES_PER_SESSION = 8;
const SESSION_DURATION_MS = 15 * 60 * 1000;

export function HarloSessionProvider({
  children,
  onboardingContext,
}: {
  children: React.ReactNode;
  onboardingContext?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messageCount = useRef(0);
  const sessionStart = useRef(Date.now());
  const lastSessionEnd = useRef<number | null>(null);

  const sessionEnded =
    messageCount.current >= MAX_MESSAGES_PER_SESSION ||
    Date.now() - sessionStart.current > SESSION_DURATION_MS;

  const sendMessage = useCallback(async (text: string) => {
    if (sessionEnded || status === 'loading') return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setStatus('loading');
    setErrorMessage(null);
    messageCount.current += 1;

    trackEvent('message_sent', { messageNumber: messageCount.current });

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await sendToHarlo(allMessages, onboardingContext);

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setStatus(sessionEnded ? 'ended' : 'idle');

      if (sessionEnded) {
        lastSessionEnd.current = Date.now();
        trackEvent('session_ended', { messageCount: messageCount.current });
      }

    } catch (error) {
      if (error instanceof HarloAIError) {
        setErrorMessage(getErrorMessage(error.type as AIError));
        trackEvent('ai_error', { errorType: error.type });
      } else {
        setErrorMessage(getErrorMessage('UNKNOWN'));
      }
      setStatus('idle');
      messageCount.current -= 1;
    }
  }, [messages, status, sessionEnded, onboardingContext]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const startNewSession = useCallback(() => {
    if (lastSessionEnd.current && Date.now() - lastSessionEnd.current < 30 * 60 * 1000) return;
    setMessages([]);
    setStatus('idle');
    setErrorMessage(null);
    messageCount.current = 0;
    sessionStart.current = Date.now();
  }, []);

  return (
    <HarloSessionContext.Provider value={{
      messages,
      status,
      errorMessage,
      sessionEnded,
      sendMessage,
      clearError,
      startNewSession,
    }}>
      {children}
    </HarloSessionContext.Provider>
  );
}

export function useHarloSession(): HarloSessionContextType {
  const ctx = useContext(HarloSessionContext);
  if (!ctx) throw new Error('useHarloSession must be used within HarloSessionProvider');
  return ctx;
}
