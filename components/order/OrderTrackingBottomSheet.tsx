import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Linking,
  Modal,
  Animated,
  Dimensions,
  Image // *** NEW: Import Image
} from 'react-native';
import { X, MapPin, Truck, User, Phone, Star, Navigation, ArrowRight } from 'lucide-react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useWebSocketContext } from '@/hooks/WebSocketContext'; // *** NEW: Import WebSocket context
import { orpc } from '@/hooks/orpc';
import { hp, rs, getAvatarSize } from '@/utils/responsive';
import { config } from '@/config/config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderTrackingBottomSheetProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onRouteUpdate?: (route: any) => void;
  onViewFullDetails?: () => void; // NEW: Callback to open full details
}

interface OrderData {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude: string;
  pickupLongitude: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  materials: unknown;
  vehicleType: string;
  driverId?: string | null;
  driver?: {
    id: string;
    name: string;
    phoneNumber: string;
    rating?: number;
    vehicleInfo?: string;
  } | null;
  driverLocation?: {
    latitude: string;
    longitude: string;
  } | null;
}

export function OrderTrackingBottomSheet({ 
  visible, 
  orderId, 
  onClose,
  onRouteUpdate,
  onViewFullDetails // NEW: Add to destructuring
}: OrderTrackingBottomSheetProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { orderUpdate } = useWebSocketContext(); // *** NEW: Get WebSocket order updates
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [translateY] = useState(new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (visible && orderId) {
      fetchOrder();
      // Delay animation slightly for smoother transition
      setTimeout(() => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }).start();
      }, 100);
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const result = await orpc.order.getById({ orderId });
      if (result.success && result.order) {
        const orderData = result.order as any;
        
        // Parse materials if they come as JSON string
        if (orderData.materials && typeof orderData.materials === 'string') {
          try {
            orderData.materials = JSON.parse(orderData.materials);
          } catch (e) {
            console.log('Failed to parse materials:', e);
            orderData.materials = [];
          }
        }
        
        console.log('📦 [OrderTrackingBottomSheet] Order fetched:', {
          orderId: orderData.id,
          status: orderData.status,
          materials: orderData.materials,
          materialsType: typeof orderData.materials,
          materialsIsArray: Array.isArray(orderData.materials),
        });
        
        setOrder(orderData);
        
        // Update route on home map
        if (onRouteUpdate && orderData.driverLocation) {
          const routeData = {
            driver: {
              lat: parseFloat(orderData.driverLocation.latitude),
              lng: parseFloat(orderData.driverLocation.longitude),
            },
            pickup: {
              lat: parseFloat(orderData.pickupLatitude),
              lng: parseFloat(orderData.pickupLongitude),
            },
            delivery: {
              lat: parseFloat(orderData.deliveryLatitude),
              lng: parseFloat(orderData.deliveryLongitude),
            },
          };
          onRouteUpdate(routeData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  // *** NEW: Listen for WebSocket order updates
  useEffect(() => {
    if (orderUpdate && orderUpdate.orderId === orderId) {
      console.log('📥 Received order update via WebSocket:', orderUpdate);
      
      // Update order state with new data from WebSocket
      setOrder(prevOrder => {
        if (!prevOrder) return prevOrder;
        
        return {
          ...prevOrder,
          status: orderUpdate.status,
          driver: orderUpdate.driver ? {
            id: orderUpdate.driver.id,
            name: orderUpdate.driver.name,
            phoneNumber: orderUpdate.driver.phone,
            vehicleInfo: orderUpdate.driver.vehicleInfo,
          } : prevOrder.driver,
          driverLocation: orderUpdate.driverLocation || prevOrder.driverLocation,
        };
      });
      
      // Update route on map if driver location changed
      if (onRouteUpdate && orderUpdate.driverLocation && order) {
        const routeData = {
          driver: {
            lat: parseFloat(orderUpdate.driverLocation.latitude),
            lng: parseFloat(orderUpdate.driverLocation.longitude),
          },
          pickup: {
            lat: parseFloat(order.pickupLatitude),
            lng: parseFloat(order.pickupLongitude),
          },
          delivery: {
            lat: parseFloat(order.deliveryLatitude),
            lng: parseFloat(order.deliveryLongitude),
          },
        };
        onRouteUpdate(routeData);
      }
    }
  }, [orderUpdate, orderId]);

  // *** MODIFIED: Fetch order only on initial load (no more polling)
  useEffect(() => {
    if (!visible || !orderId) return;
    
    // Only fetch once when sheet opens
    fetchOrder();
  }, [visible, orderId]);

  const handleCallDriver = () => {
    if (order?.driver) {
      const phone = (order.driver as any).phoneNumber || (order.driver as any).phone;
      if (phone) {
        Linking.openURL(`tel:${phone}`);
      }
    }
  };

  const handleClose = () => {
    if (onRouteUpdate) {
      onRouteUpdate(null); // Clear route from map
    }
    onClose();
  };

  if (!order && !loading) {
    return null;
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Track Order</Text>
            <Text style={styles.orderNumber}>#{orderId.slice(-6)}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        ) : order ? (
          <>
            {/* Driver Info Card */}
            {order.driver && (
              <View style={styles.driverCard}>
                <View style={styles.driverInfo}>
                  {/* *** NEW: Show profile photo if available, otherwise show initial */}
                  {(order.driver as any).profilePhoto ? (
                    <Image
                      source={{ 
                        uri: `${config.api.uploadsUrl}/${(order.driver as any).profilePhoto}` 
                      }}
                      style={styles.driverAvatar}
                      defaultSource={require('@/assets/images/react-logo.png')}
                    />
                  ) : (
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverInitial}>
                        {order.driver.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{order.driver.name}</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.rating}>{(order.driver.rating ?? 4.5).toFixed(1)}</Text>
                    </View>
                    {order.driver.vehicleInfo && (
                      <Text style={styles.vehicleInfo}>{order.driver.vehicleInfo}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.callButton}
                    onPress={handleCallDriver}
                  >
                    <Phone size={20} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Status Notice */}
            <View style={styles.statusNotice}>
              <Navigation size={16} color={colors.primary} />
              <Text style={styles.statusNoticeText}>
                Driver is on the way. Track location on map above.
              </Text>
            </View>

            {/* Horizontal Route Display */}
            <View style={styles.compactRoute}>
              <View style={styles.compactRoutePoint}>
                <View style={[styles.compactDot, { backgroundColor: '#FF6B35' }]} />
                <View style={styles.compactRouteInfo}>
                  <Text style={styles.compactRouteLabel}>Pickup</Text>
                  <Text style={styles.compactRouteAddress} numberOfLines={1}>
                    {order.pickupAddress.split(',')[0]}
                  </Text>
                </View>
              </View>
              
              <View style={styles.compactRouteArrow}>
                <View style={styles.compactArrowLine} />
              </View>
              
              <View style={styles.compactRoutePoint}>
                <View style={[styles.compactDot, { backgroundColor: '#34C759' }]} />
                <View style={styles.compactRouteInfo}>
                  <Text style={styles.compactRouteLabel}>Delivery</Text>
                  <Text style={styles.compactRouteAddress} numberOfLines={1}>
                    {order.deliveryAddress.split(',')[0]}
                  </Text>
                </View>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Truck size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Vehicle Type</Text>
                  <Text style={styles.detailValue}>
                    {order.vehicleType.charAt(0).toUpperCase() + order.vehicleType.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Materials Section */}
              {(() => {
                let materials = order.materials;
                
                // Parse if string
                if (typeof materials === 'string') {
                  try {
                    materials = JSON.parse(materials);
                  } catch (e) {
                    materials = [];
                  }
                }
                
                // Check if we have materials to display
                if (Array.isArray(materials) && materials.length > 0) {
                  return (
                    <View style={styles.materialsSection}>
                      <Text style={styles.materialsLabel}>📦 Package Contents</Text>
                      <View style={styles.materialTags}>
                        {materials.map((material: string, index: number) => (
                          <View key={index} style={styles.materialTag}>
                            <Text style={styles.materialTagText}>{material}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                }
                return null;
              })()}
            </View>
            
            {/* View Full Details Button */}
            {onViewFullDetails && (
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={onViewFullDetails}
              >
                <Text style={styles.viewDetailsButtonText}>View Full Order Details</Text>
                <ArrowRight size={20} color={colors.surface} />
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SCREEN_HEIGHT * 0.5,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  driverCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: getAvatarSize(),
    height: getAvatarSize(),
    borderRadius: getAvatarSize() / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverInitial: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  rating: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  vehicleInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statusNoticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  compactRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  compactRoutePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  compactRouteInfo: {
    flex: 1,
  },
  compactRouteLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  compactRouteAddress: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  compactRouteArrow: {
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  compactArrowLine: {
    width: 20,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  horizontalRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  routeStep: {
    flex: 1,
    alignItems: 'center',
  },
  routeStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  routeStepLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  routeStepAddress: {
    fontSize: fontSize.xs,
    color: colors.text,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  routeArrow: {
    paddingHorizontal: spacing.xs,
  },
  detailsSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  materialsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  materialsLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  materialsRow: {
    marginTop: spacing.sm,
  },
  materialTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  materialTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  materialTagText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  viewDetailsButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.surface,
  },
});
