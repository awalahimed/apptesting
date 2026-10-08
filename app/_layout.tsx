import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { SplashScreenComponent } from '@/components/splash-screen';
import { OnboardingSlider } from '@/components/onboarding';
import { GlobalOfflineBanner } from '@/components/shared/GlobalOfflineBanner';
import { useAppStore } from '@/hooks/use-app-store';
import { SidebarProvider } from '@/components/user/SidebarContext';
import { Sidebar } from '@/components/user/Sidebar';
import { AuthProvider, useAuth } from '@/hooks/AuthContext';
import { WebSocketProvider } from '@/hooks/WebSocketContext';
import { ThemeProvider } from '@/hooks/ThemeContext';
import { DriverStatusProvider } from '@/hooks/DriverStatusContext';
import { NotificationProvider } from '@/hooks/NotificationContext';
import { AlertProvider } from '@/components/shared/CustomAlert';
import { userRoles } from '@/constants/userRoles';
import '@/types/auth';
import { trackActivity } from '@/utils/tokenStorage';

// Route configuration
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/auth/account-suspended',
  '/auth/account-flagged',
] as const;

const ONBOARDING_ROUTES = [
  '/auth/onboarding/',
] as const;

const APP_ROUTES = [
  '/(tabs)/user/',
  '/(tabs)/driver/',
  '/(tabs)/shared/',
  '/shared/',
  '/order',
] as const;

const DISALLOWED_ROLES = ['admin', 'call_center'];

// Helper functions
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    route.endsWith('/')
      ? pathname.startsWith(route)
      : pathname === route
  )
}

function isOnboardingRoute(pathname: string): boolean {
  return ONBOARDING_ROUTES.some(route =>
    route.endsWith('/')
      ? pathname.startsWith(route)
      : pathname === route
  )
}

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(route =>
    route.endsWith('/')
      ? pathname.startsWith(route)
      : pathname === route
  )
}

function getHomeRoute(role: string): string {
  switch (role) {
    case userRoles.DRIVER:
      return '/(tabs)/driver/home';
    case userRoles.OWNER_SHOP:
      return '/(tabs)/user/home';
    default:
      return '/(tabs)/user/home';
  }
}

function getAllowedRoutes(role: string): string[] {
  switch (role) {
    case userRoles.DRIVER:
      return ['/(tabs)/driver/', '/(tabs)/shared/', '/shared/', '/order'];
    case userRoles.OWNER_SHOP:
      return ['/(tabs)/user/', '/(tabs)/shared/', '/shared/', '/order'];
    default:
      return ['/(tabs)/user/', '/(tabs)/shared/', '/shared/', '/order'];
  }
}

function needsOnboarding(role: string): boolean {
  return role === 'unknown' || !role;
}

function needsAccountStatusRedirect(accountStatus: string | null, banned: boolean | null): 'suspended' | 'flagged' | null {
  if (accountStatus === 'suspended' || banned) return 'suspended';
  if (accountStatus === 'flagged') return 'flagged';
  return null;
}

// Auth Guard Component
function AuthGuard({
  children,
  session,
  pathname,
  hasFinishedSplash,
  isAuthLoading,
}: {
  children: React.ReactNode;
  session: ReturnType<typeof useAuth>['session'];
  pathname: string;
  hasFinishedSplash: boolean;
  isAuthLoading: boolean;
}) {
  const { refreshSession } = useAuth();
  const lastCheckedPath = useRef<string>('');

  // Initial auth check on mount
  useEffect(() => {
    if (hasFinishedSplash && !isAuthLoading && !session?.user) {
      refreshSession();
    }
  }, [hasFinishedSplash, isAuthLoading, session]);

  // Redirect based on auth state - runs on every pathname change
  useEffect(() => {
    // Skip if still loading or splash not done
    if (!hasFinishedSplash || isAuthLoading) return;

    // Skip if no session
    if (!session?.user) {
      if (!isPublicRoute(pathname)) {
        router.replace('/auth/login');
      }
      return;
    }

    // Skip if we already checked this path for this user
    const checkKey = `${pathname}-${session.user.id}`;
    if (lastCheckedPath.current === checkKey) return;
    lastCheckedPath.current = checkKey;

    const user = session.user;
    const userRole = user.role;

    // Check for disallowed roles
    if (DISALLOWED_ROLES.includes(userRole)) {
      if (pathname !== '/auth/login') {
        router.replace('/auth/login');
      }
      return;
    }

    // Check account status
    const statusRedirect = needsAccountStatusRedirect(user.accountStatus, user.banned);
    if (statusRedirect) {
      const targetPath = `/auth/account-${statusRedirect}`;
      if (pathname !== targetPath) {
        router.replace(targetPath as any);
      }
      return;
    }

    // Check onboarding status
    if (needsOnboarding(userRole)) {
      if (!isOnboardingRoute(pathname) && pathname !== '/auth/role-selection') {
        router.replace('/auth/role-selection');
      }
      return;
    }

    // Redirect from role-selection if already onboarded
    if (pathname === '/auth/role-selection') {
      const homeRoute = getHomeRoute(userRole);
      router.replace(homeRoute as any);
      return;
    }

    // Check if user is accessing a route outside their role
    const allowedRoutes = getAllowedRoutes(userRole);
    const isAllowedRoute = allowedRoutes.some(route =>
      pathname.startsWith(route) || pathname === route
    );

    if (!isAllowedRoute && isAppRoute(pathname)) {
      console.log('Route not allowed:', pathname, 'for role:', userRole, 'allowed routes:', allowedRoutes);
      const homeRoute = getHomeRoute(userRole);
      router.replace(homeRoute as any);
      return;
    }

    // If on public route but authenticated, redirect to home
    // But skip if we're on login page (user might be in OTP verification)
    if (isPublicRoute(pathname) && !isOnboardingRoute(pathname) && pathname !== '/auth/login') {
      const homeRoute = getHomeRoute(userRole);
      router.replace(homeRoute as any);
    }
  }, [session, pathname, hasFinishedSplash, isAuthLoading]);

  return <>{children}</>;
}

