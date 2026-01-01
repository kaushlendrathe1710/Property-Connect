import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function EditProfile() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (fullName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (phone.trim().length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const updatedUser = await api.updateProfile(user.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      await updateUser(updatedUser);
      Alert.alert('Success', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
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
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.email, { color: theme.mutedForeground }]}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.foreground }]}>Full Name</Text>
          <Input
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: theme.foreground, marginTop: spacing.md }]}>Phone Number</Text>
          <Input
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {error ? (
            <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>
          ) : null}

          <Button
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={loading}
            style={{ marginTop: spacing.lg }}
          />

          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: theme.mutedForeground }]}>Account Information</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.foreground }]}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>Role</Text>
              <Text style={[styles.infoValue, { color: theme.foreground }]}>
                {user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || '')}
              </Text>
            </View>
          </View>
          <Text style={[styles.infoNote, { color: theme.mutedForeground }]}>
            Email and role cannot be changed. Contact support if you need assistance.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
  },
  email: {
    fontSize: fontSize.base,
  },
  form: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  error: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  infoNote: {
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
