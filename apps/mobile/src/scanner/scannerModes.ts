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
    label: 'Repas',
    title: 'Scanner un repas',
    instruction: 'Place ton assiette dans le cadre pour lancer une analyse IA.',
    frameVariant: 'plate',
    showsShutter: true,
    captureType: 'manual_photo',
    icon: 'camera',
  },
  barcode: {
    mode: 'barcode',
    label: 'Produit',
    title: 'Code-barres',
    instruction: 'Cadre le code du produit. La detection est automatique.',
    frameVariant: 'barcode',
    showsShutter: false,
    captureType: 'automatic',
    icon: 'barcode',
  },
  label: {
    mode: 'label',
    label: 'Etiquette',
    title: 'Etiquette nutritionnelle',
    instruction: 'Cadre le tableau nutritionnel de face, valeurs par 100 g visibles.',
    frameVariant: 'label',
    showsShutter: true,
    captureType: 'manual_photo',
    icon: 'label',
  },
  library: {
    mode: 'library',
    label: 'Galerie',
    title: 'Bibliotheque',
    instruction: 'Choisis une photo existante pour analyser un repas.',
    frameVariant: 'none',
    showsShutter: false,
    captureType: 'library',
    icon: 'library',
  },
};

export function getScannerModeConfig(mode: ScannerMode): ScannerModeConfig {
  return scannerModeConfig[mode];
}
