# MacroLens Mobile

Expo React Native MVP for photo-first macro tracking.

## Commands

- `npm install`
- `npm test`
- `npx tsc --noEmit`
- `npm run web`
- `npm run ios`
- `npm run android`

## Current Analysis Mode

The MVP uses `createMockAnalysisService()` so the app works without API keys. The Supabase Edge Function contract exists in `../../supabase/functions/analyze-meal/index.ts` and returns the same JSON shape.

## Safety Note

MacroLens shows nutrition estimates. It does not provide medical advice, diagnosis, or treatment guidance.
