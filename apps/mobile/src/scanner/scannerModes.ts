export type ScannerMode = 'meal' | 'barcode' | 'label' | 'library';
export type ScannerFrameVariant = 'plate' | 'barcode' | 'label' | 'none';
export type ScannerIconKey = 'camera' | 'barcode' | 'label' | 'library';
export type ScannerCaptureType = 'manual_photo' | 'automatic' | 'library';

export type ScannerModeConfig = {
  mode: ScannerMode;
  label: string;
  title: string;
  instruction: string;
  frameVariant: ScannerFrameVariant;
  showsShutter: boolean;
  captureType: ScannerCaptureType;
  icon: ScannerIconKey;
};

export const scannerModes: ScannerMode[] = ['meal', 'barcode', 'label', 'library'];

export const scannerModeConfig: Record<ScannerMode, ScannerModeConfig> = {
  meal: {
    mode: 'meal',
    label: 'Meal',
    title: 'Scan a meal',
    instruction: 'Place your plate in the frame to start an AI analysis.',
    frameVariant: 'plate',
    showsShutter: true,
    captureType: 'manual_photo',
    icon: 'camera',
  },
  barcode: {
    mode: 'barcode',
    label: 'Product',
    title: 'Barcode',
    instruction: 'Frame the product barcode. Detection is automatic.',
    frameVariant: 'barcode',
    showsShutter: false,
    captureType: 'automatic',
    icon: 'barcode',
  },
  label: {
    mode: 'label',
    label: 'Label',
    title: 'Nutrition label',
    instruction: 'Frame the nutrition table straight on, with per-100g values visible.',
    frameVariant: 'label',
    showsShutter: true,
    captureType: 'manual_photo',
    icon: 'label',
  },
  library: {
    mode: 'library',
    label: 'Gallery',
    title: 'Photo library',
    instruction: 'Choose an existing photo to analyze a meal.',
    frameVariant: 'none',
    showsShutter: false,
    captureType: 'library',
    icon: 'library',
  },
};

export function getScannerModeConfig(mode: ScannerMode): ScannerModeConfig {
  return scannerModeConfig[mode];
}
