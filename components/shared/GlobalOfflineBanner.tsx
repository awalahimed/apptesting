import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner } from './OfflineBanner';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { useNetworkState } from '@/hooks/useNetworkState';

/**
 * Global offline banner that appears at the top of the screen
 * when there's no connectivity. Shows immediately when offline.
 */
export function GlobalOfflineBanner() {
  const insets = useSafeAreaInsets();
  const { connected, forceReconnect } = useWebSocketContext();
  const networkState = useNetworkState(connected);

  // Show banner when:
  // 1. No network connection at all, OR
  // 2. Network available but backend unreachable (WebSocket down + no recent backend success)
  const shouldShowOffline = !networkState.isOnline || 
    (networkState.isOnline && !connected && networkState.lastBackendCheck && 
     Date.now() - networkState.lastBackendCheck > 60000); // 1 minute without backend

  if (!shouldShowOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OfflineBanner onRetry={forceReconnect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000, // High z-index to appear above other content
  },
});