import React, { useRef, useEffect, useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Modal,
  Animated,
  Dimensions
} from 'react-native'
import { spacing, fontSize, fontWeight } from '@/constants/theme'
import { X, ArrowRight, Package, Truck, Car, Bike } from 'lucide-react-native'
import { hp, rs } from '@/utils/responsive'
import { useTheme } from '@/hooks/ThemeContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AssignedOrderBottomSheetProps {
  order: any | null
  visible: boolean
  onClose: () => void
}

export const AssignedOrderBottomSheet: React.FC<AssignedOrderBottomSheetProps> = ({ 
  order, 
  visible, 
  onClose 
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [translateY] = useState(new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (visible && order) {
      // Delay animation slightly for smoother transition
      setTimeout(() => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }).start();
      }, 100);
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, order]);

  const VehicleIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'motorcycle':
        return <Bike size={16} color={colors.primary} />
      case 'car':
        return <Car size={16} color={colors.primary} />
      case 'truck':
        return <Truck size={16} color={colors.primary} />
      default:
        return <Package size={16} color={colors.primary} />
    }
  }

  if (!order) return null

  if (!visible) return null

  const customerName = order.customerName || 'Customer'
  const customerInitial = customerName.charAt(0).toUpperCase()
  
  // Parse materials if they come as JSON string
  let parsedMaterials: string[] = []
  if (order.materials) {
    try {
      if (typeof order.materials === 'string') {
        parsedMaterials = JSON.parse(order.materials)
      } else if (Array.isArray(order.materials)) {
        parsedMaterials = order.materials
      }
    } catch (error) {
      console.log('Failed to parse materials:', error)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>🔒 ASSIGNED</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.customerSection}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>{customerInitial}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customerName}</Text>
            <View style={styles.vehicleAndMaterialsRow}>
              <View style={styles.vehicleBadge}>
                <VehicleIcon type={order.vehicleType} />
                <Text style={styles.vehicleText}>
                  {order.vehicleType?.charAt(0).toUpperCase() + order.vehicleType?.slice(1)}
                </Text>
              </View>
              {parsedMaterials.length > 0 && (
                <View style={styles.materialsBadge}>
                  <Package size={12} color={colors.textSecondary} />
                  <Text style={styles.materialsText} numberOfLines={1}>
                    {parsedMaterials.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Compact Horizontal Route Display */}
        <View style={styles.compactRoute}>
          <View style={styles.compactRouteItem}>
            <View style={[styles.compactDot, { backgroundColor: '#FF6B35' }]} />
            <View style={styles.compactRouteText}>
              <Text style={styles.compactRouteLabel}>Pickup</Text>
              <Text style={styles.compactRouteAddress} numberOfLines={2}>
                {order.pickupAddress || 'Pickup Location'}
              </Text>
            </View>
          </View>
          
          <View style={styles.compactRouteItem}>
            <View style={[styles.compactDot, { backgroundColor: '#34C759' }]} />
            <View style={styles.compactRouteText}>
              <Text style={styles.compactRouteLabel}>Delivery</Text>
              <Text style={styles.compactRouteAddress} numberOfLines={2}>
                {order.deliveryAddress || 'Delivery Location'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>

          {order.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{order.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.statusNotice}>
          <Text style={styles.statusNoticeText}>
            📍 Navigate to pickup location to start delivery
          </Text>
        </View>
      </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SCREEN_HEIGHT * 0.4,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  lockBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  lockBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  closeButton: {
    padding: spacing.xs,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  customerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehicleAndMaterialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehicleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  materialsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    maxWidth: '60%',
  },
  materialsText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  compactRoute: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  compactRouteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  compactRouteText: {
    flex: 1,
  },
  compactRouteLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  compactRouteAddress: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 18,
  },
  detailsSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  statusNotice: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    marginBottom: spacing.xxl,
  },
  statusNoticeText: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
})
