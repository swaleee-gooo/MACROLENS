import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Sparkles, Target } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type AuthMode = 'login' | 'signup' | 'reset';

type Props = {
  defaultMode?: AuthMode;
  onBack: () => void;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onEmailSignup: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onOAuth: (provider: 'apple' | 'google') => Promise<void>;
};

function ProviderButton({ label, icon: Icon, onPress }: { label: string; icon: typeof Sparkles; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 52,
        paddingHorizontal: spacing.md,
      }}
    >
      <Icon color={colors.black} size={19} strokeWidth={2.4} />
      <Text style={{ color: colors.black, flex: 1, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

export function AuthScreen({ defaultMode = 'login', onBack, onEmailLogin, onEmailSignup, onResetPassword, onOAuth }: Props) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canSubmit = email.includes('@') && (mode === 'reset' || password.length >= 8);

  async function submit() {
    if (!canSubmit || isLoading) {
      return;
    }

    setIsLoading(true);
    setStatus(null);
    try {
      if (mode === 'login') {
        await onEmailLogin(email, password);
      } else if (mode === 'signup') {
        await onEmailSignup(email, password);
      } else {
        await onResetPassword(email);
        setStatus('Email de reinitialisation envoye.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Connexion impossible pour le moment.');
    } finally {
      setIsLoading(false);
    }
  }

  async function startOAuth(provider: 'apple' | 'google') {
    setIsLoading(true);
    setStatus(null);
    try {
      await onOAuth(provider);
      setStatus('Valide la connexion puis reviens dans MacroLens.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Connexion externe indisponible.');
    } finally {
      setIsLoading(false);
    }
  }

  const title = mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Creer ton compte' : 'Reset password';
  const cta = mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Creer le compte' : 'Envoyer le lien';

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Synchronise tes repas, ton profil et tes progres sur tous tes appareils.</Text>
      </View>

      {mode !== 'reset' ? (
        <View style={{ gap: spacing.md }}>
          <ProviderButton icon={Sparkles} label="Continuer avec Apple" onPress={() => startOAuth('apple')} />
          <ProviderButton icon={Target} label="Continuer avec Google" onPress={() => startOAuth('google')} />
        </View>
      ) : null}

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Mail color={colors.black} size={18} strokeWidth={2.4} />
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Email</Text>
        </View>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          style={{ borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.black, minHeight: 48, paddingHorizontal: spacing.md }}
          value={email}
        />
        {mode !== 'reset' ? (
          <TextInput
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={{ borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.black, minHeight: 48, paddingHorizontal: spacing.md }}
            value={password}
          />
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <ShieldCheck color={colors.green} size={16} strokeWidth={2.4} />
          <Text style={{ color: colors.muted, flex: 1, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>Donnees privees, RLS Supabase actif, aucune revente de donnees.</Text>
        </View>
      </View>

      {status ? (
        <View style={{ backgroundColor: colors.greenSoft, borderColor: colors.green, borderRadius: radius.md, borderWidth: 1, padding: spacing.md }}>
          <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900', lineHeight: 18 }}>{status}</Text>
        </View>
      ) : null}

      <Pressable
        disabled={!canSubmit || isLoading}
        onPress={submit}
        style={{
          alignItems: 'center',
          backgroundColor: canSubmit && !isLoading ? colors.black : colors.muted,
          borderRadius: radius.pill,
          flexDirection: 'row',
          gap: spacing.sm,
          justifyContent: 'center',
          minHeight: 58,
        }}
      >
        <KeyRound color="white" size={19} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>{isLoading ? 'Chargement...' : cta}</Text>
      </Pressable>

      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        {mode !== 'login' ? <Pressable onPress={() => setMode('login')}><Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>J ai deja un compte</Text></Pressable> : null}
        {mode !== 'signup' ? <Pressable onPress={() => setMode('signup')}><Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>Creer un compte</Text></Pressable> : null}
        {mode !== 'reset' ? <Pressable onPress={() => setMode('reset')}><Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>Mot de passe oublie</Text></Pressable> : null}
      </View>
    </ScrollView>
  );
}
