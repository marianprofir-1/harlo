import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendToHarlo, HarloAIError, getErrorMessage, AIError } from '../lib/ai';
import { trackEvent } from '../lib/analytics';
import { KEYS } from '../lib/storage';
import { saveSessionMemory } from '../lib/memory';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type SessionStatus = 'idle' | 'loading';

interface HarloSessionContextType {
  messages: Message[];
  status: SessionStatus;
  errorMessage: string | null;
  sessionEnded: boolean;
  hasSessionToday: boolean;
  continuePromptVisible: boolean;
  extensionsUsed: number;
  tomorrowQuestion: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
  onContinue: () => void;
  onDecline: () => void;
}

const HarloSessionContext = createContext<HarloSessionContextType | null>(null);

// Segment 1: 6 messages → continue prompt
// Segment 2: 5 more (11 total) → continue prompt
// Segment 3: 5 more (16 total) → gentle close
const SEGMENT_1 = 6;
const SEGMENT_EXTRA = 5;

function getSegmentLimit(extensions: number): number {
  return SEGMENT_1 + extensions * SEGMENT_EXTRA;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function HarloSessionProvider({
  children,
  onboardingContext,
  tomorrowQuestion = null,
  dayNumber = 1,
}: {
  children: React.ReactNode;
  onboardingContext?: string;
  tomorrowQuestion?: string | null;
  dayNumber?: number;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [hasSessionToday, setHasSessionToday] = useState(false);
  const [continuePromptVisible, setContinuePromptVisible] = useState(false);
  const [extensionsUsed, setExtensionsUsed] = useState(0);

  // Refs avoid stale closures inside async callbacks
  const userMessageCount = useRef(0);
  const extensionsRef = useRef(0);
  const sessionSaved = useRef(false);
  const sessionStarted = useRef(false);
  const userTexts = useRef<string[]>([]); // for memory extraction (max 3)

  useEffect(() => {
    AsyncStorage.getItem(KEYS.LAST_SESSION_DATE).then(val => {
      if (val === todayStr()) setHasSessionToday(true);
    });
  }, []);

  const doEndSession = useCallback(async () => {
    if (sessionSaved.current) return;
    sessionSaved.current = true;

    setSessionEnded(true);
    setContinuePromptVisible(false);
    setHasSessionToday(true);
    trackEvent('session_ended', { messageCount: userMessageCount.current });

    await AsyncStorage.setItem(KEYS.LAST_SESSION_DATE, todayStr());

    if (userTexts.current.length > 0) {
      await saveSessionMemory({
        date: todayStr(),
        dayNumber,
        moments: userTexts.current,
      });
    }
  }, [dayNumber]);

  const sendMessage = useCallback(async (text: string) => {
    if (sessionEnded || continuePromptVisible || status === 'loading') return;

    // Mark session started on first message — prevents a second session today
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      AsyncStorage.setItem(KEYS.LAST_SESSION_DATE, todayStr());
      setHasSessionToday(true);
      trackEvent('chat_session_started');
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Collect user texts for memory (skip very short replies)
    if (text.trim().length > 20 && userTexts.current.length < 3) {
      userTexts.current = [...userTexts.current, text.trim()];
    }

    setMessages(prev => [...prev, userMessage]);
    setStatus('loading');
    setErrorMessage(null);
    userMessageCount.current += 1;

    trackEvent('message_sent', { messageNumber: userMessageCount.current });

    try {
      // messages here is the pre-send list (stale closure is intentional)
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
      setStatus('idle');

      // Check segment limit using ref (always current, not stale)
      const ext = extensionsRef.current;
      const limit = getSegmentLimit(ext);

      if (userMessageCount.current >= limit) {
        if (ext >= 2) {
          await doEndSession();
        } else {
          setContinuePromptVisible(true);
        }
      }
    } catch (error) {
      if (error instanceof HarloAIError) {
        setErrorMessage(getErrorMessage(error.type as AIError));
        trackEvent('ai_error', { errorType: error.type });
      } else {
        setErrorMessage(getErrorMessage('UNKNOWN'));
      }
      setStatus('idle');
      userMessageCount.current -= 1;
    }
  }, [messages, status, sessionEnded, continuePromptVisible, onboardingContext, doEndSession]);

  const onContinue = useCallback(() => {
    extensionsRef.current += 1;
    setExtensionsUsed(extensionsRef.current);
    setContinuePromptVisible(false);
    trackEvent('session_continued', { extension: extensionsRef.current });
  }, []);

  const onDecline = useCallback(async () => {
    setContinuePromptVisible(false);
    await doEndSession();
  }, [doEndSession]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return (
    <HarloSessionContext.Provider value={{
      messages,
      status,
      errorMessage,
      sessionEnded,
      hasSessionToday,
      continuePromptVisible,
      extensionsUsed,
      tomorrowQuestion,
      sendMessage,
      clearError,
      onContinue,
      onDecline,
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
