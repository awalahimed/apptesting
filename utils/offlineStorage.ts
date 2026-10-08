import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Offline storage utility for caching API responses
 */
export class OfflineStorage {
  private static readonly PREFIX = '@offline_cache_';
  
  /**
   * Store data in cache with optional expiration
   */
  static async set<T>(
    key: string, 
    data: T, 
    expirationMinutes?: number
  ): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: expirationMinutes 
          ? Date.now() + (expirationMinutes * 60 * 1000)
          : undefined
      };
      
      await AsyncStorage.setItem(
        `${this.PREFIX}${key}`, 
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get data from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Remove data from cache
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.PREFIX}${key}`);
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  /**
   * Clear all cached data
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache info (size, count, etc.)
   */
  static async getInfo(): Promise<{
    count: number;
    keys: string[];
    totalSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        count: cacheKeys.length,
        keys: cacheKeys.map(key => key.replace(this.PREFIX, '')),
        totalSize
      };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return { count: 0, keys: [], totalSize: 0 };
    }
  }
}

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  // Profile data
  PROFILE: (userId: string) => `profile_${userId}`,
  
  // Orders
  USER_ORDERS: (userId: string) => `user_orders_${userId}`,
  DRIVER_ORDERS: (driverId: string) => `driver_orders_${driverId}`,
  ORDER_DETAILS: (orderId: string) => `order_${orderId}`,
  
  // Notifications
  NOTIFICATIONS: (userId: string) => `notifications_${userId}`,
  
  // Referral data
  REFERRAL_CODE: (userId: string) => `referral_code_${userId}`,
  REFERRAL_STATS: (userId: string) => `referral_stats_${userId}`,
  REFERRAL_HISTORY: (userId: string) => `referral_history_${userId}`,
  
  // App data
  ANNOUNCEMENTS: 'announcements',
  REFERRAL_CONFIG: 'referral_config',
} as const;