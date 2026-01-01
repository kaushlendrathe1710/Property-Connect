import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth-context';

export default function Profile() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, string> = {
      buyer: 'Buyer',
      seller: 'Seller',
      agent: 'Agent',
      admin: 'Administrator',
    };
    return roleLabels[role] || role;
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'shield-outline', label: 'Privacy', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About', onPress: () => {} },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>
            {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.foreground }]}>
          {user?.fullName || 'User'}
        </Text>
        <Text style={[styles.email, { color: theme.mutedForeground }]}>
          {user?.email}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.roleText, { color: theme.primary }]}>
            {getRoleBadge(user?.role || 'buyer')}
          </Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={22} color={theme.foreground} />
            <Text style={[styles.menuLabel, { color: theme.foreground }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={{ marginTop: spacing.lg }}
      />

      <Text style={[styles.version, { color: theme.mutedForeground }]}>
        PropMarket v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  profileCard: {
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
  name: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  menuSection: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.base,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: fontSize.sm,
  },
});
