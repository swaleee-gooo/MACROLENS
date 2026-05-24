# Premium Conversion V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MVP workflow with a premium onboarding, local hard paywall gate, bottom-tab app shell, polished dashboard/timeline/profile/result flows, and a clear path to real App Store IAP.

**Architecture:** Keep the existing lightweight `ScreenState` navigation in `App.tsx`, but introduce focused domain/view-model/storage modules so business logic is testable. This iteration implements a local Expo Go entitlement gate, not real native purchases; real RevenueCat/StoreKit integration must be a separate development-build iteration.

**Tech Stack:** Expo React Native SDK 54 app, TypeScript, AsyncStorage, Vitest, lucide-react-native, existing Supabase/OpenAI scan pipeline.

---

## Pre-Implementation Requirements

- Before editing app code, read the repo-required Expo docs at `https://docs.expo.dev/versions/v56.0.0/`.
- Keep the app compatible with current Expo Go testing during this iteration.
- Do not install RevenueCat or native IAP libraries in this plan.
- Do not expose a production-like fake purchase path as real monetization.
- Do not remove existing remote scan, non-food error, manual meal, correction, and local persistence flows.

---

## File Structure

- Modify `apps/mobile/src/ui/theme.ts`: premium palette, typography, shadows, tab/footer constants.
- Create `apps/mobile/src/components/BrandHeader.tsx`: consistent MacroLens header.
- Create `apps/mobile/src/components/BottomTabs.tsx`: Accueil/Timeline/Profil tabs.
- Create `apps/mobile/src/components/PremiumCard.tsx`: reusable card wrapper.
- Create `apps/mobile/src/components/RingProgress.tsx`: SVG circular progress rings.
- Create `apps/mobile/src/components/StickyFooterButton.tsx`: bottom CTA button.
- Create `apps/mobile/src/components/PaywallPlanCard.tsx`: paywall plan selector.
- Create `apps/mobile/src/domain/onboardingProfile.ts`: draft validation and conversion to `UserProfile`.
- Create `apps/mobile/src/domain/onboardingProfile.test.ts`: onboarding profile tests.
- Create `apps/mobile/src/domain/streaks.ts`: streak calculation from meals.
- Create `apps/mobile/src/domain/streaks.test.ts`: streak tests.
- Create `apps/mobile/src/domain/portionAdjustments.ts`: gram presets and item scaling.
- Create `apps/mobile/src/domain/portionAdjustments.test.ts`: adjustment tests.
- Create `apps/mobile/src/storage/entitlementRepository.ts`: local premium entitlement.
- Create `apps/mobile/src/storage/entitlementRepository.test.ts`: locked/unlock/clear tests.
- Create `apps/mobile/src/storage/onboardingRepository.ts`: onboarding completion persistence.
- Create `apps/mobile/src/storage/onboardingRepository.test.ts`: completion save/load/clear tests.
- Create `apps/mobile/src/ui/premiumDashboardViewModel.ts`: Home dashboard model.
- Create `apps/mobile/src/ui/premiumDashboardViewModel.test.ts`: dashboard tests.
- Create `apps/mobile/src/ui/timelineSectionsViewModel.ts`: group meals by day.
- Create `apps/mobile/src/ui/timelineSectionsViewModel.test.ts`: timeline grouping tests.
- Create `apps/mobile/src/ui/badgesViewModel.ts`: unlocked/locked badges.
- Create `apps/mobile/src/ui/badgesViewModel.test.ts`: badge tests.
- Replace `apps/mobile/src/screens/OnboardingScreen.tsx`: five-step premium onboarding.
- Create `apps/mobile/src/screens/PaywallScreen.tsx`: hard paywall UI.
- Create `apps/mobile/src/screens/PremiumHomeScreen.tsx`: premium dashboard.
- Create `apps/mobile/src/screens/PremiumTimelineScreen.tsx`: grouped timeline.
- Create `apps/mobile/src/screens/SuccessProfileScreen.tsx`: achievements/profile hub.
- Create `apps/mobile/src/screens/EditProfileScreen.tsx`: restyled editable profile.
- Create `apps/mobile/src/screens/PortionAdjustScreen.tsx`: gram adjustment.
- Create `apps/mobile/src/screens/SaveConfirmationScreen.tsx`: post-save reward.
- Modify `apps/mobile/src/screens/ResultScreen.tsx`: premium result styling and adjustment CTA.
- Modify `apps/mobile/App.tsx`: onboarding/paywall gate, bottom tabs, premium screen routing, save confirmation.
- Modify `docs/superpowers/status/2026-05-23-macrolens-project-control.md`: record Premium Conversion V1 after verification.

---

## Task 1: Premium Visual Foundation

**Files:**
- Modify: `apps/mobile/src/ui/theme.ts`
- Create: `apps/mobile/src/components/PremiumCard.tsx`
- Create: `apps/mobile/src/components/StickyFooterButton.tsx`
- Create: `apps/mobile/src/components/BrandHeader.tsx`
- Create: `apps/mobile/src/components/RingProgress.tsx`
- Create: `apps/mobile/src/components/BottomTabs.tsx`

- [ ] **Step 1: Read current theme and component conventions**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
Get-Content apps/mobile/src/ui/theme.ts
Get-Content apps/mobile/src/components/MetricPill.tsx
Get-Content apps/mobile/src/components/MealCard.tsx
```

Expected: existing `colors`, `spacing`, `radius`, and `typography` are visible.

- [ ] **Step 2: Extend theme**

In `apps/mobile/src/ui/theme.ts`, replace the exported constants with:

```ts
export const colors = {
  ink: '#050505',
  muted: '#6B707A',
  background: '#FAF9F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EFEA',
  line: '#E2DED6',
  black: '#050505',
  green: '#087A45',
  greenSoft: '#9DF2BE',
  blue: '#2F5BFF',
  blueSoft: '#EAF0FF',
  amber: '#FFAD66',
  amberSoft: '#FFF0E3',
  red: '#B42318',
  redSoft: '#FFE2DF',
  protein: '#087A45',
  carbs: '#2F5BFF',
  fat: '#FFAD66',
  fiber: '#7157D9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const typography = {
  hero: 44,
  title: 34,
  heading: 24,
  subheading: 19,
  body: 16,
  small: 13,
  tiny: 11,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
```

- [ ] **Step 3: Create PremiumCard**

Create `apps/mobile/src/components/PremiumCard.tsx`:

```tsx
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../ui/theme';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function PremiumCard({ children, style }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.lg,
        ...shadows.card,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Create StickyFooterButton**

Create `apps/mobile/src/components/StickyFooterButton.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export function StickyFooterButton({ label, onPress, disabled = false, icon, secondaryLabel, onSecondaryPress }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, borderColor: colors.line, borderTopWidth: 1, gap: spacing.md, padding: spacing.xl }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          alignItems: 'center',
          backgroundColor: disabled ? '#8F8F8B' : colors.black,
          borderRadius: radius.pill,
          flexDirection: 'row',
          gap: spacing.md,
          justifyContent: 'center',
          minHeight: 64,
          paddingHorizontal: spacing.xl,
        }}
      >
        <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>{label}</Text>
        {icon}
      </Pressable>
      {secondaryLabel && onSecondaryPress ? (
        <Pressable
          onPress={onSecondaryPress}
          style={{
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.pill,
            borderWidth: 1,
            minHeight: 54,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 5: Create BrandHeader**

Create `apps/mobile/src/components/BrandHeader.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { Bell, Flame, Settings } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  streak?: number;
  onSettings?: () => void;
};

