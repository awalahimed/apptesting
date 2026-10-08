import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { SecureStore } from '@/utils/storage';
import { orpc } from './orpc';
import { tokenStorage, type AuthUser } from '../utils/tokenStorage';
import { useNetworkState } from './useNetworkState';

type AuthState = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface Session {
  user: AuthUser;
  token: string;
}

interface AuthContextType {
  // State
  state: AuthState;
  session: Session | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth operations
  login: (phoneNumber: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  verifyLoginOTP: (phoneNumber: string, code: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  resendLoginOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  register: (phoneNumber: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifyRegistrationOTP: (phoneNumber: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout

  // Session operations
  refreshSession: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<void>;
  setSession: (session: Session | null) => void;

  // Error handling
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [session, setSessionState] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef(state);
  const sessionRef = useRef(session);
  const isInitialized = useRef(false);

  // Get network state for offline-aware logout
  const networkState = useNetworkState(false); // Pass false since we don't have WebSocket context here

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        setState('unauthenticated');
        isInitialized.current = true;
        return;
      }

      const user = await tokenStorage.getUser();
      if (user) {
        setSessionState({ user, token });
        setState('authenticated');
      } else {
        await tokenStorage.clearToken();
        setState('unauthenticated');
      }
    } catch {
      await tokenStorage.clearToken();
      setState('unauthenticated');
    } finally {
      isInitialized.current = true;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Periodic check for token validity (every 30 seconds)
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (state !== 'authenticated') return;
      
      const token = await tokenStorage.getToken();
      if (!token && sessionRef.current) {
        // Tokens were cleared (likely by orpc due to expiration) but state is still authenticated
        console.log('[AuthContext] Tokens cleared externally - logging out');
        setSessionState(null);
        setState('unauthenticated');
      }
    };

    const interval = setInterval(checkTokenValidity, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [state]);

  const setSession = useCallback((newSession: Session | null) => {
    setSessionState(newSession);
    if (newSession) {
      setState('authenticated');
    } else {
      setState('unauthenticated');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateUser = useCallback(async (userData: Partial<AuthUser>) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev.user, ...userData };
      return { ...prev, user: updatedUser };
    });

    // Also update SecureStore
    const currentSession = sessionRef.current;
    if (currentSession) {
      const updatedUser = { ...currentSession.user, ...userData };
      await tokenStorage.setToken({
        token: currentSession.token,
        refreshToken: await tokenStorage.getRefreshToken() || '',
        user: updatedUser,
        rememberMe: await tokenStorage.getRememberMe()
      }).catch(console.error);
    }
  }, []);

  const login = useCallback(async (phone: string, password: string, rememberMe: boolean = false) => {
    setState('loading');
    setError(null);
    try {
      // Store remember me preference for later use
      await tokenStorage.setRememberMe(rememberMe);
      
      const result = await orpc.authApp.sendLoginOTP({ phoneNumber: phone, password });
      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }
      setState('idle');
      return { success: true, message: result.message };
    } catch (err: any) {
      setError(err?.message || 'Login failed Invaled phone number or password ');
      setState('unauthenticated');
      return { success: false, message: err?.message || 'Login failed Invaled phone number or password' };
    }
  }, []);

  const verifyLoginOTP = useCallback(async (phone: string, code: string, rememberMe?: boolean) => {
    setState('loading');
    setError(null);
    try {
      const result = await orpc.authApp.verifyOTP({ phoneNumber: phone, code });
      if (!result.success) {
        throw new Error((result as any).message || 'Invalid OTP');
      }

      if ((result as any).accessToken && (result as any).user) {
        // Get remember me preference if not provided
        const shouldRemember = rememberMe !== undefined ? rememberMe : await tokenStorage.getRememberMe();
        
        await tokenStorage.setToken({
          token: (result as any).accessToken,
          refreshToken: (result as any).refreshToken,
          user: (result as any).user,
          rememberMe: shouldRemember
        });
        setSessionState({ user: (result as any).user, token: (result as any).accessToken });
        setState('authenticated');
      }
      return { success: true };
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
      setState('unauthenticated');
      return { success: false, error: err?.message };
    }
  }, []);

  const resendLoginOTP = useCallback(async (phone: string) => {
    setState('loading');
    setError(null);
    try {
      const result = await orpc.authApp.resendOTP({ phoneNumber: phone });
      if (!result.success) {
        throw new Error(result.message || 'Failed to resend OTP');
      }
      setState('idle');
      return { success: true, message: result.message || 'OTP sent successfully' };
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP');
      setState('idle');
      return { success: false, message: err?.message || 'Failed to resend OTP' };
    }
  }, []);

