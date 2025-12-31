import { View, Text, StyleSheet, FlatList, useColorScheme } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/lib/theme';
import { PropertyCard } from '@/components/PropertyCard';
import { api, Property, Favorite } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function Favorites() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery<Favorite[]>({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.getFavorites(user!.id),
    enabled: !!user,
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.getProperties(),
  });

  const favoriteProperties = properties?.filter((p) =>
    favorites?.some((f) => f.propertyId === p.id)
  ) || [];

  const handleRemoveFavorite = async (propertyId: string) => {
    if (!user) return;
    await api.removeFavorite(propertyId, user.id);
    queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={favoriteProperties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => router.push(`/property/${item.id}`)}
            onFavorite={() => handleRemoveFavorite(item.id)}
            isFavorite={true}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={theme.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              No Favorites Yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              Properties you save will appear here
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
