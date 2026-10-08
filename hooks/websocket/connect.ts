import { RPCLink } from '@orpc/client/websocket'
import { createORPCClient } from '@orpc/client'
import { useState, useEffect, useRef } from 'react'
import { config } from '../../config/config'
import { SecureStore } from '@/utils/storage'
import { refreshTokens } from '../orpc'
import { useRouter } from 'expo-router'
import { AppState, AppStateStatus } from 'react-native'

import { 
  Notifications, 
  isNotificationsAvailable, 
  requestPermissions, 
  scheduleNotification, 
  setNotificationHandler, 
  addNotificationResponseListener 
} from '../../utils/notifications'

type OrderBroadcast = {
  type: 'order_broadcast'
  data: {
    orderId: string
    pickupAddress: string
    deliveryAddress: string
    materials: unknown
    estimatedPrice: string
    vehicleType: string
    notes: string | null
    pickupLocation: { latitude: string; longitude: string }
  }
}

// *** NEW: Order update event type
type OrderUpdate = {
  type: 'order_update'
  orderId: string
  status: string
  driver?: {
    id: string
    name: string
    phone: string
    vehicleInfo: string
  } | null
  driverLocation?: {
    latitude: string
    longitude: string
  } | null
}

// *** NEW: Order assigned event type
type OrderAssigned = {
  type: 'order_assigned'
  data: {
    orderId: string
    customerId: string
    customerName: string
    customerPhone: string | null
    pickupAddress: string
    deliveryAddress: string
    materials: unknown
    vehicleType: string
    notes: string | null
    status: string
    finalPrice: string
    pickupLocation: { latitude: string; longitude: string }
    deliveryLocation: { latitude: string; longitude: string }
  }
}

type NotificationMessage = {
  type: 'notification'
  data: {
    id: string
    title: string
    body: string
    notificationType: string
    orderId?: string
    status?: string
    timestamp: string
  }
}

