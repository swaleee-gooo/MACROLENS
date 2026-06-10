import { describe, expect, it } from 'vitest';
import {
  createInitialReviewPromptState,
  initializeReviewPromptState,
  recordReviewPrompt,
  shouldPromptForReview,
  type ReviewPromptContext,
  type ReviewPromptState,
} from './reviewPrompt';

const NOW = new Date('2026-06-10T12:00:00.000Z');

function context(overrides: Partial<ReviewPromptContext> = {}): ReviewPromptContext {
  return {
    totalMealsSaved: 1,
    currentStreakDays: 0,
    now: NOW,
    lastActionWasError: false,
    ...overrides,
  };
}

function state(overrides: Partial<ReviewPromptState> = {}): ReviewPromptState {
  return { ...createInitialReviewPromptState(), ...overrides };
}

describe('shouldPromptForReview', () => {
  it('fires third_meal exactly at the 3rd saved meal', () => {
    expect(shouldPromptForReview(state(), context({ totalMealsSaved: 3 }))).toEqual({
      prompt: true,
      milestone: 'third_meal',
    });
  });

  it('does not fire third_meal before the 3rd meal', () => {
    expect(shouldPromptForReview(state(), context({ totalMealsSaved: 2 }))).toEqual({
      prompt: false,
      milestone: null,
    });
  });

  it('does not re-fire third_meal at the 4th, 5th... meal', () => {
    const consumed = recordReviewPrompt(state(), 'third_meal', new Date('2026-01-01T12:00:00.000Z'));

    expect(shouldPromptForReview(consumed, context({ totalMealsSaved: 4 }))).toEqual({ prompt: false, milestone: null });
    expect(shouldPromptForReview(consumed, context({ totalMealsSaved: 5 }))).toEqual({ prompt: false, milestone: null });
    // Even without a recorded prompt, 4+ meals is past the milestone.
    expect(shouldPromptForReview(state(), context({ totalMealsSaved: 4 }))).toEqual({ prompt: false, milestone: null });
  });

  it('fires streak_7 when the streak reaches 7 days', () => {
    expect(shouldPromptForReview(state(), context({ totalMealsSaved: 12, currentStreakDays: 7 }))).toEqual({
      prompt: true,
      milestone: 'streak_7',
    });
  });

  it('fires streak_7 at most once ever', () => {
    const consumed = recordReviewPrompt(state(), 'streak_7', new Date('2025-01-01T12:00:00.000Z'));

    expect(shouldPromptForReview(consumed, context({ totalMealsSaved: 30, currentStreakDays: 14 }))).toEqual({
      prompt: false,
      milestone: null,
    });
  });

  it('suppresses streak_7 within 30 days of the previous prompt, allows it after', () => {
    const prompted = recordReviewPrompt(state(), 'third_meal', new Date('2026-06-01T12:00:00.000Z'));
    const streakContext = { totalMealsSaved: 10, currentStreakDays: 7 };

    // 29 days later: inside the cooldown, no prompt and the milestone is NOT consumed.
    expect(
      shouldPromptForReview(prompted, context({ ...streakContext, now: new Date('2026-06-30T12:00:00.000Z') })),
    ).toEqual({ prompt: false, milestone: null });

    // 31 days later: cooldown elapsed, the pending milestone fires.
    expect(
      shouldPromptForReview(prompted, context({ ...streakContext, now: new Date('2026-07-02T12:00:00.000Z') })),
    ).toEqual({ prompt: true, milestone: 'streak_7' });
  });

  it('never prompts more than 3 times per rolling 365 days', () => {
    const capped = state({
      lastPromptedAt: '2026-01-03T12:00:00.000Z',
      promptTimestamps: ['2026-01-01T12:00:00.000Z', '2026-01-02T12:00:00.000Z', '2026-01-03T12:00:00.000Z'],
    });
    const streakContext = { totalMealsSaved: 50, currentStreakDays: 7 };

    // Cooldown elapsed but the yearly budget is exhausted.
    expect(
      shouldPromptForReview(capped, context({ ...streakContext, now: new Date('2026-06-10T12:00:00.000Z') })),
    ).toEqual({ prompt: false, milestone: null });

    // Once the oldest prompts fall out of the rolling 365-day window, prompting resumes.
    expect(
      shouldPromptForReview(capped, context({ ...streakContext, now: new Date('2027-01-02T13:00:00.000Z') })),
    ).toEqual({ prompt: true, milestone: 'streak_7' });
  });

  it('never prompts when the last action was an error', () => {
    expect(shouldPromptForReview(state(), context({ totalMealsSaved: 3, lastActionWasError: true }))).toEqual({
      prompt: false,
      milestone: null,
    });
    expect(
      shouldPromptForReview(state(), context({ totalMealsSaved: 10, currentStreakDays: 7, lastActionWasError: true })),
    ).toEqual({ prompt: false, milestone: null });
  });

  it('lets a milestone suppressed by an error fire on the next clean save', () => {
    const cleanState = state();
    expect(shouldPromptForReview(cleanState, context({ totalMealsSaved: 10, currentStreakDays: 7, lastActionWasError: true }))).toEqual({
      prompt: false,
      milestone: null,
    });
    expect(shouldPromptForReview(cleanState, context({ totalMealsSaved: 11, currentStreakDays: 7 }))).toEqual({
      prompt: true,
      milestone: 'streak_7',
    });
  });
});

describe('initializeReviewPromptState (retroactive guard)', () => {
  it('marks third_meal consumed without prompting when an existing user already has more than 3 meals', () => {
    const initialized = initializeReviewPromptState({ totalMealsSaved: 12 });

    expect(initialized.hasPromptedForMilestone.third_meal).toBe(true);
    expect(initialized.lastPromptedAt).toBeNull();
    expect(initialized.promptTimestamps).toEqual([]);
    expect(shouldPromptForReview(initialized, context({ totalMealsSaved: 12 }))).toEqual({
      prompt: false,
      milestone: null,
    });
  });

  it('leaves third_meal pending for a fresh install at 3 meals or fewer', () => {
    expect(initializeReviewPromptState({ totalMealsSaved: 0 }).hasPromptedForMilestone).toEqual({});
    expect(initializeReviewPromptState({ totalMealsSaved: 3 }).hasPromptedForMilestone).toEqual({});
    expect(shouldPromptForReview(initializeReviewPromptState({ totalMealsSaved: 3 }), context({ totalMealsSaved: 3 }))).toEqual({
      prompt: true,
      milestone: 'third_meal',
    });
  });
});

describe('recordReviewPrompt', () => {
  it('stamps the prompt, consumes the milestone and appends to the rolling window', () => {
    const next = recordReviewPrompt(state(), 'third_meal', NOW);

    expect(next.lastPromptedAt).toBe(NOW.toISOString());
    expect(next.promptTimestamps).toEqual([NOW.toISOString()]);
    expect(next.hasPromptedForMilestone.third_meal).toBe(true);
  });

  it('drops timestamps older than 365 days from the window', () => {
    const stale = state({ promptTimestamps: ['2024-01-01T12:00:00.000Z'] });

    expect(recordReviewPrompt(stale, 'streak_7', NOW).promptTimestamps).toEqual([NOW.toISOString()]);
  });
});
