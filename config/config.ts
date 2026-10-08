import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the development server IP address
 * This works by using Expo's debugger host which is your computer's IP
 */
function getDevServerIP(): string {
  const debuggerHost = Constants.expoConfig?.hostUri;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    console.log('🌐 [Config] Detected dev server IP:', ip);
    return ip;
  }
  if (Platform.OS === 'android') {
    console.log('🌐 [Config] Using Android emulator localhost (10.0.2.2)');
    return '10.53.206.100';
  }

  console.log('⚠️ [Config] Could not detect IP, falling back to localhost');
  return 'localhost';
}

const devIP = getDevServerIP();
const DEFAULT_PORT = '3002';
const WS_PORT = '8080';

// Check if we're in development mode
const isDevelopment = __DEV__;

// Production URLs - hardcoded for one.beonadvert.com
const baseUrl = isDevelopment
  ? `http://${devIP}:${DEFAULT_PORT}`
  : 'https://mytrucket.com';

const orpcUrl = isDevelopment
  ? `http://${devIP}:${DEFAULT_PORT}/rpc`
  : 'https://mytrucket.com/rpc';

const authUrl = isDevelopment
  ? `http://${devIP}:${DEFAULT_PORT}/api/auth`
  : 'https://mytrucket.com/api/auth';

const wsUrl = isDevelopment
  ? `ws://${devIP}:${DEFAULT_PORT}`
  : 'wss://mytrucket.com';

const uploadsUrl = isDevelopment
  ? `http://${devIP}:${DEFAULT_PORT}/uploads`
  : 'https://mytrucket.com/uploads';

console.log('🔧 [Config] API Configuration:', {
  isDevelopment,
  baseUrl,
  orpcUrl,
  authUrl,
  wsUrl,
  uploadsUrl,
});

export const config = {
  api: {
    baseUrl,
    orpcUrl,
    authUrl,
    wsUrl,
    uploadsUrl,
  },
};
