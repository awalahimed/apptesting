import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAlert } from '@/components/shared/CustomAlert';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Truck, Car, Bike, User, Phone, WifiOff, Clock, Maximize2 } from 'lucide-react-native';
import { config } from '@/config/config';
import { formatNumber } from '@/utils/formatters';
import { spacing, fontSize, fontWeight, colors } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { orpc } from '@/hooks/orpc';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { router } from 'expo-router';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const STATUS_CONFIG = {
  pending_approval: { title: 'Waiting for Approval', icon: Clock, color: colors.warning },
  searching: { title: 'Searching for Driver', icon: Truck, color: colors.primary },
  offers: { title: 'Driver Offers', icon: Car, color: colors.success },
  assigned: { title: 'Driver Assigned', icon: Truck, color: colors.primary },
  on_the_way: { title: 'On The Way', icon: Truck, color: colors.primary },
  delivered: { title: 'Delivered', icon: Truck, color: colors.success },
  completed: { title: 'Completed', icon: Truck, color: colors.success },
};

interface OrderData {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  materials: unknown;
  vehicleType: string;
  createdAt?: string | Date;
  estimatedPrice?: string | null;
  driverId?: string | null;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
    vehicleInfo: string;
    vehicleImage?: string;
    image?: string;
  } | null;
}

interface DriverOffer {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string | null;
  driverImage?: string | null;
  vehicleInfo: string;
  vehicleType?: string;
  vehicleImage?: string | null;
  plateNumber?: string;
  offeredPrice: string;
  createdAt: Date;
}

interface OrderStatusSheetProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatTime = (minutes: number | null): string => {
  if (minutes == null || minutes < 1) return 'Just now';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs <= 0) return `${mins} min ago`;
  return `${hrs}h ${mins}m ago`;
};

const getVehicleIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'truck': return <Truck size={14} color={colors.textSecondary} />;
    case 'car': return <Car size={14} color={colors.textSecondary} />;
    case 'motorcycle': case 'bike': return <Bike size={14} color={colors.textSecondary} />;
    default: return <Truck size={14} color={colors.textSecondary} />;
  }
};

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

