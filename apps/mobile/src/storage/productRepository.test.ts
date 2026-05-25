import { describe, expect, it } from 'vitest';
import type { PackagedFoodItem } from '../packagedFood/packagedFoodSchema';
import { createProductRepository } from './productRepository';

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  };
}

const item: PackagedFoodItem = {
  barcode: '123',
  name: 'Mayonnaise test',
  caloriesPer100g: 720,
  proteinPer100g: 1,
  carbsPer100g: 2,
  fatPer100g: 78,
  fiberPer100g: 0,
  source: 'nutrition_label_ocr',
};

describe('productRepository', () => {
  it('saves and retrieves user products by barcode', async () => {
    const repository = createProductRepository(memoryStorage());

    await repository.saveProduct(item);

    await expect(repository.getProduct('123')).resolves.toEqual(item);
  });

  it('keeps the newest saved version for a barcode', async () => {
    const repository = createProductRepository(memoryStorage());

    await repository.saveProduct(item);
    await repository.saveProduct({ ...item, name: 'Mayonnaise corrigee', caloriesPer100g: 690 });

    await expect(repository.getProduct('123')).resolves.toMatchObject({
      name: 'Mayonnaise corrigee',
      caloriesPer100g: 690,
    });
  });
});
