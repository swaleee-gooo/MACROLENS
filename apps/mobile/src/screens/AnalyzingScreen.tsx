import { ActivityIndicator, Image, Text, View } from 'react-native';
import { ScanLine } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  imageUri: string;
};

export function AnalyzingScreen({ imageUri }: Props) {
  const isManual = imageUri.startsWith('manual://');

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
      {isManual ? (
        <View
          style={{
            alignItems: 'center',
            aspectRatio: 1,
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.lg,
            borderWidth: 1,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <ScanLine color={colors.green} size={72} strokeWidth={1.8} />
        </View>
      ) : (
        <Image source={{ uri: imageUri }} style={{ aspectRatio: 1, borderRadius: radius.lg, width: '100%' }} />
      )}
      <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xl }}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Analyse du repas</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, textAlign: 'center' }}>
          Detection des aliments, portions et macros probables.
        </Text>
      </View>
    </View>
  );
}