export function BrandHeader({ streak, onSettings }: Props) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <Flame color={colors.black} size={24} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: 34, fontWeight: '900' }}>MACROLENS</Text>
      </View>
      {onSettings ? (
        <Pressable
          onPress={onSettings}
          style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 }}
        >
          <Settings color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 }}>
          {typeof streak === 'number' ? (
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>{streak}</Text>
          ) : (
            <Bell color={colors.ink} size={22} strokeWidth={2.4} />
          )}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 6: Create RingProgress**

Create `apps/mobile/src/components/RingProgress.tsx`:

```tsx
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../ui/theme';

type Props = {
  size: number;
  strokeWidth: number;
  progress: number;
  color?: string;
  label: string;
  detail: string;
};

export function RingProgress({ size, strokeWidth, progress, color = colors.black, label, detail }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(progress, 100));
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceMuted} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center', position: 'absolute' }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{detail}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 7: Create BottomTabs**

Create `apps/mobile/src/components/BottomTabs.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { BarChart3, Home, User } from 'lucide-react-native';
import { colors, spacing, typography } from '../ui/theme';

export type AppTab = 'home' | 'timeline' | 'profile';

type Props = {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
};

const tabs: { tab: AppTab; label: string; icon: typeof Home }[] = [
  { tab: 'home', label: 'Accueil', icon: Home },
  { tab: 'timeline', label: 'Timeline', icon: BarChart3 },
  { tab: 'profile', label: 'Profil', icon: User },
];

export function BottomTabs({ activeTab, onChangeTab }: Props) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderTopWidth: 1, flexDirection: 'row', paddingBottom: spacing.md, paddingTop: spacing.md }}>
      {tabs.map(({ tab, label, icon: Icon }) => {
        const active = activeTab === tab;

        return (
          <Pressable key={tab} onPress={() => onChangeTab(tab)} style={{ alignItems: 'center', flex: 1, gap: spacing.xs }}>
            <Icon color={active ? colors.black : colors.muted} size={24} strokeWidth={active ? 2.8 : 2.2} />
            <Text style={{ color: active ? colors.black : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 8: Run typecheck**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/ui/theme.ts apps/mobile/src/components/PremiumCard.tsx apps/mobile/src/components/StickyFooterButton.tsx apps/mobile/src/components/BrandHeader.tsx apps/mobile/src/components/RingProgress.tsx apps/mobile/src/components/BottomTabs.tsx
git commit -m "feat: add premium visual foundation"
```

---

## Task 2: Local Onboarding And Entitlement State

**Files:**
- Create: `apps/mobile/src/domain/onboardingProfile.ts`
- Create: `apps/mobile/src/domain/onboardingProfile.test.ts`
- Create: `apps/mobile/src/storage/onboardingRepository.ts`
- Create: `apps/mobile/src/storage/onboardingRepository.test.ts`
- Create: `apps/mobile/src/storage/entitlementRepository.ts`
- Create: `apps/mobile/src/storage/entitlementRepository.test.ts`

- [ ] **Step 1: Write onboarding profile tests**

Create `apps/mobile/src/domain/onboardingProfile.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid } from './onboardingProfile';

describe('onboarding profile', () => {
  it('validates complete realistic onboarding data', () => {
    expect(
      isOnboardingDraftValid({
        goal: 'lose_fat',
        age: 28,
        sex: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevel: 'moderate',
      }),
    ).toBe(true);
  });

  it('rejects unrealistic values', () => {
    expect(
      isOnboardingDraftValid({
        goal: 'lose_fat',
        age: 12,
        sex: 'male',
        heightCm: 80,
        weightKg: 20,
        activityLevel: 'moderate',
      }),
    ).toBe(false);
  });

  it('builds a user profile with calculated targets', () => {
    const profile = buildUserProfileFromOnboarding(
      {
        goal: 'lose_fat',
        age: 28,
        sex: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevel: 'moderate',
      },
      'local-user',
      '2026-05-24T10:00:00.000Z',
    );

    expect(profile.id).toBe('local-user');
    expect(profile.ageRange).toBe('25-34');
    expect(profile.targets.calorieTarget).toBeGreaterThan(0);
    expect(profile.targets.proteinTargetG).toBe(160);
    expect(profile.updatedAt).toBe('2026-05-24T10:00:00.000Z');
  });
});
```

- [ ] **Step 2: Write repository tests**

Create `apps/mobile/src/storage/entitlementRepository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from './mealRepository';
import { createEntitlementRepository } from './entitlementRepository';

describe('entitlement repository', () => {
  it('defaults to locked', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: false,
      source: 'none',
      updatedAt: null,
    });
  });

  it('saves and loads a local dev unlock', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await repository.saveEntitlement({
      isPremium: true,
      source: 'local_dev',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: true,
      source: 'local_dev',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
  });

  it('clears entitlement', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());
    await repository.saveEntitlement({ isPremium: true, source: 'local_dev', updatedAt: '2026-05-24T10:00:00.000Z' });

    await repository.clearEntitlement();

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: false,
      source: 'none',
      updatedAt: null,
    });
  });
});
```

Create `apps/mobile/src/storage/onboardingRepository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from './mealRepository';
import { createOnboardingRepository } from './onboardingRepository';

