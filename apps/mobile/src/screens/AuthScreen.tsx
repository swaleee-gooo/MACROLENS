import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ChevronLeft, KeyRound, Mail } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useLang } from '../i18n/LanguageContext';
import { Eyebrow, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    back: 'Back',
    signupTitle: 'Save your progress',
    signupSubtitle: 'Create your account to keep your plan and data on every device.',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to pick up your plan and data where you left off.',
    resetTitle: 'Reset password',
    resetSubtitle: 'Enter your email and we will send you a reset link.',
    continueApple: 'Continue with Apple',
    continueGoogle: 'Continue with Google',
    orWithEmail: 'or with email',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Password (8+ characters)',
    submitSignup: 'Create my account',
    submitLogin: 'Sign in',
    submitReset: 'Send reset link',
    skip: 'Skip for now',
    haveAccount: 'I already have an account',
    needAccount: 'Create an account',
    forgotPassword: 'Forgot password?',
    loading: 'One moment...',
    confirmEmail: 'Account created. Check your inbox to confirm, then sign in.',
    resetSent: 'Reset link sent. Check your inbox.',
    genericError: 'Unable to connect right now.',
    oauthError: 'Sign-in did not complete. Try again.',
  },
  fr: {
    back: 'Retour',
    signupTitle: 'Sauvegarde ta progression',
    signupSubtitle: 'Crée ton compte pour retrouver ton plan et tes données sur tous tes appareils.',
    loginTitle: 'Content de te revoir',
    loginSubtitle: 'Connecte-toi pour retrouver ton plan et tes données.',
    resetTitle: 'Réinitialiser le mot de passe',
    resetSubtitle: 'Entre ton email et on t’envoie un lien de réinitialisation.',
    continueApple: 'Continuer avec Apple',
    continueGoogle: 'Continuer avec Google',
    orWithEmail: 'ou par email',
    emailPlaceholder: 'toi@exemple.com',
    passwordPlaceholder: 'Mot de passe (8+ caractères)',
    submitSignup: 'Créer mon compte',
    submitLogin: 'Se connecter',
    submitReset: 'Envoyer le lien',
    skip: 'Passer pour l’instant',
    haveAccount: 'J’ai déjà un compte',
    needAccount: 'Créer un compte',
    forgotPassword: 'Mot de passe oublié ?',
    loading: 'Un instant...',
    confirmEmail: 'Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.',
    resetSent: 'Lien envoyé. Vérifie ta boîte mail.',
    genericError: 'Connexion impossible pour le moment.',
    oauthError: 'La connexion n’a pas abouti. Réessaie.',
  },
};

type AuthMode = 'login' | 'signup' | 'reset';

/** 'confirm_email' = account created but email confirmation is still required (no session yet). */
export type EmailSignupOutcome = 'signed_in' | 'confirm_email';

type Props = {
  defaultMode?: AuthMode;
  onBack: () => void;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onEmailSignup: (email: string, password: string) => Promise<EmailSignupOutcome | void>;
  onResetPassword: (email: string) => Promise<void>;
  onOAuth: (provider: 'apple' | 'google') => Promise<void>;
  /** When provided, shows the "Skip for now" link (onboarding-style entry points). */
  onSkip?: () => void;
};

function AppleLogo({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M16.3 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.3-.9-2.3-3.5Zm-2.3-6.4c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.5-1.2Z"
      />
    </Svg>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1Z" />
      <Path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <Path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
      <Path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z" />
    </Svg>
  );
}

/** Prototype `.btn` — full-width, radius 13, icon + 15px/600 label. */
function AuthButton({
  label,
  icon,
  variant,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  icon?: ReactNode;
  variant: 'dark' | 'ghost' | 'accent';
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const bg = variant === 'dark' ? colors.ink : variant === 'accent' ? colors.accent : colors.paper2;
  const fg = variant === 'ghost' ? colors.ink : colors.paper;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center' as const,
        backgroundColor: bg,
        borderColor: variant === 'ghost' ? colors.line2 : 'transparent',
        borderRadius: radius.md,
        borderWidth: variant === 'ghost' ? 1 : 0,
        flexDirection: 'row' as const,
        gap: spacing.sm,
        justifyContent: 'center' as const,
        opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        paddingVertical: 15,
      })}
    >
      {icon}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Prototype `.fld` — hairline field with a leading muted icon. */
function AuthField({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  accessibilityLabel,
}: {
  icon: ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address';
  accessibilityLabel: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line2,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: 13,
      }}
    >
      {icon}
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        secureTextEntry={secureTextEntry}
        style={{ color: colors.ink, flex: 1, fontFamily: fonts.mono, fontSize: 14, minHeight: 46, paddingVertical: 11 }}
        value={value}
      />
    </View>
  );
}

