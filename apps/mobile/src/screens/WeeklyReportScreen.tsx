import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import type { WeeklyReport } from '../domain/weeklyReport';
import { Card, Eyebrow, Num, Seal } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  report: WeeklyReport;
  onBack: () => void;
};

const STR = {
  en: {
    back: 'Back',
    weeklySummary: 'Weekly summary',
    whatToDoNow: 'What to do now',
    thisWeeksGoal: "This week's goal",
    thisWeeksGoalBody: 'Scan ambiguous meals, correct sauces and portions, then aim for consistency over a perfect number.',
    avgKcal: 'avg kcal/d',
    avgProt: 'avg prot/d',
    daysLogged: 'days logged',
    adherence: 'Adherence',
    recommendations: 'Recommendations',
    verifyMeals: 'Increase verified meals',
    verifyMealsBody: 'Some estimated meals this week — scan or weigh them to improve your tracking reliability.',
  },
  fr: {
    back: 'Retour',
    weeklySummary: 'Bilan hebdomadaire',
    whatToDoNow: 'Que faire maintenant',
    thisWeeksGoal: 'Objectif de la semaine',
    thisWeeksGoalBody: 'Scannez les repas ambigus, corrigez les sauces et les portions, puis visez la régularité plutôt qu\'un chiffre parfait.',
    avgKcal: 'kcal moy/j',
    avgProt: 'prot moy/j',
    daysLogged: 'jours loggés',
    adherence: 'Adhérence',
    recommendations: 'Recommandations',
    verifyMeals: 'Augmente les repas vérifiés',
    verifyMealsBody: 'Quelques repas estimés cette semaine — pèse-les pour fiabiliser ton suivi.',
  },
};

/** Parse "X days logged, Y kcal on average, Zg of protein." from summary */
function parseSummaryStats(summary: string): { days: number; kcal: number; prot: number } {
  const daysMatch = summary.match(/(\d+)\s*days?\s*logged/i) ?? summary.match(/(\d+)\s*jours?\s*loggés?/i);
  const kcalMatch = summary.match(/(\d+)\s*kcal/i);
  const protMatch = summary.match(/(\d+)g\s*of\s*protein/i) ?? summary.match(/(\d+)g\s*de\s*protéines?/i);
  return {
    days: daysMatch ? parseInt(daysMatch[1], 10) : 0,
    kcal: kcalMatch ? parseInt(kcalMatch[1], 10) : 0,
    prot: protMatch ? parseInt(protMatch[1], 10) : 0,
  };
}

export function WeeklyReportScreen({ report, onBack }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const stats = parseSummaryStats(report.summary);
  const adherencePct = stats.days > 0 ? Math.round((stats.days / 7) * 100) : 0;

  const today = new Date();
  const endDate = new Date(today);
  endDate.setUTCDate(today.getUTCDate() - today.getUTCDay() + (today.getUTCDay() === 0 ? -6 : 1));
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - 6);
  const fmtShort = (d: Date) =>
    d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
  const dateRange = `${fmtShort(startDate)} – ${fmtShort(today)}`;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}
    >
      <Pressable
        onPress={onBack}
        style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs }}
      >
        <ArrowLeft color={colors.ink} size={22} strokeWidth={2.2} />
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.back}</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{dateRange}</Eyebrow>
        <Text
          style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 }}
        >
          {report.title}
        </Text>
      </View>

      {/* Adherence card */}
      <Card style={{ padding: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Eyebrow>{t.adherence}</Eyebrow>
            <Num
              style={{
                color: colors.accentInk,
                fontSize: 30,
                fontWeight: '600',
                marginTop: 5,
              }}
            >
              {adherencePct}%
            </Num>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Eyebrow>{t.weeklySummary}</Eyebrow>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5, justifyContent: 'flex-end', marginTop: 7 }}>
              <TrendingUp color={colors.accentInk} size={16} strokeWidth={2} />
              <Num style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600' }}>
                {stats.days}/7
              </Num>
            </View>
          </View>
        </View>
      </Card>

      {/* 3 stat mini-cards */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Card style={{ flex: 1, padding: spacing.md }}>
          <Eyebrow>{t.avgKcal}</Eyebrow>
          <Num style={{ fontSize: typography.subheading, fontWeight: '600', marginTop: 6 }}>{stats.kcal}</Num>
        </Card>
        <Card style={{ flex: 1, padding: spacing.md }}>
          <Eyebrow>{t.avgProt}</Eyebrow>
          <Num style={{ fontSize: typography.subheading, fontWeight: '600', marginTop: 6 }}>{stats.prot}g</Num>
        </Card>
        <Card style={{ flex: 1, padding: spacing.md }}>
          <Eyebrow>{t.daysLogged}</Eyebrow>
          <Num style={{ fontSize: typography.subheading, fontWeight: '600', marginTop: 6 }}>{stats.days}</Num>
        </Card>
      </View>

      {/* Recommendations section */}
      <Eyebrow style={{ marginBottom: -spacing.sm }}>{t.recommendations}</Eyebrow>

      {/* nextStep recommendation card */}
      <Card style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.accentWash,
            borderRadius: radius.sm,
            flex: 0,
            height: 34,
            justifyContent: 'center',
            width: 34,
          }}
        >
          <TrendingUp color={colors.accentInk} size={18} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.small, fontWeight: '600' }}>{t.whatToDoNow}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16, marginTop: 3 }}>
            {report.nextStep}
          </Text>
        </View>
      </Card>

      {/* Verify meals recommendation card */}
      <Card style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.accentWash,
            borderRadius: radius.sm,
            flex: 0,
            height: 34,
            justifyContent: 'center',
            width: 34,
          }}
        >
          <Seal size={18} color={colors.accentInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.small, fontWeight: '600' }}>{t.verifyMeals}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16, marginTop: 3 }}>
            {t.verifyMealsBody}
          </Text>
        </View>
      </Card>

      {/* Dark goal banner */}
      <View
        style={{
          backgroundColor: colors.ink,
          borderRadius: radius.lg,
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.10)',
            borderRadius: radius.md,
            height: 42,
            justifyContent: 'center',
            width: 42,
          }}
        >
          <Seal size={22} color={colors.warn} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: '#FFFFFF', fontSize: typography.subheading, fontWeight: '700' }}>
            {t.thisWeeksGoal}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: typography.small, lineHeight: 19 }}>
            {t.thisWeeksGoalBody}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
