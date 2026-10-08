import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Truck ,MapPin, CheckCircle, Clock, XCircle, Ban } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { orpc } from '@/hooks/orpc';
import { OrderSkeleton } from '@/components/shared/OrderSkeleton';
import { formatNumber } from '@/utils/formatters';

interface DriverOffer {
  id: string;
  orderId: string;
  offeredPrice: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string | Date;
  respondedAt?: string | Date | null;
  pickupAddress: string;
  deliveryAddress: string;
  materials: unknown;
  vehicleType: string;
  orderStatus: string;
}

export default function DriverOffers() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const result = await orpc.order.getMyOffers();
      if (result.success && result.offers) {
        setOffers(result.offers as any);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  const getOfferStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle size={18} color={colors.success} />;
      case 'pending':
        return <Clock size={18} color={colors.warning} />;
      case 'rejected':
        return <XCircle size={18} color={colors.error} />;
      case 'cancelled':
        return <Ban size={18} color={colors.textMuted} />;
      default:
        return <Package size={18} color={colors.textMuted} />;
    }
  };

  const getOfferStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      case 'cancelled':
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} color={colors.success} />;
      case 'assigned':
        return <Truck size={18} color={colors.primary} />;
      case 'on_the_way':
        return <Truck size={18} color={colors.primary} />;
      case 'delivered':
        return <CheckCircle size={18} color={colors.success} />;
      case 'approved':
        return <Clock size={18} color={colors.warning} />;
      case 'has_offers':
        return <Clock size={18} color={colors.warning} />;
      case 'cancelled':
        return <Ban size={18} color={colors.error} />;
      default:
        return <Package size={18} color={colors.textMuted} />;
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'assigned':
        return 'Assigned';
      case 'on_the_way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'approved':
        return 'Approved';
      case 'has_offers':
        return 'Has Offers';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'assigned':
        return colors.primary;
      case 'on_the_way':
        return colors.primary;
      case 'delivered':
        return colors.success;
      case 'approved':
        return colors.warning;
      case 'has_offers':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/driver/home')}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Offers</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <OrderSkeleton />
        ) : offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No offers yet</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Your submitted offers will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.offersList}>
            {offers.map((offer) => (
              <View
                key={offer.id}
                style={[styles.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.offerHeader}>
                  <View style={styles.offerInfo}>
                    <Text style={[styles.offerId, { color: colors.text }]}>
                      Order #{offer.orderId.slice(-6)}
                    </Text>
                    <Text style={[styles.offerDate, { color: colors.textSecondary }]}>
                      {new Date(offer.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: `${getOfferStatusColor(offer.status)}20` }]}>
                      {getOfferStatusIcon(offer.status)}
                      <Text style={[styles.statusText, { color: getOfferStatusColor(offer.status) }]}>
                        {getOfferStatusText(offer.status)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getOrderStatusColor(offer.orderStatus)}20` }]}>
                      {getOrderStatusIcon(offer.orderStatus)}
                      <Text style={[styles.statusText, { color: getOrderStatusColor(offer.orderStatus) }]}>
                        {getOrderStatusText(offer.orderStatus)}
                      </Text>
                    </View>
                  </View>
                </View>

                {Array.isArray(offer.materials) && offer.materials.length > 0 && (
                  <Text style={[styles.offerItems, { color: colors.text }]}>
                    {offer.materials.join(', ')}
                  </Text>
                )}

                <View style={styles.offerRoute}>
                  <View style={styles.routeItem}>
                    <MapPin size={16} color={colors.textMuted} />
                    <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
                      From: {offer.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.routeItem}>
                    <MapPin size={16} color={colors.textMuted} />
                    <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
                      To: {offer.deliveryAddress}
                    </Text>
                  </View>
                </View>

                <View style={styles.offerFooter}>
                  <Text style={[styles.offerPrice, { color: colors.primary }]}>
                    {formatNumber(parseFloat(offer.offeredPrice))} ETB
                  </Text>
                  {offer.respondedAt && (
                    <Text style={[styles.respondedText, { color: colors.textSecondary }]}>
                      Responded: {new Date(offer.respondedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptyMessage: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  offersList: {
    padding: spacing.lg,
  },
  offerCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  offerInfo: {
    flex: 1,
  },
  offerId: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  offerDate: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  statusContainer: {
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  offerItems: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  offerRoute: {
    marginBottom: spacing.md,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  routeText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  offerPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  respondedText: {
    fontSize: fontSize.xs,
  },
});
