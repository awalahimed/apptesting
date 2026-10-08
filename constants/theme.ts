// Theme configuration - import this file for all app colors
import { rf, rs } from '@/utils/responsive'

// App Info
export const appName = 'My Truck';
export const appTagline = 'Track your deliveries';

// Primary Colors - Teal/Green theme
export const colors = {
  primary: '#1a9b7f',
  primaryLight: '#4abb9a',
  primaryDark: '#158f73',
  primaryOpacity10: 'rgba(26, 155, 127, 0.1)',
  primaryOpacity20: 'rgba(26, 155, 127, 0.2)',
  primaryOpacity30: 'rgba(26, 155, 127, 0.3)',

  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',

  // Card
  card: '#FFFFFF',
  cardSecondary: '#F3F4F6',
  surface: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Status
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  
  // Input
  inputBackground: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputPlaceholder: '#9CA3AF',
  inputText: '#1A1A1A',

  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Ring colors (for splash screen)
  ringPrimary: '#3B82F6',
  ringSecondary: '#60A5FA',

  // Social
  google: '#DB4437',
  telegram: '#0088CC',
  
  // Dark mode colors
  dark: {
    background: '#000000',
    backgroundSecondary: '#111111',
    card: '#1A1A1A',
    cardSecondary: '#262626',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    border: '#2D2D2D',
    borderLight: '#374151',
    inputBackground: '#1A1A1A',
    inputBorder: '#374151',
  },
};

// Spacing (responsive)
export const spacing = {
  xs: rs(4),
  sm: rs(8),
  md: rs(16),
  lg: rs(24),
  xl: rs(32),
  xxl: rs(48),
};

// Border Radius (responsive)
export const borderRadius = {
  sm: rs(4),
  md: rs(8),
  lg: rs(12),
  xl: rs(16),
  xxl: rs(24),
  full: 9999,
};

// Font Sizes (responsive)
export const fontSize = {
  xs: rf(12),
  sm: rf(14),
  md: rf(16),
  lg: rf(18),
  xl: rf(24),
  xxl: rf(32),
  xxxl: rf(42),
};

// Font Weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Combined theme object for convenience
export const theme = {
  appName,
  appTagline,
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
};

// Types
export type AppColors = typeof colors;
export type AppSpacing = typeof spacing;
export type AppBorderRadius = typeof borderRadius;
export type AppFontSize = typeof fontSize;
