import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/hooks/ThemeContext';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { useNetworkState } from '@/hooks/useNetworkState';
import { spacing, fontSize, fontWeight } from '@/constants/theme';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const { colors } = useTheme();
  const { connected, reconnectAttempts, forceReconnect } = useWebSocketContext();
  const networkState = useNetworkState(connected);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      forceReconnect();
    }
  };

  const getMessage = () => {
    if (!networkState.isOnline) {
      return 'No internet connection';
    }
    
    if (networkState.isOnline && !connected) {
      if (reconnectAttempts > 0) {
        return `Reconnecting... (${reconnectAttempts}/5)`;
      }
      return 'Server connection lost';
    }
    
    return 'No connection';
  };

  return (
    <View style={[styles.banner, { backgroundColor: colors.error }]}>
      <View style={styles.content}>
        <WifiOff size={20} color={colors.white} />
        <Text style={[styles.message, { color: colors.white }]}>
          {getMessage()}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={handleRetry}
        activeOpacity={0.7}
      >
        <RefreshCw size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  refreshButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: spacing.sm,
  },
});