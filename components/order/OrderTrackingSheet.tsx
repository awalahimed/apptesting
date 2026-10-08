import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { X, MapPin, Truck, User, Phone, Star, Navigation } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { MapComponent } from '@/components/shared/MapComponent';
import { orpc } from '@/hooks/orpc';

const { height: screenHeight } = Dimensions.get('window');

interface OrderTrackingSheetProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
}

interface OrderData {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude: string;
  pickupLongitude: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  materials: unknown;
  vehicleType: string;
  driverId?: string | null;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
    vehicleInfo: string;
  } | null;
}

export function OrderTrackingSheet({ visible, orderId, onClose }: OrderTrackingSheetProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const result = await orpc.order.getById({ orderId });
        if (result.success) {
          setOrder(result.order);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [visible, orderId]);

  if (!order && !loading) {
    return null;
  }

  const markers = [];
  if (order) {
    markers.push({
      lat: parseFloat(order.pickupLatitude),
      lng: parseFloat(order.pickupLongitude),
      title: 'Pickup Location',
      type: 'pickup' as const,
    });
    markers.push({
      lat: parseFloat(order.deliveryLatitude),
      lng: parseFloat(order.deliveryLongitude),
      title: 'Delivery Location',
      type: 'delivery' as const,
    });
  }

  const route = order ? {
    pickup: {
      lat: parseFloat(order.pickupLatitude),
      lng: parseFloat(order.pickupLongitude),
    },
    delivery: {
      lat: parseFloat(order.deliveryLatitude),
      lng: parseFloat(order.deliveryLongitude),
    },
  } : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Order</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        ) : order ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Map */}
            <View style={styles.mapContainer}>
              <MapComponent
                style={styles.map}
                markers={markers}
                route={route}
              />
            </View>

            {/* Driver Info Card */}
            {order.driver && (
              <View style={styles.driverCard}>
                <Text style={styles.cardTitle}>Your Driver</Text>
                <View style={styles.driverInfo}>
                  <View style={styles.driverAvatar}>
                    <User size={32} color={colors.primary} />
                  </View>
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{order.driver.name}</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={16} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.rating}>{(order.driver.rating ?? 4.5).toFixed(1)}</Text>
                    </View>
                    <Text style={styles.vehicleInfo}>{order.driver.vehicleInfo}</Text>
                  </View>
                  <TouchableOpacity style={styles.callButton}>
                    <Phone size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Order Details Card */}
            <View style={styles.orderCard}>
              <Text style={styles.cardTitle}>Order Details</Text>
              
              <View style={styles.locationSection}>
                <View style={styles.detailRow}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF6B35' + '20' }]}>
                    <MapPin size={16} color="#FF6B35" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Pickup</Text>
                    <Text style={styles.detailValue}>{order.pickupAddress}</Text>
                  </View>
                </View>

                <View style={styles.routeLine} />

                <View style={styles.detailRow}>
                  <View style={[styles.iconContainer, { backgroundColor: '#34C759' + '20' }]}>
                    <MapPin size={16} color="#34C759" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Delivery</Text>
                    <Text style={styles.detailValue}>{order.deliveryAddress}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Truck size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Vehicle Type</Text>
                  <Text style={styles.detailValue}>
                    {order.vehicleType.charAt(0).toUpperCase() + order.vehicleType.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Materials Card */}
            {Array.isArray(order.materials) && order.materials.length > 0 && (
              <View style={styles.materialsCard}>
                <Text style={styles.cardTitle}>Package Contents</Text>
                <View style={styles.materialTags}>
                  {order.materials.map((material, index) => (
                    <View key={index} style={styles.materialTag}>
                      <Text style={styles.materialTagText}>{material}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  mapContainer: {
    height: 300,
    margin: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  driverCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.md,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rating: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  vehicleInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.md,
  },
  materialsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.md,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  locationSection: {
    position: 'relative',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  routeLine: {
    position: 'absolute',
    left: 15,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  materialTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  materialTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  materialTagText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
