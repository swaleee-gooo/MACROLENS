import { formatConfidenceLabel } from './dashboardViewModel';
import type { FoodItem, Meal, NutritionSource } from '../domain/types';

export type ResultTrustItemRow = {
  id: string;
  name: string;
  quantityLabel: string;
  caloriesLabel: string;
  macroLine: string;
  confidenceLabel: string;
  sourceLabel: string;
};

export type ResultTrustViewModel = {
  sourceLabel: string;
  sourceDetail: string;
  confidenceTitle: string;
  rangeLabel: string;
  calorieRangeLabel: string;
  macroRanges: {
    protein: string;
    carbs: string;
    fat: string;
  };
  explanationTitle: string;
  explanationBullets: string[];
  items: ResultTrustItemRow[];
};

function sourceLabel(source: NutritionSource, imageUri: string): string {
  if (source === 'mock') {
    return 'Mode demo';
  }

  if (imageUri.startsWith('manual://')) {
    return 'Saisie manuelle';
  }

  if (source === 'open_food_facts' || source === 'nutrition_label_ocr') {
    return 'Base produit';
  }

  return 'Analyse IA';
}

function sourceDetail(meal: Meal): string {
  if (meal.source === 'open_food_facts') {
    return 'Macros issues de la base produit. Verifie surtout la portion consommee.';
  }

  if (meal.source === 'nutrition_label_ocr') {
    return "Macros lues depuis l'etiquette. Verifie la portion et les valeurs par 100 g.";
  }

  if (meal.imageUri.startsWith('manual://')) {
    return 'Valeurs saisies ou corrigees manuellement.';
  }

  if (meal.source === 'mock') {
    return 'Resultat exemple pour tester le flux sans IA live.';
  }

  return "Estimation photo avec fourchette. Ajuste les aliments visibles avant d'enregistrer.";
}

function foodSourceLabel(source: NutritionSource): string {
  if (source === 'open_food_facts') {
    return 'Open Food Facts';
  }

  if (source === 'nutrition_label_ocr') {
    return 'Etiquette OCR';
  }

  if (source === 'usda') {
    return 'USDA';
  }

  if (source === 'mock') {
    return 'Demo';
  }

  return 'Estimation IA';
}

function quantityLabel(item: FoodItem): string {
  const quantity = Math.round(item.estimatedQuantity * 10) / 10;
  return `${quantity}${item.unit === 'g' ? ' g' : ` ${item.unit}`}`;
}

function uncertaintyBullets(meal: Meal): string[] {
  const reasons = meal.uncertaintyReasons?.filter((reason) => reason.trim().length > 0) ?? [];
  if (reasons.length > 0) {
    return reasons.slice(0, 3);
  }

  if (meal.confidence === 'high') {
    return ['Aliments et portions suffisamment lisibles.', 'La correction reste disponible si la portion reelle differe.'];
  }

  if (meal.confidence === 'medium') {
    return ['Les aliments principaux sont detectes, mais une portion peut varier.', 'Ajuste les quantites si le cadrage etait incomplet.'];
  }

  return ['Controle les portions visibles avant sauvegarde.', 'Ajoute sauce ou huile si elles ne sont pas clairement visibles.'];
}

function buildItemRow(item: FoodItem): ResultTrustItemRow {
  return {
    id: item.id,
    name: item.name,
    quantityLabel: quantityLabel(item),
    caloriesLabel: `${item.calories} kcal`,
    macroLine: `${item.proteinG}g prot | ${item.carbsG}g gluc | ${item.fatG}g lip`,
    confidenceLabel: formatConfidenceLabel(item.confidence),
    sourceLabel: foodSourceLabel(item.dataSource),
  };
}

function macroRangeLabel(value: number, spread: number): string {
  const low = Math.max(0, Math.round(value * (1 - spread)));
  const high = Math.max(low, Math.round(value * (1 + spread)));
  return `${low}-${high}g`;
}

export function buildResultTrustViewModel(meal: Meal): ResultTrustViewModel {
  const calorieRangeLabel = `${meal.caloriesLow}-${meal.caloriesHigh} kcal`;

  return {
    sourceLabel: sourceLabel(meal.source, meal.imageUri),
    sourceDetail: sourceDetail(meal),
    confidenceTitle: formatConfidenceLabel(meal.confidence),
    rangeLabel: calorieRangeLabel,
    calorieRangeLabel,
    macroRanges: {
      protein: macroRangeLabel(meal.proteinG, 0.08),
      carbs: macroRangeLabel(meal.carbsG, 0.08),
      fat: macroRangeLabel(meal.fatG, 0.14),
    },
    explanationTitle: 'Pourquoi cette estimation ?',
    explanationBullets: uncertaintyBullets(meal),
    items: meal.items.map(buildItemRow),
  };
}
