type LookupRequest = {
  barcode?: string;
};

type Dependencies = {
  fetchProduct?: (url: string, init?: RequestInit) => Promise<Response>;
};

type OpenFoodFactsPayload = {
  code?: string;
  status?: number;
  product?: unknown;
};

const openFoodFactsFields = 'code,product_name_fr,product_name,brands,nutriments';
const openFoodFactsHosts = ['https://world.openfoodfacts.org', 'https://fr.openfoodfacts.org'];

function unique(values: string[]): string[] {
  return values.filter((value, index) => value.length > 0 && values.indexOf(value) === index);
}

function normalizeBarcodeCandidates(rawBarcode: string): string[] {
  const compact = rawBarcode.trim();
  const digits = compact.replace(/\D/g, '');
  const candidates = [compact, digits];

  if (digits.length === 12) {
    candidates.push(`0${digits}`);
  }

  if (digits.length === 13 && digits.startsWith('0')) {
    candidates.push(digits.slice(1));
  }

  return unique(candidates);
}

export async function handleLookupPackagedFood(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  const body = (await request.json()) as LookupRequest;
  if (!body.barcode) {
    return Response.json({ error: 'barcode_required' }, { status: 400 });
  }

  const fetchProduct = dependencies.fetchProduct ?? fetch;

  for (const candidate of normalizeBarcodeCandidates(body.barcode)) {
    for (const host of openFoodFactsHosts) {
      const response = await fetchProduct(
        `${host}/api/v2/product/${encodeURIComponent(candidate)}.json?fields=${encodeURIComponent(openFoodFactsFields)}`,
        {
          headers: {
            accept: 'application/json',
            'user-agent': 'MacroLens/1.0 packaged-food-lookup',
          },
        },
      );

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as OpenFoodFactsPayload;
      if (payload.status === 0 || !payload.product) {
        continue;
      }

      return Response.json({
        code: payload.code || candidate,
        product: payload.product,
      });
    }
  }

  return Response.json({ error: 'product_not_found' }, { status: 404 });
}
