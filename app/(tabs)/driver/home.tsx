import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopBar } from '@/components/user/TopBar';
import { MapComponent } from '@/components/shared/MapComponent';
import { OrderSearchSheet } from '@/components/driver/OrderSearchSheet';
import { DriverAssignedOrderCard } from '@/components/driver/DriverAssignedOrderCard';
import { RejectionNotice } from '@/components/driver/RejectionNotice';
import { WalletTutorialModal } from '@/components/tutorial/WalletTutorialModal';
import { SimpleTutorial } from '@/components/tutorial/SimpleTutorial';
import { useAuth } from '@/hooks/AuthContext';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { useDriverStatus } from '@/hooks/DriverStatusContext';
import { userRoles } from '@/constants/userRoles';
import { Search, Navigation, AlertCircle, X } from 'lucide-react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';

import * as Location from 'expo-location';
import { uploadImageWithReplace } from '@/utils/upload';

function DriverHome() {
  const { session, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { orpcClient, connected, assignedOrder: wsAssignedOrder, setAssignedOrder: setWsAssignedOrder } = useWebSocketContext();
  const { isOnline: isDriverOnline } = useDriverStatus();
  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [showRejectionSheet, setShowRejectionSheet] = useState(false);
  const [assignedOrder, setAssignedOrder] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const tutorialSteps = [
    {
      target: 'topBar',
      title: 'Menu & Notifications',
      description: 'Access your profile, settings, and notifications from the top bar.',
    },
    {
      target: 'searchButton',
      title: 'Find Orders',
      description: 'Tap here to browse and accept available delivery orders.',
    },
    {
      target: 'wallet',
      title: 'Your Wallet',
      description: 'Manage your earnings and withdrawals in the wallet section.',
    },
  ];

  // Check if tutorial should be shown
  useEffect(() => {
    const checkTutorial = async () => {
      const hasSeenTutorial = await AsyncStorage.getItem('driver_home_tutorial');
      if (!hasSeenTutorial && session?.user) {
        setShowWalletModal(true);
      }
    };
    checkTutorial();
  }, [session]);

  const handleCreateWallet = async () => {
    setShowWalletModal(false);
    await AsyncStorage.setItem('driver_home_tutorial', 'true');
    setTimeout(() => setShowTutorial(true), 500);
  };

  const handleStartTutorial = async () => {
    try {
      const result = await orpcClient.wallet.get.query();
      if (result.wallet) {
        await AsyncStorage.setItem('driver_home_tutorial', 'true');
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
    router.push('/(tabs)/driver/wallet');
  };

  // Expose tutorial trigger globally
  useEffect(() => {
    (global as any).startDriverTutorial = handleStartTutorial;
    return () => {
      delete (global as any).startDriverTutorial;
    };
  }, []);

  const [rejectionData, setRejectionData] = useState<{
    hasRejection: boolean;
    rejectionReason?: string;
    rejectedDocument?: 'license' | 'vehicle';
  } | null>(null);

  // Route guard - redirect if not driver
  useEffect(() => {
    if (isLoading) return;
    
    if (!session?.user) {
      router.replace('/auth/login');
      return;
    }
    
    const role = session.user.role;
    if (role !== userRoles.DRIVER) {
      if (role === userRoles.OWNER_SHOP) {
        router.replace('/(tabs)/user/home');
      } else {
        router.replace('/auth/role-selection');
      }
    }
  }, [session, isLoading]);

  // Set status bar to be transparent and show light content
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setTranslucent(true);
  }, []);

  // Get driver location immediately with high accuracy
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          });
          setDriverLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Location error:', error);
      }
    })();
  }, []);

  // *** NEW: Listen for WebSocket push notifications of assigned orders
  useEffect(() => {
    // Don't process WebSocket assigned orders if user is not a driver
    if (!session?.user || session.user.role !== userRoles.DRIVER) {
      return;
    }

    if (wsAssignedOrder) {
      console.log('📥 Received assigned order via WebSocket:', wsAssignedOrder);
      setAssignedOrder(wsAssignedOrder);
      setLoadingOrder(false);
      // Note: wsAssignedOrder is already in the WebSocket context, no need to set it again
    }
  }, [wsAssignedOrder, session?.user?.role]);

  // *** MODIFIED: Fetch assigned order only on initial load (no more polling)
  useEffect(() => {
    // Don't make API calls if user is not a driver
    if (!session?.user || session.user.role !== userRoles.DRIVER) {
      setLoadingOrder(false);
      return;
    }

    if (!connected || !orpcClient) {
      setLoadingOrder(true);
      return;
    }

    const fetchAssignedOrder = async () => {
      try {
        console.log('🔍 [DriverHome] Fetching assigned orders...');
        const result = await orpcClient.driver.getAvailableOrders();
        
        console.log('📦 [DriverHome] Fetch result:', {
          isLocked: result.isLocked,
          ordersCount: result.orders?.length || 0,
          lockedOrderId: result.lockedOrderId,
          accountStatus: result.accountStatus
        });
        
        // Store all available orders for map display
        const allOrders = result.orders || [];
        const visibleOrders = allOrders.filter((o: any) => 
          ['approved', 'has_offers', 'assigned', 'accepted'].includes(o?.status)
        );
        setAvailableOrders(visibleOrders);
        
        if (result.isLocked && result.orders && result.orders.length > 0) {
          const newOrder = result.orders[0];
          console.log('✅ [DriverHome] Setting assigned order:', newOrder.id);
          setAssignedOrder(newOrder);
          // Update WebSocket context so other components can access it
          setWsAssignedOrder(newOrder);
        } else {
          console.log('❌ [DriverHome] No assigned order, clearing state');
          setAssignedOrder(null);
          // Clear WebSocket context
          setWsAssignedOrder(null);
        }
      } catch (error) {
        console.error('Failed to fetch assigned order:', error);
        setAssignedOrder(null);
        setAvailableOrders([]);
        setWsAssignedOrder(null);
      } finally {
        setLoadingOrder(false);
      }
    };

    // *** Only fetch once on connection, no interval
    fetchAssignedOrder();
  }, [connected, orpcClient, session?.user?.role, setWsAssignedOrder]);

  // Fetch rejection status
  useEffect(() => {
    // Don't check rejection status if user is not a driver
    if (!session?.user || session.user.role !== userRoles.DRIVER) {
      return;
    }

    const accountStatus = session?.user?.accountStatus;
    
    // Check if user is rejected from session data
    if (accountStatus === 'rejected' && session?.user) {
      const userData = session.user as any;
      setRejectionData({
        hasRejection: true,
        rejectionReason: userData.rejectionReason || 'Your documents have been rejected. Please re-upload.',
        rejectedDocument: userData.rejectedDocument || 'license',
      });
    } else {
      setRejectionData({ hasRejection: false });
    }
  }, [session, session?.user?.role]);

  // Handle re-upload
  const handleReupload = async (frontImage: string, backImage?: string) => {
    console.log('🔄 [handleReupload] Starting re-upload process');
    console.log('🔄 [handleReupload] Rejection data:', rejectionData);
    
    if (!session?.user?.id || !orpcClient || !rejectionData?.rejectedDocument) {
      console.error('❌ [handleReupload] Missing required data:', {
        userId: session?.user?.id,
        hasOrpcClient: !!orpcClient,
        rejectedDocument: rejectionData?.rejectedDocument,
      });
      throw new Error('Missing required data');
    }

    const isLicense = rejectionData.rejectedDocument === 'license';
    console.log('🔄 [handleReupload] Document type:', isLicense ? 'license' : 'vehicle');
    
    try {
      if (isLicense && backImage) {
        console.log('📤 [handleReupload] Uploading license front...');
        // Upload both front and back for license
        const frontId = await uploadImageWithReplace(frontImage, null, {
          userId: session.user.id,
          documentType: 'license_front',
        });
        console.log('✅ [handleReupload] License front uploaded:', frontId);
        
        console.log('📤 [handleReupload] Uploading license back...');
        const backId = await uploadImageWithReplace(backImage, null, {
          userId: session.user.id,
          documentType: 'license_back',
        });
        console.log('✅ [handleReupload] License back uploaded:', backId);
        
        // Call reupload endpoint with both IDs
        console.log('📤 [handleReupload] Calling reuploadDriverLicense endpoint...');
        await orpcClient.onboarding.reuploadDriverLicense({
          userId: session.user.id,
          licenseFrontId: frontId,
          licenseBackId: backId,
        });
        console.log('✅ [handleReupload] License re-upload complete');
      } else {
        console.log('📤 [handleReupload] Uploading vehicle photo...');
        // Upload single vehicle photo
        const vehiclePhotoId = await uploadImageWithReplace(frontImage, null, {
          userId: session.user.id,
          documentType: 'vehicle_photo',
        });
        console.log('✅ [handleReupload] Vehicle photo uploaded:', vehiclePhotoId);
        
        // Call vehicle reupload endpoint
        console.log('📤 [handleReupload] Calling reuploadVehiclePhoto endpoint...');
        await orpcClient.onboarding.reuploadVehiclePhoto({
          userId: session.user.id,
          vehiclePhotoId,
        });
        console.log('✅ [handleReupload] Vehicle photo re-upload complete');
      }

      // Refresh rejection status
      console.log('✅ [handleReupload] Re-upload successful, clearing rejection status');
      setRejectionData({ hasRejection: false });
    } catch (error) {
      console.error('❌ [handleReupload] Error during re-upload:', error);
      throw error;
    }
  };

  // Calculate route data for map - show assigned order route if exists, otherwise show all available orders as markers
  const routeData = useMemo(() => {
    if (!assignedOrder || !driverLocation) return null;
    
    const pickupLoc = assignedOrder.pickupLocation;
    const deliveryLoc = assignedOrder.deliveryLocation;
    
    if (!pickupLoc || !deliveryLoc) return null;
    
    return {
      driver: driverLocation,
      pickup: {
        lat: parseFloat(pickupLoc.latitude),
        lng: parseFloat(pickupLoc.longitude),
      },
      delivery: {
        lat: parseFloat(deliveryLoc.latitude),
        lng: parseFloat(deliveryLoc.longitude),
      },
      vehicleType: assignedOrder.vehicleType as 'truck' | 'car' | 'motorcycle',
    };
  }, [assignedOrder, driverLocation]);

  // Generate markers for all available orders (when no assigned order)
  const availableOrderMarkers = useMemo(() => {
    if (assignedOrder) {
      console.log('🗺️ [availableOrderMarkers] Has assigned order, returning empty array');
      return [];
    }
    
    if (availableOrders.length === 0) {
      console.log('🗺️ [availableOrderMarkers] No available orders, returning empty array');
      return [];
    }
    
    const markers: any[] = [];
    
    availableOrders.forEach((order) => {
      const pickupLoc = order.pickupLocation;
      const deliveryLoc = order.deliveryLocation;
      
      console.log('🗺️ [availableOrderMarkers] Order:', order.id, 'pickup:', pickupLoc, 'delivery:', deliveryLoc);
      
      if (pickupLoc) {
        markers.push({
          lat: parseFloat(pickupLoc.latitude),
          lng: parseFloat(pickupLoc.longitude),
          title: `Pickup: ${order.pickupAddress}`,
          type: 'pickup' as const,
          orderId: order.id,
        });
      }
      
      if (deliveryLoc) {
        markers.push({
          lat: parseFloat(deliveryLoc.latitude),
          lng: parseFloat(deliveryLoc.longitude),
          title: `Delivery: ${order.deliveryAddress}`,
          type: 'delivery' as const,
          orderId: order.id,
        });
      }
    });
    
    console.log('🗺️ [availableOrderMarkers] Generated', markers.length, 'markers');
    return markers;
  }, [availableOrders, assignedOrder]);

  // Don't render if not authorized
  if (isLoading || !session?.user || session.user.role !== userRoles.DRIVER) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <WalletTutorialModal
        visible={showWalletModal}
        onCreateWallet={handleCreateWallet}
        userType="driver"
      />

      <SimpleTutorial
        visible={showTutorial}
        steps={tutorialSteps}
        onComplete={handleTutorialComplete}
      />
      
      <MapComponent 
        style={styles.map} 
        route={routeData} 
        markers={availableOrderMarkers}
        showControls={true}
      />
      
      <View style={styles.topBarContainer}>
        <TopBar 
          onNotificationPress={() => router.push('/shared/notifications')}
        />
      </View>

      {!loadingOrder && (
        <TouchableOpacity 
          style={[
            styles.searchButton, 
              { backgroundColor: 
                !isDriverOnline ? '#6b7280' : // Gray when offline
                rejectionData?.hasRejection ? colors.error : 
                session?.user?.accountStatus === 're-uploaded' ? '#FFA500' : 
                session?.user?.accountStatus === 'pending' ? '#FFA500' :
                colors.primary 
              }
            ]} 
            onPress={() => {
              if (!isDriverOnline) return; // Do nothing when offline
              if (rejectionData?.hasRejection) {
                setShowRejectionSheet(true);
              } else {
              setShowOrderSearch(true);
            }
          }}
          disabled={!isDriverOnline || (session?.user?.accountStatus !== 'active' && !rejectionData?.hasRejection)}
        >
          {!isDriverOnline ? (
            <>
              <AlertCircle size={20} color={colors.surface} />
              <Text style={[styles.searchButtonText, { color: colors.surface }]}>Offline</Text>
            </>
          ) : rejectionData?.hasRejection ? (
            <>
              <AlertCircle size={20} color={colors.surface} />
              <Text style={[styles.searchButtonText, { color: colors.surface }]}>Account Rejected</Text>
            </>
          ) : session?.user?.accountStatus === 're-uploaded' ? (
            <>
              <AlertCircle size={20} color={colors.surface} />
              <Text style={[styles.searchButtonText, { color: colors.surface }]}>Pending Re-Review</Text>
            </>
          ) : session?.user?.accountStatus === 'pending' ? (
            <>
              <AlertCircle size={20} color={colors.surface} />
              <Text style={[styles.searchButtonText, { color: colors.surface }]}>Pending Approval</Text>
            </>
          ) : assignedOrder ? (
            <>
              <Navigation size={20} color={colors.surface} />
              <Text style={[styles.searchButtonText, { color: colors.surface }]}>View Directions</Text>
            </>
          ) : (
            <>
              <Search size={20} color={colors.surface} />
              <Text style={[styles.searchButtonText, { color: colors.surface }]}>Search Orders</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {assignedOrder && !loadingOrder && (
        <DriverAssignedOrderCard 
          order={assignedOrder}
          onRouteUpdate={(route) => {
            // Route is already calculated in routeData memo
          }}
        />
      )}

      <OrderSearchSheet
        visible={showOrderSearch}
        onClose={() => setShowOrderSearch(false)}
        onSelectOrder={(order) => {
          console.log('Selected order:', order);
          setShowOrderSearch(false);
        }}
      />

      {/* Rejection Details Modal */}
      <Modal
        visible={showRejectionSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRejectionSheet(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.rejectionBadge, { backgroundColor: colors.error }]}>
                <Text style={[styles.rejectionBadgeText, { color: colors.surface }]}>Rejected</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Re-upload Required</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRejectionSheet(false)} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {rejectionData?.hasRejection && rejectionData.rejectionReason && rejectionData.rejectedDocument && (
              <RejectionNotice
                rejectionReason={rejectionData.rejectionReason}
                rejectedDocument={rejectionData.rejectedDocument}
                onDismiss={() => setShowRejectionSheet(false)}
                onReupload={async (imageUri) => {
                  await handleReupload(imageUri);
                  setShowRejectionSheet(false);
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  searchButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  rejectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  rejectionBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
});

export default DriverHome;
