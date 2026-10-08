import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/ThemeContext';

interface SettingsItemProps {
  icon: React.ReactNode;
  iconBackground: string;
  label: string;
  value?: string;
  showArrow?: boolean;
  onPress: () => void;
}

export function SettingsItem({
  icon,
  iconBackground,
  label,
  value,
  showArrow,
  onPress,
}: SettingsItemProps) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContainer}>
        <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
          {icon}
        </View>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          {value && <Text style={[styles.value, { color: colors.text }]}>{value}</Text>}
        </View>
      </View>
      <View style={styles.actions}>
        {!showArrow && <Text style={[styles.editText, { color: colors.text }]}>Edit</Text>}
        {showArrow && (
          <ArrowRight size={16} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  label: {
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  value: {
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 25,
    justifyContent: 'flex-end',
  },
  editText: {
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'right',
  },
});
