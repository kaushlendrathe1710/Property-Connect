import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useColorScheme, Dimensions, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { Button } from '@/components/Button';
import { api, Property, User } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const { width } = Dimensions.get('window');

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Property & { owner: User }>({
    queryKey: ['property', id],
    queryFn: () => api.getProperty(id!),
    enabled: !!id,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.getFavorites(user!.id),
    enabled: !!user && user.role === 'buyer',
  });

  const isFavorite = favorites?.some((f) => f.propertyId === id);

  const handleFavorite = async () => {
    if (!user || !id) return;
    if (isFavorite) {
      await api.removeFavorite(id, user.id);
    } else {
      await api.addFavorite(user.id, id);
    }
    queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
  };

  const handleSendInquiry = async () => {
    if (!user || !data || !inquiryMessage.trim()) return;

    setSendingInquiry(true);
    try {
      await api.sendInquiry({
        propertyId: data.id,
        buyerId: user.id,
        sellerId: data.ownerId,
        message: inquiryMessage.trim(),
      });
      setShowInquiryModal(false);
      setInquiryMessage('');
      Alert.alert('Success', 'Your inquiry has been sent to the owner.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send inquiry');
    } finally {
      setSendingInquiry(false);
    }
  };

  const formatPrice = (price: string, listingType: string) => {
    const num = parseFloat(price);
    if (listingType === 'lease') {
      return `$${num.toLocaleString()}/month`;
    }
    return `$${num.toLocaleString()}`;
  };

  if (isLoading || !data) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.mutedForeground }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {data.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {data.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentImageIndex ? theme.primaryForeground : theme.primaryForeground + '50',
                  },
                ]}
              />
            ))}
          </View>
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: theme.primaryForeground }]}>
              {data.listingType === 'sale' ? 'For Sale' : 'For Lease'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.primary }]}>
              {formatPrice(data.price, data.listingType)}
            </Text>
            {user?.role === 'buyer' && (
              <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={28}
                  color={isFavorite ? theme.destructive : theme.foreground}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.title, { color: theme.foreground }]}>{data.title}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={theme.mutedForeground} />
            <Text style={[styles.address, { color: theme.mutedForeground }]}>
              {data.address}, {data.city}, {data.state} {data.zipCode}
            </Text>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={24} color={theme.primary} />
              <Text style={[styles.detailValue, { color: theme.foreground }]}>{data.bedrooms}</Text>
              <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>Beds</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={24} color={theme.primary} />
              <Text style={[styles.detailValue, { color: theme.foreground }]}>{data.bathrooms}</Text>
              <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>Baths</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={24} color={theme.primary} />
              <Text style={[styles.detailValue, { color: theme.foreground }]}>{data.squareFeet.toLocaleString()}</Text>
              <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>Sqft</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={24} color={theme.primary} />
              <Text style={[styles.detailValue, { color: theme.foreground }]}>{data.yearBuilt}</Text>
              <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>Built</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Description</Text>
            <Text style={[styles.description, { color: theme.mutedForeground }]}>
              {data.description}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {data.amenities.map((amenity, index) => (
                <View key={index} style={[styles.amenityChip, { backgroundColor: theme.card }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.amenityText, { color: theme.foreground }]}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.ownerCard, { backgroundColor: theme.card }]}>
            <View style={[styles.ownerAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.ownerAvatarText, { color: theme.primary }]}>
                {data.owner?.fullName?.charAt(0).toUpperCase() || 'O'}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={[styles.ownerName, { color: theme.foreground }]}>
                {data.owner?.fullName || 'Property Owner'}
              </Text>
              <Text style={[styles.ownerRole, { color: theme.mutedForeground }]}>
                {data.ownerType === 'agent' ? 'Real Estate Agent' : 'Property Owner'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {user?.role === 'buyer' && (
        <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <Button
            title="Send Inquiry"
            onPress={() => setShowInquiryModal(true)}
            style={{ flex: 1 }}
          />
        </View>
      )}

      <Modal
        visible={showInquiryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInquiryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>Send Inquiry</Text>
              <TouchableOpacity onPress={() => setShowInquiryModal(false)}>
                <Ionicons name="close" size={24} color={theme.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.mutedForeground }]}>
              Send a message to the property owner about "{data.title}"
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.card, color: theme.foreground, borderColor: theme.border }]}
              placeholder="I'm interested in this property..."
              placeholderTextColor={theme.mutedForeground}
              value={inquiryMessage}
              onChangeText={setInquiryMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Button
              title="Send Message"
              onPress={handleSendInquiry}
              loading={sendingInquiry}
              disabled={!inquiryMessage.trim()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  address: {
    fontSize: fontSize.base,
    flex: 1,
  },
  detailsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  detailItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: fontSize.xs,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  amenityText: {
    fontSize: fontSize.sm,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  ownerRole: {
    fontSize: fontSize.sm,
  },
  bottomBar: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: fontSize.base,
    marginBottom: spacing.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    minHeight: 120,
    marginBottom: spacing.md,
  },
});
