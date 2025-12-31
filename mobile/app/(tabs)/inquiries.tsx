import { View, Text, StyleSheet, FlatList, useColorScheme, Image, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { api, Inquiry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function Inquiries() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const isBuyer = user?.role === 'buyer';

  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: isBuyer ? ['my-inquiries', user?.id] : ['inquiries', user?.id],
    queryFn: () => isBuyer ? api.getMyInquiries(user!.id) : api.getInquiries(user!.id),
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderInquiry = ({ item }: { item: Inquiry }) => (
    <TouchableOpacity
      style={[styles.inquiryCard, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/property/${item.propertyId}`)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.property?.images[0] || 'https://via.placeholder.com/100' }}
        style={styles.propertyImage}
      />
      <View style={styles.inquiryContent}>
        <View style={styles.inquiryHeader}>
          <Text style={[styles.propertyTitle, { color: theme.foreground }]} numberOfLines={1}>
            {item.property?.title || 'Property'}
          </Text>
          {!item.isRead && !isBuyer && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]} />
          )}
        </View>
        <Text style={[styles.inquiryMessage, { color: theme.mutedForeground }]} numberOfLines={2}>
          {isBuyer ? item.message : `${item.buyer?.fullName || 'Buyer'}: ${item.message}`}
        </Text>
        <Text style={[styles.inquiryDate, { color: theme.mutedForeground }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={inquiries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderInquiry}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              {isBuyer ? 'My Inquiries' : 'Received Inquiries'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.mutedForeground }]}>
              {inquiries?.length || 0} messages
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              No Inquiries Yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              {isBuyer
                ? 'Send inquiries about properties you are interested in'
                : 'Inquiries from buyers will appear here'}
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
  inquiryCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  inquiryContent: {
    flex: 1,
    justifyContent: 'center',
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  propertyTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inquiryMessage: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  inquiryDate: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
    paddingHorizontal: spacing.xl,
  },
});
