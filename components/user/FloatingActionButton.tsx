import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Home } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface FloatingActionButtonProps {
  onPress?: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Home size={32} color={colors.background} strokeWidth={2.5} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -35 }],
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});