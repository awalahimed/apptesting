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
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, XCircle, Ban } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useAuth } from '@/hooks/AuthContext';
import { orpc } from '@/hooks/orpc';
import { OrderStatusSheet } from '@/components/order/OrderStatusSheet-redesign';
import { OrderTrackingSheet } from '@/components/order/OrderTrackingSheet';
import { OrderSkeleton } from '@/components/shared/OrderSkeleton';
import { userRoles } from '@/constants/userRoles';
import { formatNumber } from '@/utils/formatters';

interface Order {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  materials: unknown;
  createdAt: string | Date;
  finalPrice?: string | null;
  // Driver offer fields
  orderId?: string;
  offeredPrice?: string;
  orderStatus?: string;
  respondedAt?: string | Date | null;
}

export default function Orders() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [clickedOrderId, setClickedOrderId] = useState<string | null>(null);
  
  const isDriver = session?.user?.role === userRoles.DRIVER;
  const pageTitle = isDriver ? 'My Offers' : 'My Orders';

  useEffect(() => {
    fetchOrders();
  }, []);

  const sortOrders = (list: Order[]) => {
    const rank = (status: string) => (status === 'pending' ? 0 : 1);
    return [...list].sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // If driver, fetch offers instead of orders
      if (isDriver) {
        const result = await orpc.order.getMyOffers();
        if (result.success && result.offers) {
          setOrders(result.offers);
        }
      } else {
        const result = await orpc.order.getMyOrders();
        if (result.success && result.orders) {
          setOrders(sortOrders(result.orders));
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderClick = (order: Order) => {
    setClickedOrderId(order.id);
    // Open OrderStatusSheet for pending/approved/has_offers orders
    if (order.status === 'pending' || order.status === 'approved' || order.status === 'has_offers' || order.status === 'pending_approval') {
      setShowOrderStatus(true);
    } 
    // Open OrderTrackingSheet for assigned/on_the_way/delivered orders
    else if (order.status === 'assigned' || order.status === 'on_the_way' || order.status === 'delivered') {
      setShowTracking(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <CheckCircle size={20} color={colors.success} />;
      case 'assigned':
      case 'on_the_way':
        return <Truck size={20} color={colors.primary} />;
      case 'pending':
      case 'approved':
      case 'has_offers':
        return <Clock size={20} color={colors.warning} />;
      case 'accepted':
        return <CheckCircle size={20} color={colors.success} />;
      case 'rejected':
        return <XCircle size={20} color={colors.error} />;
      case 'cancelled':
        return <Ban size={20} color={colors.error} />;
      default:
        return <Package size={20} color={colors.textMuted} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'assigned':
        return 'Assigned';
      case 'on_the_way':
        return 'On the Way';
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'has_offers':
        return 'Has Offers';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
      case 'accepted':
        return colors.success;
      case 'assigned':
      case 'on_the_way':
        return colors.primary;
      case 'pending':
      case 'approved':
      case 'has_offers':
        return colors.warning;
      case 'rejected':
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{pageTitle}</Text>
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
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isDriver ? 'No offers yet' : 'No orders yet'}
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              {isDriver ? 'Your submitted offers will appear here' : 'Your order history will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleOrderClick(order)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      Order #{(order.orderId || order.id).slice(-6)}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {isDriver ? (
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                        {getStatusIcon(order.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {getStatusText(order.status)}
                        </Text>
                      </View>
                      {order.orderStatus && (
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.orderStatus)}20` }]}>
                          {getStatusIcon(order.orderStatus)}
                          <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
                            {getStatusText(order.orderStatus)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                      {getStatusIcon(order.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusText(order.status)}
                      </Text>
                    </View>
                  )}
                </View>

                {Array.isArray(order.materials) && order.materials.length > 0 && (
                  <Text style={[styles.orderItems, { color: colors.text }]}>
                    {order.materials.join(', ')}
                  </Text>
                )}

                <View style={styles.orderRoute}>
                  <View style={styles.routeItem}>
                    <MapPin size={16} color={colors.textMuted} />
                    <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
                      From: {order.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.routeItem}>
                    <MapPin size={16} color={colors.textMuted} />
                    <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
                      To: {order.deliveryAddress}
                    </Text>
                  </View>
                </View>

                {(order.finalPrice || order.offeredPrice) && (
                  <View style={styles.orderFooter}>
                    <Text style={[styles.orderTotal, { color: colors.primary }]}>
                      {formatNumber(parseFloat(order.offeredPrice || order.finalPrice || '0'))} ETB
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Order Status Sheet for pending orders */}
      {clickedOrderId && (
        <>
          <OrderStatusSheet
            visible={showOrderStatus}
            orderId={clickedOrderId}
            onClose={() => {
              setShowOrderStatus(false);
              setClickedOrderId(null);
              fetchOrders(); // Refresh orders after closing
            }}
          />
          <OrderTrackingSheet
            visible={showTracking}
            orderId={clickedOrderId}
            onClose={() => {
              setShowTracking(false);
              setClickedOrderId(null);
              fetchOrders(); // Refresh orders after closing
            }}
          />
        </>
      )}
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
  },
  ordersList: {
    padding: spacing.lg,
  },
  orderCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  orderDate: {
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
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  orderItems: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  orderRoute: {
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
  },
  orderFooter: {
    marginTop: spacing.sm,
  },
  orderTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});