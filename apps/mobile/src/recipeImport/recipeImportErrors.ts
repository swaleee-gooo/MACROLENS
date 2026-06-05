/**
 * Typed errors for the "import a recipe from a link" flow.
 *
 * Mirrors the analysis layer's `NonFoodPhotoError` pattern: a small named error
 * the UI can branch on to show a clear, branded message instead of a generic
 * failure screen.
 */

export const UNSUPPORTED_RECIPE_URL_MESSAGE =
  "Ce lien n'est pas reconnu. Colle un lien TikTok, Instagram, YouTube ou une page de recette.";

export const RECIPE_EXTRACTION_FAILED_MESSAGE =
  "Je n'ai pas réussi à lire cette recette. Réessaie, ou ajuste les ingrédients à la main.";

/** Thrown when the shared text/URL is not a usable recipe link. */
export class UnsupportedRecipeUrlError extends Error {
  readonly userMessage: string;

  constructor(message = 'unsupported_recipe_url', userMessage: string = UNSUPPORTED_RECIPE_URL_MESSAGE) {
    super(message);
    this.name = 'UnsupportedRecipeUrlError';
    this.userMessage = userMessage;
  }
}

/** Thrown when the URL is valid but the model could not return a recipe. */
export class RecipeExtractionFailedError extends Error {
  readonly userMessage: string;

  constructor(message = 'recipe_extraction_failed', userMessage: string = RECIPE_EXTRACTION_FAILED_MESSAGE) {
    super(message);
    this.name = 'RecipeExtractionFailedError';
    this.userMessage = userMessage;
  }
}

export function isUnsupportedRecipeUrlError(error: unknown): error is UnsupportedRecipeUrlError {
  return error instanceof UnsupportedRecipeUrlError || (error instanceof Error && error.name === 'UnsupportedRecipeUrlError');
}

export function isRecipeExtractionFailedError(error: unknown): error is RecipeExtractionFailedError {
  return error instanceof RecipeExtractionFailedError || (error instanceof Error && error.name === 'RecipeExtractionFailedError');
}
