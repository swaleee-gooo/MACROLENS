import { recipeExtractionJsonSchema } from './recipeSchema.ts';

export type RecipePlatform = 'tiktok' | 'instagram' | 'youtube' | 'web';

export type ExtractedRecipeIngredient = {
  name: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type ExtractedRecipe = {
  title: string;
  summary: string;
  sourceUrl: string;
  sourcePlatform: RecipePlatform;
  sourceAuthor: string | null;
  imageUrl: string | null;
  servings: number;
  statedCaloriesPerServing: number | null;
  ingredients: ExtractedRecipeIngredient[];
  steps: string[];
};

export type RecipeExtractionResult =
  | { status: 'ok'; recipe: ExtractedRecipe }
  | { status: 'unsupported' }
  | { status: 'no_recipe' };

type RawRecipeExtraction = {
  recipeFound: boolean;
  title: string;
  summary: string;
  servings: number;
  statedCaloriesPerServing: number | null;
  ingredients: ExtractedRecipeIngredient[];
  steps: string[];
};

type SourceContext = {
  title: string;
  caption: string;
  author: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

const sourceFetchHeaders = { 'user-agent': 'MacroLensBot/1.0 (+recipe import)' };

export function detectPlatform(url: string): RecipePlatform {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'web';
  }

  if (/(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/.test(host)) {
    return 'tiktok';
  }
  if (/(^|\.)instagram\.com$|(^|\.)instagr\.am$/.test(host)) {
    return 'instagram';
  }
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(host)) {
    return 'youtube';
  }

  return 'web';
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isTikTokShortUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/.test(host);
  } catch {
    return false;
  }
}

