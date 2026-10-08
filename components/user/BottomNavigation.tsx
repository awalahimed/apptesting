import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Activity, MessageCircle, Home, Compass, User } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface BottomNavigationProps {
  activeTab: 'activities' | 'message' | 'home' | 'discover' | 'profile';
  onTabChange: (tab: 'activities' | 'message' | 'home' | 'discover' | 'profile') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'message', label: 'Message', icon: MessageCircle },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
          >
            <Icon 
              size={24} 
              color={isActive ? colors.primary : colors.textMuted} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text style={[
              styles.label,
              isActive && styles.activeLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});