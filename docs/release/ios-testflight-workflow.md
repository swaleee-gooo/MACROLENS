# MacroLens iOS TestFlight Workflow

MacroLens uses two iOS bundle identifiers:

- Development build: `com.idrisscarta.macrolens.dev`
- TestFlight/App Store build: `com.idrisscarta.macrolens`

## Fast Updates

Use EAS Update for JavaScript, UI, copy, styles, and image asset changes that do not add or update native dependencies.

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run eas:update:production -- --message "Describe the change"
```

Users receive the update after closing and reopening the TestFlight app once or twice.

## New Native Build

Create a new TestFlight build when changes touch native code, Expo SDK/native modules, app config, permissions, icons, build settings, or RevenueCat/native purchases.

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run eas:build:ios:testflight
```

## Safer Release Flow

1. Test locally with Expo dev server or the development build.
2. For JS/UI-only changes, publish first to `preview`:

```powershell
npm run eas:update:preview -- --message "Describe the change"
```

3. If it is good, publish to `production`.
4. For native changes, build TestFlight again.

## Current Beta Note

The TestFlight profile currently uses `EXPO_PUBLIC_ENTITLEMENT_MODE=local_dev` so the app can be used before RevenueCat/App Store subscriptions are fully configured. Switch this to `store` before App Store review.
