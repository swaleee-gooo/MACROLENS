export const NON_FOOD_PHOTO_MESSAGE = 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.';

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
