import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { X, User, Wallet, Truck, MapPin, Clock, Bell, Settings, HelpCircle, Megaphone } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useSidebar } from '../user/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { LogoutButton } from '../user/LogoutButton';

export const DriverSidebar: React.FC = () => {
  const router = useRouter();
  const { isSidebarVisible, setSidebarVisible } = useSidebar();
  const { width: windowWidth } = useWindowDimensions();
  const { session } = useAuth();

  const handleClose = () => {
    setSidebarVisible(false);
  };

  const menuItems = useMemo(() => [
    { icon: User, label: 'Profile', onPress: () => router.push('/shared/profile') },
    { icon: Wallet, label: 'Wallet', onPress: () => router.push('/driver/wallet') },
    { icon: Truck, label: 'My Deliveries', onPress: () => console.log('Deliveries') },
    { icon: MapPin, label: 'Route History', onPress: () => console.log('Routes') },
    { icon: Clock, label: 'Work Schedule', onPress: () => console.log('Schedule') },
    { icon: Megaphone, label: 'Announcements', onPress: () => router.push('/shared/announcements') },
    { icon: Bell, label: 'Notifications', onPress: () => router.push('/shared/notifications') },
    { icon: Settings, label: 'Settings', onPress: () => router.push('/shared/settings') },
  ], []);

  const sidebarWidth = Math.min(windowWidth * 0.85, 320);

  return (
    <>
      {isSidebarVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={0.5}
        />
      )}

      <View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            left: isSidebarVisible ? 0 : -sidebarWidth,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={28} color={colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{session?.user?.name || 'Driver'}</Text>
              <Text style={styles.userEmail}>{session?.user?.phoneNumber || 'Driver Account'}</Text>
              <View style={styles.roleBadge}>
                <Truck size={12} color={colors.primary} />
                <Text style={styles.roleText}>DRIVER</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <LogoutButton variant="text" onLogoutComplete={handleClose} />
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => {
                handleClose();
                setTimeout(() => {
                  if ((global as any).startDriverTutorial) {
                    (global as any).startDriverTutorial();
                  }
                }, 100);
              }}
            >
              <HelpCircle size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.versionText}>Driver App v1.0.0</Text>
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
    backgroundColor: colors.background,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryOpacity10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  closeButton: {
    position: 'absolute',
    top: 55,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  menu: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
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
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryOpacity10,
  },
  versionText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
});