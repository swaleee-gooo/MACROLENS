const allowedSources = new Set(['estimated', 'usda', 'open_food_facts', 'nutrition_label_ocr', 'mock']);
const confidenceRank = new Map([
  ['low', 0],
  ['medium', 1],
  ['high', 2],
]);

function roundMetric(value) {
  return Math.round(value * 10) / 10;
}

function inRange(value, range) {
  return value >= range[0] && value <= range[1];
}

function withinOutsideTolerance(value, range, tolerance) {
  if (inRange(value, range)) {
    return true;
  }

  return value >= range[0] * (1 - tolerance) && value <= range[1] * (1 + tolerance);
}

function distanceFromRange(value, range) {
  if (inRange(value, range)) {
    return 0;
  }

  return value < range[0] ? range[0] - value : value - range[1];
}

function rangePoints(value, range, fullPoints, partialPoints, tolerance = 0) {
  if (inRange(value, range)) {
    return fullPoints;
  }

  if (partialPoints > 0 && withinOutsideTolerance(value, range, tolerance)) {
    return partialPoints;
  }

  return 0;
}

function confidencePoints(actual, expected) {
  if (actual === expected) {
    return 15;
  }

  const actualRank = confidenceRank.get(actual);
  const expectedRank = confidenceRank.get(expected);
  if (typeof actualRank === 'number' && typeof expectedRank === 'number' && Math.abs(actualRank - expectedRank) === 1) {
    return 8;
  }

  return 0;
}

function correctionKeywordsFromText(value) {
  const normalized = String(value ?? '').toLowerCase();
  const keywords = new Set();

  if (/portion|up\/down|\+15|-15/.test(normalized)) {
    keywords.add('portion');
  }
  if (/oil|huile/.test(normalized)) {
    keywords.add('oil');
  }
  if (/sauce|dressing/.test(normalized)) {
    keywords.add('sauce');
  }
  if (/cheese|fromage|parmesan|camembert/.test(normalized)) {
    keywords.add('cheese');
  }
  if (/spread|nutella|butter|beurre/.test(normalized)) {
    keywords.add('spread');
  }
  if (/split|separate|base amount/.test(normalized)) {
    keywords.add('split');
  }
  if (/label|barcode|code-barres/.test(normalized)) {
    keywords.add('label');
  }

  return keywords;
}

function expectedCorrectionKeywords(usefulCorrections) {
  const keywords = new Set();
  for (const correction of usefulCorrections ?? []) {
    for (const keyword of correctionKeywordsFromText(correction)) {
      keywords.add(keyword);
    }
  }

  return keywords;
}

function returnedCorrectionKeywords(correctionSuggestions) {
  const keywords = new Set();
  for (const suggestion of correctionSuggestions ?? []) {
    for (const keyword of correctionKeywordsFromText(`${suggestion?.correctionType ?? ''} ${suggestion?.label ?? ''}`)) {
      keywords.add(keyword);
    }
  }

  return keywords;
}

