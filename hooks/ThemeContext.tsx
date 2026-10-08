import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  colors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

// Light theme colors
const lightColors = {
  primary: '#1a9b7f',
  primaryLight: '#4abb9a',
  primaryDark: '#158f73',
  primaryOpacity10: 'rgba(26, 155, 127, 0.1)',
  primaryOpacity20: 'rgba(26, 155, 127, 0.2)',
  primaryOpacity30: 'rgba(26, 155, 127, 0.3)',

  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  card: '#FFFFFF',
  cardSecondary: '#F3F4F6',
  surface: '#FFFFFF',

  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',

  inputBackground: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputPlaceholder: '#9CA3AF',
  inputText: '#1A1A1A',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  ringPrimary: '#3B82F6',
  ringSecondary: '#60A5FA',

  google: '#DB4437',
  telegram: '#0088CC',
  white: '#FFFFFF',
};

// Dark theme colors - Surface A20 palette
const darkColors = {
  primary: '#1a9b7f',
  primaryLight: '#4abb9a',
  primaryDark: '#158f73',
  primaryOpacity10: 'rgba(26, 155, 127, 0.1)',
  primaryOpacity20: 'rgba(26, 155, 127, 0.2)',
  primaryOpacity30: 'rgba(26, 155, 127, 0.3)',

  background: '#121212',        // Surface A0 - Base dark
  backgroundSecondary: '#1E1E1E', // Surface A10
  card: '#2C2C2C',              // Surface A20
  cardSecondary: '#383838',     // Surface A30
  surface: '#2C2C2C',           // Surface A20

  text: '#FFFFFF',              // Pure white
  textSecondary: '#B3B3B3',     // Light gray
  textMuted: '#808080',         // Medium gray

  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',

  inputBackground: '#2C2C2C',   // Surface A20
  inputBorder: '#404040',       // Slightly lighter
  inputPlaceholder: '#808080',  // Medium gray
  inputText: '#FFFFFF',         // Pure white

  border: '#383838',            // Surface A30
  borderLight: '#404040',       // Lighter border

  ringPrimary: '#3B82F6',
  ringSecondary: '#60A5FA',

  google: '#DB4437',
  telegram: '#0088CC',
  white: '#FFFFFF',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Get current colors based on theme
  const colors = isDark ? darkColors : lightColors;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