// Configure notification handler (only if available)
if (isNotificationsAvailable()) {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const useWebSocket = () => {
  const router = useRouter()
  const [websocket, setWebSocket] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [incomingOrder, setIncomingOrder] = useState<OrderBroadcast['data'] | null>(null)
  // *** NEW: State for assigned order push notification
  const [assignedOrder, setAssignedOrder] = useState<OrderAssigned['data'] | null>(null)
  // *** NEW: State for order updates (status changes, driver location, etc.)
  const [orderUpdate, setOrderUpdate] = useState<OrderUpdate | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const orpcClientRef = useRef<any>(null)
  const maxReconnectAttempts = 5
  const [isAppActive, setIsAppActive] = useState(true)
  const [lastDisconnectReason, setLastDisconnectReason] = useState<string>('')

  const wsUrl = config.api.wsUrl || 'ws://localhost:8080'

  // Handle app state changes for better reconnection logic
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed to:', nextAppState);
      setIsAppActive(nextAppState === 'active');
      
      if (nextAppState === 'active') {
        // App became active - try to reconnect if disconnected
        if (!connected && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log('App became active, attempting to reconnect WebSocket...');
          setTimeout(() => connect(), 1000); // Small delay to ensure app is fully active
        }
      } else if (nextAppState === 'background') {
        // App went to background - don't aggressively reconnect
        console.log('App went to background, pausing reconnection attempts');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [connected]);

  // Handle notification tap
  useEffect(() => {
    if (!isNotificationsAvailable()) return

    const subscription = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data
      const notificationType = data.notificationType as string
      const orderId = data.orderId as string
      
      // Navigate based on notification type
      switch (notificationType) {
        case 'order_approved':
        case 'order_rejected':
          // Customer: Go to home (orders list)
          router.push('/(tabs)/user/home')
          break
          
        case 'new_offer':
          // Customer: Go to order tracking to see offers
          if (orderId) {
            router.push(`/order?id=${orderId}`)
          }
          break
          
        case 'order_assigned':
        case 'order_on_the_way':
        case 'order_delivered':
          // Customer: Go to order tracking
          if (orderId) {
            router.push(`/order?id=${orderId}`)
          }
          break
          
        case 'offer_accepted':
          // Driver: Go to assigned orders
          router.push('/(tabs)/driver/offers')
          break
          
        case 'order_completed':
          // Driver: Go to orders/history
          router.push('/(tabs)/shared/orders')
          break
          
        case 'order_cancelled':
          // Driver: Go to offers
          router.push('/(tabs)/driver/offers')
          break
          
        case 'announcement':
          // Go to announcements
          router.push('/shared/announcements')
          break
          
        default:
          // Default: Go to notifications screen
          router.push('/(tabs)/shared/notifications')
      }
    })

    return () => subscription.remove()
  }, [])

  const handleNotification = async (notification: NotificationMessage['data']) => {
    try {
      // Schedule local notification for background (only if available)
      if (isNotificationsAvailable()) {
        await scheduleNotification({
          title: notification.title,
          body: notification.body,
          data: {
            orderId: notification.orderId,
            status: notification.status,
            notificationType: notification.notificationType,
          },
        })
      }
    } catch (error) {
      console.error('Failed to handle notification:', error)
    }
  }

  const connect = async () => {
    try {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      try {
        await refreshTokens()
      } catch (e) {
        console.log('[WS] refreshTokens failed (will try stored token):', e)
      }

      const token = await SecureStore.getItemAsync('auth_access_token')
      if (!token) {
        console.log('No auth token, skipping WebSocket connection')
        return
      }
      
      const wsUrlWithAuth = `${wsUrl}?token=${token}`
      
      const ws = new WebSocket(wsUrlWithAuth)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
        setWebSocket(ws)
        reconnectAttemptsRef.current = 0
        setReconnectAttempts(0)
        
        try {
          const link = new RPCLink({ websocket: ws })
          const client: any = createORPCClient(link)
          
          // Store in ref instead of state
          orpcClientRef.current = client
          
          console.log('✅ oRPC client created and stored in ref')
        } catch (e) {
          console.log('oRPC client setup error:', e)
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Handle order broadcasts
          if (message.type === 'order_broadcast') {
            setIncomingOrder(message.data)
          }
          
          // *** NEW: Handle order assigned push notification
          if (message.type === 'order_assigned') {
            console.log('🔔 Order assigned via WebSocket:', message.data)
            setAssignedOrder(message.data)
            
            // Show notification
            handleNotification({
              id: message.data.orderId,
              title: '🚗 Order Assigned!',
              body: `You have been assigned to deliver for ${message.data.customerName}`,
              notificationType: 'order_assigned',
              orderId: message.data.orderId,
              status: message.data.status,
              timestamp: new Date().toISOString(),
            })
          }
          
          // *** NEW: Handle order update push notifications (status, driver location, etc.)
          if (message.type === 'order_update') {
            console.log('🔔 Order update via WebSocket:', message)
            setOrderUpdate(message)
          }
          
          // Handle notifications
          if (message.type === 'notification') {
            handleNotification(message.data)
          }
        } catch (error) {
          console.log('WebSocket message parse error:', error)
        }
      }

      ws.onclose = (event) => {
        const reason = event.reason || 'Unknown reason';
        console.log('WebSocket disconnected:', event.code, reason);
        setLastDisconnectReason(reason);
        setConnected(false)
        setWebSocket(null)
        orpcClientRef.current = null

        // Only attempt reconnection if app is active and we haven't exceeded max attempts
        if (isAppActive && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const attempt = reconnectAttemptsRef.current + 1
          reconnectAttemptsRef.current = attempt
          setReconnectAttempts(attempt)

          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt - 1) * 1000;
          const jitter = Math.random() * 1000;
          const delay = Math.min(baseDelay + jitter, 30000); // Max 30 seconds
          
          console.log(`Scheduling reconnection attempt ${attempt}/${maxReconnectAttempts} in ${Math.round(delay/1000)}s`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAppActive) { // Double-check app is still active
              connect()
            }
          }, delay)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached. Will retry when app becomes active.');
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnected(false)
        
        // Log error details but don't show UI notifications (banner will handle this)
        if (isAppActive) {
          console.log('WebSocket error occurred while app is active:', error);
        }
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const disconnect = () => {
    console.log('Manually disconnecting WebSocket...');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (websocket) {
      websocket.close(1000, 'Manual disconnect'); // Normal closure
    }
    reconnectAttemptsRef.current = maxReconnectAttempts
    setReconnectAttempts(maxReconnectAttempts)
  }

  const forceReconnect = () => {
    console.log('Force reconnecting WebSocket...');
    disconnect();
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    setTimeout(() => connect(), 1000);
  }

  useEffect(() => {
    // Request notification permissions (only if available)
    const requestNotificationPermissions = async () => {
      if (isNotificationsAvailable()) {
        const { status } = await requestPermissions()
        if (status !== 'granted') {
          console.log('Notification permissions not granted')
        }
      }
    }
    
    requestNotificationPermissions()

    // Delay WebSocket connection to allow auth to initialize
    const timer = setTimeout(() => {
      connect()
    }, 2000)
    
    return () => { 
      clearTimeout(timer)
      disconnect() 
    }
  }, [])

  return { 
    websocket, 
    orpcClient: orpcClientRef.current,
    connected, 
    reconnectAttempts,
    incomingOrder,
    setIncomingOrder,
    // *** NEW: Expose assigned order state
    assignedOrder,
    setAssignedOrder,
    // *** NEW: Expose order update state
    orderUpdate,
    setOrderUpdate,
    connect,
    disconnect,
    forceReconnect,
    isAppActive,
    lastDisconnectReason,
  }
}