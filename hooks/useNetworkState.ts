import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { orpc } from './orpc';

interface NetworkState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  latency?: number; // Round-trip time in milliseconds
  lastCheck?: number; // Timestamp of last connectivity check
  lastBackendCheck?: number; // Timestamp of last backend ping
}

interface ConnectivityTestResult {
  isOnline: boolean;
  latency?: number;
  error?: string;
}

/**
 * Optimized network state detection with minimal backend pings
 * Strategy:
 * 1. Use native network detection as primary source
 * 2. Use WebSocket connection state as backend connectivity indicator
 * 3. Only ping backend when absolutely necessary
 * 4. Implement exponential backoff for failed connections
 */
export function useNetworkState(wsConnected: boolean = false): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isConnected: wsConnected,
    connectionType: 'unknown',
    latency: undefined,
    lastCheck: undefined,
    lastBackendCheck: undefined,
  });

  const backendCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consecutiveFailures = useRef(0);
  const lastSuccessfulPing = useRef<number>(Date.now());

  // Test backend connectivity (used sparingly)
  const testBackendConnectivity = async (): Promise<ConnectivityTestResult> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const result = await orpc.health.ping();
      
      clearTimeout(timeoutId);
      
      if (result.pong === 'pong') {
        const latency = Date.now() - startTime;
        consecutiveFailures.current = 0; // Reset failure count
        lastSuccessfulPing.current = Date.now();
        
        return {
          isOnline: true,
          latency,
        };
      }
      
      consecutiveFailures.current++;
      return {
        isOnline: false,
        error: 'Invalid response from health check',
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      consecutiveFailures.current++;
      
      // Only log significant errors
      if (consecutiveFailures.current <= 2) {
        console.log('Backend connectivity test failed:', error.message);
      }
      
      return {
        isOnline: false,
        latency,
        error: error.message || 'Unknown error',
      };
    }
  };

  // Get exponential backoff delay based on consecutive failures
  const getBackoffDelay = (): number => {
    const baseDelay = 60000; // 1 minute base delay
    const maxDelay = 300000; // 5 minutes max delay
    const delay = Math.min(baseDelay * Math.pow(2, consecutiveFailures.current), maxDelay);
    return delay;
  };

  // Determine if we need to ping the backend
  const shouldPingBackend = (): boolean => {
    const now = Date.now();
    const timeSinceLastCheck = now - (networkState.lastBackendCheck || 0);
    const timeSinceLastSuccess = now - lastSuccessfulPing.current;
    
    // Don't ping if WebSocket is connected (backend is clearly reachable)
    if (wsConnected) return false;
    
    // Don't ping if we recently checked (within last 2 minutes)
    if (timeSinceLastCheck < 120000) return false;
    
    // Ping if we haven't had a successful ping in over 5 minutes
    if (timeSinceLastSuccess > 300000) return true;
    
    // Ping if network just came back online and we're not sure about backend
    if (networkState.isOnline && !networkState.isConnected && timeSinceLastCheck > 60000) return true;
    
    return false;
  };

  // Schedule a backend check with exponential backoff
  const scheduleBackendCheck = () => {
    if (backendCheckTimeoutRef.current) {
      clearTimeout(backendCheckTimeoutRef.current);
    }

    const delay = getBackoffDelay();
    console.log(`Scheduling backend check in ${Math.round(delay / 1000)}s (failures: ${consecutiveFailures.current})`);
    
    backendCheckTimeoutRef.current = setTimeout(async () => {
      if (shouldPingBackend()) {
        console.log('Performing scheduled backend connectivity check...');
        const result = await testBackendConnectivity();
        
        setNetworkState(prev => ({
          ...prev,
          isConnected: wsConnected || result.isOnline,
          latency: result.latency,
          lastBackendCheck: Date.now(),
        }));
        
        // Schedule next check if still having issues
        if (!result.isOnline && consecutiveFailures.current < 10) {
          scheduleBackendCheck();
        }
      }
    }, delay);
  };

  // Handle native network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      const connectionType = state.type === 'wifi' ? 'wifi' : 
                           state.type === 'cellular' ? 'cellular' : 
                           state.type === 'none' ? 'none' : 'unknown';

      console.log('Native network state changed:', { 
        isConnected, 
        type: state.type, 
        isInternetReachable: state.isInternetReachable 
      });

      setNetworkState(prev => {
        const wasOnline = prev.isOnline;
        // Be more conservative - only consider online if both connected AND internet reachable
        const nowOnline = isConnected && (state.isInternetReachable !== false);
        
        // If network just came back online, we might need to check backend
        if (!wasOnline && nowOnline && !wsConnected) {
          // Schedule a backend check in 2 seconds to give network time to stabilize
          setTimeout(() => {
            if (shouldPingBackend()) {
              testBackendConnectivity().then(result => {
                setNetworkState(current => ({
                  ...current,
                  isConnected: wsConnected || result.isOnline,
                  latency: result.latency,
                  lastBackendCheck: Date.now(),
                }));
              });
            }
          }, 2000);
        }

        return {
          ...prev,
          isOnline: nowOnline,
          isConnected: wsConnected || (nowOnline && prev.isConnected),
          connectionType,
          lastCheck: Date.now(),
        };
      });
    });

    return unsubscribe;
  }, [wsConnected]);

  // Update WebSocket connection status
  useEffect(() => {
    setNetworkState(prev => {
      const wasConnected = prev.isConnected;
      const nowConnected = wsConnected || (prev.isOnline && prev.isConnected);
      
      // If WebSocket just connected, we know backend is reachable
      if (!wasConnected && wsConnected) {
        consecutiveFailures.current = 0;
        lastSuccessfulPing.current = Date.now();
        
        // Clear any pending backend checks
        if (backendCheckTimeoutRef.current) {
          clearTimeout(backendCheckTimeoutRef.current);
          backendCheckTimeoutRef.current = null;
        }
      }
      
      // If WebSocket disconnected, we might need to check backend later
      if (wasConnected && !wsConnected && prev.isOnline) {
        scheduleBackendCheck();
      }

      return {
        ...prev,
        isConnected: nowConnected,
      };
    });
  }, [wsConnected]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App became active');
        
        // Only check backend if we really need to
        if (shouldPingBackend()) {
          console.log('App became active, checking backend connectivity...');
          testBackendConnectivity().then(result => {
            setNetworkState(prev => ({
              ...prev,
              isConnected: wsConnected || result.isOnline,
              latency: result.latency,
              lastBackendCheck: Date.now(),
            }));
          });
        }
      } else if (nextAppState === 'background') {
        // Clear any pending checks when app goes to background
        if (backendCheckTimeoutRef.current) {
          clearTimeout(backendCheckTimeoutRef.current);
          backendCheckTimeoutRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [wsConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (backendCheckTimeoutRef.current) {
        clearTimeout(backendCheckTimeoutRef.current);
      }
    };
  }, []);

  return networkState;
}