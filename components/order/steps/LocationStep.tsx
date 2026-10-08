import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { MapComponent } from '@/components/shared/MapComponent';
import { GebetaAutocomplete } from '@/components/shared/GebetaAutocomplete';

interface LocationStepProps {
  data: any;
  onNext: (data: any) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function LocationStep({ data, onNext }: LocationStepProps) {
  const [pickup, setPickup] = useState(data.pickup || null);
  const [destination, setDestination] = useState(data.destination || null);
  const [selectingFor, setSelectingFor] = useState<'pickup' | 'delivery' | null>('pickup');

  // Log state changes
  useEffect(() => {
    console.log('🔍 selectingFor changed to:', selectingFor);
  }, [selectingFor]);

  const handleNext = () => {
    if (pickup && destination) {
      onNext({ pickup, destination });
    }
  };

  const handleMapPress = async (coordinate: { latitude: number; longitude: number }) => {
    console.log('🗺️ Map pressed, selectingFor:', selectingFor);
    
    const tempAddress = `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
    let resolvedAddress = tempAddress;
    
    // Reverse geocode with Gebeta
    try {
      const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || '';
      if (GEBETA_API_KEY) {
        const response = await fetch(
          `https://mapapi.gebeta.app/v2/search/reverse-geocoding?lat=${coordinate.latitude}&lon=${coordinate.longitude}&apiKey=${GEBETA_API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          const results = data.data?.results || [];
          if (results.length > 0) {
            const result = results[0];
            const parts = [];
            if (result.name) parts.push(result.name);
            if (result.address?.city) parts.push(result.address.city);
            if (result.address?.country) parts.push(result.address.country);
            if (parts.length > 0) resolvedAddress = parts.join(', ');
            else if (result.display_name) resolvedAddress = result.display_name;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Gebeta reverse geocoding failed:', e);
    }
    
    const newLocation = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      address: resolvedAddress,
    };
    
    // If user explicitly selected which location to change, prioritize that
    if (selectingFor === 'pickup') {
      console.log('📍 Setting location for: pickup');
      setPickup(newLocation);
      // Auto-switch to delivery after pickup is set
      if (!destination) {
        console.log('🔄 Auto-switching to delivery mode');
        setTimeout(() => setSelectingFor('delivery'), 0);
      } else {
        console.log('✅ Delivery already set, clearing selection');
        setTimeout(() => setSelectingFor(null), 0);
      }
    } else if (selectingFor === 'delivery') {
      console.log('📍 Setting location for: delivery');
      setDestination(newLocation);
      setTimeout(() => setSelectingFor(null), 0);
    } else if (!pickup) {
      // If no explicit selection, set pickup first and auto-switch to delivery
      console.log('📦 Setting pickup from map press');
      setPickup(newLocation);
      console.log('🔄 Auto-switching to delivery mode');
      setTimeout(() => setSelectingFor('delivery'), 0);
    } else if (!destination) {
      // Then set delivery
      console.log('🚚 Setting delivery from map press');
      setDestination(newLocation);
      setTimeout(() => setSelectingFor(null), 0);
    }
  };

  const markers = [];
  if (pickup) {
    markers.push({
      lat: pickup.latitude,
      lng: pickup.longitude,
      title: 'Pickup Location',
      type: 'pickup' as const,
      draggable: true,
    });
  }
  if (destination) {
    markers.push({
      lat: destination.latitude,
      lng: destination.longitude,
      title: 'Destination',
      type: 'delivery' as const,
      draggable: true,
    });
  }

  const isValid = pickup && destination;

