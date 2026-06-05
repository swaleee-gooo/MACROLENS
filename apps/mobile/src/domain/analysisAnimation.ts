export type AnalysisAnimationStage = {
  label: string;
  detail: string;
  progress: number;
};

export function buildAnalysisAnimationStages(): AnalysisAnimationStage[] {
  return [
    { label: 'Detecting foods', detail: 'Identifying the visible ingredients.', progress: 18 },
    { label: 'Estimating portions', detail: 'Comparing volume, plate size, and density.', progress: 46 },
    { label: 'Checking hidden calories', detail: 'Sauces, oil, and toppings are reviewed.', progress: 74 },
    { label: 'Final macros', detail: 'Calories, protein, and the likely range are almost ready.', progress: 100 },
  ];
}
