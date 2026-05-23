# MacroLens

MacroLens is a mobile MVP for estimating calories and macros from a food photo with a confidence-first user experience.

## Structure

- `apps/mobile`: Expo React Native app.
- `supabase`: database migration and Edge Function contract.
- `docs/superpowers/specs`: product and technical spec.
- `docs/superpowers/plans`: implementation plans.

## Verify

```powershell
Set-Location apps/mobile
npm test
npx tsc --noEmit
npm run web
```

## Product Principle

The app avoids fake precision. Every scan presents an estimate, a plausible calorie range, and a confidence level.
