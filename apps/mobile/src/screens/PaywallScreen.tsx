import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Bell, CalendarDays, Check, LockKeyhole } from 'lucide-react-native';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { privacyUrl, termsUrl } from '../config/legalLinks';
import type { PlanPricing } from '../entitlements/entitlementTypes';
import { useLang } from '../i18n/LanguageContext';
import {
  paywallBilledLine,
  paywallCta,
  paywallLegalText,
  planForTrialToggle,
  planPricingFor,
  savingsPercent,
  trialTimelineForSelection,
  trialToggleValue,
  trialToggleVisible,
} from '../ui/paywallViewModel';
import { Card, Eyebrow, Num, PrimaryButton, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    eyebrow: 'MacroLens Pro',
    title: 'Reach your goal — with numbers you can trust',
    benefits: [
      'Unlimited AI meal scans',
      'Trust levels and error ranges on every estimate',
      'Personal calibration that learns your portions',
      'History, trends and device sync',
    ],
    trialToggle: 'Free trial enabled',
    mostPopular: 'Most popular',
    save: (percent: number) => `Save ${percent}%`,
    yearly: 'Yearly',
    monthly: 'Monthly',
    yearlySub: (price: string) => `12 mo · ${price}`,
    perMonthShort: (price: string) => `${price} / mo`,
    perYearShort: (price: string) => `${price} / yr`,
    timelineNow: 'Now',
    timelineNowDetail: 'Start your free trial — full access',
    timelineDay: (day: number) => `Day ${day}`,
    timelineReminderDetail: 'We remind you before it ends',
    timelineStartDetail: 'Subscription starts — cancel before',
    noPaymentNow: 'No payment due now',
    ctaTrialDays: (days: number) => `Start my ${days}-day free trial`,
    ctaTrial: 'Start my free trial',
    ctaSubscribe: 'Subscribe',
    billedTrialDays: (days: number, price: string) => `${days} days free, then ${price}/year · cancel anytime`,
    billedTrial: (price: string) => `Free trial, then ${price}/year · cancel anytime`,
    billedAnnual: (price: string) => `${price}/year · cancel anytime`,
    billedMonthly: (price: string) => `${price}/month · cancel anytime`,
    pricePlaceholder: 'Price shown at checkout',
    pricesLoading: 'Prices are loading…',
    retry: 'Retry',
    restore: 'Restore',
    terms: 'Terms',
    privacy: 'Privacy',
    devUnlock: 'Continue in test mode',
  },
  fr: {
    eyebrow: 'MacroLens Pro',
    title: 'Atteins ton objectif — avec des chiffres fiables',
    benefits: [
      'Scans de repas IA illimités',
      'Niveaux de confiance et marges d’erreur sur chaque estimation',
      'Calibration personnelle qui apprend tes portions',
      'Historique, tendances et synchro multi-appareils',
    ],
    trialToggle: 'Essai gratuit activé',
    mostPopular: 'Le plus populaire',
    save: (percent: number) => `Économise ${percent}%`,
    yearly: 'Annuel',
    monthly: 'Mensuel',
    yearlySub: (price: string) => `12 mois · ${price}`,
    perMonthShort: (price: string) => `${price} / mois`,
    perYearShort: (price: string) => `${price} / an`,
    timelineNow: 'Maintenant',
    timelineNowDetail: 'Démarre ton essai gratuit — accès complet',
    timelineDay: (day: number) => `Jour ${day}`,
    timelineReminderDetail: 'On te prévient avant la fin',
    timelineStartDetail: 'L’abonnement démarre — annulable avant',
    noPaymentNow: 'Aucun paiement aujourd’hui',
    ctaTrialDays: (days: number) => `Démarrer mes ${days} jours d’essai gratuit`,
    ctaTrial: 'Démarrer mon essai gratuit',
    ctaSubscribe: 'S’abonner',
    billedTrialDays: (days: number, price: string) => `${days} jours gratuits, puis ${price}/an · annulable à tout moment`,
    billedTrial: (price: string) => `Essai gratuit, puis ${price}/an · annulable à tout moment`,
    billedAnnual: (price: string) => `${price}/an · annulable à tout moment`,
    billedMonthly: (price: string) => `${price}/mois · annulable à tout moment`,
    pricePlaceholder: 'Prix affiché au moment du paiement',
    pricesLoading: 'Les prix chargent…',
    retry: 'Réessayer',
    restore: 'Restaurer',
    terms: 'Conditions',
    privacy: 'Confidentialité',
    devUnlock: 'Continuer en mode test',
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

/** One step of the compact trial timeline — connected circles, accent vertical line. */
function TimelineStep({ icon, title, detail, accent, isLast }: { icon: ReactNode; title: string; detail: string; accent: boolean; isLast: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingBottom: isLast ? 0 : spacing.md, position: 'relative' }}>
      {!isLast ? <View style={{ backgroundColor: colors.accentLine, bottom: 0, left: 10, position: 'absolute', top: 24, width: 2 }} /> : null}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: accent ? colors.accent : colors.accentWash,
          borderColor: accent ? 'transparent' : colors.accentLine,
          borderRadius: radius.pill,
          borderWidth: accent ? 0 : 1,
          height: 22,
          justifyContent: 'center',
          width: 22,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: 12.5, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 14, marginTop: 1 }}>{detail}</Text>
      </View>
    </View>
  );
}