  return (
    <View style={styles.container}>
      {/* Search Inputs */}
      <View style={styles.searchContainer}>
        <Text style={styles.sectionTitle}>Set Locations</Text>
        
        <View style={styles.searchItem}>
          <View style={styles.labelRow}>
            <MapPin size={18} color="#FF6B35" />
            <Text style={styles.label}>Pickup Location</Text>
            {pickup && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔄 Change pickup button pressed');
                  setSelectingFor('pickup');
                }}
                style={styles.changeButton}
              >
                <Text style={styles.changeButtonText}>Change on map</Text>
              </TouchableOpacity>
            )}
          </View>
          <GebetaAutocomplete
            key={`pickup-${pickup?.latitude}-${pickup?.longitude}`}
            placeholder="Search pickup address"
            value={pickup?.address || ''}
            onLocationSelect={(location) => {
              console.log('📦 Pickup selected:', location);
              setPickup({
                latitude: location.lat,
                longitude: location.lng,
                address: location.address,
              });
              setSelectingFor(null);
            }}
            onChangeText={(text) => {
              // Clear pickup if user clears the text
              if (!text || text.trim() === '') {
                setPickup(null);
              }
            }}
            style={styles.autocomplete}
          />
        </View>

        <View style={styles.searchItem}>
          <View style={styles.labelRow}>
            <Navigation size={18} color="#34C759" />
            <Text style={styles.label}>Delivery Location</Text>
            {destination && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔄 Change delivery button pressed');
                  setSelectingFor('delivery');
                }}
                style={styles.changeButton}
              >
                <Text style={styles.changeButtonText}>Change on map</Text>
              </TouchableOpacity>
            )}
          </View>
          <GebetaAutocomplete
            key={`delivery-${destination?.latitude}-${destination?.longitude}`}
            placeholder="Search delivery address"
            value={destination?.address || ''}
            onLocationSelect={(location) => {
              console.log('🚚 Destination selected:', location);
              setDestination({
                latitude: location.lat,
                longitude: location.lng,
                address: location.address,
              });
              setSelectingFor(null);
            }}
            onChangeText={(text) => {
              // Clear destination if user clears the text
              if (!text || text.trim() === '') {
                setDestination(null);
              }
            }}
            style={styles.autocomplete}
          />
        </View>
      </View>

      {/* Map with draggable markers */}
      <View style={styles.mapContainer}>
        <MapComponent
          style={styles.map}
          markers={markers}
          onMapPress={handleMapPress}
          onMarkerDragEnd={async (marker) => {
            console.log('🎯 Marker dragged:', marker);
            
            let resolvedAddress = `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`;
            try {
              const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || '';
              if (GEBETA_API_KEY) {
                const response = await fetch(
                  `https://mapapi.gebeta.app/v2/search/reverse-geocoding?lat=${marker.lat}&lon=${marker.lng}&apiKey=${GEBETA_API_KEY}`
                );
                if (response.ok) {
                  const data = await response.json();
                  const results = data.data?.results || [];
                  if (results.length > 0) {
                    const result = results[0];
                    const parts = [];
                    if (result.name) parts.push(result.name);
                    if (result.address?.city) parts.push(result.address.city);
                    if (result.address?.country) parts.push(result.address.country);
                    if (parts.length > 0) resolvedAddress = parts.join(', ');
                    else if (result.display_name) resolvedAddress = result.display_name;
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Reverse geocoding failed:', e);
            }
            
            const locationData = {
              latitude: marker.lat,
              longitude: marker.lng,
              address: resolvedAddress,
            };
            
            if (marker.type === 'pickup') {
              console.log('📦 Updating pickup from drag');
              setPickup(locationData);
            } else if (marker.type === 'delivery') {
              console.log('🚚 Updating destination from drag');
              setDestination(locationData);
            }
          }}
          initialRegion={{
            latitude: pickup?.latitude || destination?.latitude || 9.145,
            longitude: pickup?.longitude || destination?.longitude || 40.489673,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        />
        {markers.length > 0 && (
          <View style={styles.mapHint}>
            <Text style={styles.mapHintText}>
              {selectingFor 
                ? `📍 Tap map to set ${selectingFor === 'pickup' ? 'pickup' : 'delivery'} location`
                : '💡 Tap markers to change, or tap map to add new location'}
            </Text>
          </View>
        )}
        {markers.length === 0 && (
          <View style={styles.mapHint}>
            <Text style={styles.mapHintText}>📍 Tap anywhere on the map to set pickup location</Text>
          </View>
        )}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isValid}
      >
        <Text style={styles.nextButtonText}>
          {isValid ? 'Continue' : 'Select both locations'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    gap: 16,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: 'Sora',
    fontSize: 18,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 4,
  },
  searchItem: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '500',
    color: '#191919',
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  changeButtonText: {
    fontFamily: 'Sora',
    fontSize: 11,
    fontWeight: '500',
    color: '#1a9b7f',
  },
  autocomplete: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapHint: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHintText: {
    fontFamily: 'Sora',
    fontSize: 12,
    color: '#78838D',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#1a9b7f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});