/**
 * JSON schema handed to the OpenAI Responses API (strict structured output) for
 * recipe extraction. Mirrors the `mealAnalysisJsonSchema` approach used by the
 * meal analyzer. The model returns `recipeFound: false` when the shared link is
 * not actually a recipe, so the handler can answer with a precise error instead
 * of inventing ingredients.
 */
export const recipeExtractionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['recipeFound', 'title', 'summary', 'servings', 'statedCaloriesPerServing', 'ingredients', 'steps'],
  properties: {
    recipeFound: {
      type: 'boolean',
      description: 'False when the content is not a cooking recipe (skit, vlog, unrelated link).',
    },
    title: { type: 'string', description: 'Short dish name. Empty string when recipeFound is false.' },
    summary: { type: 'string', description: 'One sentence describing the dish. Empty when no recipe.' },
    servings: { type: 'integer', minimum: 1, description: 'Number of servings the listed quantities make. Use 1 if unknown.' },
    statedCaloriesPerServing: {
      type: ['number', 'null'],
      description:
        'Calories PER SERVING explicitly stated by the creator in the caption/post/video (e.g. "508 kcal per bowl", "2000 cal total for 4"). Convert a stated total to per-serving by dividing by servings. Use null when no calorie number is stated — never compute or guess it from the ingredients.',
    },
    ingredients: {
      type: 'array',
      description: 'Every ingredient with an estimated total weight for the whole recipe and per-100g nutrition.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'grams', 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'],
        properties: {
          name: { type: 'string' },
          grams: { type: 'number', minimum: 0, description: 'Total grams for all servings of the recipe.' },
          kcalPer100g: { type: 'number', minimum: 0 },
          proteinPer100g: { type: 'number', minimum: 0 },
          carbsPer100g: { type: 'number', minimum: 0 },
          fatPer100g: { type: 'number', minimum: 0 },
        },
      },
    },
    steps: {
      type: 'array',
      description: 'Ordered preparation steps. May be empty when the source only lists ingredients.',
      items: { type: 'string' },
    },
  },
} as const;
