/**
 * Centralized Auth Hook
 *
 * This hook provides a single source of truth for authentication state.
 * All auth-related state and operations should be accessed through this hook.
 *
 * @deprecated Use useAuth from AuthContext.tsx instead
 */

import { useAuth as useAuthContext } from './AuthContext';
import type { AuthUser, Session } from '../utils/tokenStorage';

// Re-export types for backward compatibility
export type { AuthUser, Session } from '../utils/tokenStorage';

interface UseAuthReturn {
  // State
  state: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
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
  verifyRegisterOTP: (phoneNumber: string, code: string) => Promise<{ success: boolean; error?: string }>;
  sendRegisterOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  sendLoginOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;

  // Password operations
  sendResetOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: { phoneNumber: string; code: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;

  // Session operations
  refreshSession: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  clearSession: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

// Add additional auth operations not in the context
import { orpc } from './orpc';
import { tokenStorage } from '../utils/tokenStorage';
import { useCallback, useState } from 'react';

export function useAuth(): UseAuthReturn {
  const context = useAuthContext();

  // Additional state for OTP operations
  const [otpState, setOtpState] = useState<{
    phoneNumber: string;
    purpose: 'login' | 'register' | 'reset';
  } | null>(null);

  const resendLoginOTP = useCallback(async (phone: string) => {
    try {
      const result = await orpc.authApp.sendLoginOTP({ phoneNumber: phone });
      if (!result.success) {
        throw new Error(result.message || 'Failed to resend OTP');
      }
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to resend OTP' };
    }
  }, []);

  const sendRegisterOTP = useCallback(async (phone: string) => {
    try {
      const result = await orpc.authApp.sendResetOTP({ phoneNumber: phone });
      if (!result.success) {
        throw new Error(result.message || 'Failed to send OTP');
      }
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to send OTP' };
    }
  }, []);

  const sendLoginOTP = useCallback(async (phone: string) => {
    try {
      const result = await orpc.authApp.sendLoginOTP({ phoneNumber: phone });
      if (!result.success) {
        throw new Error(result.message || 'Failed to send OTP');
      }
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to send OTP' };
    }
  }, []);

  const sendResetOTP = useCallback(async (phone: string) => {
    context.clearError(); // Clear any existing errors
    try {
      const result = await orpc.authApp.sendResetOTP({ phoneNumber: phone });
      if (!result.success) {
        throw new Error(result.message || 'Failed to send reset code');
      }
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to send reset code' };
    }
  }, [context]);

  const resetPassword = useCallback(async (data: { phoneNumber: string; code: string; newPassword: string }) => {
    context.clearError(); // Clear any existing errors
    try {
      const result = await orpc.authApp.resetPassword({
        phoneNumber: data.phoneNumber,
        code: data.code,
        newPassword: data.newPassword
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to reset password');
      }
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to reset password' };
    }
  }, [context]);

  const verifyRegisterOTP = useCallback(async (phone: string, code: string) => {
    return context.verifyRegistrationOTP(phone, code);
  }, [context]);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      const result = await orpc.authApp.refreshTokens({ refreshToken });
      if (result.accessToken && result.user) {
        await tokenStorage.setToken({
          token: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user
        });
        context.setSession({ user: result.user, token: result.accessToken });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [context]);

  const signOut = context.logout;
  const clearSession = context.setSession;

  return {
    ...context,
    resendLoginOTP,
    sendRegisterOTP,
    sendLoginOTP,
    sendResetOTP,
    resetPassword,
    verifyRegisterOTP,
    signOut,
    clearSession,
    refreshTokens,
  };
}
