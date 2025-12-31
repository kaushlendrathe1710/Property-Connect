import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/lib/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function Login() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.requestOtp(email.trim().toLowerCase());
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user, isNewUser } = await api.verifyOtp(email.trim().toLowerCase(), otp);
      await login(user);

      if (isNewUser || !user.onboardingComplete) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="home" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.foreground }]}>PropMarket</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            {step === 'email'
              ? 'Enter your email to get started'
              : 'Enter the verification code sent to your email'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error}
              />
              <Button
                title="Continue"
                onPress={handleRequestOtp}
                loading={loading}
                style={{ marginTop: spacing.sm }}
              />
            </>
          ) : (
            <>
              <Input
                label="Verification Code"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                error={error}
              />
              <Button
                title="Verify"
                onPress={handleVerifyOtp}
                loading={loading}
                style={{ marginTop: spacing.sm }}
              />
              <Button
                title="Back to Email"
                onPress={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                variant="ghost"
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
});
