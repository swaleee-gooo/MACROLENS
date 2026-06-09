export type ShoppingListSource = {
  name: string;
  grams: number;
};

export type ShoppingListItem = {
  id: string;
  name: string;
  grams: number;
};

function canonicalName(name: string): string {
  return name.trim().toLowerCase();
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

/**
 * Build a de-duplicated grocery list from a meal's / recipe's ingredients:
 * same ingredient name → quantities summed, sorted alphabetically.
 */
export function buildShoppingList(sourceItems: ShoppingListSource[]): ShoppingListItem[] {
  const byName = new Map<string, ShoppingListItem>();

  for (const source of sourceItems) {
    const name = source.name.trim();
    if (name.length === 0) {
      continue;
    }

    const key = canonicalName(name);
    const grams = typeof source.grams === 'number' && Number.isFinite(source.grams) && source.grams > 0 ? source.grams : 0;
    const existing = byName.get(key);

    if (existing) {
      existing.grams += grams;
    } else {
      byName.set(key, { id: `shop-${slug(key)}`, name, grams });
    }
  }

  return Array.from(byName.values())
    .map((item) => ({ ...item, grams: Math.round(item.grams) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Plain-text export for the native Share sheet (Notes, Messages, …). */
export function formatShoppingListText(items: ShoppingListItem[], title: string): string {
  const header = title.trim().length > 0 ? title.trim() : 'Liste de courses';
  const lines = items.map((item) => (item.grams > 0 ? `- ${item.name} — ${item.grams} g` : `- ${item.name}`));
  return [header, '', ...lines].join('\n');
}
