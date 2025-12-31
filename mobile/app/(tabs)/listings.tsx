import { View, Text, StyleSheet, FlatList, useColorScheme, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/Button';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function MyListings() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const { data: listings, isLoading } = useQuery<Property[]>({
    queryKey: ['my-listings', user?.id],
    queryFn: () => api.getMyListings(user!.id),
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      approved: { bg: theme.success + '20', text: theme.success },
      pending: { bg: theme.warning + '20', text: theme.warning },
      rejected: { bg: theme.destructive + '20', text: theme.destructive },
    };
    const colors = statusColors[status as keyof typeof statusColors] || statusColors.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.statusText, { color: colors.text }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.listingItem}>
            {getStatusBadge(item.status)}
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              My Listings
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.mutedForeground }]}>
              {listings?.length || 0} properties
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={theme.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              No Listings Yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              Create your first property listing
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: fontSize.base,
  },
  listingItem: {
    marginBottom: spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.base,
    textAlign: 'center',
  },
});