async function resolveTikTokCanonicalUrl(url: string): Promise<string> {
  if (!isTikTokShortUrl(url)) {
    return url;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: sourceFetchHeaders,
    });
    try {
      await response.body?.cancel();
    } catch {
      // The final response body is not needed; ignore runtimes that cannot cancel it.
    }

    return response.url && isHttpUrl(response.url) && detectPlatform(response.url) === 'tiktok' ? response.url : url;
  } catch {
    return url;
  }
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, { headers: { ...sourceFetchHeaders, accept: 'application/json' } });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: sourceFetchHeaders });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${property}["'][^>]+content\\s*=\\s*["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableTrimmedString(value: unknown): string | null {
  const trimmed = trimmedString(value);
  return trimmed.length > 0 ? trimmed : null;
}

function httpImageUrl(value: unknown): string | null {
  const trimmed = trimmedString(value);
  return trimmed.length > 0 && isHttpUrl(trimmed) ? trimmed : null;
}

async function oEmbedContext(endpoint: string, sourceUrl: string): Promise<SourceContext | null> {
  const data = await fetchJson(endpoint);
  if (!data) {
    return null;
  }

  const title = trimmedString(data.title);
  const author = nullableTrimmedString(data.author_name);
  const imageUrl = httpImageUrl(data.thumbnail_url);
  return { title, caption: title, author, imageUrl, sourceUrl };
}

async function htmlContext(url: string): Promise<SourceContext> {
  const html = await fetchHtml(url);
  if (!html) {
    return { title: '', caption: '', author: null, imageUrl: null, sourceUrl: url };
  }

  const title = decodeHtmlEntities(trimmedString(metaContent(html, 'og:title') ?? html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ''));
  const description = decodeHtmlEntities(trimmedString(metaContent(html, 'og:description') ?? metaContent(html, 'description') ?? ''));
  const imageUrl = httpImageUrl(metaContent(html, 'og:image'));
  const author = nullableTrimmedString(metaContent(html, 'author') ?? metaContent(html, 'article:author'));
  const caption = `${title}\n${description}`.trim();
  return { title, caption, author, imageUrl, sourceUrl: url };
}

async function gatherSourceContext(url: string, platform: RecipePlatform): Promise<SourceContext> {
  if (platform === 'tiktok') {
    const canonicalUrl = await resolveTikTokCanonicalUrl(url);
    const context = await oEmbedContext(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`, canonicalUrl);
    return context ?? (await htmlContext(canonicalUrl));
  }

  if (platform === 'youtube') {
    const context = await oEmbedContext(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, url);
    return context ?? (await htmlContext(url));
  }

  // Instagram has no open oEmbed without a Graph token, and generic web pages just
  // get scraped for their Open Graph tags + title.
  return htmlContext(url);
}

type ResponseOutputContent = { type?: string; text?: string };
type ResponseOutputItem = { content?: ResponseOutputContent[] };

function extractOutputText(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'output_text' in data && typeof data.output_text === 'string') {
    return data.output_text;
  }

  if (typeof data !== 'object' || data === null || !('output' in data) || !Array.isArray(data.output)) {
    throw new Error('openai_missing_output_text');
  }

  for (const item of data.output as ResponseOutputItem[]) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  throw new Error('openai_missing_output_text');
}

const SYSTEM_PROMPT =
  'You extract a cooking recipe for MacroLens, a consumer macro tracker, from a social post or recipe page. ' +
  'You are given the post caption/title and (when available) a thumbnail image. ' +
  'If the content is clearly not a cooking recipe, set recipeFound=false and return empty title/summary/ingredients/steps. ' +
  'Otherwise return a concise dish title, a one-sentence summary, the number of servings the quantities make (1 if unknown), ' +
  'and the full ingredient list. For each ingredient estimate the TOTAL grams used in the whole recipe (all servings) and ' +
  'realistic per-100g nutrition (kcal, protein, carbs, fat) from standard food databases. When the caption omits a quantity, ' +
  'estimate a typical amount for the dish rather than skipping the ingredient. Include preparation steps when present. ' +
  'If the creator explicitly states a calorie number (per serving or total), report it in statedCaloriesPerServing as a ' +
  'per-serving value (divide a stated total by the number of servings); otherwise set statedCaloriesPerServing to null and never guess it. ' +
  'Do not invent ingredients that are not implied by the dish. Quantities are estimates the user will review and adjust.';

function nonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function positiveGrams(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function positiveNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function normalizedServings(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function normalizedStepList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((step) => trimmedString(step)).filter((step) => step.length > 0);
}

function normalizedIngredient(value: unknown): ExtractedRecipeIngredient | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const ingredient = value as Record<string, unknown>;
  const name = trimmedString(ingredient.name);
  const grams = positiveGrams(ingredient.grams);
  if (!name || grams === null) {
    return null;
  }

  return {
    name,
    grams,
    kcalPer100g: nonNegativeNumber(ingredient.kcalPer100g),
    proteinPer100g: nonNegativeNumber(ingredient.proteinPer100g),
    carbsPer100g: nonNegativeNumber(ingredient.carbsPer100g),
    fatPer100g: nonNegativeNumber(ingredient.fatPer100g),
  };
}

function isExtractedRecipeIngredient(value: ExtractedRecipeIngredient | null): value is ExtractedRecipeIngredient {
  return value !== null;
}

function normalizeRawRecipe(
  raw: RawRecipeExtraction,
  context: SourceContext,
  requestedUrl: string,
  platform: RecipePlatform,
): ExtractedRecipe | null {
  const rawIngredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const ingredients = rawIngredients.map((ingredient) => normalizedIngredient(ingredient)).filter(isExtractedRecipeIngredient);
  if (!raw.recipeFound || ingredients.length === 0) {
    return null;
  }

  const title = trimmedString(raw.title) || context.title || context.caption.split('\n')[0]?.trim() || 'Recette importee';

  return {
    title,
    summary: trimmedString(raw.summary),
    sourceUrl: requestedUrl,
    sourcePlatform: platform,
    sourceAuthor: context.author,
    imageUrl: context.imageUrl,
    servings: normalizedServings(raw.servings),
    statedCaloriesPerServing: positiveNumberOrNull(raw.statedCaloriesPerServing),
    ingredients,
    steps: normalizedStepList(raw.steps),
  };
}

async function callOpenAi(context: SourceContext, url: string, openAiKey: string): Promise<RawRecipeExtraction> {
  const content: Array<Record<string, unknown>> = [
    {
      type: 'input_text',
      text: `Source URL: ${context.sourceUrl || url}\nCaption / page text:\n${context.caption || '(no caption available — infer from the URL and thumbnail)'}`,
    },
  ];
  if (context.imageUrl) {
    content.push({ type: 'input_image', image_url: context.imageUrl, detail: 'low' });
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openAiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
        { role: 'user', content },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'macrolens_recipe_extraction',
          schema: recipeExtractionJsonSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_request_failed_${response.status}`);
  }

  return JSON.parse(extractOutputText(await response.json())) as RawRecipeExtraction;
}

export async function extractRecipeWithOpenAI(url: string, openAiKey: string): Promise<RecipeExtractionResult> {
  const platform = detectPlatform(url);
  const context = await gatherSourceContext(url, platform);
  const raw = await callOpenAi(context, url, openAiKey);
  const recipe = normalizeRawRecipe(raw, context, url, platform);

  if (!recipe) {
    return { status: 'no_recipe' };
  }

  return {
    status: 'ok',
    recipe,
  };
}
