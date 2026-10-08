import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEBETA_API_KEY = process.env.EXPO_PUBLIC_GEBETA_MAPS_API_KEY || '';
const ROUTE_CACHE_PREFIX = 'route_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RoutePoint {
  lat: number;
  lng: number;
}

interface CachedRoute {
  coordinates: Array<{ latitude: number; longitude: number }>;
  timestamp: number;
}

export const useMapData = (route: any) => {
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);

  useEffect(() => {
    console.log('🗺️ MapComponent route prop changed:', route ? 'Route provided' : 'No route');
    if (route) {
      console.log('🗺️ Route details:', JSON.stringify(route, null, 2));
      if (route.driver) {
        fetchFullRoute(route.driver, route.pickup, route.delivery);
      } else {
        fetchRoute(route.pickup, route.delivery);
      }
    } else {
      setRouteCoordinates([]);
    }
  }, [route]);

  const getCacheKey = (from: RoutePoint, to: RoutePoint): string => {
    return `${ROUTE_CACHE_PREFIX}${from.lat.toFixed(4)}_${from.lng.toFixed(4)}_${to.lat.toFixed(4)}_${to.lng.toFixed(4)}`;
  };

  const getCachedRoute = async (from: RoutePoint, to: RoutePoint): Promise<Array<{ latitude: number; longitude: number }> | null> => {
    try {
      const cacheKey = getCacheKey(from, to);
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const data: CachedRoute = JSON.parse(cached);
        const now = Date.now();
        if (now - data.timestamp < CACHE_EXPIRY_MS) {
          console.log('✅ Using cached route');
          return data.coordinates;
        } else {
          console.log('⏰ Cache expired, fetching new route');
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('❌ Error reading route cache:', error);
    }
    return null;
  };

  const setCachedRoute = async (from: RoutePoint, to: RoutePoint, coordinates: Array<{ latitude: number; longitude: number }>) => {
    try {
      const cacheKey = getCacheKey(from, to);
      const data: CachedRoute = {
        coordinates,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      console.log('💾 Route cached successfully');
    } catch (error) {
      console.error('❌ Error caching route:', error);
    }
  };

  const fetchFullRoute = async (
    driver: RoutePoint,
    pickup: RoutePoint,
    delivery: RoutePoint
  ) => {
    try {
      if (!GEBETA_API_KEY) {
        console.warn('Gebeta API key not found, no route will be shown');
        setRouteCoordinates([]);
        return;
      }

      const origin1 = `{${driver.lat},${driver.lng}}`;
      const destination1 = `{${pickup.lat},${pickup.lng}}`;
      const origin2 = `{${pickup.lat},${pickup.lng}}`;
      const destination2 = `{${delivery.lat},${delivery.lng}}`;
      
      const [response1, response2] = await Promise.all([
        fetch(`https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(origin1)}&destination=${encodeURIComponent(destination1)}&apiKey=${GEBETA_API_KEY}`),
        fetch(`https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(origin2)}&destination=${encodeURIComponent(destination2)}&apiKey=${GEBETA_API_KEY}`)
      ]);
      
      if (!response1.ok || !response2.ok) {
        console.log('API failed, no route will be shown');
        setRouteCoordinates([]);
        return;
      }
      
      const [data1, data2] = await Promise.all([response1.json(), response2.json()]);
      
      const allCoordinates: Array<{ latitude: number; longitude: number }> = [];
      
      if (data1.direction && Array.isArray(data1.direction)) {
        allCoordinates.push(...data1.direction.map((point: number[]) => ({
          latitude: point[0],
          longitude: point[1],
        })));
      }
      
      if (data2.direction && Array.isArray(data2.direction)) {
        allCoordinates.push(...data2.direction.map((point: number[]) => ({
          latitude: point[0],
          longitude: point[1],
        })));
      }
      
      if (allCoordinates.length > 0) {
        setRouteCoordinates(allCoordinates);
      } else {
        setRouteCoordinates([]);
      }
    } catch (error) {
      console.error('Error fetching full route:', error);
      setRouteCoordinates([]);
    }
  };

  const fetchRoute = async (pickup: RoutePoint, delivery: RoutePoint) => {
    try {
      // Check cache first
      const cached = await getCachedRoute(pickup, delivery);
      if (cached) {
        setRouteCoordinates(cached);
        return;
      }

      if (!GEBETA_API_KEY) {
        console.warn('⚠️ Gebeta API key not found');
        setRouteCoordinates([]);
        return;
      }

      const origin = `{${pickup.lat},${pickup.lng}}`;
      const destination = `{${delivery.lat},${delivery.lng}}`;
      
      const url = `https://mapapi.gebeta.app/api/route/direction/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&apiKey=${GEBETA_API_KEY}`;
      console.log('🌐 Fetching route from Gebeta API...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log('❌ Gebeta API failed with status:', response.status);
        const text = await response.text();
        console.log('❌ Response:', text);
        setRouteCoordinates([]);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Gebeta API response received');
      
      if (data.direction && Array.isArray(data.direction)) {
        const coordinates = data.direction.map((point: number[]) => ({
          latitude: point[0],
          longitude: point[1],
        }));
        console.log('✅ Route has', coordinates.length, 'points');
        setRouteCoordinates(coordinates);
        
        // Cache the route
        await setCachedRoute(pickup, delivery, coordinates);
      } else {
        console.log('⚠️ No direction data in response');
        setRouteCoordinates([]);
      }
    } catch (error) {
      console.error('❌ Error fetching route:', error);
      setRouteCoordinates([]);
    }
  };

  return { routeCoordinates };
};