describe('onboarding repository', () => {
  it('defaults to incomplete', async () => {
    const repository = createOnboardingRepository(createMemoryStorageAdapter());

    await expect(repository.getState()).resolves.toEqual({ isComplete: false });
  });

  it('saves completion', async () => {
    const repository = createOnboardingRepository(createMemoryStorageAdapter());

    await repository.saveState({ isComplete: true, completedAt: '2026-05-24T10:00:00.000Z' });

    await expect(repository.getState()).resolves.toEqual({ isComplete: true, completedAt: '2026-05-24T10:00:00.000Z' });
  });

  it('clears completion', async () => {
    const repository = createOnboardingRepository(createMemoryStorageAdapter());
    await repository.saveState({ isComplete: true, completedAt: '2026-05-24T10:00:00.000Z' });

    await repository.clearState();

    await expect(repository.getState()).resolves.toEqual({ isComplete: false });
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/onboardingProfile.test.ts src/storage/entitlementRepository.test.ts src/storage/onboardingRepository.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 4: Implement onboarding domain**

Create `apps/mobile/src/domain/onboardingProfile.ts`:

```ts
import { calculateMacroTargets } from './macroTargets';
import type { UserGoal, UserProfile } from './types';

export type OnboardingProfileDraft = {
  goal: UserGoal;
  age: number;
  sex: 'female' | 'male';
  heightCm: number;
  weightKg: number;
  activityLevel: UserProfile['activityLevel'];
};

function ageRangeFromAge(age: number): UserProfile['ageRange'] {
  if (age <= 24) {
    return '18-24';
  }
  if (age <= 34) {
    return '25-34';
  }
  if (age <= 44) {
    return '35-44';
  }
  if (age <= 54) {
    return '45-54';
  }
  return '55+';
}

export function isOnboardingDraftValid(draft: OnboardingProfileDraft): boolean {
  return draft.age >= 18 && draft.age <= 85 && draft.heightCm >= 120 && draft.heightCm <= 230 && draft.weightKg >= 35 && draft.weightKg <= 250;
}

export function buildUserProfileFromOnboarding(draft: OnboardingProfileDraft, userId: string, updatedAt = new Date().toISOString()): UserProfile {
  const baseProfile: UserProfile = {
    id: userId,
    goal: draft.goal,
    ageRange: ageRangeFromAge(draft.age),
    sex: draft.sex,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    activityLevel: draft.activityLevel,
    targetWeightKg: null,
    targets: {
      calorieTarget: 0,
      proteinTargetG: 0,
      carbsTargetG: 0,
      fatTargetG: 0,
      fiberTargetG: 0,
      calorieOverride: null,
      proteinOverrideG: null,
    },
    updatedAt,
  };

  return {
    ...baseProfile,
    targets: calculateMacroTargets(baseProfile),
  };
}
```

- [ ] **Step 5: Implement repositories**

Create `apps/mobile/src/storage/entitlementRepository.ts`:

```ts
import type { StorageAdapter } from './mealRepository';

const ENTITLEMENT_KEY = 'macrolens.entitlement.v1';

export type EntitlementState = {
  isPremium: boolean;
  source: 'none' | 'local_dev' | 'store';
  updatedAt: string | null;
};

export type EntitlementRepository = {
  getEntitlement(): Promise<EntitlementState>;
  saveEntitlement(state: EntitlementState): Promise<void>;
  clearEntitlement(): Promise<void>;
};

const lockedState: EntitlementState = {
  isPremium: false,
  source: 'none',
  updatedAt: null,
};

export function createEntitlementRepository(storage: StorageAdapter): EntitlementRepository {
  return {
    async getEntitlement() {
      const raw = await storage.getItem(ENTITLEMENT_KEY);
      if (!raw) {
        return lockedState;
      }

      try {
        return JSON.parse(raw) as EntitlementState;
      } catch {
        return lockedState;
      }
    },

    async saveEntitlement(state) {
      await storage.setItem(ENTITLEMENT_KEY, JSON.stringify(state));
    },

    async clearEntitlement() {
      if (storage.removeItem) {
        await storage.removeItem(ENTITLEMENT_KEY);
        return;
      }

      await storage.setItem(ENTITLEMENT_KEY, '');
    },
  };
}
```

Create `apps/mobile/src/storage/onboardingRepository.ts`:

```ts
import type { StorageAdapter } from './mealRepository';

const ONBOARDING_KEY = 'macrolens.onboarding.v1';

export type OnboardingState = {
  isComplete: boolean;
  completedAt?: string;
};

export type OnboardingRepository = {
  getState(): Promise<OnboardingState>;
  saveState(state: OnboardingState): Promise<void>;
  clearState(): Promise<void>;
};

const initialState: OnboardingState = { isComplete: false };

export function createOnboardingRepository(storage: StorageAdapter): OnboardingRepository {
  return {
    async getState() {
      const raw = await storage.getItem(ONBOARDING_KEY);
      if (!raw) {
        return initialState;
      }

      try {
        return JSON.parse(raw) as OnboardingState;
      } catch {
        return initialState;
      }
    },

    async saveState(state) {
      await storage.setItem(ONBOARDING_KEY, JSON.stringify(state));
    },

    async clearState() {
      if (storage.removeItem) {
        await storage.removeItem(ONBOARDING_KEY);
        return;
      }

      await storage.setItem(ONBOARDING_KEY, '');
    },
  };
}
```

- [ ] **Step 6: Run tests**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/onboardingProfile.test.ts src/storage/entitlementRepository.test.ts src/storage/onboardingRepository.test.ts src/domain/macroTargets.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain/onboardingProfile.ts apps/mobile/src/domain/onboardingProfile.test.ts apps/mobile/src/storage/entitlementRepository.ts apps/mobile/src/storage/entitlementRepository.test.ts apps/mobile/src/storage/onboardingRepository.ts apps/mobile/src/storage/onboardingRepository.test.ts
git commit -m "feat: persist onboarding and entitlement state"
```

---

## Task 3: Premium Onboarding And Paywall Screens

**Files:**
- Replace: `apps/mobile/src/screens/OnboardingScreen.tsx`
- Create: `apps/mobile/src/screens/PaywallScreen.tsx`
- Create: `apps/mobile/src/components/PaywallPlanCard.tsx`

- [ ] **Step 1: Create PaywallPlanCard**

Create `apps/mobile/src/components/PaywallPlanCard.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

export type PaywallPlan = 'annual' | 'monthly';

type Props = {
  plan: PaywallPlan;
  selected: boolean;
  title: string;
  price: string;
  detail: string;
  badge?: string;
  onSelect: (plan: PaywallPlan) => void;
};

export function PaywallPlanCard({ plan, selected, title, price, detail, badge, onSelect }: Props) {
  return (
    <Pressable
      onPress={() => onSelect(plan)}
      style={{
        backgroundColor: selected ? colors.black : colors.surface,
        borderColor: selected ? colors.black : colors.line,
        borderRadius: radius.md,
        borderWidth: 2,
        gap: spacing.sm,
        padding: spacing.lg,
      }}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: selected ? 'white' : colors.ink, fontSize: typography.heading, fontWeight: '900' }}>{title}</Text>
        {selected ? <CheckCircle2 color="white" size={22} strokeWidth={2.5} /> : null}
      </View>
      <Text style={{ color: selected ? 'white' : colors.ink, fontSize: typography.title, fontWeight: '900' }}>{price}</Text>
      <Text style={{ color: selected ? '#EDEDED' : colors.muted, fontSize: typography.small, fontWeight: '800' }}>{detail}</Text>
      {badge ? (
        <View style={{ alignSelf: 'flex-start', backgroundColor: selected ? colors.greenSoft : colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
          <Text style={{ color: colors.green, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
```

- [ ] **Step 2: Replace OnboardingScreen**

Replace `apps/mobile/src/screens/OnboardingScreen.tsx` with a five-step component using this public API:

```tsx
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, Dumbbell, Flame, Scale, TrendingDown, TrendingUp } from 'lucide-react-native';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid, type OnboardingProfileDraft } from '../domain/onboardingProfile';
import type { UserGoal, UserProfile } from '../domain/types';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  userId: string;
  onComplete: (profile: UserProfile) => void;
};

// Implementation requirements:
// - Step 1: goal cards for lose_fat, build_muscle, maintain, understand_eating.
// - Step 2: age, sex, height, weight inputs.
// - Step 3: activity cards low, moderate, high.
// - Step 4: plan preview using buildUserProfileFromOnboarding.
// - Step 5 is not inside onboarding; App routes to Paywall after onComplete.
// - StickyFooterButton says "Continuer" until the final preview step, then "Voir mon plan".
// - Continue disabled until the current step is valid.
// - Keep all strings ASCII.
```

The implementation should keep helper functions inside the file:

```ts
function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyDraft(goal: UserGoal): OnboardingProfileDraft {
  return {
    goal,
    age: 0,
    sex: 'male',
    heightCm: 0,
    weightKg: 0,
    activityLevel: 'moderate',
  };
}
```

- [ ] **Step 3: Create PaywallScreen**

Create `apps/mobile/src/screens/PaywallScreen.tsx` with this public API:

```tsx
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, LockKeyhole, Sparkles } from 'lucide-react-native';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onUnlockForDevelopment: () => void;
  onRestore: () => void;
};

const benefits = ['Analyse photo IA', 'Objectifs calories et proteines', 'Corrections de portions', 'Timeline et progression'];

export function PaywallScreen({ onUnlockForDevelopment, onRestore }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');

  function subscribe() {
    Alert.alert('Achats en developpement', 'Les achats reels seront actives dans une development build avec RevenueCat.');
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, height: 84, justifyContent: 'center', width: 84 }}>
            <Sparkles color="white" size={36} strokeWidth={2.5} />
          </View>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>Atteins tes macros avec l'IA</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '700', lineHeight: 24, textAlign: 'center' }}>
            Scanne tes repas, ajuste les portions et suis tes objectifs chaque jour.
          </Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <PaywallPlanCard plan="annual" selected={selectedPlan === 'annual'} title="Annuel" price="39,99 EUR / an" detail="Meilleure valeur pour progresser toute l'annee." badge="Economise 58%" onSelect={setSelectedPlan} />
          <PaywallPlanCard plan="monthly" selected={selectedPlan === 'monthly'} title="Mensuel" price="7,99 EUR / mois" detail="Flexible, annulable a tout moment." onSelect={setSelectedPlan} />
        </View>
        <View style={{ gap: spacing.sm }}>
          {benefits.map((benefit) => (
            <View key={benefit} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <Check color={colors.green} size={18} strokeWidth={2.5} />
              <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{benefit}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 17, textAlign: 'center' }}>
          Abonnement renouvele automatiquement. Annulable a tout moment depuis les reglages App Store. Les estimations nutritionnelles ne remplacent pas un avis medical.
        </Text>
        <Pressable onPress={onRestore} style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900' }}>Restaurer mes achats</Text>
        </Pressable>
        <Pressable onPress={onUnlockForDevelopment} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}>
          <LockKeyhole color={colors.muted} size={14} strokeWidth={2.4} />
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>Continuer en mode test Expo Go</Text>
        </Pressable>
      </ScrollView>
      <StickyFooterButton label="Continuer" onPress={subscribe} />
    </View>
  );
}
```

- [ ] **Step 4: Typecheck**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/screens/OnboardingScreen.tsx apps/mobile/src/screens/PaywallScreen.tsx apps/mobile/src/components/PaywallPlanCard.tsx
git commit -m "feat: add premium onboarding and paywall"
```

---

## Task 4: Premium View Models

**Files:**
- Create: `apps/mobile/src/domain/streaks.ts`
- Create: `apps/mobile/src/domain/streaks.test.ts`
- Create: `apps/mobile/src/ui/premiumDashboardViewModel.ts`
- Create: `apps/mobile/src/ui/premiumDashboardViewModel.test.ts`
- Create: `apps/mobile/src/ui/timelineSectionsViewModel.ts`
- Create: `apps/mobile/src/ui/timelineSectionsViewModel.test.ts`
- Create: `apps/mobile/src/ui/badgesViewModel.ts`
- Create: `apps/mobile/src/ui/badgesViewModel.test.ts`

- [ ] **Step 1: Write streak tests**

Create `apps/mobile/src/domain/streaks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateMealStreak } from './streaks';
import type { Meal } from './types';

function meal(id: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: 500,
    caloriesLow: 425,
    caloriesHigh: 575,
    proteinG: 30,
    carbsG: 50,
    fatG: 15,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('calculateMealStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(
      calculateMealStreak(
        [
          meal('today', '2026-05-24T10:00:00.000Z'),
          meal('yesterday', '2026-05-23T10:00:00.000Z'),
          meal('two-days', '2026-05-22T10:00:00.000Z'),
        ],
        '2026-05-24',
      ),
    ).toBe(3);
  });

  it('returns zero when today has no meal', () => {
    expect(calculateMealStreak([meal('yesterday', '2026-05-23T10:00:00.000Z')], '2026-05-24')).toBe(0);
  });
});
```

- [ ] **Step 2: Write view-model tests**

Create `apps/mobile/src/ui/premiumDashboardViewModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildPremiumDashboardViewModel } from './premiumDashboardViewModel';
import type { MacroTargets, Meal } from '../domain/types';

const targets: MacroTargets = {
  calorieTarget: 2400,
  proteinTargetG: 150,
  carbsTargetG: 250,
  fatTargetG: 70,
  fiberTargetG: 30,
  calorieOverride: null,
  proteinOverrideG: null,
};

function meal(id: string, capturedAt: string, calories: number, proteinG: number): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: calories,
    caloriesLow: Math.round(calories * 0.85),
    caloriesHigh: Math.round(calories * 1.15),
    proteinG,
    carbsG: 50,
    fatG: 20,
    fiberG: 8,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildPremiumDashboardViewModel', () => {
  it('builds totals, remaining calories, progress and streak', () => {
    const vm = buildPremiumDashboardViewModel(
      [meal('today', '2026-05-24T10:00:00.000Z', 1850, 120), meal('yesterday', '2026-05-23T10:00:00.000Z', 500, 30)],
      '2026-05-24',
      targets,
    );

    expect(vm.calories.consumed).toBe(1850);
    expect(vm.calories.remaining).toBe(550);
    expect(vm.calories.progress).toBe(77);
    expect(vm.protein.progress).toBe(80);
    expect(vm.streakDays).toBe(2);
    expect(vm.nextBadge.label).toBe('Chef Etoile');
  });
});
```

Create `apps/mobile/src/ui/timelineSectionsViewModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTimelineSections } from './timelineSectionsViewModel';
import type { Meal } from '../domain/types';

function meal(id: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: 500,
    caloriesLow: 425,
    caloriesHigh: 575,
    proteinG: 30,
    carbsG: 50,
    fatG: 15,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildTimelineSections', () => {
  it('groups meals by today and yesterday', () => {
    const sections = buildTimelineSections([meal('today', '2026-05-24T10:00:00.000Z'), meal('yesterday', '2026-05-23T10:00:00.000Z')], '2026-05-24');

    expect(sections.map((section) => section.title)).toEqual(["Aujourd'hui", 'Hier']);
    expect(sections[0].meals[0].id).toBe('today');
  });
});
```

Create `apps/mobile/src/ui/badgesViewModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildBadgesViewModel } from './badgesViewModel';

describe('buildBadgesViewModel', () => {
  it('unlocks streak and protein badges', () => {
    const vm = buildBadgesViewModel({ streakDays: 7, proteinTargetDays: 7, scanCount: 3 });

    expect(vm.unlocked.map((badge) => badge.id)).toContain('protein-7');
    expect(vm.unlocked.map((badge) => badge.id)).toContain('streak-7');
    expect(vm.locked.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Verify red**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/streaks.test.ts src/ui/premiumDashboardViewModel.test.ts src/ui/timelineSectionsViewModel.test.ts src/ui/badgesViewModel.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 4: Implement streaks**

Create `apps/mobile/src/domain/streaks.ts`:

```ts
import type { Meal } from './types';

function previousIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function calculateMealStreak(meals: Meal[], todayIsoDate: string): number {
  const daysWithMeals = new Set(meals.map((meal) => meal.capturedAt.slice(0, 10)));
  let cursor = todayIsoDate;
  let streak = 0;

  while (daysWithMeals.has(cursor)) {
    streak += 1;
    cursor = previousIsoDate(cursor);
  }

  return streak;
}
```

- [ ] **Step 5: Implement view models**

Create `apps/mobile/src/ui/premiumDashboardViewModel.ts`:

```ts
import { calculateMealStreak } from '../domain/streaks';
import type { MacroTargets, Meal } from '../domain/types';
import { buildDailySummary } from './dashboardViewModel';

function progress(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.min(999, Math.round((value / target) * 100));
}

export function buildPremiumDashboardViewModel(meals: Meal[], todayIsoDate: string, targets: MacroTargets | null) {
  const summary = buildDailySummary(meals, todayIsoDate, targets);
  const calorieTarget = targets?.calorieTarget ?? 0;
  const proteinTarget = targets?.proteinTargetG ?? 0;

  return {
    dateLabel: 'Aujourd hui',
    calories: {
      consumed: summary.calories,
      target: calorieTarget,
      remaining: Math.max(0, calorieTarget - summary.calories),
      progress: targets ? progress(summary.calories, calorieTarget) : 0,
    },
    protein: {
      consumed: summary.proteinG,
      target: proteinTarget,
      progress: targets ? progress(summary.proteinG, proteinTarget) : 0,
    },
    carbs: {
      consumed: summary.carbsG,
      target: targets?.carbsTargetG ?? 0,
      progress: targets ? progress(summary.carbsG, targets.carbsTargetG) : 0,
    },
    fat: {
      consumed: summary.fatG,
      target: targets?.fatTargetG ?? 0,
      progress: targets ? progress(summary.fatG, targets.fatTargetG) : 0,
    },
    streakDays: calculateMealStreak(meals, todayIsoDate),
    nextBadge: {
      label: 'Chef Etoile',
      daysRemaining: 3,
    },
  };
}
```

Create `apps/mobile/src/ui/timelineSectionsViewModel.ts`:

```ts
import type { Meal } from '../domain/types';

export type TimelineSection = {
  title: string;
  meals: Meal[];
};

function previousIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function sectionTitle(date: string, todayIsoDate: string): string {
  if (date === todayIsoDate) {
    return "Aujourd'hui";
  }
  if (date === previousIsoDate(todayIsoDate)) {
    return 'Hier';
  }
  return date;
}

export function buildTimelineSections(meals: Meal[], todayIsoDate: string): TimelineSection[] {
  const grouped = new Map<string, Meal[]>();

  meals.forEach((meal) => {
    const date = meal.capturedAt.slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), meal]);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, mealsForDate]) => ({
      title: sectionTitle(date, todayIsoDate),
      meals: mealsForDate.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    }));
}
```

Create `apps/mobile/src/ui/badgesViewModel.ts`:

```ts
export type Badge = {
  id: string;
  title: string;
  detail: string;
  accent: 'green' | 'blue' | 'amber';
};

