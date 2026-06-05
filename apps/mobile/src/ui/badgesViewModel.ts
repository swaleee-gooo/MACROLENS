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
  { id: 'streak-7', title: '7-day streak', detail: 'Log a meal for 7 days.', accent: 'green', unlocked: (input) => input.streakDays >= 7 },
  { id: 'protein-7', title: '7 protein days', detail: 'Hit your protein target for 7 days.', accent: 'green', unlocked: (input) => input.proteinTargetDays >= 7 },
  { id: 'photo-3', title: 'Consistent scanner', detail: 'Scan 3 meals.', accent: 'blue', unlocked: (input) => input.scanCount >= 3 },
  { id: 'target-3', title: 'Target hit', detail: 'Hit your macros for 3 days.', accent: 'amber', unlocked: (input) => input.streakDays >= 3 },
  { id: 'perfect-14', title: 'Balanced routine', detail: 'Stay consistent for 14 days.', accent: 'green', unlocked: (input) => input.streakDays >= 14 },
];

export function buildBadgesViewModel(input: Input) {
  const unlocked = badges.filter((badge) => badge.unlocked(input));
  const locked = badges.filter((badge) => !badge.unlocked(input));

  return { unlocked, locked };
}
