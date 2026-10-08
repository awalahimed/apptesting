import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Modal, Image } from 'react-native'
import { useWebSocketContext } from '../../hooks/WebSocketContext'
import { Truck, Package, DollarSign, X, Navigation, Clock, Car, Bike, ArrowRight } from 'lucide-react-native'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'
import { useTheme } from '@/hooks/ThemeContext'
import { MapComponent } from '../shared/MapComponent'
import { config } from '@/config/config'
import * as Location from 'expo-location'
import { getAvatarSize, getCardPadding, getMapHeight } from '@/utils/responsive'
import { useAuth } from '@/hooks/AuthContext'
import { accountStatus } from '@/constants/userRoles'

interface OrderSearchSheetProps {
  visible: boolean
  onClose: () => void
  onSelectOrder?: (order: any) => void
}

export const OrderSearchSheet: React.FC<OrderSearchSheetProps> = ({ visible, onClose }) => {
  const { orpcClient, connected } = useWebSocketContext()
  const { colors } = useTheme()
  const { session } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [offeredPrice, setOfferedPrice] = useState('')
  const [priceError, setPriceError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [, setLockedOrderId] = useState<string | null>(null)
  const [routeDistance, setRouteDistance] = useState<string | null>(null)
  const [routeDuration, setRouteDuration] = useState<string | null>(null)

  // Get account status
  const userAccountStatus = session?.user?.accountStatus
  const isPending = userAccountStatus === accountStatus.PENDING
  const isApproved = userAccountStatus === accountStatus.ACTIVE

  // Format time ago helper
  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const createdAt = new Date(date)
    const diffMs = now.getTime() - createdAt.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    (async () => {
      try {
        const { status} = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
          setDriverLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          })
        }
      } catch (error) {
        console.log('Location error:', error)
      }
    })()
  }, [])

  useEffect(() => {
    if (!visible) {
      setLoading(false)
      return
    }

    // Don't make API calls if user is not a driver
    if (!session?.user || session.user.role !== 'driver') {
      setLoading(false)
      return
    }

    if (!connected || !orpcClient) {
      console.log('⏳ Waiting for connection... connected:', connected, 'orpcClient:', !!orpcClient)
      setLoading(true)
      return
    }

    const fetchOrders = async () => {
      try {
        setLoading(true)
        console.log('📡 Fetching orders from WebSocket...')
        
        const result = await orpcClient.driver.getAvailableOrders()
        console.log('📦 Received orders:', result.orders?.length || 0)
        console.log('🔒 Lock status:', result.isLocked ? 'LOCKED' : 'UNLOCKED')
        console.log('👤 Account status:', result.accountStatus)
        
        // Log materials for each order
        result.orders?.forEach((order: any) => {
          console.log(`📦 Order ${order.id} materials:`, order.materials)
        })
        
        setIsLocked(result.isLocked || false)
        setLockedOrderId(result.lockedOrderId || null)
        
        // If account is not approved, don't show any orders
        if (result.accountStatus && result.accountStatus !== 'active') {
          setOrders([])
          setLoading(false)
          return
        }
        
        const allOrders = result.orders || []
        
        // Parse materials if they come as JSON strings
        const parsedOrders = allOrders.map((order: any) => {
          let materials = order.materials
          if (typeof materials === 'string') {
            try {
              materials = JSON.parse(materials)
            } catch (e) {
              console.error('Failed to parse materials:', e)
              materials = []
            }
          }
          return { ...order, materials }
        })
        
        const visibleOrders = parsedOrders
          .filter((o: any) => ['approved', 'has_offers', 'assigned', 'accepted'].includes(o?.status))
          .sort((a: any, b: any) => {
            const rank = (s: string) => (s === 'approved' ? 0 : s === 'has_offers' ? 1 : 2)
            const r = rank(a?.status) - rank(b?.status)
            if (r !== 0) return r
            return new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
          })

        setOrders(visibleOrders)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [visible, connected, orpcClient, session?.user?.role])

  // Listen for incoming order broadcasts
  useEffect(() => {
    if (!visible || !connected || !orpcClient) return
    
    // Don't handle broadcasts if user is not a driver
    if (!session?.user || session.user.role !== 'driver') return

    const handleIncomingOrder = async () => {
      console.log('📢 New order broadcast received, refreshing orders...')
      try {
        const result = await orpcClient.driver.getAvailableOrders()
        const allOrders = result.orders || []
        
        // Parse materials if they come as JSON strings
        const parsedOrders = allOrders.map((order: any) => {
          let materials = order.materials
          if (typeof materials === 'string') {
            try {
              materials = JSON.parse(materials)
            } catch (e) {
              console.error('Failed to parse materials:', e)
              materials = []
            }
          }
          return { ...order, materials }
        })
        
        const visibleOrders = parsedOrders
          .filter((o: any) => ['approved', 'has_offers', 'assigned', 'accepted'].includes(o?.status))
          .sort((a: any, b: any) => {
            const rank = (s: string) => (s === 'approved' ? 0 : s === 'has_offers' ? 1 : 2)
            const r = rank(a?.status) - rank(b?.status)
            if (r !== 0) return r
            return new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
          })
        setOrders(visibleOrders)
      } catch (error) {
        console.error('Failed to refresh orders:', error)
      }
    }

    // Check for incoming orders from WebSocket context
    const checkInterval = setInterval(() => {
      // This will trigger when incomingOrder changes in WebSocket context
      handleIncomingOrder()
    }, 5000)

    return () => clearInterval(checkInterval)
  }, [visible, connected, orpcClient, session?.user?.role])

  const handleSelectOrder = (order: any) => {
    console.log('🔍 Selected order:', order.id)
    console.log('🔍 Order materials:', order.materials)
    console.log('🔍 Materials is array?', Array.isArray(order.materials))
    console.log('🔍 Materials length:', order.materials?.length)
    
    setSelectedOrder(order)
    const existingOffer = order.driverOffer
    // Format existing offer with commas
    setOfferedPrice(existingOffer ? formatNumberWithCommas(existingOffer.toString()) : '')
    setShowDetailsModal(true)
    setRouteDistance(null)
    setRouteDuration(null)
    
    // Fetch route info
    if (driverLocation && order.pickupLocation && order.deliveryLocation) {
      fetchRouteInfo(order)
    }
  }

  const fetchRouteInfo = async (order: any) => {
    try {
      const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || ''
      if (!GEBETA_API_KEY || !driverLocation) return

      // Fetch route from driver to pickup
      const origin = `{${driverLocation.lat},${driverLocation.lng}}`
      const pickup = `{${order.pickupLocation.latitude},${order.pickupLocation.longitude}}`
      const delivery = `{${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}}`
      
      // Get total route: driver -> pickup -> delivery
      const response1 = await fetch(
        `https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(pickup)}&apiKey=${GEBETA_API_KEY}`
      )
      
      const response2 = await fetch(
        `https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(delivery)}&apiKey=${GEBETA_API_KEY}`
      )
      
      if (response1.ok && response2.ok) {
        const data1 = await response1.json()
        const data2 = await response2.json()
        
        const totalDistance = (data1.totalDistance || 0) + (data2.totalDistance || 0)
        const totalTime = (data1.timetaken || 0) + (data2.timetaken || 0)
        
        const distanceKm = (totalDistance / 1000).toFixed(1)
        const durationMin = Math.round(totalTime / 60)
        
        // Format duration: show hours if >= 60 minutes
        let durationText = ''
        if (durationMin < 60) {
          durationText = `${durationMin} min`
        } else {
          const hours = Math.floor(durationMin / 60)
          const mins = durationMin % 60
          if (mins === 0) {
            durationText = `${hours} hr${hours > 1 ? 's' : ''}`
          } else {
            durationText = `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`
          }
        }
        
        setRouteDistance(`${distanceKm} km`)
        setRouteDuration(durationText)
      }
    } catch (error) {
      console.error('Error fetching route info:', error)
    }
  }

  const isOrderAssigned = selectedOrder?.status === 'assigned'

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')
    
    // Split by decimal point
    const parts = cleaned.split('.')
    
    // Add commas to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Limit to 2 decimal places
    if (parts[1]) {
      parts[1] = parts[1].substring(0, 2)
    }
    
    return parts.join('.')
  }

  // Parse formatted number to float
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, ''))
  }

  const handleSubmitOffer = async () => {
    if (!orpcClient || !selectedOrder) {
      console.log('Cannot submit: missing orpcClient or selectedOrder')
      return
    }

    const price = parseFormattedNumber(offeredPrice)
    
    // Validate price
    if (isNaN(price) || price <= 0) {
      setPriceError('Please enter a valid price')
      return
    }
    
    if (price > 99999999.99) {
      setPriceError('Price cannot exceed 99,999,999.99 ETB')
      return
    }
    
    setPriceError('') // Clear any previous errors

    try {
      setSubmitting(true)
      await orpcClient.driver.createOffer({
        orderId: selectedOrder.id,
        offeredPrice: price,
      })
      
      handleCancel()
      
      // Show loading state while refreshing
      setLoading(true)
      
      const result = await orpcClient.driver.getAvailableOrders()
      const allOrders = result.orders || []
      
      // Parse materials if they come as JSON strings
      const parsedOrders = allOrders.map((order: any) => {
        let materials = order.materials
        if (typeof materials === 'string') {
          try {
            materials = JSON.parse(materials)
          } catch (e) {
            console.error('Failed to parse materials:', e)
            materials = []
          }
        }
        return { ...order, materials }
      })
      
      const visibleOrders = parsedOrders
        .filter((o: any) => ['approved', 'has_offers', 'assigned', 'accepted'].includes(o?.status))
        .sort((a: any, b: any) => {
          const rank = (s: string) => (s === 'approved' ? 0 : s === 'has_offers' ? 1 : 2)
          const r = rank(a?.status) - rank(b?.status)
          if (r !== 0) return r
          return new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
        })
      
      setOrders(visibleOrders)
    } catch (error: any) {
      console.error('Failed to submit offer:', error)
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowDetailsModal(false)
    setTimeout(() => {
      setSelectedOrder(null)
      setOfferedPrice('')
    }, 300)
  }

  const routeData = useMemo(() => {
    if (!selectedOrder || !driverLocation) {
      console.log('❌ No routeData: selectedOrder or driverLocation missing', {
        hasSelectedOrder: !!selectedOrder,
        hasDriverLocation: !!driverLocation
      })
      return null
    }
    
    const pickupLoc = selectedOrder.pickupLocation
    const deliveryLoc = selectedOrder.deliveryLocation
    
    if (!pickupLoc || !deliveryLoc) {
      console.log('❌ No routeData: pickup or delivery location missing', {
        hasPickup: !!pickupLoc,
        hasDelivery: !!deliveryLoc
      })
      return null
    }
    
    const route = {
      driver: driverLocation,
      pickup: {
        lat: parseFloat(pickupLoc.latitude),
        lng: parseFloat(pickupLoc.longitude),
      },
      delivery: {
        lat: parseFloat(deliveryLoc.latitude),
        lng: parseFloat(deliveryLoc.longitude),
      },
      vehicleType: selectedOrder.vehicleType as 'truck' | 'car' | 'motorcycle',
    }
    
    console.log('✅ RouteData created:', JSON.stringify(route, null, 2))
    return route
  }, [selectedOrder, driverLocation])

  const VehicleIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'motorcycle':
        return <Bike size={14} color={colors.primary} />
      case 'car':
        return <Car size={14} color={colors.primary} />
      case 'truck':
        return <Truck size={14} color={colors.primary} />
      default:
        return <Package size={14} color={colors.primary} />
    }
  }

  const SkeletonCard = () => (
    <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
        <View style={styles.skeletonTextContainer}>
          <View style={[styles.skeletonText, { width: '60%', backgroundColor: colors.border }]} />
          <View style={[styles.skeletonText, { width: '40%', height: 12, marginTop: 4, backgroundColor: colors.border }]} />
        </View>
      </View>
      <View style={[styles.skeletonDivider, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonText, { width: '80%', marginBottom: 8, backgroundColor: colors.border }]} />
      <View style={[styles.skeletonText, { width: '70%', marginBottom: 8, backgroundColor: colors.border }]} />
      <View style={[styles.skeletonText, { width: '50%', backgroundColor: colors.border }]} />
    </View>
  )

  if (!visible) return null

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {!connected || !orpcClient ? (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Connecting to server...</Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButtonCenter, { backgroundColor: colors.primary }]}>
                <Text style={[styles.closeButtonText, { color: '#FFFFFF' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Available Orders</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary, backgroundColor: colors.surface }]}>Loading orders...</Text>
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.ordersGrid}>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </View>
              </ScrollView>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {isLocked ? '🔒 Assigned Order' : 'Available Orders'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
                {isLocked 
                  ? 'You are locked to this order. Complete it to see other orders.'
                  : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} available`
                }
              </Text>

              {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Package size={64} color={colors.textSecondary} />
                  {isPending ? (
                    <>
                      <Text style={[styles.emptyText, { color: colors.text }]}>Account Pending Approval</Text>
                      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        Your account is being reviewed. You'll be able to view and accept orders once approved.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.emptyText, { color: colors.text }]}>No orders available</Text>
                      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        New orders will appear here when they match your vehicle type
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.ordersGrid}>
                  {orders.map(order => {
                    const hasOffer = order.hasOffer && order.driverOffer
                    const customerName = order.customerName || 'Customer'
                    const customerInitial = customerName.charAt(0).toUpperCase()
                    const isAssigned = order.status === 'assigned'
                    
                    // Debug materials
                    console.log(`🎨 Rendering order ${order.id}:`, {
                      hasMaterials: !!order.materials,
                      isArray: Array.isArray(order.materials),
                      length: order.materials?.length,
                      materials: order.materials
                    })
                    
                    return (
                      <TouchableOpacity
                        key={order.id}
                        style={[
                          styles.orderCard,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          hasOffer && styles.orderCardWithOffer,
                          isAssigned && styles.orderCardAssigned
                        ]}
                        onPress={() => handleSelectOrder(order)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.statusBadge, 
                          isAssigned ? { backgroundColor: colors.warning + '20', borderColor: colors.warning } : (hasOffer ? { backgroundColor: colors.success + '20', borderColor: colors.success } : { backgroundColor: colors.error + '20', borderColor: colors.error })
                        ]}>
                          <Text style={[
                            styles.statusBadgeText, 
                            { color: isAssigned ? colors.warning : (hasOffer ? colors.success : colors.error) }
                          ]}>
                            {isAssigned ? '🔒 ASSIGNED' : (hasOffer ? `✓ ${order.driverOffer} ETB` : '✗ Not Set')}
                          </Text>
                        </View>

                        <View style={styles.customerSection}>
                          {order.customerProfilePhoto ? (
                            <Image
                              source={{ uri: `${config.api.uploadsUrl}/${order.customerProfilePhoto}` }}
                              style={[styles.customerAvatar, { backgroundColor: colors.primary }]}
                            />
                          ) : (
                            <View style={[styles.customerAvatar, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.customerInitial, { color: '#FFFFFF' }]}>{customerInitial}</Text>
                            </View>
                          )}
                          <View style={styles.customerInfo}>
                            <Text style={[styles.customerName, { color: colors.text }]}>{customerName}</Text>
                            <View style={[styles.vehicleBadgeSmall, { backgroundColor: colors.primary + '20' }]}>
                              <VehicleIcon type={order.vehicleType} />
                              <Text style={[styles.vehicleTextSmall, { color: colors.primary }]}>
                                {order.vehicleType?.charAt(0).toUpperCase() + order.vehicleType?.slice(1)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.locationSection}>
                          <View style={styles.locationRow}>
                            <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
                              {order.pickupAddress}
                            </Text>
                          </View>
                          
                          <View style={[styles.locationConnector, { backgroundColor: colors.border }]} />
                          
                          <View style={styles.locationRow}>
                            <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
                              {order.deliveryAddress}
                            </Text>
                          </View>
                        </View>

                        {order.materials && order.materials.length > 0 && (
                          <View style={[styles.materialsRow, { borderTopColor: colors.border }]}>
                            <Package size={12} color={colors.textSecondary} />
                            <Text style={[styles.materialsText, { color: colors.textSecondary }]} numberOfLines={1}>
                              {Array.isArray(order.materials) ? order.materials.join(', ') : String(order.materials)}
                            </Text>
                          </View>
                        )}

                        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                          <View style={styles.timeRow}>
                            <Clock size={12} color={colors.textSecondary} />
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                              {formatTimeAgo(order.createdAt)}
                            </Text>
                          </View>
                          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
                            {hasOffer ? 'View Details' : 'Make Offer'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={[styles.detailsModalContainer, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.detailsScrollContent}>
            {selectedOrder && (
              <>
                <View style={[styles.mapContainerLarge, { backgroundColor: colors.background }]}>
                  {/* Distance and Time at Top */}
                  {(routeDistance || routeDuration) && (
                    <View style={[styles.routeInfoTop, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.routeInfoText, { color: colors.text }]}>
                        {routeDistance && `📏 ${routeDistance}`}
                        {routeDistance && routeDuration && '  •  '}
                        {routeDuration && `⏱️ ${routeDuration}`}
                      </Text>
                    </View>
                  )}
                  
                  {routeData ? (
                    <MapComponent style={styles.mapLarge} route={routeData} />
                  ) : (
                    <View style={[styles.mapPlaceholder, { backgroundColor: colors.background }]}>
                      <Navigation size={32} color={colors.textSecondary} />
                      <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>Loading map...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.sheetHeader}>
                    <Text style={[styles.sheetTitle, { color: colors.text }]}>Order Details</Text>
                    <TouchableOpacity onPress={handleCancel} style={styles.closeButtonSheet}>
                      <X size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Addresses */}
                  <View style={[styles.addressesSection, { backgroundColor: colors.surface }]}>
                    <View style={styles.addressRow}>
                      <View style={[styles.addressDot, { backgroundColor: '#FF6B35' }]} />
                      <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                        {selectedOrder.pickupAddress}
                      </Text>
                    </View>
                    <View style={styles.addressRow}>
                      <View style={[styles.addressDot, { backgroundColor: '#34C759' }]} />
                      <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                        {selectedOrder.deliveryAddress}
                      </Text>
                    </View>
                  </View>

                  {/* Materials List */}
                  {selectedOrder.materials && selectedOrder.materials.length > 0 && (
                    <View style={[styles.materialsSection, { backgroundColor: colors.surface }]}>
                      <View style={styles.materialsSectionHeader}>
                        <Package size={18} color={colors.primary} />
                        <Text style={[styles.materialsSectionTitle, { color: colors.text }]}>Materials to Deliver</Text>
                      </View>
                      <View style={styles.materialsList}>
                        {(Array.isArray(selectedOrder.materials) ? selectedOrder.materials : []).map((material: string, index: number) => (
                          <View key={index} style={[styles.materialChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                            <Text style={[styles.materialChipText, { color: colors.primary }]}>{material}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Vehicle Type */}
                  <View style={[styles.vehicleSection, { backgroundColor: colors.surface }]}>
                    <VehicleIcon type={selectedOrder.vehicleType} />
                    <Text style={[styles.vehicleLabel, { color: colors.textSecondary }]}>Vehicle Required:</Text>
                    <Text style={[styles.vehicleValue, { color: colors.text }]}>
                      {selectedOrder.vehicleType?.charAt(0).toUpperCase() + selectedOrder.vehicleType?.slice(1)}
                    </Text>
                  </View>

                  {!isOrderAssigned ? (
                    <>
                      <View style={styles.offerSection}>
                        <Text style={[styles.offerLabel, { color: colors.text }]}>
                          {selectedOrder.driverOffer ? 'Your Offer' : 'Enter Your Offer'}
                        </Text>
                        <View style={[
                          styles.priceInputContainer, 
                          { 
                            backgroundColor: colors.surface, 
                            borderColor: priceError ? '#EF4444' : colors.border,
                            borderWidth: priceError ? 2 : 1,
                          }
                        ]}>
                          <DollarSign size={20} color={colors.textSecondary} />
                          <TextInput
                            style={[styles.priceInput, { color: colors.text }]}
                            value={offeredPrice}
                            onChangeText={(text) => {
                              setOfferedPrice(formatNumberWithCommas(text))
                              // Clear error when user starts typing
                              if (priceError) setPriceError('')
                            }}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                            editable={!submitting}
                          />
                          <Text style={[styles.currency, { color: colors.primary }]}>ETB</Text>
                        </View>
                        {priceError ? (
                          <Text style={[styles.errorText, { color: '#EF4444' }]}>
                            {priceError}
                          </Text>
                        ) : (
                          <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            {selectedOrder.driverOffer 
                              ? 'You can update your offer'
                              : 'Enter your delivery charge (max: 99,999,999.99 ETB)'}
                          </Text>
                        )}
                      </View>

                      <View style={styles.buttonRow}>
                        <TouchableOpacity 
                          style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={handleCancel}
                          disabled={submitting}
                        >
                          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.buttonDisabled]}
                          onPress={handleSubmitOffer}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                              {selectedOrder.driverOffer ? 'Update Offer' : 'Submit Offer'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.lockedNotice, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                      <Text style={[styles.lockedNoticeTitle, { color: colors.warning }]}>🔒 Order Assigned</Text>
                      <Text style={[styles.lockedNoticeText, { color: colors.text }]}>
                        This order has been assigned to you. Complete the delivery to unlock and see other orders.
                      </Text>
                      <TouchableOpacity 
                        style={[styles.button, styles.closeOnlyButton, { backgroundColor: colors.primary }]}
                        onPress={handleCancel}
                      >
                        <Text style={[styles.closeOnlyButtonText, { color: '#FFFFFF' }]}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonSheet: {
    padding: spacing.xs,
  },
  closeButtonCenter: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  loadingText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  ordersGrid: {
    padding: spacing.md,
    gap: spacing.md,
  },
  orderCard: {
    borderRadius: 16,
    padding: getCardPadding(),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    position: 'relative',
  },
  orderCardWithOffer: {
  },
  orderCardAssigned: {
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  statusBadgeSet: {
  },
  statusBadgeNotSet: {
  },
  statusBadgeAssigned: {
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  statusTextSet: {
  },
  statusTextNotSet: {
  },
  statusTextAssigned: {
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: getAvatarSize(),
    height: getAvatarSize(),
    borderRadius: getAvatarSize() / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  customerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  vehicleBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  vehicleTextSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  locationSection: {
    marginBottom: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  locationText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  locationConnector: {
    width: 2,
    height: 16,
    marginLeft: 5,
    marginVertical: 2,
  },
  materialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  materialsText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  viewDetailsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  skeletonAvatar: {
    width: getAvatarSize(),
    height: getAvatarSize(),
    borderRadius: getAvatarSize() / 2,
    backgroundColor: colors.border,
  },
  skeletonTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonText: {
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  detailsModalContainer: {
    flex: 1,
  },
  detailsScrollContent: {
    paddingBottom: spacing.xxl,
  },
  mapContainer: {
    height: getMapHeight(),
    overflow: 'hidden',
  },
  mapContainerLarge: {
    height: 500,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLarge: {
    flex: 1,
  },
  routeInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  routeInfoTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  routeInfoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  detailsContainer: {
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  routeDetails: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
  },
  routeAddress: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  routeConnectorLarge: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 7,
    marginVertical: spacing.xs,
  },
  horizontalRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  routeStep: {
    flex: 1,
    alignItems: 'center',
  },
  routeStepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  routeStepLabel: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  routeStepAddress: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  routeArrow: {
    paddingHorizontal: spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoItem: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  offerSection: {
    marginBottom: spacing.lg,
  },
  offerLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    paddingVertical: spacing.md,
  },
  currency: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  hint: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 2,
  },
  submitButton: {
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  lockedNotice: {
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  lockedNoticeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  lockedNoticeText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  closeOnlyButton: {
    width: '100%',
  },
  closeOnlyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  // New compact styles
  compactRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  compactRouteStep: {
    alignItems: 'center',
    gap: 4,
  },
  compactDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  compactLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  compactArrow: {
    width: 20,
    height: 2,
    marginHorizontal: 4,
  },
  addressesSection: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  materialsSection: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  materialsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  materialsSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  materialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  materialChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  materialChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  vehicleLabel: {
    fontSize: fontSize.sm,
  },
  vehicleValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})