type Input = {
  streakDays: number;
  proteinTargetDays: number;
  scanCount: number;
};

const badges: (Badge & { unlocked: (input: Input) => boolean })[] = [
  { id: 'streak-7', title: '7 jours consecutifs', detail: 'Enregistrer un repas pendant 7 jours.', accent: 'green', unlocked: (input) => input.streakDays >= 7 },
  { id: 'protein-7', title: '7 jours de proteines', detail: 'Atteindre tes proteines pendant 7 jours.', accent: 'green', unlocked: (input) => input.proteinTargetDays >= 7 },
  { id: 'photo-3', title: 'Photographe assidu', detail: 'Scanner 3 repas.', accent: 'blue', unlocked: (input) => input.scanCount >= 3 },
  { id: 'target-3', title: 'Cible atteinte', detail: 'Atteindre tes macros pendant 3 jours.', accent: 'amber', unlocked: (input) => input.streakDays >= 3 },
];

export function buildBadgesViewModel(input: Input) {
  const unlocked = badges.filter((badge) => badge.unlocked(input));
  const locked = badges.filter((badge) => !badge.unlocked(input));

  return { unlocked, locked };
}
```

- [ ] **Step 6: Run tests**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/streaks.test.ts src/ui/premiumDashboardViewModel.test.ts src/ui/timelineSectionsViewModel.test.ts src/ui/badgesViewModel.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain/streaks.ts apps/mobile/src/domain/streaks.test.ts apps/mobile/src/ui/premiumDashboardViewModel.ts apps/mobile/src/ui/premiumDashboardViewModel.test.ts apps/mobile/src/ui/timelineSectionsViewModel.ts apps/mobile/src/ui/timelineSectionsViewModel.test.ts apps/mobile/src/ui/badgesViewModel.ts apps/mobile/src/ui/badgesViewModel.test.ts
git commit -m "feat: build premium app view models"
```

