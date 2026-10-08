import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Linking,
  Dimensions,
  Image
} from 'react-native';
import { Phone, ChevronDown, ChevronUp, MapPin, Truck, Navigation, Play, CheckCircle, Package } from 'lucide-react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useAlert } from '@/components/shared/CustomAlert';
import { orpc } from '@/hooks/orpc';
import { config } from '@/config/config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DriverAssignedOrderCardProps {
  order: any;
  onRouteUpdate?: (route: any) => void;
  onClose?: () => void;
}

export function DriverAssignedOrderCard({ 
  order: initialOrder, 
  onRouteUpdate,
  onClose 
}: DriverAssignedOrderCardProps) {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const styles = createStyles(colors);
  const [order, setOrder] = useState(initialOrder);
  const [expanded, setExpanded] = useState(false);
  const [heightAnim] = useState(new Animated.Value(110));

  // Update order when prop changes - only if data actually changed
  useEffect(() => {
    if (!initialOrder) return;
    
    // Only update if data actually changed
    const hasChanged = !order || 
      order.id !== initialOrder.id ||
      order.customerName !== initialOrder.customerName ||
      order.customerPhone !== initialOrder.customerPhone ||
      order.pickupAddress !== initialOrder.pickupAddress ||
      order.deliveryAddress !== initialOrder.deliveryAddress ||
      order.status !== initialOrder.status;
    
    if (hasChanged) {
      setOrder(initialOrder);
    }
  }, [initialOrder]);

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: expanded ? 400 : 110,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [expanded]);

  const handleCallCustomer = useCallback(() => {
    if (order?.customerPhone) {
      Linking.openURL(`tel:${order.customerPhone}`);
    } else {
      showAlert({
        title: 'No Phone',
        message: 'Customer phone number not available',
      });
    }
  }, [order?.customerPhone, showAlert]);

  const handleStartDelivery = useCallback(async () => {
    showAlert({
      title: 'Start Delivery',
      message: 'Are you ready to start the delivery?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              const result = await orpc.order.updateOrderStatus({
                orderId: order.id,
                status: 'on_the_way'
              });
              
              if (result.success) {
                showAlert({ title: 'Success', message: 'Delivery started!' });
                setOrder({ ...order, status: 'on_the_way' });
              } else {
                showAlert({ title: 'Error', message: 'Customer confirmation is needed before you can start' });
              }
            } catch (error: any) {
              console.error('Failed to start delivery:', error);
              showAlert({ title: 'Error', message: 'Customer confirmation is needed before you can start' });
            }
          }
        }
      ]
    });
  }, [order, showAlert]);

  const handleMarkDelivered = useCallback(async () => {
    showAlert({
      title: 'Mark as Delivered',
      message: 'Confirm that you have delivered the order?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delivered',
          onPress: async () => {
            try {
              const result = await orpc.order.updateOrderStatus({
                orderId: order.id,
                status: 'delivered'
              });
              
              if (result.success) {
                showAlert({ title: 'Success', message: 'Order marked as delivered! Waiting for customer confirmation.' });
                setOrder({ ...order, status: 'delivered' });
              } else {
                showAlert({ title: 'Error', message: 'Failed to mark as delivered' });
              }
            } catch (error: any) {
              console.error('Failed to mark as delivered:', error);
              showAlert({ title: 'Error', message: error?.message || 'Failed to mark as delivered' });
            }
          }
        }
      ]
    });
  }, [order, showAlert]);

  const customerName = useMemo(() => order?.customerName || 'Customer', [order?.customerName]);
  const customerInitial = useMemo(() => customerName.charAt(0).toUpperCase(), [customerName]);
  
  const customerImageUrl = useMemo(() => {
    if (!order?.customerProfilePhoto) return null;
    return `${config.api.uploadsUrl}/${order.customerProfilePhoto}`;
  }, [order?.customerProfilePhoto]);
  
  // Parse materials if they come as JSON string
  const parsedMaterials = useMemo(() => {
    if (!order?.materials) return [];
    try {
      if (typeof order.materials === 'string') {
        return JSON.parse(order.materials);
      } else if (Array.isArray(order.materials)) {
        return order.materials;
      }
    } catch (error) {
      console.log('Failed to parse materials:', error);
    }
    return [];
  }, [order?.materials]);

  if (!order) return null;

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.customerInfo}>
          {/* *** NEW: Show customer profile photo if available */}
          {customerImageUrl ? (
            <Image 
              source={{ uri: customerImageUrl }}
              style={styles.customerAvatar}
              resizeMode="cover"
              onError={() => {
                console.log('Failed to load customer image:', customerImageUrl);
              }}
            />
          ) : (
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>{customerInitial}</Text>
            </View>
          )}
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customerName}</Text>
            <View style={styles.vehicleAndMaterialsRow}>
              <View style={styles.vehicleTypeBadge}>
                <Truck size={12} color={colors.primary} />
                <Text style={styles.vehicleTypeText}>
                  {order.vehicleType?.charAt(0).toUpperCase() + order.vehicleType?.slice(1)}
                </Text>
              </View>
              {parsedMaterials.length > 0 && (
                <View style={styles.materialsBadge}>
                  <Package size={10} color={colors.textSecondary} />
                  <Text style={styles.materialsText} numberOfLines={1}>
                    {parsedMaterials.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={handleCallCustomer}
          >
            <Phone size={16} color={colors.surface} />
          </TouchableOpacity>
          
          <View style={styles.expandButton}>
            {expanded ? (
              <ChevronDown size={18} color={colors.textSecondary} />
            ) : (
              <ChevronUp size={18} color={colors.textSecondary} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Compact Horizontal Route */}
          <View style={styles.compactRoute}>
            <View style={styles.compactRouteItem}>
              <View style={[styles.compactDot, { backgroundColor: '#FF6B35' }]} />
              <View style={styles.compactRouteText}>
                <Text style={styles.compactRouteLabel}>Pickup</Text>
                <Text style={styles.compactRouteAddress} numberOfLines={2}>
                  {order.pickupAddress}
                </Text>
              </View>
            </View>
            
            <View style={styles.compactRouteItem}>
              <View style={[styles.compactDot, { backgroundColor: '#34C759' }]} />
              <View style={styles.compactRouteText}>
                <Text style={styles.compactRouteLabel}>Delivery</Text>
                <Text style={styles.compactRouteAddress} numberOfLines={2}>
                  {order.deliveryAddress}
                </Text>
              </View>
            </View>
          </View>

          {order.notes && (
            <View style={styles.notesRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{order.notes}</Text>
            </View>
          )}

          {/* *** NEW: Action buttons based on order status */}
          <View style={styles.actionButtons}>
            {order.status === 'assigned' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.startButton]}
                onPress={handleStartDelivery}
              >
                <Play size={16} color={colors.surface} fill={colors.surface} />
                <Text style={styles.startButtonText}>Start Delivery</Text>
              </TouchableOpacity>
            )}
            
            {order.status === 'on_the_way' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.deliveredButton]}
                onPress={handleMarkDelivered}
              >
                <CheckCircle size={16} color={colors.surface} />
                <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}

            {order.status === 'delivered' && (
              <View style={styles.waitingNotice}>
                <Text style={styles.waitingNoticeText}>
                  ⏳ Waiting for customer to confirm completion
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  customerInitial: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  vehicleAndMaterialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vehicleTypeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  materialsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 150,
  },
  materialsText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  compactRoute: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  compactRouteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  compactRouteText: {
    flex: 1,
  },
  compactRouteLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  compactRouteAddress: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  materialsRow: {
    marginTop: spacing.xs,
  },
  materialTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  materialTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  materialTagText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  notesRow: {
    marginTop: spacing.xs,
  },
  actionButtons: {
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  startButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.surface,
  },
  deliveredButton: {
    backgroundColor: colors.success,
  },
  deliveredButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.surface,
  },
  waitingNotice: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  waitingNoticeText: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
});
