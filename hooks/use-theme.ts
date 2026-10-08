import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'dark';

  return {
    colors: {
      background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
      card: colorScheme === 'dark' ? '#1A1A1A' : '#F5F5F5',
      primary: '#3B82F6',
      secondary: '#64748B',
      text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      textSecondary: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
      border: colorScheme === 'dark' ? '#2D2D2D' : '#E5E5E5',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    isDark: colorScheme === 'dark',
  };
}
