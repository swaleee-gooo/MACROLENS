import type { PortionEvidence, ReferenceObjectKey } from '../metaboproof/portionEngine';

export type ScannerMealPhotoRole = 'primary' | 'top' | 'side';

export type ScannerEvidenceState = {
  photos: Array<{
    uri: string;
    role: ScannerMealPhotoRole;
  }>;
  referenceObject?: {
    key: ReferenceObjectKey;
    cancelled: boolean;
    detected: boolean;
  };
};

export function createScannerEvidenceState(): ScannerEvidenceState {
  return {
    photos: [],
  };
}

export function addScannerMealPhoto(state: ScannerEvidenceState, uri: string, role: ScannerMealPhotoRole = 'primary'): ScannerEvidenceState {
  return {
    ...state,
    photos: [...state.photos.filter((photo) => photo.role !== role), { uri, role }],
  };
}

export function cancelReferenceObject(state: ScannerEvidenceState, key: ReferenceObjectKey): ScannerEvidenceState {
  return {
    ...state,
    referenceObject: {
      key,
      cancelled: true,
      detected: false,
    },
  };
}

export function scannerEvidenceForAnalysis(state: ScannerEvidenceState): PortionEvidence[] {
  const topPhoto = state.photos.find((photo) => photo.role === 'top');
  const sidePhoto = state.photos.find((photo) => photo.role === 'side');
  const primaryPhoto = state.photos.find((photo) => photo.role === 'primary') ?? topPhoto;
  const evidence: PortionEvidence[] = [];

  if (topPhoto && sidePhoto) {
    evidence.push({ type: 'multi_photo_top_side', imageUris: [topPhoto.uri, sidePhoto.uri] });
  } else if (primaryPhoto) {
    evidence.push({ type: 'single_photo', imageUris: [primaryPhoto.uri] });
  }

  if (state.referenceObject) {
    evidence.push({
      type: 'reference_object',
      referenceObjectKey: state.referenceObject.key,
      cancelled: state.referenceObject.cancelled,
      detected: state.referenceObject.detected,
    });
  }

  return evidence;
}
