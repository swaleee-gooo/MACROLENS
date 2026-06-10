const DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_DAYS = 30;
const ROLLING_WINDOW_DAYS = 365;
const MAX_PROMPTS_PER_WINDOW = 3;
const THIRD_MEAL_COUNT = 3;
const STREAK_MILESTONE_DAYS = 7;

export type ReviewPromptMilestone = 'third_meal' | 'streak_7';

export type ReviewPromptState = {
  lastPromptedAt: string | null; // ISO
  // Spec note: the spec sketches `promptCount365d: number`; timestamps are
  // stored instead so the 365-day window is truly rolling (a bare counter can
  // never expire old prompts). The rolling count is derived at evaluation time.
  promptTimestamps: string[]; // ISO, one entry per recorded prompt attempt
  hasPromptedForMilestone: Record<string, boolean>; // 'third_meal' | 'streak_7'
};

export type ReviewPromptContext = {
  totalMealsSaved: number;
  currentStreakDays: number;
  now: Date;
  lastActionWasError: boolean;
};

export function createInitialReviewPromptState(): ReviewPromptState {
  return {
    lastPromptedAt: null,
    promptTimestamps: [],
    hasPromptedForMilestone: {},
  };
}

// Lazy first-time initialization (called by the repository the FIRST time the
// state is read, never as a boot migration): existing users who already have
// more than 3 meals saved must not get a retroactive `third_meal` prompt, so
// the milestone is marked consumed immediately, without prompting.
export function initializeReviewPromptState(context: { totalMealsSaved: number }): ReviewPromptState {
  const state = createInitialReviewPromptState();
  if (context.totalMealsSaved > THIRD_MEAL_COUNT) {
    state.hasPromptedForMilestone.third_meal = true;
  }

  return state;
}

export function countPromptsInRollingWindow(state: ReviewPromptState, now: Date): number {
  const windowStart = now.getTime() - ROLLING_WINDOW_DAYS * DAY_MS;
  return state.promptTimestamps.filter((timestamp) => {
    const promptedAt = Date.parse(timestamp);
    return Number.isFinite(promptedAt) && promptedAt > windowStart;
  }).length;
}

function pendingMilestone(state: ReviewPromptState, context: ReviewPromptContext): ReviewPromptMilestone | null {
  // Each milestone fires at most once ever.
  if (!state.hasPromptedForMilestone.third_meal && context.totalMealsSaved === THIRD_MEAL_COUNT) {
    return 'third_meal';
  }

  if (!state.hasPromptedForMilestone.streak_7 && context.currentStreakDays >= STREAK_MILESTONE_DAYS) {
    return 'streak_7';
  }

  return null;
}

export function shouldPromptForReview(
  state: ReviewPromptState,
  context: ReviewPromptContext,
): { prompt: boolean; milestone: string | null } {
  const milestone = pendingMilestone(state, context);
  if (!milestone) {
    return { prompt: false, milestone: null };
  }

  // Never right after an error (failed scan, failed purchase): the user is
  // not at a satisfaction peak. The milestone stays pending for a later save.
  if (context.lastActionWasError) {
    return { prompt: false, milestone: null };
  }

  // Never within 30 days of the previous prompt.
  if (state.lastPromptedAt !== null) {
    const lastPromptedAt = Date.parse(state.lastPromptedAt);
    if (Number.isFinite(lastPromptedAt) && context.now.getTime() - lastPromptedAt < COOLDOWN_DAYS * DAY_MS) {
      return { prompt: false, milestone: null };
    }
  }

  // Never more than 3 prompts per rolling 365 days (Apple's yearly budget).
  if (countPromptsInRollingWindow(state, context.now) >= MAX_PROMPTS_PER_WINDOW) {
    return { prompt: false, milestone: null };
  }

  return { prompt: true, milestone };
}

// Records a prompt attempt (the OS may still decide not to show the popup —
// the attempt counts against the budget regardless). Pure: returns new state.
export function recordReviewPrompt(state: ReviewPromptState, milestone: string, now: Date): ReviewPromptState {
  const windowStart = now.getTime() - ROLLING_WINDOW_DAYS * DAY_MS;

  return {
    lastPromptedAt: now.toISOString(),
    promptTimestamps: [
      ...state.promptTimestamps.filter((timestamp) => {
        const promptedAt = Date.parse(timestamp);
        return Number.isFinite(promptedAt) && promptedAt > windowStart;
      }),
      now.toISOString(),
    ],
    hasPromptedForMilestone: { ...state.hasPromptedForMilestone, [milestone]: true },
  };
}
