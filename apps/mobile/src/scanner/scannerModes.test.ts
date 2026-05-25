import { describe, expect, it } from 'vitest';
import { getScannerModeConfig, scannerModes } from './scannerModes';

describe('scannerModes', () => {
  it('orders the scanner modes like the capture tray', () => {
    expect(scannerModes).toEqual(['meal', 'barcode', 'label', 'library']);
  });

  it('shows the shutter only for camera capture modes', () => {
    expect(getScannerModeConfig('meal').showsShutter).toBe(true);
    expect(getScannerModeConfig('label').showsShutter).toBe(true);
    expect(getScannerModeConfig('barcode').showsShutter).toBe(false);
    expect(getScannerModeConfig('library').showsShutter).toBe(false);
  });

  it('uses product wording for barcode mode instead of meal wording', () => {
    const barcodeConfig = getScannerModeConfig('barcode');

    expect(barcodeConfig.title).toBe('Code-barres');
    expect(barcodeConfig.instruction).toContain('produit');
    expect(barcodeConfig.frameVariant).toBe('barcode');
  });
});