export function AuthScreen({ defaultMode = 'signup', onBack, onEmailLogin, onEmailSignup, onResetPassword, onOAuth, onSkip }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Sign in with Apple only exists on iOS hardware — hide the button elsewhere (web/Android).
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then((available) => {
          if (!cancelled) {
            setAppleAvailable(available);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = email.includes('@') && (mode === 'reset' || password.length >= 8);
  const title = mode === 'login' ? t.loginTitle : mode === 'signup' ? t.signupTitle : t.resetTitle;
  const subtitle = mode === 'login' ? t.loginSubtitle : mode === 'signup' ? t.signupSubtitle : t.resetSubtitle;
  const submitLabel = mode === 'login' ? t.submitLogin : mode === 'signup' ? t.submitSignup : t.submitReset;

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  }

  async function submit() {
    if (!canSubmit || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
        await onEmailLogin(email, password);
      } else if (mode === 'signup') {
        const outcome = await onEmailSignup(email, password);
        if (outcome === 'confirm_email') {
          setNotice(t.confirmEmail);
          setMode('login');
        }
      } else {
        await onResetPassword(email);
        setNotice(t.resetSent);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.genericError);
    } finally {
      setIsLoading(false);
    }
  }

  async function startOAuth(provider: 'apple' | 'google') {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);
    try {
      await onOAuth(provider);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : t.oauthError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header — back chevron */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
        <Pressable
          accessibilityLabel={t.back}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => ({ alignItems: 'center' as const, height: 30, justifyContent: 'center' as const, marginLeft: -6, opacity: pressed ? 0.7 : 1, width: 30 })}
        >
          <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
        </Pressable>
        <View style={{ width: 30 }} />
      </View>

      {/* Seal + title + subtitle */}
      <View style={{ alignItems: 'center', paddingBottom: 6, paddingTop: spacing.lg }}>
        <Seal size={38} />
      </View>
      <Text
        style={{
          color: colors.ink,
          fontFamily: fonts.display,
          fontSize: 24,
          fontWeight: '600',
          letterSpacing: -0.5,
          lineHeight: 28,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19, marginBottom: spacing.xl, marginTop: 9, textAlign: 'center' }}>
        {subtitle}
      </Text>

      {/* Provider buttons (hidden in reset mode) */}
      {mode !== 'reset' ? (
        <View style={{ gap: 10 }}>
          {appleAvailable ? (
            <AuthButton
              accessibilityLabel={t.continueApple}
              icon={<AppleLogo />}
              label={t.continueApple}
              onPress={() => startOAuth('apple')}
              variant="dark"
              disabled={isLoading}
            />
          ) : null}
          <AuthButton
            accessibilityLabel={t.continueGoogle}
            icon={<GoogleLogo />}
            label={t.continueGoogle}
            onPress={() => startOAuth('google')}
            variant="ghost"
            disabled={isLoading}
          />
        </View>
      ) : null}

      {/* "or with email" hairline divider */}
      {mode !== 'reset' ? (
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginVertical: 14 }}>
          <View style={{ backgroundColor: colors.line, flex: 1, height: 1 }} />
          <Eyebrow>{t.orWithEmail}</Eyebrow>
          <View style={{ backgroundColor: colors.line, flex: 1, height: 1 }} />
        </View>
      ) : (
        <View style={{ height: spacing.sm }} />
      )}

      {/* Email + password fields */}
      <View style={{ gap: 11 }}>
        <AuthField
          accessibilityLabel={t.emailPlaceholder}
          icon={<Mail color={colors.muted} size={17} strokeWidth={1.9} />}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder={t.emailPlaceholder}
          value={email}
        />
        {mode !== 'reset' ? (
          <AuthField
            accessibilityLabel={t.passwordPlaceholder}
            icon={<KeyRound color={colors.muted} size={17} strokeWidth={1.9} />}
            onChangeText={setPassword}
            placeholder={t.passwordPlaceholder}
            secureTextEntry
            value={password}
          />
        ) : null}
      </View>

      {/* Status messages */}
      {notice ? (
        <View style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: radius.md, borderWidth: 1, marginTop: 14, padding: spacing.md }}>
          <Text style={{ color: colors.accentInk, fontSize: typography.small, lineHeight: 18 }}>{notice}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={{ backgroundColor: colors.dangerWash, borderColor: colors.dangerLine, borderRadius: radius.md, borderWidth: 1, marginTop: 14, padding: spacing.md }}>
          <Text style={{ color: colors.dangerInk, fontSize: typography.small, lineHeight: 18 }}>{error}</Text>
        </View>
      ) : null}

      {/* Submit */}
      <View style={{ marginTop: 14 }}>
        <AuthButton
          accessibilityLabel={submitLabel}
          disabled={!canSubmit || isLoading}
          label={isLoading ? t.loading : submitLabel}
          onPress={submit}
          variant="accent"
        />
      </View>

      {/* Mode toggles */}
      <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }}>
        {mode !== 'login' ? (
          <Pressable accessibilityLabel={t.haveAccount} accessibilityRole="button" onPress={() => switchMode('login')} hitSlop={8}>
            <Eyebrow color={colors.ink2}>{t.haveAccount}</Eyebrow>
          </Pressable>
        ) : null}
        {mode !== 'signup' ? (
          <Pressable accessibilityLabel={t.needAccount} accessibilityRole="button" onPress={() => switchMode('signup')} hitSlop={8}>
            <Eyebrow color={colors.accentInk}>{t.needAccount}</Eyebrow>
          </Pressable>
        ) : null}
        {mode === 'login' ? (
          <Pressable accessibilityLabel={t.forgotPassword} accessibilityRole="button" onPress={() => switchMode('reset')} hitSlop={8}>
            <Eyebrow>{t.forgotPassword}</Eyebrow>
          </Pressable>
        ) : null}
        {onSkip ? (
          <Pressable accessibilityLabel={t.skip} accessibilityRole="button" onPress={onSkip} hitSlop={8}>
            <Eyebrow>{t.skip}</Eyebrow>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
