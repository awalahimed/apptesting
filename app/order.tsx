import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, X, Plus, Wallet, Car, Truck, Bike, Map, Check } from 'lucide-react-native';
import { MapComponent } from '@/components/shared/MapComponent';
import { OrderStatusSheet } from '@/components/order/OrderStatusSheet-redesign';
import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/ThemeContext';
import { showToast } from '@/hooks/useToast';
import { orpc } from '@/hooks/orpc';
import { useAuth } from '@/hooks/AuthContext';
import { useWallet } from '@/hooks/wallet/useWallet';

const vehicles = [
  { id: 'motorcycle', name: 'Motorcycle', icon: Bike, description: 'Fast delivery', comingSoon: true },
  { id: 'car', name: 'Car', icon: Car, description: 'Standard delivery', comingSoon: true },
  { id: 'truck', name: 'Truck', icon: Truck, description: 'Heavy delivery', comingSoon: false },
];

export default function OrderScreen() {
  const { colors } = useTheme();
  const { refreshSession } = useAuth();
  const { wallet, refetch: refetchWallet } = useWallet();
  
  const [pickupLocation, setPickupLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [pickupText, setPickupText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'pickup' | 'destination' | null>(null);
  const selectingForRef = useRef<'pickup' | 'destination' | null>(null);

  const setSelectingForSync = (value: 'pickup' | 'destination' | null) => {
    selectingForRef.current = value;
    setSelectingFor(value);
  };
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const walletBalance = parseFloat(wallet?.balance || '0');
  const hasInsufficientFunds = walletBalance <= 0;

  useEffect(() => {
    if (refetchWallet) refetchWallet();
  }, []);

  const openMapView = () => {
    setShowMapView(true);
    setSelectingForSync('pickup');
    setRouteInfo(null);
  };

  const closeMapView = () => {
    setShowMapView(false);
    setSelectingForSync(null);
    setRouteInfo(null);
  };

  // Fetch route info when both locations are set
  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!pickupLocation || !destinationLocation) {
        setRouteInfo(null);
        return;
      }

      try {
        const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || '';
        const origin = `{${pickupLocation.lat},${pickupLocation.lng}}`;
        const destination = `{${destinationLocation.lat},${destinationLocation.lng}}`;
        
        const response = await fetch(
          `https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&apiKey=${GEBETA_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          const distance = data.totalDistance || data.distance;
          const time = data.timetaken || data.totalTime || data.time || data.duration;
          
          if (distance) {
            const distanceKm = (distance / 1000).toFixed(2);
            const durationMin = time ? Math.round(time / 60) : null;
            
            setRouteInfo({
              distance: `${distanceKm} km`,
              duration: durationMin ? `${durationMin} min` : 'N/A'
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching route info:', error);
      }
    };

    fetchRouteInfo();
  }, [pickupLocation, destinationLocation]);

  const handleMapPress = async (coordinate: { latitude: number; longitude: number }) => {
    // Read from ref (synchronous) instead of state (async)
    const currentMode = selectingForRef.current;
    console.log('🗺️ Map pressed, selectingFor:', currentMode);
    if (!currentMode) {
      console.log('⚠️ No selection mode active');
      return;
    }

    const tempAddress = `${coordinate.latitude.toFixed(5)}°N, ${coordinate.longitude.toFixed(5)}°E`;
    console.log('📍 Setting location for:', currentMode);
    
    if (currentMode === 'pickup') {
      setPickupLocation({ address: tempAddress, lat: coordinate.latitude, lng: coordinate.longitude });
      setPickupText(tempAddress);
    } else if (currentMode === 'destination') {
      setDestinationLocation({ address: tempAddress, lat: coordinate.latitude, lng: coordinate.longitude });
      setDestinationText(tempAddress);
    }

    // Fetch actual address from reverse geocoding API (Gebeta Maps)
    try {
      let address = tempAddress; // Fallback to coordinates
      
      const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || '';
      
      if (GEBETA_API_KEY) {
        const gebetaResponse = await fetch(
          `https://mapapi.gebeta.app/v2/search/reverse-geocoding?lat=${coordinate.latitude}&lon=${coordinate.longitude}&apiKey=${GEBETA_API_KEY}`
        );
        
        if (gebetaResponse.ok) {
          const data = await gebetaResponse.json();
          console.log('✅ Gebeta reverse geocoding response:', JSON.stringify(data, null, 2));
          
          const results = data.data?.results || [];
          if (results.length > 0) {
            const result = results[0];
            console.log('📍 Gebeta result name:', result.name);
            console.log('📍 Gebeta result display_name:', result.display_name);
            console.log('📍 Gebeta result address:', JSON.stringify(result.address));
            console.log('📍 Gebeta result category:', result.category);
            
            const parts = [];
            
            if (result.name) parts.push(result.name);
            if (result.address?.city) parts.push(result.address.city);
            if (result.address?.country) parts.push(result.address.country);
            
            if (parts.length > 0) {
              address = parts.join(', ');
            } else if (result.display_name) {
              address = result.display_name;
            }
            
            console.log('📍 Final resolved address:', address);
          } else {
            console.warn('⚠️ Gebeta returned empty results for:', coordinate.latitude, coordinate.longitude);
          }
        } else {
          const errorText = await gebetaResponse.text();
          console.warn('⚠️ Gebeta reverse geocoding failed:', gebetaResponse.status, errorText);
          // Fallback to Nominatim if Gebeta fails
          const cleanText = (text: string): string => {
            if (!text) return '';
            return text
              .replace(/[\u0600-\u06FF]/g, '')
              .replace(/[\u1200-\u137F]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          };
          
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}&format=json&addressdetails=1`,
            { headers: { 'User-Agent': 'MyTrackApp/1.0' } }
          );
          
          if (nominatimResponse.ok) {
            const data = await nominatimResponse.json();
            const addr = data.address;
            const parts = [];
            
            const road = cleanText(addr.road || addr.neighbourhood || '');
            const suburb = cleanText(addr.suburb || addr.city_district || '');
            const city = cleanText(addr.city || addr.town || addr.village || '');
            const state = cleanText(addr.state || '');
            
            if (road) parts.push(road);
            if (suburb && suburb !== road) parts.push(suburb);
            if (city && city !== suburb) parts.push(city);
            if (state && state !== city) parts.push(state);
            
            if (parts.length > 0) address = parts.join(', ');
          }
        }
      }
      
      // Update with actual address using captured mode
      if (currentMode === 'pickup') {
        setPickupLocation({ address, lat: coordinate.latitude, lng: coordinate.longitude });
        setPickupText(address);
        showToast({ type: 'success', message: 'Pickup location set' });
      } else if (currentMode === 'destination') {
        setDestinationLocation({ address, lat: coordinate.latitude, lng: coordinate.longitude });
        setDestinationText(address);
        showToast({ type: 'success', message: 'Drop-off location set' });
      }
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      // Keep the coordinate-based address
      showToast({ 
        type: 'success', 
        message: currentMode === 'pickup' ? 'Pickup location set' : 'Drop-off location set'
      });
    }
  };

  const handlePlaceOrder = useCallback(async () => {
    const finalPickupAddress = pickupLocation?.address || pickupText.trim();
    const finalDestinationAddress = destinationLocation?.address || destinationText.trim();
    
    console.log('📦 Creating order with data:', {
      pickupAddress: finalPickupAddress,
      pickupLatitude: pickupLocation?.lat || 9.145,
      pickupLongitude: pickupLocation?.lng || 40.489,
      deliveryAddress: finalDestinationAddress,
      deliveryLatitude: destinationLocation?.lat || 9.145,
      deliveryLongitude: destinationLocation?.lng || 40.489,
      materials,
      vehicleType: selectedVehicle,
    });
    
    if (!finalPickupAddress) {
      showToast({ type: 'error', message: 'Please enter pickup location' });
      return;
    }
    if (!finalDestinationAddress) {
      showToast({ type: 'error', message: 'Please enter destination' });
      return;
    }
    if (materials.length === 0) {
      showToast({ type: 'error', message: 'Please add at least one material type' });
      return;
    }
    if (!selectedVehicle) {
      showToast({ type: 'error', message: 'Please select vehicle type' });
      return;
    }

    setIsSubmitting(true);
    try {
      await refreshSession();
      const result = await orpc.order.create({
        pickupAddress: finalPickupAddress,
        pickupLatitude: pickupLocation?.lat || 9.145,
        pickupLongitude: pickupLocation?.lng || 40.489,
        deliveryAddress: finalDestinationAddress,
        deliveryLatitude: destinationLocation?.lat || 9.145,
        deliveryLongitude: destinationLocation?.lng || 40.489,
        materials: materials,
        vehicleType: selectedVehicle as 'motorcycle' | 'car' | 'truck',
      });

      console.log('✅ Order created successfully:', result);

      if (result.success) {
        showToast({ type: 'success', message: 'Order created successfully!' });
        setCreatedOrderId(result.orderId);
        setShowOrderStatus(true);
      } else {
        showToast({ type: 'error', message: 'Failed to create order' });
      }
    } catch (error) {
      console.error('❌ Order creation error:', error);
      showToast({ type: 'error', message: 'Failed to create order' });
    } finally {
      setIsSubmitting(false);
    }
  }, [pickupLocation, pickupText, destinationLocation, destinationText, materials, selectedVehicle]);

  const addMaterial = () => {
    if (currentMaterial.trim() && !materials.includes(currentMaterial.trim())) {
      setMaterials([...materials, currentMaterial.trim()]);
      setCurrentMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const markers = [];
  if (pickupLocation) {
    markers.push({ lat: pickupLocation.lat, lng: pickupLocation.lng, type: 'pickup' as const, title: 'Pickup' });
  }
  if (destinationLocation) {
    markers.push({ lat: destinationLocation.lat, lng: destinationLocation.lng, type: 'delivery' as const, title: 'Drop-off' });
  }

  const bothLocationsSet = pickupText && destinationText;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {showMapView ? (
        <>
          {/* MAP VIEW */}
          <MapComponent
            style={styles.map}
            onMapPress={handleMapPress}
            markers={markers}
            route={pickupLocation && destinationLocation ? {
              pickup: { lat: pickupLocation.lat, lng: pickupLocation.lng },
              delivery: { lat: destinationLocation.lat, lng: destinationLocation.lng },
            } : null}
          />



          <View style={[styles.topSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.topSheetHeader}>
              <TouchableOpacity 
                style={[styles.backButtonTop, { backgroundColor: colors.background }]} 
                onPress={closeMapView}
              >
                <ArrowLeft size={20} color={colors.text} />
              </TouchableOpacity>
              
              {bothLocationsSet && (
                <TouchableOpacity 
                  style={[styles.checkIconContainer, { backgroundColor: '#4CAF50' }]}
                  onPress={closeMapView}
                >
                  <Check size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.locationsSummary, { backgroundColor: colors.background, marginBottom: 0 }]}>
              <View style={styles.locationSummaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: '#FF6B35' }]} />
                <Text style={[styles.summaryText, { color: pickupText ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                  {pickupText || 'Tap Set Pickup below'}
                </Text>
              </View>
              <View style={styles.summaryConnector} />
              <View style={styles.locationSummaryRow}>
                <View style={[styles.summarySquare, { backgroundColor: '#34C759' }]} />
                <Text style={[styles.summaryText, { color: destinationText ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                  {destinationText || 'Tap Set Drop-off below'}
                </Text>
              </View>
              
              {routeInfo && (
                <View style={styles.routeInfoContainer}>
                  <View style={[styles.routeInfoBadge, { backgroundColor: colors.primaryOpacity10 }]}>
                    <Text style={[styles.routeInfoText, { color: colors.primary }]}>
                      📏 {routeInfo.distance}
                    </Text>
                  </View>
                  <View style={[styles.routeInfoBadge, { backgroundColor: colors.primaryOpacity10 }]}>
                    <Text style={[styles.routeInfoText, { color: colors.primary }]}>
                      ⏱️ {routeInfo.duration}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.mapButtonsBottom}>
            <TouchableOpacity
              style={[
                styles.mapSelectButtonLarge,
                { backgroundColor: selectingFor === 'pickup' ? '#FF6B35' : colors.surface },
              ]}
              onPress={() => setSelectingForSync('pickup')}
            >
              <MapPin size={20} color={selectingFor === 'pickup' ? '#fff' : colors.text} />
              <Text style={[styles.mapSelectTextLarge, { color: selectingFor === 'pickup' ? '#fff' : colors.text }]}>
                Set Pickup
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mapSelectButtonLarge,
                { backgroundColor: selectingFor === 'destination' ? '#34C759' : colors.surface },
              ]}
              onPress={() => setSelectingForSync('destination')}
            >
              <MapPin size={20} color={selectingFor === 'destination' ? '#fff' : colors.text} />
              <Text style={[styles.mapSelectTextLarge, { color: selectingFor === 'destination' ? '#fff' : colors.text }]}>
                Set Drop-off
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* FORM VIEW */}
          <SafeAreaView style={styles.formContainer} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonForm}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>Create Order</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Details</Text>
                  <TouchableOpacity 
                    style={[styles.mapIconButton, { backgroundColor: colors.primary }]}
                    onPress={openMapView}
                  >
                    <Map size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputsContainer}>
                  <TouchableOpacity 
                    style={[styles.locationDisplay, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      setShowMapView(true);
                      setSelectingForSync('pickup');
                    }}
                  >
                    <View style={styles.locationDisplayContent}>
                      <View style={[styles.summaryDot, { backgroundColor: '#FF6B35' }]} />
                      <View style={styles.locationTextContainer}>
                        <Text style={[styles.labelText, { color: colors.textSecondary }]}>Pickup Location</Text>
                        <Text style={[styles.locationText, { color: pickupText ? colors.text : colors.textSecondary }]} numberOfLines={2}>
                          {pickupText || 'Tap to select on map'}
                        </Text>
                      </View>
                    </View>
                    <ArrowLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.locationDisplay, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      setShowMapView(true);
                      setSelectingForSync('destination');
                    }}
                  >
                    <View style={styles.locationDisplayContent}>
                      <View style={[styles.summarySquare, { backgroundColor: '#34C759' }]} />
                      <View style={styles.locationTextContainer}>
                        <Text style={[styles.labelText, { color: colors.textSecondary }]}>Drop-off Location</Text>
                        <Text style={[styles.locationText, { color: destinationText ? colors.text : colors.textSecondary }]} numberOfLines={2}>
                          {destinationText || 'Tap to select on map'}
                        </Text>
                      </View>
                    </View>
                    <ArrowLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>What are you sending?</Text>
                <View style={styles.materialInput}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                    placeholder="e.g. Documents, Electronics"
                    placeholderTextColor={colors.textSecondary}
                    value={currentMaterial}
                    onChangeText={setCurrentMaterial}
                    onSubmitEditing={addMaterial}
                  />
                  <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={addMaterial}>
                    <Plus size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>
                {materials.length > 0 && (
                  <View style={styles.materialTags}>
                    {materials.map((material, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: colors.primaryOpacity10 }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>{material}</Text>
                        <TouchableOpacity onPress={() => removeMaterial(index)}>
                          <X size={14} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Choose Vehicle</Text>
                {vehicles.map((vehicle) => {
                  const IconComponent = vehicle.icon;
                  const isSelected = selectedVehicle === vehicle.id;
                  
                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.vehicleCard,
                        { borderColor: colors.border },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryOpacity10 },
                        vehicle.comingSoon && { opacity: 0.5 }
                      ]}
                      onPress={() => !vehicle.comingSoon && setSelectedVehicle(vehicle.id)}
                      disabled={vehicle.comingSoon}
                    >
                      <IconComponent size={24} color={isSelected ? colors.primary : colors.textSecondary} />
                      <View style={styles.vehicleInfo}>
                        <Text style={[styles.vehicleName, { color: colors.text }]}>{vehicle.name}</Text>
                        <Text style={[styles.vehicleDesc, { color: colors.textSecondary }]}>{vehicle.description}</Text>
                      </View>
                      {vehicle.comingSoon && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Soon</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>

            {/* Fixed Footer with SafeAreaView */}
            <SafeAreaView edges={['bottom']} style={[styles.footerContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                {hasInsufficientFunds ? (
                  <View>
                    <View style={[styles.warningBox, { backgroundColor: '#FFF3E0' }]}>
                      <Wallet size={18} color="#F57C00" />
                      <Text style={[styles.warningText, { color: '#E65100' }]}>
                        Insufficient balance. Please top up.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: colors.primary }]}
                      onPress={() => router.push('/(tabs)/user/wallet?openTopUp=true')}
                    >
                      <Text style={[styles.buttonText, { color: colors.white }]}>Top Up Wallet</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    title={isSubmitting ? "Creating..." : "Place Order"}
                    onPress={handlePlaceOrder}
                    loading={isSubmitting}
                    fullWidth
                    disabled={!pickupText || !destinationText || materials.length === 0 || !selectedVehicle || isSubmitting}
                  />
                )}
              </View>
            </SafeAreaView>
          </SafeAreaView>
        </>
      )}

      {createdOrderId && (
        <OrderStatusSheet
          visible={showOrderStatus}
          orderId={createdOrderId}
          onClose={() => {
            setShowOrderStatus(false);
            setCreatedOrderId(null);
            router.replace('/(tabs)/user/home');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapButtonsBottom: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  mapSelectButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapSelectTextLarge: {
    fontSize: 15,
    fontWeight: '600',
  },
  topSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  topSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButtonTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  formContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButtonForm: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsContainer: {
    gap: 16,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 70,
  },
  locationDisplayContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '500',
  },
  locationsSummary: {
    padding: 12,
    borderRadius: 12,
  },
  locationSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summarySquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
  },
  summaryConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  routeInfoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  materialInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 8,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
  },
  vehicleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  footerContainer: {
    borderTopWidth: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
