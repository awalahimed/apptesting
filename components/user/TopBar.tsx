import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Bell } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useSidebar } from './SidebarContext';
import { useNotificationContext } from '@/hooks/NotificationContext';

interface TopBarProps {
  onNotificationPress?: () => void;
  MenuButton?: React.ComponentType<any>;
  NotificationButton?: React.ComponentType<any>;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onNotificationPress,
  MenuButton,
  NotificationButton 
}) => {
  const { toggleSidebar } = useSidebar();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = windowWidth < 360;
  const { unreadCount } = useNotificationContext();

  const MenuWrapper = MenuButton || TouchableOpacity;
  const NotificationWrapper = NotificationButton || TouchableOpacity;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <MenuWrapper
        onPress={toggleSidebar}
        style={[styles.iconButton, isSmallScreen && styles.iconButtonSmall]}
        accessibilityLabel="Open menu"
      >
        <Menu size={isSmallScreen ? 20 : 24} color={colors.white} strokeWidth={2} />
      </MenuWrapper>

      <NotificationWrapper
        onPress={onNotificationPress}
        style={[styles.iconButton, isSmallScreen && styles.iconButtonSmall]}
        accessibilityLabel="Notifications"
      >
        <Bell size={isSmallScreen ? 20 : 24} color={colors.white} strokeWidth={2} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </NotificationWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
