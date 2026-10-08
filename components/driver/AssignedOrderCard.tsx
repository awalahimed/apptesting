import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'
import { Navigation, Package, Clock, Truck, Car, Bike } from 'lucide-react-native'
import { hp, getAvatarSize, getCardPadding } from '@/utils/responsive'

interface AssignedOrderCardProps {
  order: any
  onPress: () => void
}

export const AssignedOrderCard: React.FC<AssignedOrderCardProps> = ({ order, onPress }) => {

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

  const customerName = order.customerName || 'Customer'
  const customerInitial = customerName.charAt(0).toUpperCase()

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
        <View style={styles.header}>
          <View style={styles.lockBadge}>
            <Text style={styles.lockBadgeText}>🔒 ASSIGNED ORDER</Text>
          </View>
        </View>

        <View style={styles.customerSection}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>{customerInitial}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customerName}</Text>
            <View style={styles.vehicleBadge}>
              <VehicleIcon type={order.vehicleType} />
              <Text style={styles.vehicleText}>
                {order.vehicleType?.charAt(0).toUpperCase() + order.vehicleType?.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {order.pickupAddress}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationConnector} />
          
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>DESTINATION</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {order.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.timeRow}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.timeText}>
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.viewDirectionsRow}>
            <Navigation size={14} color={colors.primary} />
            <Text style={styles.viewDirectionsText}>View Directions</Text>
          </View>
        </View>
      </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: getCardPadding(),
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  header: {
    marginBottom: spacing.md,
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
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: getAvatarSize(),
    height: getAvatarSize(),
    borderRadius: getAvatarSize() / 2,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  vehicleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  locationConnector: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    marginLeft: 5,
    marginVertical: 2,
  },
  footer: {
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
  viewDirectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewDirectionsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
})
