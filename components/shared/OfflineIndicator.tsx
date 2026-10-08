import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/hooks/ThemeContext';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { useNetworkState } from '@/hooks/useNetworkState';
import { spacing, fontSize, fontWeight } from '@/constants/theme';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  compact?: boolean;
  onRetry?: () => void;
}

export function OfflineIndicator({ 
  showWhenOnline = false, 
  compact = false,
  onRetry 
}: OfflineIndicatorProps) {
  const { colors } = useTheme();
  const { connected, reconnectAttempts, forceReconnect, lastDisconnectReason } = useWebSocketContext();
  const networkState = useNetworkState(connected);

  // Don't show if online and showWhenOnline is false
  if (networkState.isOnline && connected && !showWhenOnline) {
    return null;
  }

  const getStatus = () => {
    if (!networkState.isOnline) {
      return {
        icon: WifiOff,
        text: 'No Connection',
        subtext: 'Cannot reach server',
        color: colors.error,
        backgroundColor: colors.errorLight,
      };
    }
    
    if (!connected) {
      if (reconnectAttempts > 0) {
        return {
          icon: RefreshCw,
          text: 'Reconnecting...',
          subtext: `Attempt ${reconnectAttempts}/5`,
          color: colors.warning,
          backgroundColor: colors.warningLight,
        };
      }
      
      return {
        icon: WifiOff,
        text: 'Disconnected',
        subtext: lastDisconnectReason || 'Connection lost',
        color: colors.error,
        backgroundColor: colors.errorLight,
      };
    }

    // Online and connected - show connection quality
    const latency = networkState.latency;
    let qualityText = 'Connected';
    let qualitySubtext = 'Real-time updates active';
    
    if (latency) {
      if (latency < 500) {
        qualityText = 'Excellent';
        qualitySubtext = `${latency}ms - Fast connection`;
      } else if (latency < 1000) {
        qualityText = 'Good';
        qualitySubtext = `${latency}ms - Stable connection`;
      } else if (latency < 2000) {
        qualityText = 'Fair';
        qualitySubtext = `${latency}ms - Slow connection`;
      } else {
        qualityText = 'Poor';
        qualitySubtext = `${latency}ms - Very slow`;
      }
    }

    return {
      icon: Wifi,
      text: qualityText,
      subtext: qualitySubtext,
      color: colors.success,
      backgroundColor: colors.primaryOpacity10,
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      forceReconnect();
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: status.backgroundColor }]}>
        <Icon size={16} color={status.color} />
        <Text style={[styles.compactText, { color: status.color }]}>
          {status.text}
        </Text>
        {(!networkState.isOnline || !connected) && (
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <RefreshCw size={14} color={status.color} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: status.backgroundColor }]}>
      <View style={styles.content}>
        <Icon size={20} color={status.color} />
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: status.color }]}>
            {status.text}
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            {status.subtext}
          </Text>
        </View>
      </View>
      
      {(!networkState.isOnline || !connected) && (
        <TouchableOpacity onPress={handleRetry} style={styles.retryButtonLarge}>
          <RefreshCw size={16} color={status.color} />
          <Text style={[styles.retryText, { color: status.color }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  subtext: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  retryButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    gap: spacing.xs,
  },
  compactText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  retryButton: {
    padding: 2,
  },
});