function hasUsefulCorrection(usefulCorrections, correctionSuggestions) {
  const expected = expectedCorrectionKeywords(usefulCorrections);
  if (expected.size === 0) {
    return true;
  }

  const returned = returnedCorrectionKeywords(correctionSuggestions);
  return [...expected].some((keyword) => returned.has(keyword));
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentage(numerator, denominator) {
  return denominator > 0 ? roundMetric((numerator / denominator) * 100) : 0;
}

function average(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function scoreNutritionCase(benchmarkCase, payload) {
  const meal = payload?.meal ?? {};
  const expected = benchmarkCase.expected;
  const points = {
    calories: rangePoints(meal.caloriesEstimate, expected.calories, 30, 15, 0.15),
    protein: rangePoints(meal.proteinG, expected.proteinG, 20, 10, 0.2),
    carbs: rangePoints(meal.carbsG, expected.carbsG, 10, 0),
    fat: rangePoints(meal.fatG, expected.fatG, 10, 0),
    confidence: confidencePoints(meal.confidence, benchmarkCase.expectedConfidence),
    corrections: hasUsefulCorrection(benchmarkCase.usefulCorrections, payload?.correctionSuggestions) ? 10 : 0,
    source: allowedSources.has(meal.source) ? 5 : 0,
  };
  const failedDimensions = [];

  if (points.calories === 0) {
    failedDimensions.push('calories');
  }
  if (points.protein === 0) {
    failedDimensions.push('protein');
  }
  if (points.carbs === 0) {
    failedDimensions.push('carbs');
  }
  if (points.fat === 0) {
    failedDimensions.push('fat');
  }
  if (points.confidence === 0) {
    failedDimensions.push('confidence');
  }
  if (points.corrections === 0) {
    failedDimensions.push('corrections');
  }
  if (points.source === 0) {
    failedDimensions.push('source');
  }

  const totalScore = Object.values(points).reduce((sum, value) => sum + value, 0);

  return {
    id: benchmarkCase.id,
    category: benchmarkCase.category,
    meal: benchmarkCase.meal,
    expectedConfidence: benchmarkCase.expectedConfidence,
    outputConfidence: meal.confidence ?? 'unknown',
    source: meal.source ?? 'unknown',
    totalScore,
    passed: totalScore >= 70,
    points,
    failedDimensions,
    failureModes: benchmarkCase.failureModes ?? [],
    usefulCorrections: benchmarkCase.usefulCorrections ?? [],
    calorieError: roundMetric(distanceFromRange(meal.caloriesEstimate, expected.calories)),
    output: {
      caloriesEstimate: meal.caloriesEstimate,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      fiberG: meal.fiberG,
      confidence: meal.confidence,
      source: meal.source,
    },
  };
}

export function scoreNutritionError(benchmarkCase, failure) {
  return {
    id: benchmarkCase.id,
    category: benchmarkCase.category,
    meal: benchmarkCase.meal,
    expectedConfidence: benchmarkCase.expectedConfidence,
    outputConfidence: 'unknown',
    source: 'error',
    totalScore: 0,
    passed: false,
    points: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0,
      corrections: 0,
      source: 0,
    },
    failedDimensions: ['analysis_error'],
    failureModes: benchmarkCase.failureModes ?? [],
    usefulCorrections: benchmarkCase.usefulCorrections ?? [],
    calorieError: 0,
    error: {
      status: failure.status,
      code: failure.code,
      message: failure.message,
    },
    output: {
      caloriesEstimate: null,
      proteinG: null,
      carbsG: null,
      fatG: null,
      fiberG: null,
      confidence: 'unknown',
      source: 'error',
    },
  };
}

export function summarizeNutritionBenchmark(
  scores,
  { requiredCases = 50, minAverageScore = 80, hardCaseMinAverageScore = 65 } = {},
) {
  const executedCases = scores.length;
  const averageScore = roundMetric(average(scores.map((score) => score.totalScore)));
  const categoryAverages = {};
  const categories = [...new Set(scores.map((score) => score.category))];

  for (const category of categories) {
    const categoryScores = scores.filter((score) => score.category === category).map((score) => score.totalScore);
    categoryAverages[category] = roundMetric(average(categoryScores));
  }

  const lowExpectedCases = scores.filter((score) => score.expectedConfidence === 'low');
  const failureModeCounts = new Map();
  for (const score of scores.filter((item) => !item.passed)) {
    for (const failureMode of score.failureModes) {
      failureModeCounts.set(failureMode, (failureModeCounts.get(failureMode) ?? 0) + 1);
    }
  }

  const top10FailureModes = [...failureModeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([failureMode, count]) => ({ failureMode, count }));

  const releaseFailures = [];
  if (executedCases < requiredCases) {
    releaseFailures.push(`nutrition_requires_${requiredCases}_executed_cases`);
  }
  if (averageScore < minAverageScore) {
    releaseFailures.push('nutrition_average_score_below_80');
  }
  if ((categoryAverages['Hard Case'] ?? hardCaseMinAverageScore) < hardCaseMinAverageScore) {
    releaseFailures.push('nutrition_hard_case_average_below_65');
  }
  if (scores.some((score) => score.source === 'mock')) {
    releaseFailures.push('nutrition_mock_source_blocks_accuracy_claim');
  }
  if (scores.some((score) => score.source === 'error' || score.error)) {
    releaseFailures.push('nutrition_case_errors_present');
  }

  return {
    executedCases,
    averageScore,
    medianCalorieError: roundMetric(median(scores.map((score) => score.calorieError)) ?? 0),
    percentInsideCalorieRange: percentage(scores.filter((score) => score.points.calories === 30).length, executedCases),
    percentInsideProteinRange: percentage(scores.filter((score) => score.points.protein === 20).length, executedCases),
    lowConfidenceRecall: percentage(lowExpectedCases.filter((score) => score.outputConfidence === 'low').length, lowExpectedCases.length),
    top10FailureModes,
    correctionSuggestionPrecision: percentage(scores.filter((score) => score.points.corrections === 10).length, executedCases),
    categoryAverages,
    releaseFailures,
    accuracyClaimAllowed: releaseFailures.length === 0,
  };
}
