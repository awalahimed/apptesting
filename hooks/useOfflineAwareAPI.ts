import { useState, useCallback, useEffect } from 'react';
import { orpc } from './orpc';
import { useNetworkState } from './useNetworkState';
import { useWebSocketContext } from './WebSocketContext';

interface APICallOptions {
  showOfflineMessage?: boolean;
  retryOnReconnect?: boolean;
  fallbackData?: any;
}

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  options: APICallOptions;
}

/**
 * Hook for making offline-aware API calls
 * Features:
 * - Queues requests when offline
 * - Retries failed requests when back online
 * - Provides fallback data when available
 * - UI feedback handled by OfflineBanner component
 */
export function useOfflineAwareAPI() {
  const { connected: wsConnected } = useWebSocketContext();
  const networkState = useNetworkState(wsConnected);
  const [requestQueue, setRequestQueue] = useState<QueuedRequest[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Process queued requests when back online
  const processQueue = useCallback(async () => {
    if (isProcessingQueue || requestQueue.length === 0 || !networkState.isOnline) {
      return;
    }

    setIsProcessingQueue(true);
    console.log(`📡 Processing ${requestQueue.length} queued requests...`);

    const currentQueue = [...requestQueue];
    setRequestQueue([]);

    for (const request of currentQueue) {
      try {
        const result = await request.fn();
        request.resolve(result);
        console.log(`✅ Queued request ${request.id} completed`);
      } catch (error) {
        console.log(`❌ Queued request ${request.id} failed:`, error);
        request.reject(error);
      }
    }

    setIsProcessingQueue(false);
  }, [requestQueue, networkState.isOnline, isProcessingQueue]);

  // Process queue when network comes back online
  useEffect(() => {
    if (networkState.isOnline && requestQueue.length > 0) {
      processQueue();
    }
  }, [networkState.isOnline, requestQueue.length, processQueue]);

  /**
   * Make an API call with offline handling
   */
  const makeAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: APICallOptions = {}
  ): Promise<T> => {
    const {
      retryOnReconnect = true,
      fallbackData = null
    } = options;

    // If online, make the call directly
    if (networkState.isOnline) {
      try {
        return await apiCall();
      } catch (error) {
        // If the call fails and we want to retry on reconnect, queue it
        if (retryOnReconnect && !networkState.isOnline) {
          return new Promise<T>((resolve, reject) => {
            const requestId = Date.now().toString();
            setRequestQueue(prev => [...prev, {
              id: requestId,
              fn: apiCall,
              resolve,
              reject,
              options
            }]);
          });
        }
        throw error;
      }
    }

    // If offline and we have fallback data, return it
    if (fallbackData !== null) {
      return fallbackData;
    }

    // If offline and we want to retry on reconnect, queue the request
    if (retryOnReconnect) {
      return new Promise<T>((resolve, reject) => {
        const requestId = Date.now().toString();
        setRequestQueue(prev => [...prev, {
          id: requestId,
          fn: apiCall,
          resolve,
          reject,
          options
        }]);
      });
    }

    // If offline and no fallback/retry, throw error
    throw new Error('No internet connection');
  }, [networkState.isOnline, setRequestQueue]);

  /**
   * Wrapper for common API calls
   */
  const api = {
    // Health checks
    healthCheck: (options?: APICallOptions) =>
      makeAPICall(() => orpc.health.check(), options),
    
    ping: (options?: APICallOptions) =>
      makeAPICall(() => orpc.health.ping(), options),
    
    networkTest: (clientTimestamp: number, options?: APICallOptions) =>
      makeAPICall(() => orpc.health.networkTest({ clientTimestamp }), options),

    // Profile calls
    getProfile: (userId: string, options?: APICallOptions) =>
      makeAPICall(() => orpc.profile.getProfile({ userId }), options),
    
    updateProfile: (data: any, options?: APICallOptions) =>
      makeAPICall(() => orpc.profile.updateProfile(data), options),

    // Order calls
    create: (data: any, options?: APICallOptions) =>
      makeAPICall(() => orpc.order.create(data), options),
    
    getById: (orderId: string, options?: APICallOptions) =>
      makeAPICall(() => orpc.order.getById({ orderId }), options),
    
    getMyOrders: (options?: APICallOptions) =>
      makeAPICall(() => orpc.order.getMyOrders(), options),

    // Notification calls
    getUserNotifications: (options?: APICallOptions) =>
      makeAPICall(() => orpc.notifications.getUserNotifications(), options),
    
    markAsRead: (notificationId: string, options?: APICallOptions) =>
      makeAPICall(() => orpc.notifications.markAsRead({ notificationId }), options),

    // Referral calls
    getMyReferralCode: (options?: APICallOptions) =>
      makeAPICall(() => orpc.referral.getMyReferralCode(), options),
    
    getStats: (options?: APICallOptions) =>
      makeAPICall(() => orpc.referral.getStats(), options),
  };

  return {
    networkState,
    requestQueue: requestQueue.length,
    isProcessingQueue,
    makeAPICall,
    api,
  };
}