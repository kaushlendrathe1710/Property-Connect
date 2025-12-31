import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const roles = [
  { id: 'buyer', label: 'Buyer', description: 'Looking to buy or rent', icon: 'search' as const },
  { id: 'seller', label: 'Seller', description: 'Selling my property', icon: 'home' as const },
  { id: 'agent', label: 'Agent', description: 'Real estate professional', icon: 'briefcase' as const },
];

export default function Onboarding() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { user, updateUser } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleComplete = async () => {
    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const updatedUser = await api.completeOnboarding(user.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        role: selectedRole,
      });
      await updateUser(updatedUser);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.foreground }]}>Complete Your Profile</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Tell us a bit about yourself
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="John Doe"
          autoCapitalize="words"
        />

        <Input
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { color: theme.foreground }]}>I am a...</Text>
        <View style={styles.roleContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => setSelectedRole(role.id)}
              style={[
                styles.roleCard,
                {
                  backgroundColor: selectedRole === role.id ? theme.primary + '15' : theme.card,
                  borderColor: selectedRole === role.id ? theme.primary : theme.border,
                },
              ]}
            >
              <Ionicons
                name={role.icon}
                size={28}
                color={selectedRole === role.id ? theme.primary : theme.mutedForeground}
              />
              <Text
                style={[
                  styles.roleLabel,
                  { color: selectedRole === role.id ? theme.primary : theme.foreground },
                ]}
              >
                {role.label}
              </Text>
              <Text style={[styles.roleDescription, { color: theme.mutedForeground }]}>
                {role.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>
        ) : null}

        <Button
          title="Complete Setup"
          onPress={handleComplete}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  roleLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  error: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
