export type AnalysisAnimationStage = {
  label: string;
  detail: string;
  progress: number;
};

export function buildAnalysisAnimationStages(): AnalysisAnimationStage[] {
  return [
    { label: 'Detection aliments', detail: 'On isole les ingredients visibles.', progress: 18 },
    { label: 'Estimation portions', detail: 'On compare volume, assiette et densite.', progress: 46 },
    { label: 'Calories cachees', detail: 'Sauces, huile et toppings sont verifies.', progress: 74 },
    { label: 'Macros finales', detail: 'Calories, proteines et plage probable arrivent.', progress: 100 },
  ];
}
