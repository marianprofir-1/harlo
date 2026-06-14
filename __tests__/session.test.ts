import { renderHook, act } from '@testing-library/react-hooks';
import { HarloSessionProvider, useHarloSession } from '../contexts/HarloSession';

jest.mock('../lib/ai', () => ({
  sendToHarlo: jest.fn().mockResolvedValue('Test response'),
  getErrorMessage: jest.fn().mockReturnValue('Connection error'),
  // Avoid TypeScript shorthand (public type:) inside jest.mock — not allowed by Babel
  HarloAIError: class MockHarloAIError extends Error {
    errorType: string;
    constructor(errorType: string, message: string) {
      super(message);
      this.errorType = errorType;
    }
  },
}));

jest.mock('../lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

describe('Session limits', () => {
  test('sessionEnded becomes true after 8 messages', async () => {
    const { result } = renderHook(() => useHarloSession(), {
      wrapper: HarloSessionProvider,
    });

    for (let i = 0; i < 8; i++) {
      await act(async () => {
        await result.current.sendMessage(`Message ${i + 1}`);
      });
    }

    expect(result.current.sessionEnded).toBe(true);
  });

  test('sendMessage does nothing when session is ended', async () => {
    const { result } = renderHook(() => useHarloSession(), {
      wrapper: HarloSessionProvider,
    });

    for (let i = 0; i < 8; i++) {
      await act(async () => { await result.current.sendMessage('msg'); });
    }

    const messageCountBefore = result.current.messages.length;
    await act(async () => { await result.current.sendMessage('extra message'); });
    expect(result.current.messages.length).toBe(messageCountBefore);
  });
});