export function PaywallScreen({ pricing, onPurchase, onRetryPricing, onUnlockForDevelopment, onRestore, showDevelopmentUnlock }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');

  const annual = planPricingFor(pricing, 'annual');
  const monthly = planPricingFor(pricing, 'monthly');
  const degraded = pricing === null;
  const savings = savingsPercent(pricing);
  const toggleVisible = trialToggleVisible(pricing);
  const toggleValue = trialToggleValue(pricing, selectedPlan);
  const timeline = trialTimelineForSelection(pricing, selectedPlan);
  const cta = paywallCta(pricing, selectedPlan);
  const billed = paywallBilledLine(pricing, selectedPlan);

  const ctaLabel = cta.hasTrial ? (cta.trialDays ? t.ctaTrialDays(cta.trialDays) : t.ctaTrial) : t.ctaSubscribe;
  const billedText =
    billed.kind === 'placeholder'
      ? t.pricePlaceholder
      : billed.kind === 'trial_annual'
        ? billed.trialDays
          ? t.billedTrialDays(billed.trialDays, billed.priceString)
          : t.billedTrial(billed.priceString)
        : billed.kind === 'annual'
          ? t.billedAnnual(billed.priceString)
          : t.billedMonthly(billed.priceString);

  const annualPriceMain = annual
    ? annual.perMonthPriceString
      ? t.perMonthShort(annual.perMonthPriceString)
      : t.perYearShort(annual.priceString)
    : t.pricePlaceholder;
  const monthlyPriceMain = monthly ? t.perMonthShort(monthly.priceString) : t.pricePlaceholder;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact header: seal + eyebrow + title */}
        <View style={{ alignItems: 'center', marginBottom: 5, marginTop: 6 }}>
          <Seal size={28} />
        </View>
        <Eyebrow style={{ textAlign: 'center' }}>{t.eyebrow}</Eyebrow>
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.display,
            fontSize: 24,
            fontWeight: '600',
            letterSpacing: -0.5,
            lineHeight: 28,
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          {t.title}
        </Text>

        {/* Benefits — 4 compact check rows */}
        <View style={{ gap: spacing.sm + 2, marginTop: spacing.lg }}>
          {t.benefits.map((benefit) => (
            <View key={benefit} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm + 2 }}>
              <Check color={colors.accent} size={15} strokeWidth={2.6} />
              <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, fontWeight: '500', lineHeight: 17 }}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Free trial toggle — synced with plan selection (ON → annual, OFF → monthly) */}
        {toggleVisible ? (
          <Card
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: spacing.lg,
              paddingHorizontal: 14,
              paddingVertical: spacing.sm + 2,
            }}
          >
            <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, fontWeight: '700' }}>{t.trialToggle}</Text>
            <Switch
              accessibilityLabel={t.trialToggle}
              accessibilityState={{ checked: toggleValue }}
              onValueChange={(enabled) => setSelectedPlan(planForTrialToggle(enabled))}
              thumbColor={colors.surface}
              trackColor={{ false: colors.line2, true: colors.accent }}
              value={toggleValue}
            />
          </Card>
        ) : null}

        {/* Plan cards — visible prices, yearly first and selected by default */}
        <View style={{ gap: spacing.md, marginTop: toggleVisible ? spacing.md : spacing.lg }}>
          <PaywallPlanCard
            plan="annual"
            selected={selectedPlan === 'annual'}
            title={t.yearly}
            banner={t.mostPopular}
            savePill={savings !== null ? t.save(savings) : undefined}
            priceMain={annualPriceMain}
            priceMainIsPlaceholder={!annual}
            priceSub={annual ? t.yearlySub(annual.priceString) : undefined}
            onSelect={setSelectedPlan}
          >
            {timeline ? (
              <View style={{ borderTopColor: colors.line, borderTopWidth: 1, marginTop: spacing.md, paddingTop: spacing.md }}>
                <TimelineStep
                  accent
                  icon={<Seal size={12} color="#FFFFFF" />}
                  title={t.timelineNow}
                  detail={t.timelineNowDetail}
                  isLast={false}
                />
                <TimelineStep
                  accent={false}
                  icon={<Bell color={colors.accentInk} size={12} strokeWidth={2} />}
                  title={t.timelineDay(timeline.reminderDay)}
                  detail={t.timelineReminderDetail}
                  isLast={false}
                />
                <TimelineStep
                  accent={false}
                  icon={<CalendarDays color={colors.accentInk} size={12} strokeWidth={2} />}
                  title={t.timelineDay(timeline.trialDays)}
                  detail={t.timelineStartDetail}
                  isLast
                />
              </View>
            ) : null}
          </PaywallPlanCard>
          <PaywallPlanCard
            plan="monthly"
            selected={selectedPlan === 'monthly'}
            title={t.monthly}
            priceMain={monthlyPriceMain}
            priceMainIsPlaceholder={!monthly}
            onSelect={setSelectedPlan}
          />
        </View>

        {/* Degraded mode: pricing fetch failed — keep the retry affordance visible */}
        {degraded ? (
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.md }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny }}>{t.pricesLoading}</Text>
            <Pressable accessibilityLabel={t.retry} accessibilityRole="button" hitSlop={8} onPress={onRetryPricing}>
              <Eyebrow color={colors.accentInk}>{t.retry}</Eyebrow>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA zone */}
      <View style={{ backgroundColor: colors.background, borderTopColor: colors.line, borderTopWidth: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg }}>
        {cta.hasTrial ? (
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: spacing.sm }}>
            <Check color={colors.accentInk} size={14} strokeWidth={2.8} />
            <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '600' }}>{t.noPaymentNow}</Text>
          </View>
        ) : null}

        <PrimaryButton label={ctaLabel} onPress={() => onPurchase(selectedPlan)} />

        {/* Real billed price directly under the CTA — must be unmissable (Apple 3.1.2c) */}
        <Num style={{ color: colors.ink2, fontSize: 12, marginTop: spacing.sm, textAlign: 'center' }}>{billedText}</Num>

        {/* Restore / Terms / Privacy */}
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 18, justifyContent: 'center', marginTop: spacing.md }}>
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
        <Text style={{ color: colors.muted2, fontSize: typography.tiny, lineHeight: 15, marginTop: spacing.sm, textAlign: 'center' }}>
          {paywallLegalText(pricing, selectedPlan)}
        </Text>

        {showDevelopmentUnlock ? (
          <Pressable
            accessibilityLabel={t.devUnlock}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onUnlockForDevelopment}
            style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', marginTop: spacing.md }}
          >
            <LockKeyhole color={colors.muted} size={13} strokeWidth={2.2} />
            <Eyebrow>{t.devUnlock}</Eyebrow>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
