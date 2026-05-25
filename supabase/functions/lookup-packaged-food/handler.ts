type LookupRequest = {
  barcode?: string;
};

type Dependencies = {
  fetchProduct?: (url: string) => Promise<Response>;
};

export async function handleLookupPackagedFood(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  const body = (await request.json()) as LookupRequest;
  if (!body.barcode) {
    return Response.json({ error: 'barcode_required' }, { status: 400 });
  }

  const fetchProduct = dependencies.fetchProduct ?? fetch;
  const response = await fetchProduct(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(body.barcode)}.json`);
  if (!response.ok) {
    return Response.json({ error: 'open_food_facts_failed' }, { status: 502 });
  }

  const payload = await response.json();
  if (!payload.product) {
    return Response.json({ error: 'product_not_found' }, { status: 404 });
  }

  return Response.json({
    code: body.barcode,
    product: payload.product,
  });
}
