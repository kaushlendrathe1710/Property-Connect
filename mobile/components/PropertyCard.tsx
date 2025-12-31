import { View, Text, Image, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '@/lib/theme';
import { Property } from '@/lib/api';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function PropertyCard({ property, onPress, onFavorite, isFavorite }: PropertyCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const formatPrice = (price: string, listingType: string) => {
    const num = parseFloat(price);
    if (listingType === 'lease') {
      return `$${num.toLocaleString()}/mo`;
    }
    return `$${num.toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: theme.card }]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images[0] || 'https://via.placeholder.com/400x300' }}
          style={styles.image}
          resizeMode="cover"
        />
        {onFavorite && (
          <TouchableOpacity
            onPress={onFavorite}
            style={[styles.favoriteButton, { backgroundColor: theme.background + 'CC' }]}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? theme.destructive : theme.foreground}
            />
          </TouchableOpacity>
        )}
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.badgeText, { color: theme.primaryForeground }]}>
            {property.listingType === 'sale' ? 'For Sale' : 'For Lease'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.price, { color: theme.primary }]}>
          {formatPrice(property.price, property.listingType)}
        </Text>
        <Text style={[styles.title, { color: theme.foreground }]} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={[styles.address, { color: theme.mutedForeground }]} numberOfLines={1}>
          {property.address}, {property.city}, {property.state}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={16} color={theme.mutedForeground} />
            <Text style={[styles.detailText, { color: theme.mutedForeground }]}>
              {property.bedrooms} beds
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={16} color={theme.mutedForeground} />
            <Text style={[styles.detailText, { color: theme.mutedForeground }]}>
              {property.bathrooms} baths
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="resize-outline" size={16} color={theme.mutedForeground} />
            <Text style={[styles.detailText, { color: theme.mutedForeground }]}>
              {property.squareFeet.toLocaleString()} sqft
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  price: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  details: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
  },
});
