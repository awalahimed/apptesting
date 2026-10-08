/**
 * Data formatting utility functions
 */

import { Platform } from 'react-native';

/**
 * Format currency value
 */
export const formatCurrency = (
  amount: number,
  currency = 'ETB',
  locale = 'en-ET'
): string => {
  // For Ethiopian Birr, use custom formatting since Intl may not support it well
  if (currency === 'ETB') {
    return `${new Intl.NumberFormat(locale).format(amount)} ብር`;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (
  num: number,
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format large numbers (e.g., 1.2K, 3.5M)
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals = 0
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format duration in milliseconds to human readable
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Format distance in meters to kilometers/miles
 */
export const formatDistance = (
  meters: number,
  useMiles = false
): string => {
  if (useMiles) {
    const miles = meters / 1609.344;
    return `${miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

/**
 * Format time from hours and minutes
 */
export const formatTime = (
  hours: number,
  minutes: number,
  format: '12h' | '24h' = '12h'
): string => {
  let h = hours;

  if (format === '12h') {
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Format address from components
 */
export const formatAddress = (components: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): string => {
  const parts = [
    components.street,
    components.city,
    components.state && components.zipCode
      ? `${components.state} ${components.zipCode}`
      : components.state || components.zipCode,
    components.country,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (
  text: string,
  maxLength: number,
  position: 'end' | 'middle' = 'end'
): string => {
  if (text.length <= maxLength) return text;

  if (position === 'middle') {
    const half = Math.floor((maxLength - 3) / 2);
    return `${text.slice(0, half)}...${text.slice(-half)}`;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Convert camelCase to Title Case
 */
export const camelToTitle = (camelCase: string): string => {
  const result = camelCase.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * Convert snake_case to Title Case
 */
export const snakeToTitle = (snakeCase: string): string => {
  const result = snakeCase.split('_').map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  return result.join(' ');
};

/**
 * Capitalize first letter of each word
 */
export const titleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Mask sensitive data (e.g., credit card, SSN)
 */
export const maskSensitive = (
  value: string,
  visibleChars = 4,
  maskChar = '*'
): string => {
  const masked = maskChar.repeat(Math.max(0, value.length - visibleChars));
  const visible = value.slice(-visibleChars);
  return masked + visible;
};

/**
 * Get initials from name
 */
export const getInitials = (
  name: string,
  maxLength = 2
): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, maxLength).toUpperCase();
  }
  return words.slice(0, maxLength).map((w) => w[0].toUpperCase()).join('');
};

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export const formatOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  return `${n}${suffix}`;
};