---

## Task 5: Premium App Shell Screens

**Files:**
- Create: `apps/mobile/src/screens/PremiumHomeScreen.tsx`
- Create: `apps/mobile/src/screens/PremiumTimelineScreen.tsx`
- Create: `apps/mobile/src/screens/SuccessProfileScreen.tsx`
- Create: `apps/mobile/src/screens/EditProfileScreen.tsx`

- [ ] **Step 1: Create PremiumHomeScreen**

Create `apps/mobile/src/screens/PremiumHomeScreen.tsx` with props:

```tsx
type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  onCapture: () => void;
  onPickPhoto: () => void;
  onManualMeal: () => void;
  onOpenSettings: () => void;
};
```

Implementation requirements:

- use `BrandHeader`;
- use `buildPremiumDashboardViewModel`;
- show daily overview title;
- show streak and next badge cards;
- show large calories `RingProgress`;
- show protein/carbs/fat progress cards with small rings;
- show a weekly progress preview using seven day labels;
- show black primary scan button and two secondary buttons for gallery/manual.

- [ ] **Step 2: Create PremiumTimelineScreen**

Create `apps/mobile/src/screens/PremiumTimelineScreen.tsx` with props:

```tsx
type Props = {
  meals: Meal[];
  onOpenMeal: (meal: Meal) => void;
};
```

