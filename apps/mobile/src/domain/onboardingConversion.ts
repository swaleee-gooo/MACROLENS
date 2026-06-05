import type { UserGoal } from './types';

export type TrackingFriction = 'weighing_food' | 'forgetting_meals' | 'restaurant_meals' | 'hidden_calories';

type Input = {
  goal: UserGoal;
  friction: TrackingFriction;
  proteinTargetG: number;
};

const fallbackByGoal: Record<UserGoal, string> = {
  lose_fat: 'Scan meals, adjust portions in seconds, and keep your deficit clear without weighing everything.',
  build_muscle: 'Keep protein high, control calories, and build meals that support your progress.',
  maintain: 'Stabilize your habits, spot gaps, and keep meals close to your daily target.',
  understand_eating: 'Understand what you really eat, compare your days, and improve without a complicated spreadsheet.',
};

export function buildPersonalizedPromise({ goal, friction, proteinTargetG }: Input): string {
  const proteinTarget = `${Math.round(proteinTargetG)}g`;

  if (goal === 'lose_fat' && friction === 'restaurant_meals') {
    return `Scan restaurant meals, correct portions in seconds, and aim for ${proteinTarget} of protein per day.`;
  }

  if (goal === 'build_muscle' && friction === 'hidden_calories') {
    return `Keep protein high, spot hidden calories, and build meals around ${proteinTarget} of protein per day.`;
  }

  if (friction === 'weighing_food') {
    return `Replace constant weighing with a scan you can correct, then aim for ${proteinTarget} of protein per day.`;
  }

  if (friction === 'forgetting_meals') {
    return `Log meals quickly when you remember, keep your timeline clean, and aim for ${proteinTarget} of protein per day.`;
  }

  if (friction === 'restaurant_meals') {
    return `Scan tricky plates, adjust sauces and portions, and aim for ${proteinTarget} of protein per day.`;
  }

  if (friction === 'hidden_calories') {
    return `Spot hidden calories, correct oil and toppings, and aim for ${proteinTarget} of protein per day.`;
  }

  return fallbackByGoal[goal];
}
