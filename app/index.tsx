import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import { userRoles } from '@/constants/userRoles';
import { colors } from '@/constants/theme';
import { SplashScreenComponent } from '@/components/splash-screen';

export default function Index() {
  const { session, isLoading, state } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedInitialSession = useRef(false);

  // Check if this is initial load or post-login
  useEffect(() => {
    if (!hasCheckedInitialSession.current && !isLoading) {
      hasCheckedInitialSession.current = true;
      // If session exists on first check, user was already logged in
      // Don't show splash, just redirect
      if (session?.user) {
        setShowSplash(false);
      } else {
        // No session yet - will show splash when session appears (after login)
        setShowSplash(true);
      }
    }
  }, [session, isLoading]);

  useEffect(() => {
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    // Don't redirect if auth is still loading or we're already redirecting
    if (isLoading || isRedirecting) return;

    // Don't redirect if auth state is still loading (prevents race conditions)
    if (state === 'loading') return;

    const handleRedirect = async () => {
      setIsRedirecting(true);
      
      // Longer delay to ensure auth state is fully stable after login/registration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Double-check session state after delay
      if (!session?.user) {
        // No user session, redirect to login
        router.replace('/auth/login');
        return;
      }

      const user = session.user;
      const userRole = user.role;

      // Check account status first
      if (user.accountStatus === 'suspended' || user.banned) {
        router.replace('/auth/account-suspended');
        return;
      }

      if (user.accountStatus === 'flagged') {
        router.replace('/auth/account-flagged');
        return;
      }

      // Check if user needs onboarding
      if (!userRole || userRole === 'unknown') {
        router.replace('/auth/role-selection');
        return;
      }

      // Redirect based on user role
      switch (userRole) {
        case userRoles.DRIVER:
          router.replace('/(tabs)/driver/home');
          break;
        case userRoles.OWNER_SHOP:
          router.replace('/(tabs)/user/home');
          break;
        default:
          // Unknown role, go to role selection
          router.replace('/auth/role-selection');
          break;
      }
    };

    // Use timeout to prevent blocking and allow cleanup
    redirectTimeoutRef.current = setTimeout(handleRedirect, 100);

    // Cleanup function
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [session, isLoading, isRedirecting, state]);

  // Show splash screen only for post-login
  if (showSplash && session?.user) {
    return (
      <SplashScreenComponent 
        mode="loading" 
        onAnimationComplete={() => {}} 
      />
    );
  }

  // Show simple spinner for initial load (user already logged in)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});