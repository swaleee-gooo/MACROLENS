import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, CalendarCheck, Target } from 'lucide-react-native';
import type { WeeklyReport } from '../domain/weeklyReport';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  report: WeeklyReport;
  onBack: () => void;
};

export function WeeklyReportScreen({ report, onBack }: Props) {
  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={26} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>{report.title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>{report.summary}</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.xl }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 76, justifyContent: 'center', width: 76 }}>
          <CalendarCheck color={colors.green} size={38} strokeWidth={2.5} />
        </View>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Ce qu'on fait maintenant</Text>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>{report.nextStep}</Text>
      </View>

      <View style={{ backgroundColor: colors.black, borderRadius: radius.md, flexDirection: 'row', gap: spacing.md, padding: spacing.lg }}>
        <Target color={colors.amber} size={26} strokeWidth={2.4} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>Objectif de la semaine</Text>
          <Text style={{ color: '#EDEDED', fontSize: typography.small, fontWeight: '800', lineHeight: 19 }}>Scanne les repas ambigus, corrige sauces et portions, puis vise la regularite plutot qu'un chiffre parfait.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
