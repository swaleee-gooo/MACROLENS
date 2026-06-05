import { describe, expect, it } from 'vitest';
import { calculateKcalInterval } from './uncertaintyEngine';

describe('MetaboProof uncertainty engine', () => {
  it('uses a wide default interval for photo-only estimates', () => {
    expect(
      calculateKcalInterval({
        predictedKcal: 500,
        evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
        userResiduals: [],
      }),
    ).toEqual({
      min: 325,
      max: 675,
      margin: 175,
      method: 'default_visual_margin',
    });
  });

  it('uses the 90th percentile user residual after enough verified samples', () => {
    const interval = calculateKcalInterval({
      predictedKcal: 500,
      evidenceLevel: 'CALIBRATED_TOTAL_WEIGHT',
      userResiduals: [18, 20, 22, 25, 27, 30, 35, 38, 42, 48],
    });

    expect(interval).toEqual({
      min: 452,
      max: 548,
      margin: 48,
      method: 'conformal_user_residual_p90',
    });
  });

  it('reduces calibrated intervals compared with visual-only defaults after samples', () => {
    const visual = calculateKcalInterval({ predictedKcal: 600, evidenceLevel: 'ESTIMATED_VISUAL_ONLY', userResiduals: [] });
    const calibrated = calculateKcalInterval({
      predictedKcal: 600,
      evidenceLevel: 'CALIBRATED_TOTAL_WEIGHT',
      userResiduals: [30, 32, 34, 36, 40, 42, 45, 48, 52, 55],
    });

    expect(calibrated.max - calibrated.min).toBeLessThan(visual.max - visual.min);
  });
});
