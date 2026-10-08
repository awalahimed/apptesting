import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAlert } from '@/components/shared/CustomAlert';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, User, Wallet, ShoppingBag, Settings, HelpCircle, Bell, Megaphone } from 'lucide-react-native';
import { useSidebar } from './SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/ThemeContext';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useDriverStatus } from '@/hooks/DriverStatusContext';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { LogoutButton } from './LogoutButton';
import { orpc as client } from '@/hooks/orpc';
import { config } from '@/config/config';
import '@/types/auth';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { isSidebarVisible, setSidebarVisible } = useSidebar();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { session, refreshSession } = useAuth();
  const { colors } = useTheme();
  const networkState = useNetworkState(false);
  const { isOnline, toggleOnlineStatus } = useDriverStatus();
  const { assignedOrder, orpcClient } = useWebSocketContext();
  const [profileData, setProfileData] = useState<any>(null);
  const [key, setKey] = useState(0);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(false);
  const hasActiveOrdersRef = useRef(false);

  const isDriver = session?.user?.role === 'driver';
  // Check hasAssignedOrder from multiple sources:
  // 1. Session data (from getSession API) - most reliable
  // 2. WebSocket context (real-time)
  // 3. Profile data (from getProfile API)
  // 4. Direct check via ref (from sidebar check)
  const hasAssignedOrder = (session?.user as any)?.hasAssignedOrder === true ||
                          !!assignedOrder || 
                          (profileData?.hasAssignedOrder === true) || 
                          hasActiveOrdersRef.current;
  
  // Debug logging for assigned order
  useEffect(() => {
    console.log('📦 [Sidebar] assignedOrder changed:', assignedOrder ? 'HAS ORDER' : 'NO ORDER', assignedOrder?.id || 'null');
  }, [assignedOrder]);
  
  // Debug logging for profile data
  useEffect(() => {
    if (profileData) {
      console.log('👤 [Sidebar] Profile Data hasAssignedOrder:', profileData.hasAssignedOrder);
    }
  }, [profileData]);
  
  // Debug logging for session data
  useEffect(() => {
    if (session?.user) {
      console.log('👤 [Sidebar] Session User hasAssignedOrder:', (session.user as any).hasAssignedOrder);
    }
  }, [session?.user]);
  
  // Check for active orders when sidebar opens (for drivers)
  useEffect(() => {
    if (isSidebarVisible && isDriver && session?.user?.id && orpcClient) {
      console.log('👁️ [Sidebar] Opened - checking for active orders');
      
      // Fetch active orders directly using WebSocket client
      const checkActiveOrders = async () => {
        try {
          setCheckingOrders(true);
          const result = await orpcClient.driver.getAvailableOrders();
          console.log('📦 [Sidebar] Active orders check:', {
            isLocked: result.isLocked,
            ordersCount: result.orders?.length || 0
          });
          const hasOrders = result.isLocked && result.orders && result.orders.length > 0;
          console.log('✅ [Sidebar] Setting hasActiveOrders to:', hasOrders);
          setHasActiveOrders(hasOrders);
          hasActiveOrdersRef.current = hasOrders;
        } catch (error) {
          console.error('[Sidebar] Failed to check active orders:', error);
          setHasActiveOrders(false);
        } finally {
          setCheckingOrders(false);
        }
      };
      
      checkActiveOrders();
    }
  }, [isSidebarVisible, isDriver, session?.user?.id, orpcClient]);
  
  // Handle online status toggle with assigned order check
  const handleToggleOnline = () => {
    console.log('🔄 Toggle attempt - isOnline:', isOnline, 'hasAssignedOrder:', hasAssignedOrder, 'hasActiveOrders:', hasActiveOrders, 'assignedOrder:', assignedOrder?.id || 'null');
    
    // If driver is online and has assigned order, prevent going offline
    if (isOnline && hasAssignedOrder) {
      Alert.alert(
        'Cannot Go Offline',
        'You have an active delivery. Please complete your current delivery before going offline.',
        [{ text: 'OK' }]
      );
      return;
    }
    // Otherwise allow toggle
    toggleOnlineStatus();
  };

  // Force re-render when session user data changes
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [session?.user?.name, session?.user?.image, session?.user?.phoneNumber]);

  const handleClose = () => {
    setSidebarVisible(false);
  };

  // Fetch profile data when sidebar opens
  useEffect(() => {
    if (isSidebarVisible && session?.user?.id) {
      const fetchProfile = async () => {
        try {
          // Only refresh session if we're online to avoid unnecessary logout triggers
          if (networkState?.isOnline) {
            try {
              await refreshSession?.();
            } catch (error) {
              console.warn('[Sidebar] Session refresh failed, continuing with cached session:', error);
              // Don't let session refresh errors prevent sidebar from working
            }
          }
          
          // Fetch profile data (also wrapped in try-catch to prevent blocking)
          try {
            const result = await client.profile.getProfile({ userId: session.user.id });
            if (result.success) {
              setProfileData(result.user);
            }
          } catch (profileError) {
            console.warn('[Sidebar] Profile fetch failed, using cached data:', profileError);
            // Continue with cached session data if profile fetch fails
          }
        } catch (error) {
          console.error('[Sidebar] Error in fetchProfile:', error);
          // Don't block sidebar from opening if there are any errors
        }
      };
      fetchProfile();
    }
  }, [isSidebarVisible, session?.user?.id, refreshSession, networkState?.isOnline]);

  const getWalletRoute = () => {
    const role = session?.user?.role;
    if (role === 'driver') return '/driver/wallet';
    if (role === 'agent_delala') return '/agent/wallet';
    return '/user/wallet';
  };

  const menuItems = useMemo(() => {
    const isDriver = session?.user?.role === 'driver';
    
    return [
      { icon: User, label: 'Profile', onPress: () => router.push('/shared/profile') },
      { icon: Wallet, label: 'Wallet', onPress: () => router.push(getWalletRoute() as any) },
      { icon: ShoppingBag, label: isDriver ? 'Offers' : 'Orders', onPress: () => router.push('/shared/orders') },
      { icon: Megaphone, label: 'Announcements', onPress: () => router.push('/shared/announcements') },
      { icon: Bell, label: 'Notifications', onPress: () => router.push('/shared/notifications') },
      { icon: Settings, label: 'Settings', onPress: () => router.push('/shared/settings') },
    ];
  }, [session?.user?.role]);

  // Console log user data when sidebar opens
  useEffect(() => {
    if (isSidebarVisible && session?.user) {
      console.log('👤 [Sidebar] User Data:', {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      });
    }
  }, [isSidebarVisible, session]);

  const sidebarWidth = Math.min(windowWidth * 0.85, 320);
  const accountStatus = (session?.user as any)?.accountStatus;

  // Get profile photo URL
  const getProfilePhotoUrl = () => {
    // First try profileData from API (has filename with extension)
    if (profileData?.profilePhoto?.filename) {
      const filename = profileData.profilePhoto.filename;
      // filename could be "uuid.png" or "profile_photo/uuid.png"
      const hasFolder = filename.includes('/');
      const uri = hasFolder
        ? `${config.api.baseUrl}/uploads/${filename}`
        : `${config.api.baseUrl}/uploads/profile_photo/${filename}`;
      return { uri };
    }

    // Fallback to session data
    if (session?.user?.image) {
      const uri = session.user.image.startsWith('/')
        ? `${config.api.baseUrl}${session.user.image}`
        : session.user.image;
      return { uri };
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      {isSidebarVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={0.5}
          pointerEvents="auto"
        />
      )}

      {/* Sidebar - opens from left */}
      <View
        key={key}
        pointerEvents="auto"
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            left: isSidebarVisible ? 0 : -sidebarWidth,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryOpacity10, borderColor: colors.primary }]}>
              {getProfilePhotoUrl() ? (
                <Image
                  source={getProfilePhotoUrl()!}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              ) : (
                <User size={28} color={colors.primary} />
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {session?.user?.name || 'Guest User'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
                {session?.user?.phoneNumber || session?.user?.email || 'Not logged in'}
              </Text>
              {/* Account Status Badge */}
              {accountStatus && (
                <View style={[
                  styles.statusBadge,
                  accountStatus === 'active' && styles.statusActive,
                  accountStatus === 'pending' && styles.statusPending,
                  accountStatus === 'suspended' && styles.statusSuspended,
                  accountStatus === 'flagged' && styles.statusFlagged,
                ]}>
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {accountStatus.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={[styles.closeButton, { top: insets.top + 11, backgroundColor: colors.surface }]} onPress={handleClose}>
            <X size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Driver Online/Offline Toggle */}
        {isDriver && (
          <View style={[styles.statusToggleContainer, { 
            backgroundColor: colors.card,
            borderBottomColor: colors.border 
          }]}>
            <View style={styles.statusToggleContent}>
              <View style={styles.statusToggleLeft}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: isOnline ? '#10b981' : '#6b7280' }
                ]} />
                <View>
                  <Text style={[styles.statusLabel, { color: colors.text }]}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                  <Text style={[styles.statusSubtext, { color: colors.textMuted }]}>
                    {isOnline && hasAssignedOrder 
                      ? 'Complete current delivery first' 
                      : isOnline 
                        ? 'Available for orders' 
                        : 'Not accepting orders'
                    }
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                disabled={isOnline && hasAssignedOrder}
                trackColor={{ false: colors.border, true: '#10b98166' }}
                thumbColor={isOnline ? '#10b981' : colors.textMuted}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        )}

        <ScrollView
          style={styles.menu}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                item.onPress();
                handleClose();
              }}
            >
              <View style={styles.menuItemLeft}>
                <item.icon size={22} color={colors.text} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerButtons}>
            <LogoutButton
              variant="text"
              onLogoutComplete={handleClose}
            />
            <TouchableOpacity 
              style={[styles.helpButton, { backgroundColor: colors.primaryOpacity10 }]}
              onPress={() => {
                handleClose();
                setTimeout(() => {
                  if ((global as any).startUserTutorial) {
                    (global as any).startUserTutorial();
                  }
                }, 100);
              }}
            >
              <HelpCircle size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 1.0.0</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#10b98122',
  },
  statusPending: {
    backgroundColor: '#f59e0b22',
  },
  statusSuspended: {
    backgroundColor: '#ef444422',
  },
  statusFlagged: {
    backgroundColor: '#ef444422',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
    borderRadius: 20,
  },
  menu: {
    flex: 1,
  },
  menuContent: {
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 11,
    marginTop: 8,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpButton: {
    padding: 8,
    borderRadius: 8,
  },
  statusToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
});
