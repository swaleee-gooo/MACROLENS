import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, CalendarDays, Check, LockKeyhole } from 'lucide-react-native';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { privacyUrl, termsUrl } from '../config/legalLinks';
import type { PlanPricing } from '../entitlements/entitlementTypes';
import { useLang } from '../i18n/LanguageContext';
import { createTrialReminderRepository } from '../storage/trialReminderRepository';
import {
  ctaLabelForSelection,
  paywallLegalText,
  paywallPlanCardContent,
  paywallPricingLine,
  planSelectionAfterOtherOptionsToggle,
  trialTimeline,
} from '../ui/paywallViewModel';
import { Card, Eyebrow, Num, PrimaryButton, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    eyebrow: 'MacroLens Pro',
    title: 'Unlock your edge',
    timelineToday: 'Today',
    timelineTodayDetail: 'Full access to MacroLens Pro, free',
    timelineDay: (day: number) => `Day ${day}`,
    timelineReminderDetail: 'We remind you before your trial ends',
    timelineStartDetail: 'Your subscription starts — cancel before',
    reminderToggle: 'Remind me before the trial ends',
    annual: 'Annual',
    monthly: 'Monthly',
    retry: 'Retry',
    otherOptions: 'Other options',
    fewerOptions: 'Fewer options',
    restore: 'Restore',
    terms: 'Terms',
    privacy: 'Privacy',
    devUnlock: 'Continue in test mode',
    benefits: ['Unlimited scans', 'Trust levels and ranges', 'Calibration and weighed recipes', 'Multi-device sync'],
  },
  fr: {
    eyebrow: 'MacroLens Pro',
    title: 'Débloque ton avantage',
    timelineToday: 'Aujourd’hui',
    timelineTodayDetail: 'Accès complet à MacroLens Pro, gratuit',
    timelineDay: (day: number) => `Jour ${day}`,
    timelineReminderDetail: 'On te prévient avant la fin de l’essai',
    timelineStartDetail: 'Ton abonnement démarre — annulable avant',
    reminderToggle: 'Préviens-moi avant la fin de l’essai',
    annual: 'Annuel',
    monthly: 'Mensuel',
    retry: 'Réessayer',
    otherOptions: 'Autres options',
    fewerOptions: 'Moins d’options',
    restore: 'Restaurer',
    terms: 'Conditions',
    privacy: 'Confidentialité',
    devUnlock: 'Continuer en mode test',
    benefits: ['Scans illimités', 'Niveaux de confiance et marges', 'Calibration et recettes pesées', 'Synchro multi-appareils'],
  },
};

type Props = {
  pricing: PlanPricing[] | null;
  onPurchase: (plan: PaywallPlan) => void;
  onRetryPricing: () => void;
  onUnlockForDevelopment: () => void;
  onRestore: () => void;
  showDevelopmentUnlock: boolean;
};

/** One step of the trial timeline — connected circles with an accent vertical line. */
function TimelineStep({ icon, title, detail, accent, isLast }: { icon: ReactNode; title: string; detail: string; accent: boolean; isLast: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 13, paddingBottom: isLast ? 4 : spacing.lg, position: 'relative' }}>
      {!isLast ? <View style={{ backgroundColor: colors.accentLine, bottom: 0, left: 13, position: 'absolute', top: 30, width: 2 }} /> : null}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: accent ? colors.accent : colors.accentWash,
          borderColor: accent ? 'transparent' : colors.accentLine,
          borderRadius: radius.pill,
          borderWidth: accent ? 0 : 1,
          height: 28,
          justifyContent: 'center',
          width: 28,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 15, marginTop: 2 }}>{detail}</Text>
      </View>
    </View>
  );
}

