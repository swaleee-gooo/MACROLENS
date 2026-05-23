const confidenceEnum = ['high', 'medium', 'low'] as const;
const mealCategoryEnum = [
  'poke_bowl',
  'pasta',
  'burger_fries',
  'salad',
  'sandwich',
  'mixed_plate',
  'dessert',
  'drink',
  'packaged',
  'unknown',
] as const;
const portionSizeEnum = ['small', 'standard', 'large', 'unknown'] as const;

export const mealAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isFoodPhoto',
    'nonFoodReason',
    'mealName',
    'mealCategory',
    'portionSize',
    'confidence',
    'uncertaintyReasons',
    'hiddenCalorieRisks',
    'items',
  ],
  properties: {
    isFoodPhoto: { type: 'boolean' },
    nonFoodReason: { type: 'string' },
    mealName: { type: 'string' },
    mealCategory: { enum: mealCategoryEnum },
    portionSize: { enum: portionSizeEnum },
    confidence: { enum: confidenceEnum },
    uncertaintyReasons: {
      type: 'array',
      items: { type: 'string' },
    },
    hiddenCalorieRisks: {
      type: 'array',
      items: { type: 'string' },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'canonicalFoodName',
          'estimatedQuantity',
          'unit',
          'calories',
          'proteinG',
          'carbsG',
          'fatG',
          'fiberG',
          'confidence',
        ],
        properties: {
          name: { type: 'string' },
          canonicalFoodName: { type: 'string' },
          estimatedQuantity: { type: 'number' },
          unit: { type: 'string' },
          calories: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
          fiberG: { type: 'number' },
          confidence: { enum: confidenceEnum },
        },
      },
    },
  },
} as const;
