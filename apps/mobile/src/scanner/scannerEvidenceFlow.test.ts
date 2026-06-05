import { describe, expect, it } from 'vitest';
import { addScannerMealPhoto, cancelReferenceObject, createScannerEvidenceState, scannerEvidenceForAnalysis } from './scannerEvidenceFlow';

describe('scannerEvidenceFlow', () => {
  it('can finish with one photo', () => {
    const state = addScannerMealPhoto(createScannerEvidenceState(), 'file://top.jpg', 'primary');

    expect(scannerEvidenceForAnalysis(state)).toEqual([{ type: 'single_photo', imageUris: ['file://top.jpg'] }]);
  });

  it('can finish with top and side photos', () => {
    const state = addScannerMealPhoto(addScannerMealPhoto(createScannerEvidenceState(), 'file://top.jpg', 'top'), 'file://side.jpg', 'side');

    expect(scannerEvidenceForAnalysis(state)).toEqual([{ type: 'multi_photo_top_side', imageUris: ['file://top.jpg', 'file://side.jpg'] }]);
  });

  it('can finish when reference object capture is cancelled', () => {
    const state = cancelReferenceObject(addScannerMealPhoto(createScannerEvidenceState(), 'file://top.jpg', 'primary'), 'card');

    expect(scannerEvidenceForAnalysis(state)).toEqual([
      { type: 'single_photo', imageUris: ['file://top.jpg'] },
      { type: 'reference_object', referenceObjectKey: 'card', cancelled: true, detected: false },
    ]);
  });
});
