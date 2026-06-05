export type VisionSignals = {
  objectBoxes?: Array<{
    label: string;
    confidence: number;
    box: [number, number, number, number];
  }>;
  masks?: Array<{
    label: string;
    confidence: number;
    areaFraction: number;
  }>;
  depthStats?: {
    provider: string;
    available: boolean;
    confidence: number;
    relativeDepthP50?: number;
    failureMode?: string;
  };
  warnings?: string[];
};

export async function fetchVisionSignals(imageUrl: string, serviceUrl: string): Promise<VisionSignals> {
  const response = await fetch(serviceUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error(`vision_signals_failed_${response.status}`);
  }

  return (await response.json()) as VisionSignals;
}
