import type { PackagedFoodItem } from '../packagedFood/packagedFoodSchema';

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const storageKey = 'macrolens.products.v1';

function parseProducts(raw: string | null): PackagedFoodItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PackagedFoodItem[]) : [];
  } catch {
    return [];
  }
}

export function createProductRepository(storage: StorageLike) {
  async function listProducts(): Promise<PackagedFoodItem[]> {
    return parseProducts(await storage.getItem(storageKey));
  }

  return {
    async getProduct(barcode: string): Promise<PackagedFoodItem | null> {
      const products = await listProducts();
      return products.find((product) => product.barcode === barcode) ?? null;
    },
    async saveProduct(item: PackagedFoodItem): Promise<void> {
      const products = (await listProducts()).filter((product) => product.barcode !== item.barcode);
      products.unshift(item);
      await storage.setItem(storageKey, JSON.stringify(products.slice(0, 200)));
    },
    async clearProducts(): Promise<void> {
      await storage.removeItem(storageKey);
    },
  };
}
