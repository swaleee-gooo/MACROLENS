type MacroTotal = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type Input = {
  consumed: MacroTotal;
  targets: MacroTotal;
};

export type TodayCoach = {
  headline: string;
  action: string;
};

export function buildTodayCoach(input: Input): TodayCoach {
  const proteinRemaining = input.targets.proteinG - input.consumed.proteinG;
  const caloriesRemaining = input.targets.calories - input.consumed.calories;

  if (proteinRemaining >= 40 && caloriesRemaining >= 500) {
    return {
      headline: 'Priorite proteines',
      action: 'Ajoute un repas avec 40-60g de proteines et garde les lipides moderes.',
    };
  }

  if (caloriesRemaining < 300) {
    return {
      headline: 'Finis leger',
      action: 'Choisis une option riche en proteines et basse en calories.',
    };
  }

  return {
    headline: 'Journee bien cadree',
    action: 'Continue avec un repas simple et garde tes portions proches du plan.',
  };
}
