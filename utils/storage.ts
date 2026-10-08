import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SecureStore = {
  async setItemAsync(key: string, value: string) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      await ExpoSecureStore.setItemAsync(key, value);
    }
  },
  async getItemAsync(key: string) {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
        return null;
      }
    } else {
      return await ExpoSecureStore.getItemAsync(key);
    }
  },
  async deleteItemAsync(key: string) {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      await ExpoSecureStore.deleteItemAsync(key);
    }
  }
};
