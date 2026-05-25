export type ScannerMode = 'meal' | 'barcode' | 'label' | 'library';
export type ScannerFrameVariant = 'plate' | 'barcode' | 'label' | 'none';
export type ScannerIconKey = 'camera' | 'barcode' | 'label' | 'library';

export type ScannerModeConfig = {
  mode: ScannerMode;
  label: string;
  title: string;
  instruction: string;
  frameVariant: ScannerFrameVariant;
  showsShutter: boolean;
  icon: ScannerIconKey;
};

export const scannerModes: ScannerMode[] = ['meal', 'barcode', 'label', 'library'];

export function getScannerModeConfig(mode: ScannerMode): ScannerModeConfig {
  switch (mode) {
    case 'meal':
      return {
        mode,
        label: 'Repas',
        title: 'Scanner un repas',
        instruction: 'Place ton assiette dans le cadre pour lancer une analyse IA.',
        frameVariant: 'plate',
        showsShutter: true,
        icon: 'camera',
      };
    case 'barcode':
      return {
        mode,
        label: 'Barcode',
        title: 'Code-barres',
        instruction: 'Cadre le code du produit. La detection est automatique.',
        frameVariant: 'barcode',
        showsShutter: false,
        icon: 'barcode',
      };
    case 'label':
      return {
        mode,
        label: 'Etiquette',
        title: 'Etiquette',
        instruction: 'Cadre le tableau nutritionnel de face, valeurs par 100 g visibles.',
        frameVariant: 'label',
        showsShutter: true,
        icon: 'label',
      };
    case 'library':
      return {
        mode,
        label: 'Library',
        title: 'Bibliotheque',
        instruction: 'Choisis une photo existante pour analyser un repas.',
        frameVariant: 'none',
        showsShutter: false,
        icon: 'library',
      };
  }
}
