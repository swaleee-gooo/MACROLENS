export const NON_FOOD_PHOTO_MESSAGE = 'I do not see food in this photo. Retake a photo of your meal.';

export class NonFoodPhotoError extends Error {
  readonly userMessage: string;

  constructor(userMessage = NON_FOOD_PHOTO_MESSAGE) {
    super('non_food_photo');
    this.name = 'NonFoodPhotoError';
    this.userMessage = userMessage;
  }
}

export function isNonFoodPhotoError(error: unknown): error is NonFoodPhotoError {
  return error instanceof NonFoodPhotoError;
}

export const RATE_LIMITED_MESSAGE = "You've hit the hourly scan limit. Try again in a few minutes.";

export class RateLimitedError extends Error {
  readonly userMessage: string;
  readonly retryAfterSeconds: number | null;

  constructor(retryAfterSeconds: number | null = null, userMessage = RATE_LIMITED_MESSAGE) {
    super('rate_limited');
    this.name = 'RateLimitedError';
    this.userMessage = userMessage;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isRateLimitedError(error: unknown): error is RateLimitedError {
  return error instanceof RateLimitedError;
}
