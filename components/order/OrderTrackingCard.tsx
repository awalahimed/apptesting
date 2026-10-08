import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Linking,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Phone, ChevronDown, ChevronUp, MapPin, Truck, X, XCircle, CheckCircle } from 'lucide-react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useAlert } from '@/components/shared/CustomAlert';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { orpc } from '@/hooks/orpc';
import { getAvatarSize } from '@/utils/responsive';
import { config } from '@/config/config';
import { formatNumber } from '@/utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderTrackingCardProps {
  orderId: string;
  onRouteUpdate?: (route: any) => void;
  onClose: () => void;
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
    vehicleInfo?: string;
    vehicleImage?: string;
  } | null;
  driverLocation?: {
    latitude: string;
    longitude: string;
  } | null;
}

export function OrderTrackingCard({ 
  orderId, 
  onRouteUpdate,
  onClose
}: OrderTrackingCardProps) {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const styles = createStyles(colors);
  const { orderUpdate } = useWebSocketContext();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [heightAnim] = useState(new Animated.Value(110));
  const [imageError, setImageError] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Memoize fetch function to prevent recreation
  const fetchOrder = useCallback(async () => {
    try {
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
        
        // Only update if data actually changed
        setOrder(prevOrder => {
          const hasChanged = !prevOrder || 
            JSON.stringify(prevOrder) !== JSON.stringify(orderData);
          return hasChanged ? orderData : prevOrder;
        });
        
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
  }, [orderId, onRouteUpdate]);

  // *** NEW: Listen for WebSocket order updates
  useEffect(() => {
    if (orderUpdate && orderUpdate.orderId === orderId) {
      console.log('📥 [OrderTrackingCard] Received order update via WebSocket:', orderUpdate);
      
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
  }, [orderUpdate, orderId, onRouteUpdate, order]);

  // *** MODIFIED: Fetch order only on initial load (no more polling)
  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // *** REMOVED: No more polling interval
    }
  }, [orderId, fetchOrder]);

  // Fetch vehicle images
  const fetchVehicleImages = async (driverId: string) => {
    try {
      setLoadingImages(true);
      const result = await orpc.driverDocuments.getVehicleImages({ driverId });
      setVehicleImages(result.images || []);
    } catch (error) {
      console.error('Failed to fetch vehicle images:', error);
      setVehicleImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: expanded ? 400 : 110,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [expanded]);

  const handleCallDriver = useCallback(() => {
    if (order?.driver) {
      const phone = (order.driver as any).phoneNumber || (order.driver as any).phone;
      if (phone) {
        Linking.openURL(`tel:${phone}`);
      }
    }
  }, [order]);

  const handleCancelOrder = useCallback(async () => {
    if (!order) return;
    
    // Free cancellation for all orders
    const message = 'Are you sure you want to cancel this order?';
    
    showAlert({
      title: 'Cancel Order',
      message,
      buttons: [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await orpc.order.cancel({ orderId });
              showAlert({ title: 'Success', message: result.message || 'Order cancelled successfully' });
              onClose();
            } catch (error: any) {
              const errorMessage = error.message || 'Failed to cancel order';
              
              if (errorMessage.includes('Insufficient balance')) {
                showAlert({
                  title: 'Insufficient Balance',
                  message: errorMessage,
                  buttons: [
                    { text: 'OK', style: 'cancel' },
                    {
                      text: 'Top Up Wallet',
                      onPress: () => {
                        onClose();
                      },
                    },
                  ]
                });
              } else {
                showAlert({ title: 'Error', message: errorMessage });
              }
            }
          },
        },
      ]
    });
  }, [orderId, onClose, order]);

  const handleCompleteOrder = useCallback(async () => {
    showAlert({
      title: 'Complete Order',
      message: 'Confirm that the order has been delivered?',
      buttons: [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Complete', 
          onPress: async () => {
            try {
              const result = await orpc.order.updateOrderStatus({
                orderId,
                status: 'completed'
              });
              
              if (result.success) {
                showAlert({ title: 'Success', message: 'Order completed successfully!' });
                onClose();
              } else {
                showAlert({ title: 'Error', message: 'Failed to complete order' });
              }
            } catch (error: any) {
              console.error('Failed to complete order:', error);
              showAlert({ title: 'Error', message: error?.message || 'Failed to complete order' });
            }
          }
        },
      ]
    });
  }, [orderId, onClose, showAlert]);

  const driverImageUrl = useMemo(() => {
    if (!order?.driver) return null;
    const profilePhoto = (order.driver as any)?.profilePhoto;
    return profilePhoto 
      ? `${config.api.uploadsUrl}/${profilePhoto}`
      : null;
  }, [order]);

  // Get status display info
  const getStatusInfo = () => {
    switch (order?.status) {
      case 'assigned':
        return { text: 'Driver Assigned', color: colors.success, emoji: '✓' };
      case 'on_the_way':
        return { text: 'On The Way', color: colors.primary, emoji: '🚚' };
      case 'delivered':
        return { text: 'Delivered', color: '#34C759', emoji: '📦' };
      case 'completed':
        return { text: 'Completed', color: colors.success, emoji: '✅' };
      case 'pending_approval':
        return { text: 'Pending Approval', color: colors.warning, emoji: '⏳' };
      case 'approved':
      case 'pending':
        return { text: 'Searching Driver', color: colors.primary, emoji: '🔍' };
      case 'has_offers':
        return { text: 'Offers Available', color: colors.primary, emoji: '💰' };
      default:
        return { text: order?.status || 'Unknown', color: colors.textSecondary, emoji: '•' };
    }
  };

  const statusInfo = getStatusInfo();

  if (!order || loading) return null;

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.driverInfo}>
          {driverImageUrl && !imageError ? (
            <Image 
              source={{ uri: driverImageUrl }}
              style={styles.driverAvatar}
              resizeMode="cover"
              onError={(e) => {
                console.log('Failed to load driver image:', driverImageUrl);
                console.log('Error:', e.nativeEvent.error);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Successfully loaded driver image:', driverImageUrl);
              }}
            />
          ) : (
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>
                {order.driver?.name.charAt(0).toUpperCase() || 'D'}
              </Text>
            </View>
          )}
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{order.driver?.name || 'Driver'}</Text>
            {order.driver?.vehicleInfo && (
              <Text style={styles.vehicleInfo}>{order.driver.vehicleInfo}</Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.emoji} {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={handleCallDriver}
          >
            <Phone size={16} color={colors.surface} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={18} color={colors.textSecondary} />
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

          {/* Vehicle Type and Materials - Side by Side */}
          <View style={styles.infoRow}>
            {/* Vehicle Type */}
            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Truck size={14} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>
                  {order.vehicleType.charAt(0).toUpperCase() + order.vehicleType.slice(1)}
                </Text>
              </View>
            </View>

            {/* Materials */}
            {Array.isArray(order.materials) && order.materials.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.detailLabel}>📦 Materials</Text>
                <View style={styles.materialTags}>
                  {order.materials.slice(0, 2).map((material, index) => (
                    <View key={index} style={styles.materialTag}>
                      <Text style={styles.materialTagText}>{material}</Text>
                    </View>
                  ))}
                  {order.materials.length > 2 && (
                    <View style={styles.materialTag}>
                      <Text style={styles.materialTagText}>+{order.materials.length - 2}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtons}>
            {/* View Vehicle Photos Button */}
            {order.driver && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={async () => {
                  if (order.driver?.id) {
                    await fetchVehicleImages(order.driver.id);
                    setShowVehicleModal(true);
                  }
                }}
              >
                <Truck size={16} color={colors.primary} />
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            )}
            
            {/* Cancel Button - Show for non-delivered and non-completed orders */}
            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'delivered' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelOrder}
              >
                <XCircle size={16} color={colors.error} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            {/* Complete Button - Only show when order is delivered */}
            {order.status === 'delivered' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.completeButton]}
                onPress={handleCompleteOrder}
              >
                <CheckCircle size={16} color={colors.success} />
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      
      {/* Vehicle Photo Modal */}
      <Modal
        visible={showVehicleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowVehicleModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vehicle Photos</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowVehicleModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContainer} showsVerticalScrollIndicator={false}>
              {loadingImages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading photos...</Text>
                </View>
              ) : vehicleImages.length > 0 ? (
                vehicleImages.map((img: any) => (
                  <View key={img.id} style={styles.imageItem}>
                    <Image
                      source={{ uri: img.url ? `${config.api.baseUrl}${img.url}` : `${config.api.uploadsUrl}/vehicle_photo/${img.fileName}` }}
                      style={styles.vehicleImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageInfo}>
                      <Text style={[styles.imageType, { color: colors.primary }]}>
                        {img.imageType === 'front' && '🚗 Front View'}
                        {img.imageType === 'back' && '🚙 Back View'}
                        {img.imageType === 'side' && '🚐 Side View'}
                        {img.imageType === 'interior' && '🪑 Interior'}
                        {img.imageType === 'other' && '📷 Other'}
                      </Text>
                      {img.description && (
                        <Text style={[styles.imageDescription, { color: colors.textSecondary }]}>
                          {img.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noImage}>
                  <Truck size={64} color={colors.textSecondary} />
                  <Text style={styles.noImageText}>No photos available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
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
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  vehicleImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    backgroundColor: colors.border,
  },
  driverInitial: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
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
  closeButton: {
    width: 32,
    height: 32,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  compactRoutePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: spacing.xs,
  },
  viewButton: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  viewButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  fullWidthButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  completeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScrollContainer: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalClose: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  imageItem: {
    marginBottom: spacing.lg,
  },
  imageInfo: {
    marginTop: spacing.sm,
  },
  imageType: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  imageDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  noImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
