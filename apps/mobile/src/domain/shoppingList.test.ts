import { describe, expect, it } from 'vitest';
import { buildShoppingList, formatShoppingListText } from './shoppingList';

describe('buildShoppingList', () => {
  it('merges duplicate ingredients and sums their grams, sorted by name', () => {
    const list = buildShoppingList([
      { name: 'Riz cuit', grams: 200 },
      { name: 'Poulet', grams: 150 },
      { name: 'riz cuit', grams: 100 },
    ]);

    expect(list).toEqual([
      { id: 'shop-poulet', name: 'Poulet', grams: 150 },
      { id: 'shop-riz-cuit', name: 'Riz cuit', grams: 300 },
    ]);
  });

  it('drops empty names and rounds grams', () => {
    const list = buildShoppingList([
      { name: '  ', grams: 50 },
      { name: 'Sauce', grams: 12.4 },
    ]);

    expect(list).toEqual([{ id: 'shop-sauce', name: 'Sauce', grams: 12 }]);
  });

  it('keeps an ingredient without a usable weight', () => {
    const list = buildShoppingList([{ name: 'Sel', grams: 0 }]);
    expect(list).toEqual([{ id: 'shop-sel', name: 'Sel', grams: 0 }]);
  });
});

describe('formatShoppingListText', () => {
  it('formats a shareable text with the title and grams', () => {
    const text = formatShoppingListText(
      [
        { id: 'shop-poulet', name: 'Poulet', grams: 150 },
        { id: 'shop-sel', name: 'Sel', grams: 0 },
      ],
      'Bol de poulet',
    );

    expect(text).toBe('Bol de poulet\n\n- Poulet — 150 g\n- Sel');
  });

  it('falls back to a default title', () => {
    expect(formatShoppingListText([], '   ')).toBe('Liste de courses\n');
  });
});
