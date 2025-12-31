import { View, Text, StyleSheet, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/lib/theme';
import { PropertyCard } from '@/components/PropertyCard';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const { data: featuredProperties, isLoading, refetch } = useQuery<Property[]>({
    queryKey: ['featured-properties'],
    queryFn: () => api.getFeaturedProperties(),
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.getFavorites(user!.id),
    enabled: !!user && user.role === 'buyer',
  });

  const favoriteIds = new Set(favorites?.map((f) => f.propertyId) || []);

  const handlePropertyPress = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handleFavorite = async (propertyId: string) => {
    if (!user) return;
    if (favoriteIds.has(propertyId)) {
      await api.removeFavorite(propertyId, user.id);
    } else {
      await api.addFavorite(user.id, propertyId);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.mutedForeground }]}>
          Welcome back,
        </Text>
        <Text style={[styles.name, { color: theme.foreground }]}>
          {user?.fullName || 'User'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="home" size={24} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.foreground }]}>
            {featuredProperties?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>
            Featured
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="heart" size={24} color={theme.destructive} />
          <Text style={[styles.statValue, { color: theme.foreground }]}>
            {favorites?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>
            Favorites
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          Featured Properties
        </Text>
        {featuredProperties?.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onPress={() => handlePropertyPress(property.id)}
            onFavorite={user?.role === 'buyer' ? () => handleFavorite(property.id) : undefined}
            isFavorite={favoriteIds.has(property.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.base,
  },
  name: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
});