Implementation requirements:

- use `BrandHeader`;
- use `buildTimelineSections`;
- sections are headed `Aujourd'hui`, `Hier`, or ISO date;
- cards show meal name, calories, protein, confidence label;
- manual meals show a simple icon block instead of broken image;
- empty state says `Aucun repas enregistre`.

- [ ] **Step 3: Create SuccessProfileScreen**

Create `apps/mobile/src/screens/SuccessProfileScreen.tsx` with props:

```tsx
type Props = {
  meals: Meal[];
  onEditProfile: () => void;
  onOpenSettings: () => void;
};
```

Implementation requirements:

- use `BrandHeader`;
- show `Mes Succes`;
- show current streak using `calculateMealStreak`;
- use `buildBadgesViewModel`;
- show unlocked badge cards and locked badge rows;
- buttons for `Modifier le profil` and `Parametres`.

- [ ] **Step 4: Create EditProfileScreen**

Create `apps/mobile/src/screens/EditProfileScreen.tsx` as a restyled wrapper around current `ProfileScreen` behavior.

Props:

```tsx
type Props = {
  profile: UserProfile | null;
  userId: string;
  onBack: () => void;
  onSave: (profile: UserProfile) => void;
};
```

Implementation requirements:

- same save behavior as `ProfileScreen`;
- visual style matches screenshot: large `Modifier le profil`, big bordered inputs, black sticky save button;
- keep fields: goal, current weight, height, age range, sex, activity.

- [ ] **Step 5: Typecheck**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/screens/PremiumHomeScreen.tsx apps/mobile/src/screens/PremiumTimelineScreen.tsx apps/mobile/src/screens/SuccessProfileScreen.tsx apps/mobile/src/screens/EditProfileScreen.tsx
git commit -m "feat: add premium app shell screens"
```

---

## Task 6: Portion Adjustment And Save Confirmation

**Files:**
- Create: `apps/mobile/src/domain/portionAdjustments.ts`
- Create: `apps/mobile/src/domain/portionAdjustments.test.ts`
- Create: `apps/mobile/src/screens/PortionAdjustScreen.tsx`
- Create: `apps/mobile/src/screens/SaveConfirmationScreen.tsx`
- Modify: `apps/mobile/src/screens/ResultScreen.tsx`

- [ ] **Step 1: Write portion adjustment tests**

Create `apps/mobile/src/domain/portionAdjustments.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { adjustMealItemGrams } from './portionAdjustments';
import type { Meal } from './types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'manual://custom',
  capturedAt: '2026-05-24T10:00:00.000Z',
  mealName: 'Poulet',
  caloriesEstimate: 200,
  caloriesLow: 170,
  caloriesHigh: 230,
  proteinG: 40,
  carbsG: 0,
  fatG: 5,
  fiberG: 0,
  confidence: 'medium',
  notes: '',
  source: 'estimated',
  items: [
    {
      id: 'item-1',
      mealId: 'meal-1',
      name: 'Poulet',
      canonicalFoodName: 'chicken breast',
      estimatedQuantity: 100,
      unit: 'g',
      calories: 200,
      proteinG: 40,
      carbsG: 0,
      fatG: 5,
      fiberG: 0,
      confidence: 'medium',
      dataSource: 'estimated',
      sourceFoodId: null,
    },
  ],
};

