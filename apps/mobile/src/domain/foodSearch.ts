export type FoodSearchEntry = {
  id: string;
  name: string;
  aliases: string[];
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  verified: boolean;
};

const foodEntries: FoodSearchEntry[] = [
  {
    id: 'chicken-breast-grilled',
    name: 'Chicken breast, grilled',
    aliases: ['poulet', 'blanc de poulet', 'chicken'],
    servingLabel: '150 g',
    calories: 248,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    fiberG: 0,
    verified: true,
  },
  {
    id: 'egg-whole',
    name: 'Egg',
    aliases: ['oeuf', 'eggs'],
    servingLabel: '2 pieces',
    calories: 156,
    proteinG: 12.6,
    carbsG: 1.1,
    fatG: 10.6,
    fiberG: 0,
    verified: true,
  },
  {
    id: 'oats',
    name: 'Oats',
    aliases: ['avoine', 'flocons'],
    servingLabel: '60 g',
    calories: 233,
    proteinG: 10.2,
    carbsG: 39.8,
    fatG: 4.1,
    fiberG: 6.4,
    verified: true,
  },
  {
    id: 'banana',
    name: 'Banana',
    aliases: ['banane'],
    servingLabel: '1 medium',
    calories: 105,
    proteinG: 1.3,
    carbsG: 27,
    fatG: 0.4,
    fiberG: 3.1,
    verified: true,
  },
  {
    id: 'apple',
    name: 'Apple',
    aliases: ['pomme'],
    servingLabel: '1 medium',
    calories: 95,
    proteinG: 0.5,
    carbsG: 25,
    fatG: 0.3,
    fiberG: 4.4,
    verified: true,
  },
  {
    id: 'brown-rice-cooked',
    name: 'Brown rice, cooked',
    aliases: ['riz complet', 'rice'],
    servingLabel: '150 g',
    calories: 168,
    proteinG: 3.9,
    carbsG: 34.5,
    fatG: 1.4,
    fiberG: 2.7,
    verified: true,
  },
  {
    id: 'salmon-cooked',
    name: 'Salmon, cooked',
    aliases: ['saumon', 'salmon'],
    servingLabel: '150 g',
    calories: 309,
    proteinG: 33.2,
    carbsG: 0,
    fatG: 18.6,
    fiberG: 0,
    verified: true,
  },
  {
    id: 'avocado',
    name: 'Avocado',
    aliases: ['avocat'],
    servingLabel: '70 g',
    calories: 112,
    proteinG: 1.4,
    carbsG: 6,
    fatG: 10.3,
    fiberG: 4.7,
    verified: true,
  },
  {
    id: 'greek-yogurt',
    name: 'Greek yogurt 0%',
    aliases: ['yaourt grec', 'skyr'],
    servingLabel: '170 g',
    calories: 100,
    proteinG: 17,
    carbsG: 6,
    fatG: 0.7,
    fiberG: 0,
    verified: true,
  },
  {
    id: 'almonds',
    name: 'Almonds',
    aliases: ['amandes'],
    servingLabel: '30 g',
    calories: 174,
    proteinG: 6.4,
    carbsG: 6.1,
    fatG: 15,
    fiberG: 3.5,
    verified: true,
  },
];

export function searchFoodEntries(query: string, limit = 10): FoodSearchEntry[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return foodEntries.slice(0, limit);
  }

  return foodEntries
    .map((entry) => {
      const haystack = [entry.name, ...entry.aliases].join(' ').toLowerCase();
      const startsWith = haystack.startsWith(normalized) ? 0 : 1;
      const includes = haystack.includes(normalized) ? 0 : 2;
      return { entry, score: startsWith + includes };
    })
    .filter((candidate) => candidate.score < 3)
    .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map((candidate) => candidate.entry);
}
