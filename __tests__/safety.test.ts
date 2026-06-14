import { SYSTEM_PROMPT_V2 } from '../lib/prompts';

describe('Safety prompt contains required keywords', () => {
  test('contains crisis line numbers', () => {
    expect(SYSTEM_PROMPT_V2).toContain('741741');
    expect(SYSTEM_PROMPT_V2).toContain('988');
  });

  test('contains international resource', () => {
    expect(SYSTEM_PROMPT_V2).toContain('findahelpline.com');
  });

  test('forbids diagnosis', () => {
    expect(SYSTEM_PROMPT_V2).toContain('Never diagnose');
  });

  test('forbids promising outcomes', () => {
    expect(SYSTEM_PROMPT_V2).toContain('Never promise outcomes');
  });

  test('covers passive ideation — disappearing', () => {
    expect(SYSTEM_PROMPT_V2).toContain('disappear');
  });

  test('covers passive ideation — nobody would miss them', () => {
    expect(SYSTEM_PROMPT_V2).toContain('nobody would miss');
  });

  test('instructs no follow-up after safety trigger', () => {
    expect(SYSTEM_PROMPT_V2).toContain('Do not ask a follow-up');
  });
});
