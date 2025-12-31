import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/Button';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const propertyTypes = ['All', 'House', 'Apartment', 'Condo', 'Townhouse', 'Land', 'Commercial'];
const listingTypes = ['All', 'Sale', 'Lease'];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedListingType, setSelectedListingType] = useState('All');

  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const filters = {
    city: searchQuery || undefined,
    propertyType: selectedType !== 'All' ? selectedType.toLowerCase() : undefined,
    listingType: selectedListingType !== 'All' ? selectedListingType.toLowerCase() : undefined,
  };

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties', filters],
    queryFn: () => api.getProperties(filters),
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.getFavorites(user!.id),
    enabled: !!user && user.role === 'buyer',
  });

  const favoriteIds = new Set(favorites?.map((f) => f.propertyId) || []);

  const approvedProperties = properties?.filter((p) => p.status === 'approved') || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: theme.foreground }]}
            placeholder="Search by city..."
            placeholderTextColor={theme.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {propertyTypes.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedType(type)}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedType === type ? theme.primary : theme.card,
                borderColor: selectedType === type ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedType === type ? theme.primaryForeground : theme.foreground },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {listingTypes.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedListingType(type)}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedListingType === type ? theme.primary : theme.card,
                borderColor: selectedListingType === type ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedListingType === type ? theme.primaryForeground : theme.foreground },
              ]}
            >
              {type === 'All' ? 'All Types' : `For ${type}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={approvedProperties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => router.push(`/property/${item.id}`)}
            onFavorite={user?.role === 'buyer' ? async () => {
              if (favoriteIds.has(item.id)) {
                await api.removeFavorite(item.id, user!.id);
              } else {
                await api.addFavorite(user!.id, item.id);
              }
            } : undefined}
            isFavorite={favoriteIds.has(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={theme.mutedForeground} />
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              {isLoading ? 'Searching...' : 'No properties found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.base,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
  },
});