export function PaywallScreen({ pricing, onPurchase, onRetryPricing, onUnlockForDevelopment, onRestore, showDevelopmentUnlock }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  // Visual + persisted preference only — the App Store sends its own trial emails.
  const [trialReminderEnabled, setTrialReminderEnabled] = useState(true);
  const trialReminderRepository = useMemo(() => createTrialReminderRepository(AsyncStorage), []);

  useEffect(() => {
    trialReminderRepository.getEnabled().then(setTrialReminderEnabled).catch(() => undefined);
  }, [trialReminderRepository]);

  function changeTrialReminder(enabled: boolean) {
    setTrialReminderEnabled(enabled);
    trialReminderRepository.saveEnabled(enabled).catch(() => undefined);
  }

  function toggleOtherOptions() {
    const nextVisible = !showOtherOptions;
    setShowOtherOptions(nextVisible);
    setSelectedPlan(planSelectionAfterOtherOptionsToggle(nextVisible, selectedPlan));
  }

  const timeline = trialTimeline(pricing);
  const priceLine = paywallPricingLine(pricing, selectedPlan);
  const annualRow = paywallPlanCardContent(pricing, 'annual');
  const monthlyRow = paywallPlanCardContent(pricing, 'monthly');

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Seal + eyebrow + title */}
        <View style={{ alignItems: 'center', marginBottom: 6, marginTop: 14 }}>
          <Seal size={40} />
        </View>
        <Eyebrow style={{ textAlign: 'center' }}>{t.eyebrow}</Eyebrow>
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.display,
            fontSize: 23,
            fontWeight: '600',
            letterSpacing: -0.5,
            lineHeight: 26,
            marginTop: 7,
            textAlign: 'center',
          }}
        >
          {t.title}
        </Text>

        {/* HERO — trial timeline when the store confirmed a free trial, simple pricing card otherwise */}
        {timeline ? (
          <Card style={{ marginTop: spacing.lg, paddingBottom: spacing.sm, paddingHorizontal: 18, paddingTop: 18 }}>
            <TimelineStep
              accent
              icon={<Seal size={15} color="#FFFFFF" />}
              title={t.timelineToday}
              detail={t.timelineTodayDetail}
              isLast={false}
            />
            <TimelineStep
              accent={false}
              icon={<Bell color={colors.accentInk} size={15} strokeWidth={1.9} />}
              title={t.timelineDay(timeline.reminderDay)}
              detail={t.timelineReminderDetail}
              isLast={false}
            />
            <TimelineStep
              accent={false}
              icon={<CalendarDays color={colors.accentInk} size={15} strokeWidth={1.9} />}
              title={t.timelineDay(timeline.trialDays)}
              detail={t.timelineStartDetail}
              isLast
            />
          </Card>
        ) : (
          <Card style={{ gap: spacing.md, marginTop: spacing.lg, padding: 18 }}>
            <View style={{ alignItems: 'center' }}>
              {annualRow.priceIsPlaceholder ? (
                <Text style={{ color: colors.muted, fontSize: typography.small }}>{annualRow.price}</Text>
              ) : (
                <Num style={{ fontSize: 22, fontWeight: '600' }}>{annualRow.price}</Num>
              )}
            </View>
            <View style={{ backgroundColor: colors.line, height: 1 }} />
            <View style={{ gap: spacing.md }}>
              {t.benefits.map((benefit) => (
                <View key={benefit} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                  <Check color={colors.accent} size={17} strokeWidth={2.4} />
                  <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '500' }}>{benefit}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Trial reminder preference (only meaningful while a trial exists) */}
        {timeline ? (
          <View
            style={{
              alignItems: 'center',
              borderColor: colors.line2,
              borderRadius: radius.md,
              borderWidth: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: spacing.md,
              paddingHorizontal: 14,
              paddingVertical: spacing.md,
            }}
          >
            <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, fontWeight: '600' }}>{t.reminderToggle}</Text>
            <Switch
              accessibilityLabel={t.reminderToggle}
              onValueChange={changeTrialReminder}
              thumbColor={colors.surface}
              trackColor={{ false: colors.line2, true: colors.accent }}
              value={trialReminderEnabled}
            />
          </View>
        ) : null}

        {/* Centered pricing line — the real billed price stays the most prominent text */}
        <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
          <Num style={{ fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{priceLine.primary}</Num>
          {priceLine.secondary ? <Num style={{ color: colors.muted, fontSize: typography.tiny, marginTop: 3 }}>{priceLine.secondary}</Num> : null}
          {priceLine.isPlaceholder ? (
            <Pressable accessibilityLabel={t.retry} accessibilityRole="button" hitSlop={8} onPress={onRetryPricing} style={{ marginTop: spacing.sm }}>
              <Eyebrow color={colors.accentInk}>{t.retry}</Eyebrow>
            </Pressable>
          ) : null}
        </View>

        {/* CTA */}
        <PrimaryButton label={ctaLabelForSelection(pricing, selectedPlan)} onPress={() => onPurchase(selectedPlan)} style={{ marginTop: spacing.lg }} />

        {/* Discreet "Other options" → inline compact plan rows (annual stays the default) */}
        <Pressable
          accessibilityLabel={showOtherOptions ? t.fewerOptions : t.otherOptions}
          accessibilityRole="button"
          hitSlop={8}
          onPress={toggleOtherOptions}
          style={{ alignItems: 'center', marginTop: 13 }}
        >
          <Eyebrow color={colors.ink2}>{showOtherOptions ? t.fewerOptions : t.otherOptions}</Eyebrow>
        </Pressable>
        {showOtherOptions ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <PaywallPlanCard
              plan="annual"
              selected={selectedPlan === 'annual'}
              title={t.annual}
              price={annualRow.price}
              priceIsPlaceholder={annualRow.priceIsPlaceholder}
              detail={annualRow.detail}
              badge={annualRow.badge ?? undefined}
              onSelect={setSelectedPlan}
            />
            <PaywallPlanCard
              plan="monthly"
              selected={selectedPlan === 'monthly'}
              title={t.monthly}
              price={monthlyRow.price}
              priceIsPlaceholder={monthlyRow.priceIsPlaceholder}
              detail={monthlyRow.detail}
              badge={monthlyRow.badge ?? undefined}
              onSelect={setSelectedPlan}
            />
          </View>
        ) : null}

        {/* Restore / Terms / Privacy */}
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 18, justifyContent: 'center', marginTop: spacing.lg }}>
          <Pressable accessibilityLabel={t.restore} accessibilityRole="button" hitSlop={8} onPress={onRestore}>
            <Eyebrow>{t.restore}</Eyebrow>
          </Pressable>
          <Pressable accessibilityLabel={t.terms} accessibilityRole="link" hitSlop={8} onPress={() => Linking.openURL(termsUrl)}>
            <Eyebrow>{t.terms}</Eyebrow>
          </Pressable>
          <Pressable accessibilityLabel={t.privacy} accessibilityRole="link" hitSlop={8} onPress={() => Linking.openURL(privacyUrl)}>
            <Eyebrow>{t.privacy}</Eyebrow>
          </Pressable>
        </View>

        {/* Renewal / cancellation disclosure (Apple 3.1.2) */}
        <Text style={{ color: colors.muted2, fontSize: typography.tiny, lineHeight: 16, marginTop: spacing.md, textAlign: 'center' }}>
          {paywallLegalText(pricing, selectedPlan)}
        </Text>

        {showDevelopmentUnlock ? (
          <Pressable
            accessibilityLabel={t.devUnlock}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onUnlockForDevelopment}
            style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', marginTop: spacing.lg }}
          >
            <LockKeyhole color={colors.muted} size={13} strokeWidth={2.2} />
            <Eyebrow>{t.devUnlock}</Eyebrow>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