  const register = useCallback(async (phone: string, password: string) => {
    setState('loading');
    setError(null);
    try {
      const result = await orpc.authApp.setPassword({ phoneNumber: phone, newPassword: password });
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }
      setState('idle');
      return { success: true, message: result.message };
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      setState('unauthenticated');
      return { success: false, message: err?.message || 'Registration failed' };
    }
  }, []);

  const verifyRegistrationOTP = useCallback(async (phone: string, code: string) => {
    setState('loading');
    setError(null);
    try {
      const result = await orpc.authApp.verifyRegistrationOTP({ phoneNumber: phone, code });
      if (!result.success) {
        throw new Error((result as any).message || 'Invalid OTP');
      }

      if ((result as any).accessToken && (result as any).user) {
        // For registration, always set remember me to true for better UX
        await tokenStorage.setToken({
          token: (result as any).accessToken,
          refreshToken: (result as any).refreshToken,
          user: (result as any).user,
          rememberMe: true // Always true for registration
        });
        setSessionState({ user: (result as any).user, token: (result as any).accessToken });
        setState('authenticated');
      }
      return { success: true };
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
      setState('unauthenticated');
      return { success: false, error: err?.message };
    }
  }, []);

  const logout = useCallback(async () => {
    setState('loading');
    try {
      const user = await tokenStorage.getUser();
      if (user?.id && networkState.isOnline) {
        try {
          await orpc.authApp.logout({ userId: user.id });
        } catch {
          // Continue with local logout even if server logout fails
        }
      }
    } finally {
      // Use conditional clear that respects remember me preference when offline
      await tokenStorage.clearTokenConditional(!networkState.isOnline);
      
      // Only clear session state if tokens were actually cleared
      const hasTokens = await tokenStorage.hasToken();
      if (!hasTokens) {
        setSessionState(null);
        setState('unauthenticated');
      } else {
        // Tokens were kept due to remember me + offline, keep session but show as loading
        console.log('🔒 Remember me enabled and offline - keeping session active');
        setState('authenticated'); // Keep user logged in
      }
    }
  }, [networkState.isOnline]);

  const refreshSession = useCallback(async () => {
    // Skip if not initialized or no session
    if (!isInitialized.current) {
      await initializeAuth();
      return;
    }

    const token = await tokenStorage.getToken();
    const rememberMe = await tokenStorage.getRememberMe();
    
    if (!token) {
      // No token found - logout
      console.log('[AuthContext] No token found during refresh - logging out')
      setSessionState(null);
      setState('unauthenticated');
      return;
    }

    // If we're offline and have remember me enabled, skip session refresh
    if (!networkState.isOnline && rememberMe) {
      console.log('🔒 Skipping session refresh - offline with remember me enabled');
      return;
    }

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        console.log('[AuthContext] No refresh token found - logging out')
        await tokenStorage.clearToken();
        setSessionState(null);
        setState('unauthenticated');
        return;
      }
      
      const result = await orpc.authApp.getSession({
        accessToken: token,
        refreshToken: refreshToken
      });

      if (result?.user && (result as any).session?.token) {
        const updatedUser = (result as any).user;
        const newToken = (result as any).session.token;

        setSessionState({
          user: updatedUser,
          token: newToken
        });
        setState('authenticated');

        await tokenStorage.setToken({
          token: newToken,
          refreshToken: refreshToken || '',
          user: updatedUser,
          rememberMe: await tokenStorage.getRememberMe()
        });
      } else {
        // Session refresh returned invalid data - logout
        console.log('[AuthContext] Invalid session data - logging out')
        await tokenStorage.clearToken();
        setSessionState(null);
        setState('unauthenticated');
      }
    } catch (err: any) {
      // Session refresh failed - could be network issue or expired tokens
      console.error('[AuthContext] refreshSession error:', err);
      
      // Check if backend explicitly says refresh token is expired
      const isRefreshTokenExpired = err?.isRefreshTokenExpired === true ||
        err?.data?.isRefreshTokenExpired === true ||
        err?.message?.toLowerCase().includes('refresh token expired');
      
      // If refresh token is expired, force logout
      if (isRefreshTokenExpired) {
        console.log('[AuthContext] ⚠️ Refresh token expired - forcing logout')
        await tokenStorage.clearToken();
        setSessionState(null);
        setState('unauthenticated');
        return;
      }
      
      // Check if it's a session expired error
      const isSessionExpired = err?.message?.toLowerCase().includes('session expired') ||
        err?.message?.toLowerCase().includes('refresh token invalid');
      
      // If session is expired, force logout
      if (isSessionExpired) {
        console.log('[AuthContext] ⚠️ Session expired - forcing logout')
        await tokenStorage.clearToken();
        setSessionState(null);
        setState('unauthenticated');
        return;
      }
      
      // Check if it's a network error vs authentication error
      const isNetworkError = err instanceof Error && (
        err.message.includes('fetch') ||
        err.message.includes('network') ||
        err.message.includes('timeout') ||
        err.message.includes('connection') ||
        !networkState.isOnline
      );
      
      // If it's a network error and we have remember me enabled, don't logout
      if (isNetworkError && rememberMe) {
        console.log('🔒 Network error during session refresh but keeping session due to remember me');
        return;
      }
      
      // For other errors, logout
      console.log('[AuthContext] Session refresh failed - logging out')
      await tokenStorage.clearToken();
      setSessionState(null);
      setState('unauthenticated');
    }
  }, [initializeAuth, networkState.isOnline]);

  const value: AuthContextType = {
    state,
    session,
    user: session?.user ?? null,
    isLoading: state === 'loading',
    isAuthenticated: state === 'authenticated',
    error,
    clearError,
    login,
    verifyLoginOTP,
    resendLoginOTP,
    register,
    verifyRegistrationOTP,
    logout,
    signOut: logout, // Alias for backward compatibility
    refreshSession,
    updateUser,
    setSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
