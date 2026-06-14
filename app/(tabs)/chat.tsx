import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { KEYS } from '../../lib/storage';
import { ChatBubble } from '../../components/ChatBubble';
import { GentleClose } from '../../components/GentleClose';
import { MoodCheckModal } from '../../components/MoodCheckModal';
import { useHarloSession } from '../../contexts/HarloSession';
import { trackEvent } from '../../lib/analytics';

function DisclaimerBanner({ onDismiss }: { onDismiss: () => void }) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity
      onPress={onDismiss}
      activeOpacity={0.85}
      style={{
        backgroundColor: theme.surfaceAlt,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>
          Harlo is a reflection companion, not a mental health service. If you're
          in crisis, please contact a qualified professional or call 988.
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
          Tap to dismiss
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={{
        backgroundColor: `${theme.danger}18`,
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Text style={{ color: theme.textSecondary, fontSize: 14, flex: 1, lineHeight: 20 }}>
        {message}
      </Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function ChatScreen() {
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  const {
    messages,
    status,
    errorMessage,
    sessionEnded,
    sendMessage,
    clearError,
    startNewSession,
  } = useHarloSession();

  const [inputText, setInputText] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [canStartNew, setCanStartNew] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const prefillHandled = useRef(false);
  const sessionEndedAtRef = useRef<number | null>(null);
  const moodCheckShown = useRef(false);

  // Check if disclaimer needs to be shown (first-ever session)
  useEffect(() => {
    AsyncStorage.getItem(KEYS.DISCLAIMER_DISMISSED).then(val => {
      if (!val) setShowDisclaimer(true);
    });
  }, []);

  // Handle prefill param from home screen navigation
  useEffect(() => {
    if (prefill && !prefillHandled.current && messages.length === 0) {
      prefillHandled.current = true;
      // Small delay to let the screen mount
      setTimeout(() => {
        sendMessage(prefill);
      }, 150);
    }
  }, [prefill, messages.length, sendMessage]);

  // Enable new session button after 30-minute cooldown + show mood check after 10s
  useEffect(() => {
    if (sessionEnded && sessionEndedAtRef.current === null) {
      sessionEndedAtRef.current = Date.now();
      const cooldownTimer = setTimeout(() => setCanStartNew(true), 30 * 60 * 1000);
      const moodTimer = !moodCheckShown.current
        ? setTimeout(() => {
            moodCheckShown.current = true;
            setShowMoodCheck(true);
          }, 10000)
        : null;
      return () => {
        clearTimeout(cooldownTimer);
        if (moodTimer) clearTimeout(moodTimer);
      };
    }
    if (!sessionEnded) {
      sessionEndedAtRef.current = null;
      setCanStartNew(false);
    }
  }, [sessionEnded]);

  // Scroll to bottom when messages change or typing starts
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, status]);

  const handleDismissDisclaimer = useCallback(async () => {
    await AsyncStorage.setItem(KEYS.DISCLAIMER_DISMISSED, 'true');
    setShowDisclaimer(false);
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || status === 'loading' || sessionEnded) return;
    setInputText('');
    sendMessage(text);
  }, [inputText, status, sessionEnded, sendMessage]);

  const handleStartNew = useCallback(() => {
    startNewSession();
    setCanStartNew(false);
    moodCheckShown.current = false;
    prefillHandled.current = false;
  }, [startNewSession]);

  const handleMoodSelect = useCallback(async (score: number) => {
    setShowMoodCheck(false);
    trackEvent('mood_check_completed', { score });
    // Append to mood log in AsyncStorage (scores only, no text)
    try {
      const raw = await AsyncStorage.getItem(KEYS.MOOD_LOG);
      const log: Array<{ score: number; date: string }> = raw ? JSON.parse(raw) : [];
      log.unshift({ score, date: new Date().toISOString() });
      await AsyncStorage.setItem(KEYS.MOOD_LOG, JSON.stringify(log.slice(0, 90))); // keep last 90
    } catch { /* non-critical */ }
  }, []);

  const isInputDisabled = sessionEnded || status === 'loading';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages area */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Disclaimer — first session only */}
          {showDisclaimer && (
            <DisclaimerBanner onDismiss={handleDismissDisclaimer} />
          )}

          {/* Empty state */}
          {messages.length === 0 && status !== 'loading' && (
            <View style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 24 }}>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 16,
                  textAlign: 'center',
                  lineHeight: 26,
                }}
              >
                Share what's on your mind.{'\n'}Harlo is listening.
              </Text>
            </View>
          )}

          {/* Message list */}
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
            />
          ))}

          {/* Typing indicator */}
          {status === 'loading' && (
            <ChatBubble
              role="assistant"
              content=""
              isTyping
            />
          )}

          {/* Session end */}
          {sessionEnded && (
            <GentleClose
              canStartNew={canStartNew}
              onStartNewSession={canStartNew ? handleStartNew : undefined}
            />
          )}
        </ScrollView>

        {/* Error banner */}
        {errorMessage && (
          <ErrorBanner message={errorMessage} onDismiss={clearError} />
        )}

        {/* Mood check modal — 10s after session ends */}
        <MoodCheckModal
          visible={showMoodCheck}
          onSelect={handleMoodSelect}
          onDismiss={() => setShowMoodCheck(false)}
        />

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 8 : 12,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.background,
            gap: 10,
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={sessionEnded ? 'Session complete' : 'Reply to Harlo…'}
            placeholderTextColor={theme.textMuted}
            editable={!isInputDisabled}
            multiline
            style={{
              flex: 1,
              color: isInputDisabled ? theme.textMuted : theme.textPrimary,
              fontSize: 16,
              lineHeight: 22,
              maxHeight: 120,
              paddingTop: 10,
              paddingBottom: 10,
            }}
            returnKeyType="default"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isInputDisabled || inputText.trim().length === 0}
            activeOpacity={0.75}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor:
                isInputDisabled || inputText.trim().length === 0
                  ? theme.border
                  : theme.brandPrimary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            {status === 'loading' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
