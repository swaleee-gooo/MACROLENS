export type Badge = {
  id: string;
  title: string;
  detail: string;
  accent: 'green' | 'blue' | 'amber';
};

type Input = {
  streakDays: number;
  proteinTargetDays: number;
  scanCount: number;
};

const badges: (Badge & { unlocked: (input: Input) => boolean })[] = [
  { id: 'streak-7', title: '7 jours consecutifs', detail: 'Enregistrer un repas pendant 7 jours.', accent: 'green', unlocked: (input) => input.streakDays >= 7 },
  { id: 'protein-7', title: '7 jours de proteines', detail: 'Atteindre tes proteines pendant 7 jours.', accent: 'green', unlocked: (input) => input.proteinTargetDays >= 7 },
  { id: 'photo-3', title: 'Photographe assidu', detail: 'Scanner 3 repas.', accent: 'blue', unlocked: (input) => input.scanCount >= 3 },
  { id: 'target-3', title: 'Cible atteinte', detail: 'Atteindre tes macros pendant 3 jours.', accent: 'amber', unlocked: (input) => input.streakDays >= 3 },
  { id: 'perfect-14', title: 'Equilibre parfait', detail: 'Rester regulier pendant 14 jours.', accent: 'green', unlocked: (input) => input.streakDays >= 14 },
];

export function buildBadgesViewModel(input: Input) {
  const unlocked = badges.filter((badge) => badge.unlocked(input));
  const locked = badges.filter((badge) => !badge.unlocked(input));

  return { unlocked, locked };
}
