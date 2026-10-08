import React, { useRef, useImperativeHandle, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
// MOCKED FOR EXPO GO
const MapView = React.forwardRef(({ children, style, ...props }: any, ref: any) => (
  <View style={[style, { backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }]}>
    <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>
      🗺️ Map is disabled in Expo Go.{'\n'}
      Run 'npx expo run:android' to see the real map.
    </Text>
  </View>
));
const Camera = React.forwardRef((props: any, ref: any) => null);
const ShapeSource = (props: any) => null;
const LineLayer = (props: any) => null;
const CircleLayer = (props: any) => null;
type MapViewRef = any;
type CameraRef = any;
import * as Location from 'expo-location';
import { useMapData } from './map/useMapData';
import { MapTypeControls } from './map/MapTypeControls';

export interface MapRef {
  flyTo: (options: { center: [number, number]; zoom?: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getCenter: () => { latitude: number; longitude: number };
  getZoom: () => number;
  setMapStyle: (style: string) => void;
}

interface MapComponentProps {
  style?: any;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    type?: 'user' | 'pickup' | 'delivery' | 'driver';
    orderId?: string;
    vehicleType?: 'truck' | 'car' | 'motorcycle';
    draggable?: boolean;
  }>;
  route?: {
    pickup: { lat: number; lng: number };
    delivery: { lat: number; lng: number };
    driver?: { lat: number; lng: number };
    vehicleType?: 'truck' | 'car' | 'motorcycle';
  } | null;
  routes?: Array<{
    orderId: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
    status: string;
  }>;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (marker: any) => void;
  onMarkerDragEnd?: (marker: { type: string; lat: number; lng: number }) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  mapStyle?: string;
  showControls?: boolean;
}

// Map style URLs
const MAP_STYLES = {
  standard: 'https://tiles.openfreemap.org/styles/liberty',
  satellite: 'https://tiles.openfreemap.org/styles/liberty', // Same style, just different camera angle
};

export const MapComponent = React.memo(
  React.forwardRef<MapRef, MapComponentProps>(
    ({ 
      style, 
      markers = [], 
      route = null,
      routes = [],
      onMapPress,
      initialRegion,
      mapStyle: customMapStyle,
      showControls = true,
    }, ref) => {
      console.log('🗺️ MapComponent render (MapLibre Native)');
      const mapRef = useRef<MapViewRef>(null);
      const cameraRef = useRef<CameraRef>(null);
      const [location, setLocation] = useState(
        initialRegion 
          ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude }
          : { latitude: 9.145, longitude: 40.489 }
      );
      const [currentMapStyle, setCurrentMapStyle] = useState(
        customMapStyle || MAP_STYLES.standard
      );
      const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
      const [pitch, setPitch] = useState(0);
      const [heading, setHeading] = useState(0);

      const { routeCoordinates } = useMapData(route);

      // Expose map methods via ref
      useImperativeHandle(ref, () => ({
        flyTo: (options: { center: [number, number]; zoom?: number }) => {
          cameraRef.current?.setCamera({
            centerCoordinate: options.center,
            zoomLevel: options.zoom || 15,
            animationDuration: 1000,
          });
        },
        zoomIn: () => {
          mapRef.current?.getZoom().then((zoom) => {
            cameraRef.current?.setCamera({
              zoomLevel: zoom + 1,
              animationDuration: 300,
            });
          });
        },
        zoomOut: () => {
          mapRef.current?.getZoom().then((zoom) => {
            cameraRef.current?.setCamera({
              zoomLevel: zoom - 1,
              animationDuration: 300,
            });
          });
        },
        getCenter: () => location,
        getZoom: () => 12,
        setMapStyle: (style: string) => {
          setCurrentMapStyle(style);
        },
      }));

      // Get user location
      useEffect(() => {
        (async () => {
          try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              let userLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setLocation({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              });
            }
          } catch (error) {
            console.log('Location error:', error);
          }
        })();
      }, []);

      // Helper function to get marker color
      const getMarkerColor = (type?: string) => {
        const colors = {
          'user': '#4285F4',
          'pickup': '#FF6B35',
          'delivery': '#34C759',
          'driver': '#FF3B30',
        };
        return colors[type as keyof typeof colors] || '#007AFF';
      };

      // Helper function to get marker size
      const getMarkerSize = (type?: string) => {
        if (type === 'user') return 8; // Smaller for user location
        if (type === 'driver') return 12; // Larger for driver
        return 10; // Default size for pickup/delivery
      };

      // Convert markers to GeoJSON FeatureCollection
      const markersGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          // User location
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude],
            },
            properties: {
              type: 'user',
              title: 'Your Location',
              color: getMarkerColor('user'),
              size: getMarkerSize('user'),
            },
          },
          // Custom markers
          ...markers.map((marker) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [marker.lng, marker.lat],
            },
            properties: {
              type: marker.type,
              title: marker.title,
              orderId: marker.orderId,
              color: getMarkerColor(marker.type),
              size: getMarkerSize(marker.type),
            },
          })),
          // Route markers
          ...(route
            ? [
                {
                  type: 'Feature' as const,
                  geometry: {
                    type: 'Point' as const,
                    coordinates: [route.pickup.lng, route.pickup.lat],
                  },
                  properties: {
                    type: 'pickup',
                    title: 'Pickup',
                    color: getMarkerColor('pickup'),
                    size: getMarkerSize('pickup'),
                  },
                },
                {
                  type: 'Feature' as const,
                  geometry: {
                    type: 'Point' as const,
                    coordinates: [route.delivery.lng, route.delivery.lat],
                  },
                  properties: {
                    type: 'delivery',
                    title: 'Delivery',
                    color: getMarkerColor('delivery'),
                    size: getMarkerSize('delivery'),
                  },
                },
                ...(route.driver
                  ? [
                      {
                        type: 'Feature' as const,
                        geometry: {
                          type: 'Point' as const,
                          coordinates: [route.driver.lng, route.driver.lat],
                        },
                        properties: {
                          type: 'driver',
                          title: 'Driver',
                          color: getMarkerColor('driver'),
                          size: getMarkerSize('driver'),
                        },
                      },
                    ]
                  : []),
              ]
            : []),
        ],
      };

      // Convert route to GeoJSON LineString
      const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null =
        routeCoordinates.length > 0
          ? {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates.map((coord) => [
                  coord.longitude,
                  coord.latitude,
                ]),
              },
              properties: {},
            }
          : null;

      const handleMapTypeChange = async (type: 'standard' | 'satellite') => {
        setMapType(type);
        
        // Get current zoom level to preserve it
        const currentZoom = await mapRef.current?.getZoom();
        const currentCenter = await mapRef.current?.getCenter();
        
        // Keep same map style, just change camera angle
        if (type === 'satellite') {
          // Set 3D view (60 degree pitch) - preserve zoom
          setPitch(60);
          setHeading(-20);
          // Use setTimeout to avoid canceling tile requests
          setTimeout(() => {
            cameraRef.current?.setCamera({
              centerCoordinate: currentCenter || [location.longitude, location.latitude],
              zoomLevel: currentZoom || 12,
              pitch: 60,
              heading: -20,
              animationDuration: 800,
              animationMode: 'easeTo',
            });
          }, 100);
        } else {
          // Reset to 2D flat view - preserve zoom
          setPitch(0);
          setHeading(0);
          // Use setTimeout to avoid canceling tile requests
          setTimeout(() => {
            cameraRef.current?.setCamera({
              centerCoordinate: currentCenter || [location.longitude, location.latitude],
              zoomLevel: currentZoom || 12,
              pitch: 0,
              heading: 0,
              animationDuration: 800,
              animationMode: 'easeTo',
            });
          }, 100);
        }
      };

      const handleLocationPress = () => {
        if (location) {
          cameraRef.current?.setCamera({
            centerCoordinate: [location.longitude, location.latitude],
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }
      };

      return (
        <View style={[styles.container, style]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            mapStyle={currentMapStyle}
            compassEnabled={true}
            compassViewPosition={1}
            compassViewMargins={{ x: 18, y: 405 }}
            logoEnabled={false}
            attributionEnabled={false}
            onPress={(feature) => {
              if (onMapPress && feature.geometry.type === 'Point') {
                const coords = feature.geometry.coordinates as [number, number];
                onMapPress({
                  longitude: coords[0],
                  latitude: coords[1],
                });
              }
            }}
          >
            <Camera
              ref={cameraRef}
              zoomLevel={12}
              centerCoordinate={[location.longitude, location.latitude]}
              pitch={pitch}
              heading={heading}
            />

            {/* Route line */}
            {routeGeoJSON && (
              <ShapeSource id="routeSource" shape={routeGeoJSON}>
                <LineLayer
                  id="routeLine"
                  style={{
                    lineColor: '#007AFF',
                    lineWidth: 4,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </ShapeSource>
            )}

            {/* Multiple routes (for showing all orders) */}
            {routes && routes.length > 0 && routes.map((routeItem, index) => {
              const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: routeItem.coordinates.map((coord) => [
                    coord.longitude,
                    coord.latitude,
                  ]),
                },
                properties: {
                  orderId: routeItem.orderId,
                  status: routeItem.status,
                },
              };

              // Different colors based on status
              const getRouteColor = (status: string) => {
                switch (status) {
                  case 'assigned':
                  case 'on_the_way':
                    return '#007AFF'; // Blue for active
                  case 'delivered':
                    return '#34C759'; // Green for delivered
                  case 'pending_approval':
                  case 'approved':
                    return '#FF9500'; // Orange for pending
                  default:
                    return '#8E8E93'; // Gray for others
                }
              };

              return (
                <ShapeSource 
                  key={`route-${routeItem.orderId}-${index}`} 
                  id={`routeSource-${routeItem.orderId}-${index}`} 
                  shape={routeGeoJSON}
                >
                  <LineLayer
                    id={`routeLine-${routeItem.orderId}-${index}`}
                    style={{
                      lineColor: getRouteColor(routeItem.status),
                      lineWidth: 3,
                      lineCap: 'round',
                      lineJoin: 'round',
                      lineOpacity: 0.7,
                    }}
                  />
                </ShapeSource>
              );
            })}

            {/* Markers as circles */}
            <ShapeSource id="markersSource" shape={markersGeoJSON}>
              <CircleLayer
                id="markerCircles"
                style={{
                  circleRadius: ['get', 'size'],
                  circleColor: ['get', 'color'],
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#FFFFFF',
                  circlePitchAlignment: 'viewport',
                }}
              />
            </ShapeSource>
          </MapView>

          {/* Map Controls */}
          {showControls && (
            <MapTypeControls
              mapType={mapType}
              onMapTypeChange={handleMapTypeChange}
              onLocationPress={handleLocationPress}
              onZoomIn={() => {
                mapRef.current?.getZoom().then((zoom) => {
                  cameraRef.current?.setCamera({
                    zoomLevel: zoom + 1,
                    animationDuration: 300,
                  });
                });
              }}
              onZoomOut={() => {
                mapRef.current?.getZoom().then((zoom) => {
                  cameraRef.current?.setCamera({
                    zoomLevel: zoom - 1,
                    animationDuration: 300,
                  });
                });
              }}
            />
          )}
        </View>
      );
    }
  ),
  (prevProps, nextProps) => {
    const markersEqual =
      JSON.stringify(prevProps.markers) === JSON.stringify(nextProps.markers);
    const routeEqual =
      JSON.stringify(prevProps.route) === JSON.stringify(nextProps.route);
    const routesEqual =
      JSON.stringify(prevProps.routes) === JSON.stringify(nextProps.routes);

    return markersEqual && routeEqual && routesEqual;
  }
);

MapComponent.displayName = 'MapComponent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
});
