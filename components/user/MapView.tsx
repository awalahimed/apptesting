import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Modal, Pressable } from 'react-native';
import { MapPin, Navigation, Plus, Minus, Locate, X } from 'lucide-react-native';
import { colors, spacing, fontSize } from '@/constants/theme';

export interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
}

export interface MapViewProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  locations?: MapLocation[];
  showUserLocation?: boolean;
  showCompass?: boolean;
  showZoomControls?: boolean;
  showLocationButton?: boolean;
  onLocationPress?: (location: MapLocation) => void;
  onMapPress?: (latitude: number, longitude: number) => void;
  onUserLocationRequest?: (latitude: number, longitude: number) => void;
  style?: object;
}

const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.015,
  longitudeDelta: 0.0121,
};

const { width, height } = Dimensions.get('window');

export const MapViewComponent: React.FC<MapViewProps> = ({
  initialRegion = DEFAULT_REGION,
  locations = [],
  showUserLocation = true,
  showCompass = true,
  showZoomControls = true,
  showLocationButton = true,
  onLocationPress,
  onMapPress,
  onUserLocationRequest,
  style,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleZoomIn = () => {
    if (zoomLevel < 3) {
      setZoomLevel(zoomLevel + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 1);
    }
  };

  const handleMapPress = () => {
    if (onMapPress) {
      onMapPress(initialRegion.latitude, initialRegion.longitude);
    }
  };

  const handleLocationButtonPress = () => {
    setShowLocationModal(true);
  };

  const handleGetCurrentLocation = () => {
    // Simulate getting current location
    const mockLocation = {
      latitude: 37.78825 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4324 + (Math.random() - 0.5) * 0.01,
    };
    setUserLocation(mockLocation);
    if (onUserLocationRequest) {
      onUserLocationRequest(mockLocation.latitude, mockLocation.longitude);
    }
    setShowLocationModal(false);
  };

  const handleManualLocation = () => {
    if (onUserLocationRequest) {
      onUserLocationRequest(initialRegion.latitude, initialRegion.longitude);
    }
    setShowLocationModal(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Map background with grid pattern */}
      <TouchableOpacity
        style={styles.mapBackground}
        onPress={handleMapPress}
        activeOpacity={0.9}
      />

      {/* Location markers */}
      {locations.map((location) => (
        <TouchableOpacity
          key={location.id}
          style={[
            styles.markerContainer,
            {
              transform: [
                { scale: zoomLevel },
                { translateX: (location.longitude - initialRegion.longitude) * 10000 * zoomLevel },
                { translateY: (location.latitude - initialRegion.latitude) * -10000 * zoomLevel },
              ],
            },
          ]}
          onPress={() => onLocationPress?.(location)}
        >
          <View style={styles.markerPin}>
            <MapPin size={24} color={colors.background} fill={colors.primary} />
          </View>
          {location.title && (
            <View style={styles.markerLabel}>
              <Text style={styles.markerLabelText} numberOfLines={1}>
                {location.title}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* User location indicator */}
      {showUserLocation && userLocation && (
        <View
          style={[
            styles.userLocationContainer,
            {
              transform: [
                { translateX: (userLocation.longitude - initialRegion.longitude) * 10000 * zoomLevel },
                { translateY: (userLocation.latitude - initialRegion.latitude) * -10000 * zoomLevel },
              ],
            },
          ]}
        >
          <View style={styles.userLocationOuter}>
            <View style={styles.userLocationInner} />
          </View>
        </View>
      )}

      {/* Compass */}
      {showCompass && (
        <View style={styles.compass}>
          <Navigation size={24} color={colors.primary} />
        </View>
      )}

      {/* Zoom controls */}
      {showZoomControls && (
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Plus size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Minus size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Location button */}
      {showLocationButton && (
        <TouchableOpacity style={styles.locationButton} onPress={handleLocationButtonPress}>
          <Locate size={24} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Location Permission Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLocationModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowLocationModal(false)}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.modalIconContainer}>
              <Locate size={48} color={colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Enable Location</Text>
            <Text style={styles.modalSubtitle}>
              Allow access to your location to see nearby places and get directions.
            </Text>

            <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleGetCurrentLocation}>
              <Locate size={20} color={colors.background} />
              <Text style={styles.modalPrimaryButtonText}>Use Current Location</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSecondaryButton} onPress={handleManualLocation}>
              <MapPin size={20} color={colors.primary} />
              <Text style={styles.modalSecondaryButtonText}>Enter Manually</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Convenience component for single location display
export const LocationMap: React.FC<{
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;
}> = ({ latitude, longitude, title, height = 200 }) => {
  return (
    <MapViewComponent
      initialRegion={{ latitude, longitude }}
      locations={
        title
          ? [{ id: '1', latitude, longitude, title }]
          : [{ id: '1', latitude, longitude }]
      }
      showZoomControls={false}
      showLocationButton={false}
      style={{ height }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackground: {
    flex: 1,
    position: 'relative',
  },
  streetVertical1: {
    position: 'absolute',
    left: '20%',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#e8e8e8',
  },
  streetVertical2: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#e0e0e0',
  },
  streetVertical3: {
    position: 'absolute',
    right: '25%',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#e8e8e8',
  },
  streetHorizontal1: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#e8e8e8',
  },
  streetHorizontal2: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  streetHorizontal3: {
    position: 'absolute',
    bottom: '30%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#e8e8e8',
  },
  building1: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 40,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  building2: {
    position: 'absolute',
    top: '60%',
    left: '60%',
    width: 50,
    height: 70,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  building3: {
    position: 'absolute',
    bottom: '15%',
    left: '15%',
    width: 35,
    height: 45,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  building4: {
    position: 'absolute',
    top: '35%',
    right: '10%',
    width: 45,
    height: 55,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  markerContainer: {
    position: 'absolute',
    top: '40%',
    left: '48%',
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '500',
  },
  userLocationContainer: {
    position: 'absolute',
    top: '42%',
    left: '48%',
  },
  userLocationOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryOpacity30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userLocationInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  compass: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomControls: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    gap: spacing.sm,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButton: {
    position: 'absolute',
    bottom: spacing.xl + 100,
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalPrimaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
  modalSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalSecondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.primary,
  },
  modalCancelButton: {
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
