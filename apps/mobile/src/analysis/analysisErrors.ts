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
