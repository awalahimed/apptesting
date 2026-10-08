import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Package, Clock, Truck, CheckCircle, MapPin } from 'lucide-react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { orpc } from '@/hooks/orpc';
import { OrderStatusSheet } from '@/components/order/OrderStatusSheet-redesign';
import { OrderSkeleton } from '@/components/shared/OrderSkeleton';

interface DeliveryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedOrder?: string | null;
  onOrderSelect: (orderId: string) => void;
  onBackToList: () => void;
}

interface Order {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  materials: unknown;
  createdAt: string | Date;
  finalPrice?: string | null;
}

const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const orderDate = new Date(date);
  const diffMs = now.getTime() - orderDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
};

export const DeliveryBottomSheet: React.FC<DeliveryBottomSheetProps> = ({
  visible,
  onClose,
  selectedOrder,
  onOrderSelect,
}) => {
  const { colors,_ } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [clickedOrderId, setClickedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchOrders();
    }
  }, [visible]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await orpc.order.getMyOrders();
      if (result.success && result.orders) {
        // *** FIXED: Filter out cancelled, rejected, and completed orders (keep delivered for customer to complete)
        const visible = result.orders
          .filter((o: any) =>
            !['cancelled', 'rejected', 'completed', 'Delivered'].includes(o?.status)
          )
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(visible);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order: Order) => {
    setClickedOrderId(order.id);
    // Show order status sheet for orders that need user action
    if (['pending_approval', 'approved', 'has_offers', 'rejected'].includes(order.status)) {
      setShowOrderStatus(true);
    } else if (['assigned', 'on_the_way', 'delivered'].includes(order.status)) {
      onOrderSelect(order.id); // This will trigger tracking
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock size={16} color={colors.warning} />;
      case 'rejected':
        return <X size={16} color={colors.error} />;
      case 'approved':
      case 'has_offers':
        return <Package size={16} color={colors.info} />;
      case 'assigned':
      case 'on_the_way':
        return <Truck size={16} color={colors.primary} />;
      case 'delivered':
      case 'completed':
        return <CheckCircle size={16} color={colors.success} />;
      default:
        return <Package size={16} color={colors.textMuted} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Waiting for Approval';
      case 'rejected':
        return 'Rejected';
      case 'approved':
        return 'Approved';
      case 'has_offers':
        return 'Has Offers';
      case 'assigned':
        return 'Assigned';
      case 'on_the_way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      default:
        return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return colors.warning;
      case 'rejected':
        return colors.error;
      case 'approved':
      case 'has_offers':
        return colors.info;
      case 'assigned':
      case 'on_the_way':
        return colors.primary;
      case 'delivered':
      case 'completed':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  if (!visible) return null;

  const isOrderSelected = !!selectedOrder;
  const currentOrder = orders.find(order => order.id === selectedOrder);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={[styles.container, isOrderSelected && styles.containerSmall, { backgroundColor: colors.background }]}>
        {!isOrderSelected && (
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>Delivery Orders</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {isOrderSelected && (
          <View style={styles.minimalHeader}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <OrderSkeleton />
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No orders yet</Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>Your orders will appear here</Text>
            </View>
          ) : (
            orders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderItem}
                onPress={() => handleOrderClick(order)}
              >
                <View style={[styles.orderIcon, { backgroundColor: colors.primaryLight }]}>
                  {getStatusIcon(order.status)}
                </View>
                
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderTitle, { color: colors.text }]}>Order #{order.id.slice(-6)}</Text>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    {formatTimeAgo(order.createdAt)}
                  </Text>
                  
                  <View style={styles.orderDetailsRow}>
                    <View style={styles.detailItem}>
                      <MapPin size={14} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
                        {order.pickupAddress}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <MapPin size={14} color={colors.textMuted} /> 
                    <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
                      {order.deliveryAddress}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderRight}>
                  {order.finalPrice && (
                    <Text style={[styles.price, { color: colors.text }]}>ETB {order.finalPrice}</Text>
                  )}
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '20' }
                  ]}>
                    {getStatusIcon(order.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.viewButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleOrderClick(order)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Order Status Sheet for pending orders */}
        {clickedOrderId && showOrderStatus && (
          <OrderStatusSheet
            visible={showOrderStatus}
            orderId={clickedOrderId}
            onClose={() => {
              setShowOrderStatus(false);
              setClickedOrderId(null);
              fetchOrders(); // Refresh orders after closing
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  containerSmall: {
    height: '15%',
  },
  minimalHeader: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs / 2,
  },
  restaurant: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  orderDetails: {
    gap: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.xs,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderMain: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  pickupDot: {
    backgroundColor: '#FF6B35',
  },
  deliveryDot: {
    backgroundColor: '#34C759',
  },
  orderDetailsRow: {
    marginTop: spacing.xs,
  },
  orderDate: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
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
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});