describe('adjustMealItemGrams', () => {
  it('scales the selected item and recalculates meal totals', () => {
    const adjusted = adjustMealItemGrams(meal, 'item-1', 150);

    expect(adjusted.items[0].estimatedQuantity).toBe(150);
    expect(adjusted.caloriesEstimate).toBe(300);
    expect(adjusted.proteinG).toBe(60);
  });

  it('enforces a safe minimum', () => {
    const adjusted = adjustMealItemGrams(meal, 'item-1', 5);

    expect(adjusted.items[0].estimatedQuantity).toBe(25);
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/portionAdjustments.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement portion adjustments**

Create `apps/mobile/src/domain/portionAdjustments.ts`:

```ts
import { recalculateMeal, scaleFoodItem } from './nutrition';
import type { Meal } from './types';

export const portionGramPresets = [100, 150, 200, 250];

export function clampGrams(grams: number): number {
  return Math.max(25, Math.min(1000, Math.round(grams)));
}

export function adjustMealItemGrams(meal: Meal, itemId: string, grams: number): Meal {
  const targetGrams = clampGrams(grams);

  return recalculateMeal({
    ...meal,
    items: meal.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      const currentQuantity = item.estimatedQuantity > 0 ? item.estimatedQuantity : 100;
      return scaleFoodItem(item, targetGrams / currentQuantity);
    }),
  });
}
```

- [ ] **Step 4: Run green test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/portionAdjustments.test.ts src/domain/nutrition.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create PortionAdjustScreen**

Create `apps/mobile/src/screens/PortionAdjustScreen.tsx` with props:

```tsx
type Props = {
  meal: Meal;
  itemId: string;
  onBack: () => void;
  onApply: (meal: Meal) => void;
};
```

Implementation requirements:

- select the item from `meal.items`;
- default grams from item quantity if unit is `g`, otherwise 150;
- minus and plus buttons adjust by 25g;
- preset buttons use `portionGramPresets`;
- impact preview shows updated calories range and protein;
- black sticky button says `Valider l'ajustement`.

- [ ] **Step 6: Create SaveConfirmationScreen**

Create `apps/mobile/src/screens/SaveConfirmationScreen.tsx` with props:

```tsx
type Props = {
  meal: Meal;
  streakDays: number;
  onHome: () => void;
  onTimeline: () => void;
};
```

Implementation requirements:

- green check circle;
- title `Repas enregistre`;
- show `+1 jour de streak` when `streakDays > 0`;
- show calories and protein added;
- primary black CTA `Retourner a l'accueil`;
- secondary CTA `Voir la timeline`;
- text `Pas de redirection automatique par timer.`

- [ ] **Step 7: Modify ResultScreen**

Modify `apps/mobile/src/screens/ResultScreen.tsx` props:

```ts
type Props = {
  meal: Meal;
  onApplyCorrection: (correction: MealCorrection) => void;
  onAdjustItem: (itemId: string) => void;
  onSave: () => void;
  onBack: () => void;
};
```

Implementation requirements:

- restyle with premium black/white direction;
- keep correction chips;
- add button `Ajuster les quantites`;
- for each item, add adjust action that calls `onAdjustItem(item.id)`;
- keep remove item behavior for multi-item meals;
- keep mock analysis warning.

- [ ] **Step 8: Typecheck and tests**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/portionAdjustments.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain/portionAdjustments.ts apps/mobile/src/domain/portionAdjustments.test.ts apps/mobile/src/screens/PortionAdjustScreen.tsx apps/mobile/src/screens/SaveConfirmationScreen.tsx apps/mobile/src/screens/ResultScreen.tsx
git commit -m "feat: add premium adjustment and save confirmation"
```

---

## Task 7: App Gate And Navigation Wiring

**Files:**
- Modify: `apps/mobile/App.tsx`
- Keep existing fallback screens until replaced: `ManualMealScreen`, `SettingsScreen`, `TargetsScreen`

- [ ] **Step 1: Update ScreenState**

In `apps/mobile/App.tsx`, replace `ScreenState` with:

```ts
type ScreenState =
  | { name: 'loading' }
  | { name: 'onboarding' }
  | { name: 'paywall' }
  | { name: 'app'; tab: AppTab }
  | { name: 'analyzing'; imageUri: string }
  | { name: 'result'; meal: Meal; isSaved: boolean }
  | { name: 'portionAdjust'; meal: Meal; itemId: string }
  | { name: 'saveConfirmation'; meal: Meal; streakDays: number }
  | { name: 'editProfile' }
  | { name: 'settings' }
  | { name: 'targets' }
  | { name: 'manualMeal' };
```

- [ ] **Step 2: Add repositories and state**

Add imports:

```ts
import { Alert, Platform, SafeAreaView, Text, View } from 'react-native';
import type { AppTab } from './src/components/BottomTabs';
import { buildUserProfileFromOnboarding } from './src/domain/onboardingProfile';
import { calculateMealStreak } from './src/domain/streaks';
import { createEntitlementRepository, type EntitlementState } from './src/storage/entitlementRepository';
import { createOnboardingRepository, type OnboardingState } from './src/storage/onboardingRepository';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { PremiumHomeScreen } from './src/screens/PremiumHomeScreen';
import { PremiumTimelineScreen } from './src/screens/PremiumTimelineScreen';
import { SuccessProfileScreen } from './src/screens/SuccessProfileScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { PortionAdjustScreen } from './src/screens/PortionAdjustScreen';
import { SaveConfirmationScreen } from './src/screens/SaveConfirmationScreen';
import { BottomTabs } from './src/components/BottomTabs';
```

Add state:

```ts
const [screen, setScreen] = useState<ScreenState>({ name: 'loading' });
const [entitlement, setEntitlement] = useState<EntitlementState>({ isPremium: false, source: 'none', updatedAt: null });
const [onboardingState, setOnboardingState] = useState<OnboardingState>({ isComplete: false });
const entitlementRepository = useMemo(() => createEntitlementRepository(AsyncStorage), []);
const onboardingRepository = useMemo(() => createOnboardingRepository(AsyncStorage), []);
```

- [ ] **Step 3: Load gate state**

Add a loading effect:

```ts
useEffect(() => {
  Promise.all([repository.listMeals(), profileRepository.getProfile(), entitlementRepository.getEntitlement(), onboardingRepository.getState()])
    .then(([loadedMeals, loadedProfile, loadedEntitlement, loadedOnboarding]) => {
      setMeals(loadedMeals);
      setProfile(loadedProfile);
      setEntitlement(loadedEntitlement);
      setOnboardingState(loadedOnboarding);

      if (!loadedOnboarding.isComplete || !loadedProfile) {
        setScreen({ name: 'onboarding' });
        return;
      }

      if (!loadedEntitlement.isPremium) {
        setScreen({ name: 'paywall' });
        return;
      }

      setScreen({ name: 'app', tab: 'home' });
    })
    .catch(() => {
      setScreen({ name: 'onboarding' });
    });
}, [entitlementRepository, onboardingRepository, profileRepository, repository]);
```

Remove the older separate meal/profile loading effects.

- [ ] **Step 4: Add gate handlers**

Add:

```ts
async function completeOnboarding(nextProfile: UserProfile) {
  await profileRepository.saveProfile(nextProfile);
  await onboardingRepository.saveState({ isComplete: true, completedAt: new Date().toISOString() });
  setProfile(nextProfile);
  setOnboardingState({ isComplete: true, completedAt: new Date().toISOString() });
  setScreen({ name: 'paywall' });
}

async function unlockForDevelopment() {
  const nextEntitlement: EntitlementState = {
    isPremium: true,
    source: 'local_dev',
    updatedAt: new Date().toISOString(),
  };
  await entitlementRepository.saveEntitlement(nextEntitlement);
  setEntitlement(nextEntitlement);
  setScreen({ name: 'app', tab: 'home' });
}

function restorePurchases() {
  Alert.alert('Restore en developpement', 'La restauration sera activee avec RevenueCat dans une development build.');
}
```

- [ ] **Step 5: Route save confirmation**

Change `saveMeal`:

```ts
async function saveMeal(meal: Meal) {
  await repository.saveMeal(meal);
  const nextMeals = await repository.listMeals();
  setMeals(nextMeals);
  setScreen({ name: 'saveConfirmation', meal, streakDays: calculateMealStreak(nextMeals, new Date().toISOString().slice(0, 10)) });
}
```

- [ ] **Step 6: Add app shell renderer**

Add helper in `MacroLensApp`:

```tsx
function renderAppShell(tab: AppTab) {
  const content =
    tab === 'timeline' ? (
      <PremiumTimelineScreen meals={meals} onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })} />
    ) : tab === 'profile' ? (
      <SuccessProfileScreen meals={meals} onEditProfile={() => setScreen({ name: 'editProfile' })} onOpenSettings={() => setScreen({ name: 'settings' })} />
    ) : (
      <PremiumHomeScreen
        meals={meals}
        targets={targets}
        onCapture={captureMeal}
        onPickPhoto={pickMealPhoto}
        onManualMeal={() => setScreen({ name: 'manualMeal' })}
        onOpenSettings={() => setScreen({ name: 'settings' })}
      />
    );

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ flex: 1 }}>{content}</View>
      <BottomTabs activeTab={tab} onChangeTab={(nextTab) => setScreen({ name: 'app', tab: nextTab })} />
    </View>
  );
}
```

- [ ] **Step 7: Update render branches**

Render new branches:

```tsx
if (screen.name === 'loading') {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
      <Text style={{ color: colors.ink, fontSize: 28, fontWeight: '900' }}>MACROLENS</Text>
    </View>
  );
}

