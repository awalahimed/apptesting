import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from 'backend/routes/_app'
import { config } from '../config/config'
import { SecureStore } from '@/utils/storage'

let isRefreshing = false

/**
 * Custom fetch with error handling and token refresh
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, init)

  // If we get an error (500 or 401)
  if (response.status === 401 || response.status === 500) {
    const clone = response.clone()
    try {
      const data = await clone.json()
      const error = data?.error || data
      const errorMessage = error?.message || data?.message || ''
      const errorCode = error?.code || data?.code || ''
      const isRefreshTokenExpired = error?.isRefreshTokenExpired === true || data?.isRefreshTokenExpired === true

      // Check if backend explicitly says refresh token is expired
      if (isRefreshTokenExpired) {
        console.log('[customFetch] ⚠️ Refresh token expired (backend flag) - forcing logout')
        await clearAuthStorage()
        return response
      }

      // Check if it's a session expired error
      const isSessionExpired = errorMessage.toLowerCase().includes('session expired') ||
        errorMessage.toLowerCase().includes('refresh token expired') ||
        errorMessage.toLowerCase().includes('refresh token invalid');

      // If session/refresh token is expired, force logout
      if (isSessionExpired) {
        console.log('[customFetch] ⚠️ Session expired - forcing logout')
        await clearAuthStorage()
        return response
      }

      // JWT expired - try to refresh (only for access token expiry)
      if (errorCode === 'UNAUTHORIZED' || errorCode === 'ERR_JWT_EXPIRED' || errorMessage.toLowerCase().includes('expired')) {
        if (!isRefreshing) {
          isRefreshing = true
          const refreshed = await doRefreshTokens()
          isRefreshing = false

          if (refreshed) {
             const newToken = await SecureStore.getItemAsync('auth_access_token')
             if (newToken && init) {
                const newHeaders = new Headers(init.headers)
                newHeaders.set('Authorization', `Bearer ${newToken}`)
                return fetch(input, { ...init, headers: newHeaders })
             }
          } else {
            // Refresh failed - tokens already cleared in doRefreshTokens
            console.log('[customFetch] Token refresh failed - user will be logged out')
          }
        }
        return response
      }

      // If user is not found (database was reset), clear and logout
      if (errorMessage === 'User not found' || (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('token') && errorMessage.includes('User not found'))) {
        console.log('[customFetch] User not found - forcing logout')
        await clearAuthStorage()
        return response
      }
    } catch (e) {
      // Not JSON - could be network error
      console.warn('[customFetch] Error parsing response:', e)
    }
  }

  return response
}

/**
 * Refresh the access token using the refresh token
 */
async function doRefreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync('auth_refresh_token')
    if (!refreshToken) {
      console.log('[doRefreshTokens] No refresh token found - logging out')
      await clearAuthStorage()
      return false
    }

    const result = await orpc.authApp.refreshTokens({ refreshToken })
    if (result.accessToken && result.user) {
      await SecureStore.setItemAsync('auth_access_token', result.accessToken)
      await SecureStore.setItemAsync('auth_refresh_token', result.refreshToken)
      await SecureStore.setItemAsync('auth_user', JSON.stringify(result.user))
      await SecureStore.setItemAsync('token_issued_at', Date.now().toString())
      return true
    }

    // Refresh failed - clear auth storage
    console.log('[doRefreshTokens] Refresh failed - invalid response')
    await clearAuthStorage()
    return false
  } catch (error: any) {
    console.error('[doRefreshTokens] Error:', error)
    
    // Check if backend explicitly says refresh token is expired
    const isRefreshTokenExpired = error?.isRefreshTokenExpired === true ||
      error?.data?.isRefreshTokenExpired === true ||
      error?.message?.toLowerCase().includes('refresh token expired');
    
    // If refresh token is expired, force logout regardless of remember me
    if (isRefreshTokenExpired) {
      console.log('[doRefreshTokens] ⚠️ Refresh token expired - forcing logout')
      await clearAuthStorage()
      return false
    }
    
    // Check if it's a network error
    const isNetworkError = error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('connection')
    );
    
    // Check for other expiration messages (fallback)
    const isExpiredError = error?.message?.toLowerCase().includes('expired') ||
      error?.message?.toLowerCase().includes('invalid') ||
      error?.message?.toLowerCase().includes('session expired') ||
      error?.code === 'UNAUTHORIZED' ||
      error?.code === 'ERR_JWT_EXPIRED';
    
    // If it's any expiration error, force logout
    if (isExpiredError) {
      console.log('[doRefreshTokens] ⚠️ Token expired - forcing logout')
      await clearAuthStorage()
      return false
    }
    
    // If it's a network error, check remember me preference
    if (isNetworkError) {
      const rememberMe = await SecureStore.getItemAsync('remember_me_preference')
      if (rememberMe === 'true') {
        console.log('[doRefreshTokens] Network error but remember me enabled - keeping tokens')
        return false // Don't clear tokens, but indicate refresh failed
      }
    }
    
    // If it's a "Not Found" error, clear auth storage
    if (error?.message?.includes('Not Found') || error?.code === 'NOT_FOUND') {
      console.log('[doRefreshTokens] User not found - logging out')
      await clearAuthStorage()
    } else {
      // For other errors, use conditional clear
      await clearAuthStorageConditional()
    }
    return false
  }
}

async function clearAuthStorageConditional() {
  // Check remember me preference and network status
  const rememberMe = await SecureStore.getItemAsync('remember_me_preference')
  
  // For now, we can't easily check network status here, so we'll be conservative
  // and only clear if remember me is not enabled
  if (rememberMe !== 'true') {
    await clearAuthStorage()
  } else {
    console.log('[clearAuthStorageConditional] Remember me enabled - keeping auth storage')
  }
}

async function clearAuthStorage() {
  await SecureStore.deleteItemAsync('auth_access_token')
  await SecureStore.deleteItemAsync('auth_refresh_token')
  await SecureStore.deleteItemAsync('auth_user')
  await SecureStore.deleteItemAsync('token_issued_at')
}

const link = new RPCLink({
  url: config.api.orpcUrl,
  fetch: customFetch,
  headers: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('auth_access_token')
      if (accessToken) {
        return { 'Authorization': `Bearer ${accessToken}` }
      }
    } catch {
    }
    return {}
  },
})

export const orpc: RouterClient<AppRouter> = createORPCClient(link)

// Export refreshTokens for external use
export async function refreshTokens(): Promise<boolean> {
  return doRefreshTokens()
}
