import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_complete';

interface AppState {
  isLoading: boolean;
  isOnboardingComplete: boolean;
  hasFinishedSplash: boolean;
  completeOnboarding: () => Promise<void>;
  markSplashFinished: () => void;
  checkOnboardingStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: true,
  isOnboardingComplete: false,
  hasFinishedSplash: false,

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      set({ isOnboardingComplete: true });
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  },

  markSplashFinished: () => {
    set({ hasFinishedSplash: true });
  },

  checkOnboardingStatus: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({
        isLoading: false,
        isOnboardingComplete: value === 'true',
      });
    } catch (error) {
      console.error('Failed to read onboarding status:', error);
      set({ isLoading: false, isOnboardingComplete: false });
    }
  },
}));
