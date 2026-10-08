import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';

interface ToggleButtonsProps {
  activeOption: 'transport' | 'delivery';
  onOptionChange: (option: 'transport' | 'delivery') => void;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = ({ 
  activeOption, 
  onOptionChange 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.button, 
          activeOption === 'transport' && styles.activeButton
        ]}
        onPress={() => onOptionChange('transport')}
      >
        <Text style={[
          styles.buttonText,
          activeOption === 'transport' && styles.activeButtonText
        ]}>
          Transport
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.button,
          activeOption === 'delivery' && styles.activeButton
        ]}
        onPress={() => onOptionChange('delivery')}
      >
        <Text style={[
          styles.buttonText,
          activeOption === 'delivery' && styles.activeButtonText
        ]}>
          Delivery
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  activeButtonText: {
    color: colors.background,
  },
});