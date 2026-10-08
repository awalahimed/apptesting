import React, { useState, useEffect, useMemo } from 'react';
import { useAlert } from '@/components/shared/CustomAlert';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopBar } from '@/components/user/TopBar';
import { DeliveryBottomSheet } from '@/components/user/DeliveryBottomSheet';
import { OrderBottomSheet } from '@/components/order/OrderBottomSheet';
import { OrderTrackingCard } from '@/components/order/OrderTrackingCard';
import { OrderStatusSheet } from '@/components/order/OrderStatusSheet-redesign';
import { WalletTutorialModal } from '@/components/tutorial/WalletTutorialModal';
import { SimpleTutorial } from '@/components/tutorial/SimpleTutorial';
import { useSidebar } from '@/components/user/SidebarContext';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { MapComponent } from '@/components/shared/MapComponent';
import { ShoppingBag, Truck } from 'lucide-react-native';
import { useAuth } from '@/hooks/AuthContext';
import { userRoles } from '@/constants/userRoles';
import { orpc } from '@/hooks/orpc';

interface Order {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude: string;
  pickupLongitude: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  materials: unknown;
  createdAt: string | Date;
  finalPrice?: string | null;
}

function UserHome() {
  const { session, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [showOrderFlow, setShowOrderFlow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [trackingRoute, setTrackingRoute] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [clickedOrderId, setClickedOrderId] = useState<string | null>(null);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const { isSidebarVisible } = useSidebar();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const tutorialSteps = [
    {
      target: 'topBar',
      title: 'Menu & Notifications',
      description: 'Access your profile, settings, and notifications from the top bar.',
    },
    {
      target: 'orderButtons',
      title: 'Place Orders',
      description: 'Use these buttons to place delivery or shopping orders.',
    },
    {
      target: 'wallet',
      title: 'Your Wallet',
      description: 'Manage your balance and transactions in the wallet section.',
    },
  ];

  // Check if tutorial should be shown
  useEffect(() => {
    const checkTutorial = async () => {
      const hasSeenTutorial = await AsyncStorage.getItem('user_home_tutorial');
      if (!hasSeenTutorial && session?.user) {
        setShowWalletModal(true);
      }
    };
    checkTutorial();
  }, [session]);

  const handleCreateWallet = async () => {
    setShowWalletModal(false);
    await AsyncStorage.setItem('user_home_tutorial', 'true');
    setTimeout(() => setShowTutorial(true), 500);
  };

  const handleStartTutorial = async () => {
    try {
      const result = await orpc.wallet.get();
      if (result.wallet) {
        await AsyncStorage.setItem('user_home_tutorial', 'true');
        setShowTutorial(true);
      } else {
        setShowWalletModal(true);
      }
    } catch (error) {
      setShowWalletModal(true);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    router.push('/(tabs)/user/wallet');
  };

  // Expose tutorial trigger globally
  useEffect(() => {
    (global as any).startUserTutorial = handleStartTutorial;
    return () => {
      delete (global as any).startUserTutorial;
    };
  }, []);
  useEffect(() => {
    if (isLoading) return;
    
    if (!session?.user) {
      router.replace('/auth/login');
      return;
    }
    
    const role = session.user.role;
    if (role !== userRoles.OWNER_SHOP) {
      if (role === userRoles.DRIVER) {
        router.replace('/(tabs)/driver/home');
      } else {
        router.replace('/auth/role-selection');
      }
    }
  }, [session, isLoading]);

  // Fetch orders to show on map
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const result = await orpc.order.getMyOrders();
      if (result.success && result.orders) {
        // Show all active orders (not cancelled, rejected, or completed)
        const activeOrders = result.orders.filter((o: any) =>
          !['cancelled', 'rejected', 'completed'].includes(o?.status)
        );
        setOrders(activeOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch orders when screen loads
  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session]);

  // Fetch routes for all orders
  useEffect(() => {
    if (orders.length > 0) {
      fetchAllRoutes();
    }
  }, [orders]);

  const fetchAllRoutes = async () => {
    const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || '';
    console.log('[fetchAllRoutes] Starting, API key exists:', !!GEBETA_API_KEY);
    console.log('[fetchAllRoutes] Number of orders:', orders.length);
    
    if (!GEBETA_API_KEY) {
      console.log('[fetchAllRoutes] No API key, using fallback straight lines');
      // Use straight lines as fallback
      const routes = orders.map(order => {
        const pickupLat = parseFloat(order.pickupLatitude);
        const pickupLng = parseFloat(order.pickupLongitude);
        const deliveryLat = parseFloat(order.deliveryLatitude);
        const deliveryLng = parseFloat(order.deliveryLongitude);
        
        if (!isNaN(pickupLat) && !isNaN(pickupLng) && !isNaN(deliveryLat) && !isNaN(deliveryLng)) {
          return {
            orderId: order.id,
            coordinates: [
              { latitude: pickupLat, longitude: pickupLng },
              { latitude: deliveryLat, longitude: deliveryLng },
            ],
            status: order.status,
          };
        }
        return null;
      }).filter(Boolean);
      
      setAllRoutes(routes);
      return;
    }

    const routes = [];
    let apiFailureCount = 0;
    
    for (const order of orders) {
      const pickupLat = parseFloat(order.pickupLatitude);
      const pickupLng = parseFloat(order.pickupLongitude);
      const deliveryLat = parseFloat(order.deliveryLatitude);
      const deliveryLng = parseFloat(order.deliveryLongitude);

      console.log(`[fetchAllRoutes] Order ${order.id}:`, {
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
        status: order.status,
      });

      if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(deliveryLat) || isNaN(deliveryLng)) {
        console.log(`[fetchAllRoutes] Skipping order ${order.id} - invalid coordinates`);
        continue;
      }

      try {
        const origin = `{${pickupLat},${pickupLng}}`;
        const destination = `{${deliveryLat},${deliveryLng}}`;
        
        const url = `https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&apiKey=${GEBETA_API_KEY}`;
        console.log(`[fetchAllRoutes] Fetching route for order ${order.id}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[fetchAllRoutes] Route data for ${order.id}:`, data.direction ? `${data.direction.length} points` : 'no direction');
          
          if (data.direction && Array.isArray(data.direction)) {
            const coordinates = data.direction.map((point: number[]) => ({
              latitude: point[0],
              longitude: point[1],
            }));
            
            routes.push({
              orderId: order.id,
              coordinates,
              status: order.status,
            });
            console.log(`[fetchAllRoutes] ✅ Added route for order ${order.id}`);
          }
        } else {
          console.log(`[fetchAllRoutes] ❌ API returned ${response.status} for ${order.id}, using straight line fallback`);
          apiFailureCount++;
          
          // Fallback to straight line
          routes.push({
            orderId: order.id,
            coordinates: [
              { latitude: pickupLat, longitude: pickupLng },
              { latitude: deliveryLat, longitude: deliveryLng },
            ],
            status: order.status,
          });
        }
      } catch (error) {
        console.error(`[fetchAllRoutes] Error fetching route for order ${order.id}:`, error);
        apiFailureCount++;
        
        // Fallback to straight line
        routes.push({
          orderId: order.id,
          coordinates: [
            { latitude: pickupLat, longitude: pickupLng },
            { latitude: deliveryLat, longitude: deliveryLng },
          ],
          status: order.status,
        });
      }
    }
    
    if (apiFailureCount > 0) {
      console.log(`[fetchAllRoutes] ⚠️ ${apiFailureCount} routes failed, using straight line fallback`);
    }
    console.log(`[fetchAllRoutes] ✅ Total routes: ${routes.length}`);
    setAllRoutes(routes);
  };

  // Create markers from orders
  const markers = useMemo(() => {
    return orders.flatMap((order) => {
      const pickupLat = parseFloat(order.pickupLatitude);
      const pickupLng = parseFloat(order.pickupLongitude);
      const deliveryLat = parseFloat(order.deliveryLatitude);
      const deliveryLng = parseFloat(order.deliveryLongitude);

      const orderMarkers = [];
      
      // Add pickup marker
      if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
        orderMarkers.push({
          lat: pickupLat,
          lng: pickupLng,
          title: order.pickupAddress,
          type: 'pickup' as const,
          orderId: order.id,
        });
      }
      
      // Add delivery marker
      if (!isNaN(deliveryLat) && !isNaN(deliveryLng)) {
        orderMarkers.push({
          lat: deliveryLat,
          lng: deliveryLng,
          title: order.deliveryAddress,
          type: 'delivery' as const,
          orderId: order.id,
        });
      }
      
      return orderMarkers;
    });
  }, [orders]);

  const handleMarkerPress = (marker: any) => {
    if (marker.orderId) {
      // Find the order
      const order = orders.find(o => o.id === marker.orderId);
      if (!order) return;
      
      // Check order status to determine which sheet to open
      if (['assigned', 'on_the_way', 'delivered'].includes(order.status)) {
        // Show tracking card for orders in delivery
        setSelectedOrder(marker.orderId);
        setShowDeliverySheet(false);
      } else if (['pending_approval', 'approved', 'has_offers', 'rejected'].includes(order.status)) {
        // Show delivery sheet with order status for orders waiting for action
        setClickedOrderId(marker.orderId);
        setShowOrderStatus(true);
        setShowDeliverySheet(false);
      }
    }
  };

  const handleCloseOrderStatus = () => {
    setShowOrderStatus(false);
    setClickedOrderId(null);
  };

  const handleOrderTracking = (orderId: string) => {
    setSelectedOrder(orderId);
    setShowDeliverySheet(false);
  };

  const handleCloseTracking = () => {
    setTrackingRoute(null);
    setSelectedOrder(null);
  };

  // Reset status bar when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!isSidebarVisible) {
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setBackgroundColor('transparent', true);
      }
    }, [isSidebarVisible])
  );

  // Handle status bar changes when sidebar opens/closes
  useEffect(() => {
    if (isSidebarVisible) {
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      StatusBar.setBackgroundColor(isDark ? colors.background : 'white', true);
    } else {
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor('transparent', true);
    }
  }, [isSidebarVisible, isDark, colors]);

  // Get location immediately on mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        // Get location with high accuracy and timeout
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        });
        setLocation(location);
      } catch (error) {
        console.log('Error getting location:', error);
      }
    })();
  }, []);

  // Don't render if not authorized
  if (isLoading || !session?.user || session.user.role !== userRoles.OWNER_SHOP) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent />
      
      <WalletTutorialModal
        visible={showWalletModal}
        onCreateWallet={handleCreateWallet}
        userType="user"
      />

      <SimpleTutorial
        visible={showTutorial}
        steps={tutorialSteps}
        onComplete={handleTutorialComplete}
      />
      
      {/* Full Screen Map */}
      <MapComponent 
        style={styles.map} 
        markers={markers}
        route={trackingRoute}
        routes={allRoutes}
        onMarkerPress={handleMarkerPress}
      />
      
      {/* Top Bar Overlay */}
      <TopBar
        onNotificationPress={() => router.push('/shared/notifications')}
      />
      
      {/* Floating Order Buttons - Hidden when tracking */}
      {!selectedOrder && (
        <View style={[styles.orderButtons, { backgroundColor: colors.primary }]}>
          <TouchableOpacity 
            style={[styles.orderButton, styles.deliveryButton]}
            onPress={() => {
              Alert.alert(
                'How would you like to post your load?',
                'Choose an option below to proceed.',
                [
                  {
                    text: 'Option 1: Post by App',
                    onPress: () => setShowDeliverySheet(true)
                  },
                  {
                    text: 'Option 2: Contact Call Center',
                    onPress: () => Linking.openURL('tel:+251912345678')
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
            }}
          >
            <Truck size={20} color={colors.white} />
            <Text style={[styles.buttonText, { color: colors.white }]}>Delivery</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: '#e0e0e0' }]} />
            
            <TouchableOpacity 
            style={styles.orderButton}
            onPress={() => {
              console.log('Order button pressed, navigating to /order');
              try {
                router.push('/order');
              } catch (error) {
                console.error('Navigation error:', error);
                router.replace('/order');
              }
            }}
          >
            <ShoppingBag size={20} color={colors.white} />
            <Text style={[styles.buttonText, { color: colors.white }]}>Order</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Tracking Card - Absolute positioned at bottom */}
      {selectedOrder && (
        <View style={styles.trackingCardContainer}>
          <OrderTrackingCard
            orderId={selectedOrder}
            onRouteUpdate={setTrackingRoute}
            onClose={handleCloseTracking}
          />
        </View>
      )}
      
      <DeliveryBottomSheet 
        visible={showDeliverySheet}
        onClose={() => {
          setShowDeliverySheet(false);
        }}
        selectedOrder={selectedOrder}
        onOrderSelect={handleOrderTracking}
        onBackToList={() => setSelectedOrder(null)}
      />
      
      {clickedOrderId && (
        <OrderStatusSheet
          visible={showOrderStatus}
          orderId={clickedOrderId}
          onClose={handleCloseOrderStatus}
        />
      )}
      
      <OrderBottomSheet
        visible={showOrderFlow}
        onClose={() => setShowOrderFlow(false)}
        onNext={(locationData) => {
          console.log('Locations:', locationData);
          setShowOrderFlow(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orderButtons: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trackingCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  deliveryButton: {
    // Remove background color to use transparent container
  },
  divider: {
    width: 1,
    marginVertical: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});

export default UserHome;