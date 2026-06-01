function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHttpsUrl(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateBenchmarkCasesForRelease({ cases, minCases, requireImageUrls, gateName }) {
  const failures = [];

  if (!Array.isArray(cases)) {
    return {
      passed: false,
      failures: [`${gateName}_cases_must_be_array`],
    };
  }

  if (cases.length < minCases) {
    failures.push(`${gateName}_requires_at_least_${minCases}_cases`);
  }

  const seenIds = new Set();
  cases.forEach((benchmarkCase, index) => {
    const caseNumber = index + 1;

    if (!isRecord(benchmarkCase)) {
      failures.push(`${gateName}_case_${caseNumber}_invalid`);
      return;
    }

    if (typeof benchmarkCase.id !== 'string' || benchmarkCase.id.length === 0) {
      failures.push(`${gateName}_case_${caseNumber}_missing_id`);
    } else if (seenIds.has(benchmarkCase.id)) {
      failures.push(`${gateName}_case_${caseNumber}_duplicate_id_${benchmarkCase.id}`);
    } else {
      seenIds.add(benchmarkCase.id);
    }

    if (requireImageUrls && !isHttpsUrl(benchmarkCase.imageUrl)) {
      failures.push(`${gateName}_case_${caseNumber}_missing_https_image_url`);
    }
  });

  return {
    passed: failures.length === 0,
    failures,
  };
}

export function assertBenchmarkCasesForRelease(options) {
  const result = validateBenchmarkCasesForRelease(options);
  if (!result.passed) {
    throw new Error(result.failures.join(','));
  }

  return result;
}