if (screen.name === 'onboarding') {
  return <OnboardingScreen userId={localUserId} onComplete={completeOnboarding} />;
}

if (screen.name === 'paywall') {
  return <PaywallScreen onUnlockForDevelopment={unlockForDevelopment} onRestore={restorePurchases} />;
}

if (screen.name === 'app') {
  return renderAppShell(screen.tab);
}

if (screen.name === 'portionAdjust') {
  return (
    <PortionAdjustScreen
      meal={screen.meal}
      itemId={screen.itemId}
      onBack={() => setScreen({ name: 'result', meal: screen.meal, isSaved: false })}
      onApply={(meal) => setScreen({ name: 'result', meal, isSaved: false })}
    />
  );
}

if (screen.name === 'saveConfirmation') {
  return (
    <SaveConfirmationScreen
      meal={screen.meal}
      streakDays={screen.streakDays}
      onHome={() => setScreen({ name: 'app', tab: 'home' })}
      onTimeline={() => setScreen({ name: 'app', tab: 'timeline' })}
    />
  );
}

if (screen.name === 'editProfile') {
  return <EditProfileScreen profile={profile} userId={localUserId} onBack={() => setScreen({ name: 'app', tab: 'profile' })} onSave={saveProfile} />;
}
```

Update existing result branch:

```tsx
if (screen.name === 'result') {
  return (
    <ResultScreen
      meal={screen.meal}
      onApplyCorrection={(correction) => setScreen({ name: 'result', meal: applyMealCorrection(screen.meal, correction), isSaved: false })}
      onAdjustItem={(itemId) => setScreen({ name: 'portionAdjust', meal: screen.meal, itemId })}
      onBack={() => setScreen({ name: 'app', tab: 'home' })}
      onSave={() => saveMeal(screen.meal)}
    />
  );
}
```

Keep `settings`, `targets`, and `manualMeal` branches, but route their back actions to `{ name: 'app', tab: 'profile' }` or `{ name: 'app', tab: 'home' }`.

- [ ] **Step 8: Run full test and typecheck**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx
git commit -m "feat: gate premium app shell"
```

---

## Task 8: Verification And App Store Readiness Notes

**Files:**
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Run full verification**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected:

- `npm test`: PASS.
- `npx tsc --noEmit`: PASS.
- `npx expo install --check`: dependencies up to date.

- [ ] **Step 2: Start Expo Go server**

Use a free port. If `8081` is occupied, use `8083`:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start --lan --clear --port 8083
```

Expected: QR code visible for Expo Go.

- [ ] **Step 3: Manual smoke test**

Verify on phone or web:

- fresh launch shows onboarding step 1;
- continue disabled until valid choice/input;
- all onboarding steps complete;
- paywall blocks app shell;
- restore button shows development message;
- local dev unlock opens app shell;
- bottom tabs switch Home/Timeline/Profile;
- Home scan/gallery/manual buttons are visible;
- manual meal creates result;
- result adjustment opens portion adjustment;
- applying adjustment changes macros;
- save opens confirmation screen;
- confirmation opens Home and Timeline;
- profile edit opens and saves;
- settings still opens and can clear history.

- [ ] **Step 4: Update status document**

In `docs/superpowers/status/2026-05-23-macrolens-project-control.md`, add under Current State:

```md
- Premium Conversion V1 is implemented in Expo Go mode: five-step onboarding, local hard paywall gate, premium Home/Timeline/Profile shell, portion adjustment, and save confirmation. Real App Store monetization still requires RevenueCat or StoreKit in a development build.
```

Add under Verified commands:

```md
- Expo Go smoke test for Premium Conversion V1 on the chosen LAN port.
```

Add under Known Concerns:

```md
- The current paywall is an Expo Go local entitlement gate for UX validation only. It must be replaced by real Apple In-App Purchase through a development/TestFlight build before App Store submission.
```

- [ ] **Step 5: Commit docs**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "docs: record premium conversion rollout"
```

- [ ] **Step 6: Confirm clean branch**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git status --short --branch
```

Expected: no uncommitted changes on `codex/macrolens-mvp`.

---

## Follow-Up Plan Required: Real IAP Development Build

This plan intentionally does not implement native IAP because the user is currently validating in Expo Go.

Before App Store submission, write and execute a separate plan for:

- `expo-dev-client`;
- RevenueCat or StoreKit library;
- EAS development build;
- App Store Connect subscription products;
- restore purchase behavior;
- production hiding/removal of `local_dev` unlock;
- TestFlight purchase sandbox validation;
- App Review notes.

Do not submit to App Store with only the local entitlement gate.

---

## Self-Review

- Spec coverage: onboarding, hard paywall, dashboard, timeline, profile/success, adjustment, save confirmation, local entitlement, compliance notes, and verification are mapped to tasks.
- Scope check: real IAP is explicitly excluded and called out as a mandatory follow-up before App Store submission.
- Type consistency: `OnboardingProfileDraft`, `EntitlementState`, `AppTab`, `buildPremiumDashboardViewModel`, `buildTimelineSections`, `buildBadgesViewModel`, and `adjustMealItemGrams` are defined before use.
- Safety scan: no task relies on unspecified implementation or fake production purchase behavior.