// Main Layout Component
function MainLayout({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();
  const { session, isLoading: isAuthLoading } = useAuth();

  const {
    isOnboardingComplete,
    hasFinishedSplash,
    markSplashFinished,
    completeOnboarding,
    checkOnboardingStatus,
  } = useAppStore();

  // Initialize app store
  useEffect(() => {
    if (!isInitialized) {
      checkOnboardingStatus();
      setIsInitialized(true);
    }
  }, [isInitialized, checkOnboardingStatus]);

  // Track user activity
  useEffect(() => {
    const interval = setInterval(() => {
      trackActivity();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Determine what to render
  const renderContent = useMemo(() => {
    if (!hasFinishedSplash) {
      return (
        <SplashScreenComponent
          mode="splash"
          onAnimationComplete={markSplashFinished}
        />
      );
    }

    if (!isOnboardingComplete) {
      return (
        <OnboardingSlider onComplete={completeOnboarding} />
      );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
  }, [hasFinishedSplash, isOnboardingComplete, markSplashFinished, completeOnboarding]);

  return (
    <SidebarProvider>
      <DriverStatusProvider>
        <NotificationProvider>
          <Sidebar />
          <AuthGuard
            session={session}
            pathname={pathname}
            hasFinishedSplash={hasFinishedSplash}
            isAuthLoading={isAuthLoading}
          >
            {session?.user ? (
              <WebSocketProvider>
                <GlobalOfflineBanner />
                {renderContent}
              </WebSocketProvider>
            ) : (
              renderContent
            )}
          </AuthGuard>
          <Toaster />
        </NotificationProvider>
      </DriverStatusProvider>
    </SidebarProvider>
  );
}

export default function RootLayout() {
  // Add global error handler for uncaught promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: any) => {
      const error = event.reason;
      console.log('Unhandled promise rejection:', error);
      
      // Silently ignore keep-awake errors (known issue in development builds)
      if (error?.message?.includes?.('keep awake') || 
          error?.message?.includes?.('KeepAwake')) {
        console.log('Ignoring keep-awake error (non-critical)');
        event.preventDefault?.();
        return;
      }
      
      // Prevent other errors from crashing the app
      event.preventDefault?.();
    };

    const handleError = (event: any) => {
      const error = event.error;
      console.log('Uncaught error:', error);
      
      // Silently ignore keep-awake errors
      if (error?.message?.includes?.('keep awake') || 
          error?.message?.includes?.('KeepAwake')) {
        console.log('Ignoring keep-awake error (non-critical)');
        event.preventDefault?.();
        return;
      }
    };

    // For React Native
    if (typeof global !== 'undefined') {
      global.addEventListener?.('unhandledrejection', handleUnhandledRejection);
      global.addEventListener?.('error', handleError);
    }

    return () => {
      global.removeEventListener?.('unhandledrejection', handleUnhandledRejection);
      global.removeEventListener?.('error', handleError);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AlertProvider>
            <AuthProvider>
              <MainLayout>
                <></>
              </MainLayout>
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
