import type { UserGoal } from './types';

export type TrackingFriction = 'weighing_food' | 'forgetting_meals' | 'restaurant_meals' | 'hidden_calories';

type Input = {
  goal: UserGoal;
  friction: TrackingFriction;
  proteinTargetG: number;
};

const fallbackByGoal: Record<UserGoal, string> = {
  lose_fat: 'Scanne tes repas, ajuste les portions en secondes, et garde ton deficit clair sans tout peser.',
  build_muscle: 'Garde tes proteines hautes, controle tes calories, et construis des repas qui soutiennent ta progression.',
  maintain: 'Stabilise tes habitudes, repere les ecarts, et garde tes repas proches de ton objectif quotidien.',
  understand_eating: 'Comprends ce que tu manges vraiment, compare tes journees, et progresse sans tableau complique.',
};

export function buildPersonalizedPromise({ goal, friction, proteinTargetG }: Input): string {
  const proteinTarget = `${Math.round(proteinTargetG)}g`;

  if (goal === 'lose_fat' && friction === 'restaurant_meals') {
    return `Scanne tes repas au restaurant, corrige les portions en secondes, et vise ${proteinTarget} de proteines par jour.`;
  }

  if (goal === 'build_muscle' && friction === 'hidden_calories') {
    return `Garde tes proteines hautes, repere les calories cachees, et construis tes repas autour de ${proteinTarget} de proteines par jour.`;
  }

  if (friction === 'weighing_food') {
    return `Remplace la pesee constante par un scan corrigeable, puis vise ${proteinTarget} de proteines par jour.`;
  }

  if (friction === 'forgetting_meals') {
    return `Logge vite tes repas quand tu y penses, garde ta timeline propre, et vise ${proteinTarget} de proteines par jour.`;
  }

  if (friction === 'restaurant_meals') {
    return `Scanne les assiettes difficiles, ajuste sauces et portions, et vise ${proteinTarget} de proteines par jour.`;
  }

  if (friction === 'hidden_calories') {
    return `Repere les calories cachees, corrige huile et toppings, et vise ${proteinTarget} de proteines par jour.`;
  }

  return fallbackByGoal[goal];
}