const BroadcastWaves = ({ colors: themeColors }: { colors: any }) => {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const wave4 = useRef(new Animated.Value(0)).current;
  const wave5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWave = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createWave(wave1, 0),
      createWave(wave2, 200),
      createWave(wave3, 400),
      createWave(wave4, 600),
      createWave(wave5, 800),
    ];

    animations.forEach(anim => anim.start());
    return () => animations.forEach(anim => anim.stop());
  }, []);

  const getWaveStyle = (animValue: Animated.Value) => ({
    transform: [{
      scaleY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1.3],
      }),
    }],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  });

  return (
    <View style={styles.wavesContainer}>
      <Animated.View style={[styles.wave, getWaveStyle(wave1)]} />
      <Animated.View style={[styles.wave, getWaveStyle(wave2)]} />
      <Animated.View style={[styles.wave, getWaveStyle(wave3)]} />
      <Animated.View style={[styles.wave, getWaveStyle(wave4)]} />
      <Animated.View style={[styles.wave, getWaveStyle(wave5)]} />
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrderStatusSheet({ visible, orderId, onClose }: OrderStatusSheetProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [status, setStatus] = useState<string>('searching');
  const [minutesSince, setMinutesSince] = useState<number | null>(null);
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [vehicleImages, setVehicleImages] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { orpcClient, connected, reconnectAttempts, websocket } = useWebSocketContext();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch wallet balance
  useEffect(() => {
    if (!visible) return;
    
    const fetchWalletBalance = async () => {
      try {
        const result = await orpc.wallet.get();
        if (result.wallet) {
          setWalletBalance(parseFloat(result.wallet.balance));
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };

    fetchWalletBalance();
  }, [visible]);

  // Fetch order data
  useEffect(() => {
    if (!visible || !orderId) return;

    const fetchOrder = async () => {
      try {
        const result = await orpc.order.getById({ orderId });
        if (result.success) {
          setOrder(result.order);
          updateStatusFromOrder(result.order.status);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      }
    };

    fetchOrder();
  }, [visible, orderId]);

  // Fetch offers when needed
  const fetchOffers = async () => {
    if (!orderId) return;
    try {
      const result = await orpc.order.getOrderOffers({ orderId });
      if (result.success && result.offers && result.offers.length > 0) {
        setOffers(result.offers);
        setStatus('offers');
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    }
  };

  // Update status based on order state
  const updateStatusFromOrder = (orderStatus: string) => {
    switch (orderStatus) {
      case 'pending_approval':
        setStatus('pending_approval');
        break;
      case 'approved':
      case 'pending':
      case 'has_offers':
        fetchOffers();
        setStatus('searching');
        break;
      case 'assigned':
      case 'on_the_way':
      case 'delivered':
      case 'completed':
        setStatus(orderStatus);
        break;
      default:
        setStatus('searching');
    }
  };

  // Fetch vehicle images
  const fetchVehicleImages = async (driverId: string) => {
    try {
      setLoadingImages(true);
      const result = await orpc.driverDocuments.getVehicleImages({ driverId });
      setVehicleImages(result.images || []);
      setSelectedImageIndex(0);
    } catch (error) {
      console.error('Failed to fetch vehicle images:', error);
      setVehicleImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  // WebSocket updates
  useEffect(() => {
    if (!connected || !orpcClient?.customer?.subscribeToOrderUpdates || !orderId) return;

    const subscribe = async () => {
      try {
        await orpcClient.customer.subscribeToOrderUpdates({ orderId });
      } catch (error) {
        console.log('WebSocket subscription error:', error);
      }
    };

    subscribe();

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_offer' && message.orderId === orderId) {
          setOffers(prev => [...prev, message.offer]);
          setStatus('offers');
        } else if (message.type === 'offer_removed' && message.orderId === orderId) {
          const updated = offers.filter(offer => offer.id !== message.offerId);
          setOffers(updated);
          if (updated.length === 0) setStatus('searching');
        } else if (message.type === 'order_update' && message.orderId === orderId) {
          setOrder(prev => {
            if (!prev) return null;
            return {
              ...prev,
              status: message.status,
              driverId: message.driverId || prev.driverId,
              driver: message.driver || prev.driver,
            };
          });
          updateStatusFromOrder(message.status);
        }
      } catch (error) {
        console.log('Error parsing websocket message:', error);
      }
    };

    if (websocket) {
      websocket.addEventListener('message', handleMessage);
    }

    return () => {
      const unsubscribe = async () => {
        try {
          if (orpcClient?.customer?.unsubscribeFromOrderUpdates) {
            await orpcClient.customer.unsubscribeFromOrderUpdates({ orderId });
          }
        } catch (error) {
          console.log('WebSocket unsubscribe error:', error);
        }
      };
      
      unsubscribe();
      
      if (websocket) {
        websocket.removeEventListener('message', handleMessage);
      }
    };
  }, [connected, orpcClient, orderId, websocket, offers]);

  // Update time since created
  useEffect(() => {
    if (!visible || !order?.createdAt) return;

    const update = () => {
      const createdMs = new Date(order.createdAt!).getTime();
      if (Number.isNaN(createdMs)) return;
      const minutes = Math.max(0, Math.floor((Date.now() - createdMs) / 60000));
      setMinutesSince(minutes);
    };

    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [visible, order?.createdAt]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCancelOrder = async () => {
    if (!order) return;
    
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await orpc.order.cancel({ orderId });
              Alert.alert('Success', result.message || 'Order cancelled successfully');
              onClose();
              router.replace('/(tabs)/user/home');
            } catch (error: any) {
              const errorMessage = error.message || 'Failed to cancel order';
              
              if (errorMessage.includes('Insufficient balance')) {
                Alert.alert(
                  'Insufficient Balance',
                  errorMessage,
                  [
                    { text: 'OK', style: 'cancel' },
                    {
                      text: 'Top Up Wallet',
                      onPress: () => {
                        onClose();
                        router.push('/(tabs)/user/wallet');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', errorMessage);
              }
            }
          },
        },
      ]
    );
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      let res;
      if (orpcClient?.customer?.acceptOffer) {
        res = await orpcClient.customer.acceptOffer({ offerId });
      } else {
        res = await orpc.order.acceptOffer({ offerId });
      }
      
      if (!res.success) throw new Error('Failed to accept offer');
      
      Alert.alert('Success', 'Driver assigned!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error: any) {
      console.log('[handleAcceptOffer] Error:', error);
      
      let errorMessage = '';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'Failed to accept offer';
      }
      
      if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
        const message = errorMessage.replace('INSUFFICIENT_BALANCE:', '').trim();
        Alert.alert(
          'Insufficient Balance',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Top Up Wallet',
              onPress: () => {
                onClose();
                router.push('/(tabs)/user/wallet');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.handle} />
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <X size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Order Details</Text>
      
      {/* Route Display */}
      <View style={styles.horizontalRoute}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: colors.warning }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {order?.pickupAddress.replace(/[\/\-]+/g, ' ').trim()}
            </Text>
          </View>
        </View>
        
        <View style={styles.routeArrow}>
          <View style={styles.arrowLine} />
        </View>
        
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Delivery</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {order?.deliveryAddress.replace(/[\/\-]+/g, ' ').trim()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Meta Info */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Truck size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {order?.vehicleType.charAt(0).toUpperCase() + order?.vehicleType.slice(1)}
          </Text>
        </View>
        {Array.isArray(order?.materials) && order.materials.length > 0 && (
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>
              {order.materials.length} item{order.materials.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStatusContent = () => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.searching;
    const Icon = config.icon;

    switch (status) {
      case 'pending_approval':
        return (
          <View style={styles.searchingState}>
            <View style={styles.pendingIcon}>
              <Icon size={64} color={colors.warning} />
            </View>
            <Text style={styles.searchingTitle}>Waiting for Approval</Text>
            <Text style={styles.searchingSubtitle}>
              Your order is being reviewed by our team
            </Text>
            {!connected && (
              <View style={styles.offlineBanner}>
                <WifiOff size={16} color={colors.warning} />
                <Text style={styles.offlineText}>Reconnecting...</Text>
              </View>
            )}
            {minutesSince !== null && (
              <Text style={styles.timeText}>{formatTime(minutesSince)}</Text>
            )}
          </View>
        );

      case 'searching':
        return (
          <View style={styles.searchingState}>
            <BroadcastWaves colors={colors} />
            <Text style={styles.searchingTitle}>Searching for Driver</Text>
            <Text style={styles.searchingSubtitle}>
              Broadcasting to nearby drivers...
            </Text>
            {!connected && (
              <View style={styles.offlineBanner}>
                <WifiOff size={16} color={colors.warning} />
                <Text style={styles.offlineText}>
                  {reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts}/5)` : 'Offline'}
                </Text>
              </View>
            )}
            <Text style={styles.timeText}>{formatTime(minutesSince)}</Text>
          </View>
        );

      case 'offers':
        return renderOffers();

      case 'assigned':
      case 'on_the_way':
      case 'delivered':
      case 'completed':
        return renderDriverInfo();

      default:
        return null;
    }
  };

  const renderOffers = () => {
    if (offers.length === 0) return null;

    return (
      <View style={styles.offersState}>
        <Text style={styles.offersTitle}>
          {offers.length} Driver{offers.length > 1 ? 's' : ''} Available
        </Text>
        {offers.map((offer) => {
          const vehicleType = offer.vehicleInfo?.split(' - ')[0] || 'Vehicle';
          const offerPrice = parseFloat(offer.offeredPrice);
          const platformFee = offerPrice * 0.07;
          const hasInsufficientBalance = walletBalance !== null && walletBalance < platformFee;

          return (
            <TouchableOpacity
              key={offer.id}
              style={styles.offerCard}
              activeOpacity={0.7}
            >
              <View style={styles.offerContent}>
                <View style={styles.offerAvatar}>
                  {offer.driverImage ? (
                    <Image
                      source={{ uri: `${config.api.uploadsUrl}/${offer.driverImage}` }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <User size={28} color={colors.primary} />
                  )}
                </View>
                
                <View style={styles.offerInfo}>
                  <Text style={styles.offerName}>{offer.driverName}</Text>
                  <View style={styles.vehicleRow}>
                    {getVehicleIcon(vehicleType)}
                    <Text style={styles.offerVehicle}>
                      {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.offerPrice}>
                  <Text style={styles.priceAmount}>{formatNumber(offerPrice)}</Text>
                  <Text style={styles.priceCurrency}>ETB</Text>
                </View>
                <Text style={styles.cashPaymentNote}>Pay driver in cash</Text>
              </View>
              
              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={async () => {
                    setSelectedDriver(offer);
                    setShowVehicleModal(true);
                    if (offer.driverId) {
                      await fetchVehicleImages(offer.driverId);
                    }
                  }}
                >
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
                
                {hasInsufficientBalance ? (
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: colors.warning }]}
                    onPress={() => {
                      Alert.alert(
                        'Insufficient Balance',
                        `You need ${formatNumber(platformFee)} ETB platform fee but have ${formatNumber(walletBalance || 0)} ETB available. Please top up your wallet.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Top Up Wallet',
                            onPress: () => {
                              onClose();
                              router.push('/(tabs)/user/wallet');
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.acceptBtnText}>Top Up</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptOffer(offer.id)}
                  >
                    <Text style={styles.acceptBtnText}>
                      Accept ({formatNumber(platformFee)} ETB Fee)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderDriverInfo = () => {
    if (!order?.driver) return null;

    const badgeColors = {
      assigned: { bg: colors.primary + '20', border: colors.primary, text: colors.primary },
      on_the_way: { bg: colors.primary + '20', border: colors.primary, text: colors.primary },
      delivered: { bg: colors.success + '20', border: colors.success, text: colors.success },
      completed: { bg: colors.success + '20', border: colors.success, text: colors.success },
    };

    const badgeColor = badgeColors[status as keyof typeof badgeColors] || badgeColors.assigned;

    return (
      <View style={styles.assignedState}>
        <View style={[styles.assignedBadge, { backgroundColor: badgeColor.bg, borderColor: badgeColor.border }]}>
          <Text style={[styles.assignedBadgeText, { color: badgeColor.text }]}>
            {status === 'assigned' && '✓ Driver Assigned'}
            {status === 'on_the_way' && '🚚 On The Way'}
            {status === 'delivered' && '📦 Delivered'}
            {status === 'completed' && '✅ Completed'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.driverCard, { borderColor: badgeColor.border }]}
          onPress={async () => {
            setSelectedDriver(order.driver);
            setShowVehicleModal(true);
            if (order.driver?.id) {
              await fetchVehicleImages(order.driver.id);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.driverContent}>
            <View style={styles.driverAvatar}>
              {order.driver.image ? (
                <Image
                  source={{ uri: `${config.api.uploadsUrl}/${order.driver.image}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <User size={32} color={colors.primary} />
              )}
            </View>
            
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <Text style={styles.driverVehicle}>{order.driver.vehicleInfo}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.callBtn}
              onPress={(e) => {
                e.stopPropagation();
                // Call driver
              }}
            >
              <Phone size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tapHint}>Tap to view vehicle photo</Text>
        </TouchableOpacity>
        
        {/* Cancel Button */}
        <TouchableOpacity style={styles.inlineCancelBtn} onPress={handleCancelOrder}>
          <Text style={styles.inlineCancelBtnText}>Cancel Order</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    const cancellableStatuses = ['pending_approval', 'searching', 'offers', 'assigned', 'on_the_way'];
    
    if (!cancellableStatuses.includes(status)) return null;

    return (
      <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  const renderVehicleModal = () => (
    <Modal
      visible={showVehicleModal}
      transparent={!isFullscreen}
      animationType="fade"
      onRequestClose={() => {
        setShowVehicleModal(false);
        setIsFullscreen(false);
      }}
    >
      {isFullscreen ? (
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setIsFullscreen(false)}
          >
            <X size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          {loadingImages ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : vehicleImages.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ width: Dimensions.get('window').width }}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                setSelectedImageIndex(index);
              }}
            >
              {vehicleImages.map((img: any, index: number) => (
                <View key={img.id} style={[styles.fullscreenImageContainer, { width: Dimensions.get('window').width }]}>
                  <Image
                    source={{ uri: img.url ? `${config.api.baseUrl}${img.url}` : `${config.api.uploadsUrl}/vehicle_photo/${img.fileName}` }}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noImage}>
              <Truck size={64} color="#FFFFFF" />
              <Text style={[styles.noImageText, { color: '#FFFFFF' }]}>No photos available</Text>
            </View>
          )}
          
          {vehicleImages.length > 0 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedImageIndex + 1} / {vehicleImages.length}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowVehicleModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vehicle Photos</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.fullscreenBtn}
                  onPress={() => setIsFullscreen(true)}
                >
                  <Maximize2 size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowVehicleModal(false)}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalScrollContainer}>
              {loadingImages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading photos...</Text>
                </View>
              ) : vehicleImages.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {vehicleImages.map((img: any, index: number) => (
                    <View key={img.id} style={styles.imageItem}>
                      <Image
                        source={{ uri: img.url ? `${config.api.baseUrl}${img.url}` : `${config.api.uploadsUrl}/vehicle_photo/${img.fileName}` }}
                        style={styles.vehicleImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageInfo}>
                        <View style={styles.imageTypeRow}>
                          <Text style={[styles.imageType, { color: colors.primary }]}>
                            {img.imageType === 'front' && 'Front View'}
                            {img.imageType === 'back' && 'Back View'}
                            {img.imageType === 'side' && 'Side View'}
                            {img.imageType === 'interior' && 'Interior'}
                            {img.imageType === 'other' && 'Other'}
                          </Text>
                        </View>
                        {img.description && (
                          <Text style={[styles.imageDescription, { color: colors.textSecondary }]}>
                            {img.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noImage}>
                  <Truck size={64} color={colors.textSecondary} />
                  <Text style={styles.noImageText}>No photos available</Text>
                </View>
              )}
            </View>
            
            {selectedDriver && (
              <View style={styles.modalFooter}>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalDriverName}>
                    {selectedDriver.driverName || selectedDriver.name}
                  </Text>
                  <Text style={styles.modalVehicleInfo}>
                    {selectedDriver.vehicleInfo}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </Modal>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!order) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {renderStatusContent()}
        </ScrollView>
        
        {renderFooter()}
      </View>
      
      {renderVehicleModal()}
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  horizontalRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
  routeArrow: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLine: {
    width: 24,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
  },
  searchingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl * 1.5,
    minHeight: 400,
  },
  pendingIcon: {
    marginBottom: spacing.xl * 1.5,
    padding: spacing.lg,
    backgroundColor: colors.warning + '10',
    borderRadius: 60,
  },
  searchingTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  searchingSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  offlineText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.md,
  },
  offersState: {
    padding: spacing.xl,
  },
  offersTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  offerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  offerInfo: {
    flex: 1,
  },
  offerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  offerVehicle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  offerPrice: {
    alignItems: 'flex-end',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  priceAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  priceCurrency: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  cashPaymentNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  offerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewBtnText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  assignedState: {
    padding: spacing.xl,
  },
  assignedBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  assignedBadgeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success,
    letterSpacing: 0.5,
  },
  driverCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  driverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  driverAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  driverVehicle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  callBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tapHint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  inlineCancelBtn: {
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  inlineCancelBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  footerSafeArea: {
    backgroundColor: colors.surface,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelBtn: {
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.error + '40',
  },
  cancelBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.error,
    letterSpacing: 0.3,
  },
});
