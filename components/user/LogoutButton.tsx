import { useState } from 'react';
import { useAlert } from '@/components/shared/CustomAlert';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkState } from '@/hooks/useNetworkState';
import { tokenStorage } from '@/utils/tokenStorage';
import { showToast } from '@/hooks/useToast';

interface LogoutButtonProps {
  variant?: 'text' | 'button' | 'icon';
  onLogoutComplete?: () => void;
}

export function LogoutButton({ variant = 'button', onLogoutComplete }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const networkState = useNetworkState(false);

  const handleLogout = async () => {
    // Check if remember me is enabled and we're offline
    const rememberMe = await tokenStorage.getRememberMe();
    const isOffline = !networkState.isOnline;
    
    if (rememberMe && isOffline) {
      Alert.alert(
        'Cannot Logout',
        'You have "Remember Me" enabled and are currently offline. Please connect to the internet to logout, or disable "Remember Me" in settings.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              console.log('🔴 [Logout] Starting logout...');
              await signOut();
              console.log('✅ [Logout] Logout successful');

              // Call callback if provided
              if (onLogoutComplete) {
                onLogoutComplete();
              }

              showToast({ type: 'success', message: 'Logged out successfully' });

              // Navigate immediately after logout completes
              router.replace('/auth/login');
            } catch (error) {
              console.error('❌ [Logout] Error:', error);
              showToast({ type: 'error', message: 'Failed to logout' });
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color={colors.error} />
        ) : (
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'text') {
    return (
      <TouchableOpacity
        style={styles.textButton}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.textButtonText}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, isLoggingOut && styles.buttonDisabled]}
      onPress={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : (
        <>
          <Ionicons name="log-out-outline" size={20} color={colors.surface} />
          <Text style={styles.buttonText}>Logout</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
