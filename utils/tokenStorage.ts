import { SecureStore } from '@/utils/storage'

const TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const USER_KEY = 'auth_user'
const LAST_ACTIVITY_KEY = 'last_activity'
const TOKEN_ISSUED_AT_KEY = 'token_issued_at'
const REMEMBER_ME_KEY = 'remember_me_preference'

// Session timeout in milliseconds (15 minutes)
export const INACTIVITY_TIMEOUT = 15 * 60 * 1000

export interface AuthUser {
  id: string
  name: string
  email: string
  image: string | null
  phoneNumber: string
  phoneNumberVerified?: boolean | null
  role: string
  accountStatus: string | null
  banned: boolean | null
}

export interface AuthToken {
  token: string
  refreshToken?: string
  user: AuthUser
  rememberMe?: boolean
}

class TokenStorage {
  async setToken(data: AuthToken): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token)
    if (data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken)
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user))
    // Store issued at time for JWT expiration checking
    await SecureStore.setItemAsync(TOKEN_ISSUED_AT_KEY, Date.now().toString())
    // Store remember me preference
    if (data.rememberMe !== undefined) {
      await SecureStore.setItemAsync(REMEMBER_ME_KEY, data.rememberMe.toString())
    }
    // Reset activity on new token
    await this.updateActivity()
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  }

  async getUser(): Promise<AuthUser | null> {
    const userStr = await SecureStore.getItemAsync(USER_KEY)
    if (!userStr) return null
    try {
      return JSON.parse(userStr) as AuthUser
    } catch {
      return null
    }
  }

  async getAuthData(): Promise<AuthToken | null> {
    const token = await this.getToken()
    const refreshToken = await this.getRefreshToken()
    const user = await this.getUser()
    if (!token || !user) return null
    return { token, refreshToken: refreshToken || undefined, user }
  }

  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
    await SecureStore.deleteItemAsync(LAST_ACTIVITY_KEY)
    await SecureStore.deleteItemAsync(TOKEN_ISSUED_AT_KEY)
    await SecureStore.deleteItemAsync(REMEMBER_ME_KEY)
  }

  async getRememberMe(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(REMEMBER_ME_KEY)
    return value === 'true'
  }

  async setRememberMe(rememberMe: boolean): Promise<void> {
    await SecureStore.setItemAsync(REMEMBER_ME_KEY, rememberMe.toString())
  }

  /**
   * Clear tokens but respect remember me preference
   * If remember me is enabled and we're offline, keep the tokens
   */
  async clearTokenConditional(isOffline: boolean = false): Promise<void> {
    const rememberMe = await this.getRememberMe()
    
    // If remember me is enabled and we're offline, don't clear tokens
    if (rememberMe && isOffline) {
      console.log('🔒 Remember me enabled and offline - keeping tokens stored')
      return
    }
    
    // Otherwise, clear all tokens
    await this.clearToken()
  }

  async hasToken(): Promise<boolean> {
    const token = await this.getToken()
    return token !== null
  }

  // Track user activity (call this on user interactions)
  async updateActivity(): Promise<void> {
    await SecureStore.setItemAsync(LAST_ACTIVITY_KEY, Date.now().toString())
  }

  // Get last activity timestamp
  async getLastActivity(): Promise<number> {
    const value = await SecureStore.getItemAsync(LAST_ACTIVITY_KEY)
    return value ? parseInt(value, 10) : 0
  }

  // Check if session has timed out due to inactivity
  async isInactivityTimeout(): Promise<boolean> {
    const lastActivity = await this.getLastActivity()
    if (!lastActivity) return false
    const now = Date.now()
    const elapsed = now - lastActivity
    return elapsed > INACTIVITY_TIMEOUT
  }

  // Get token issued at time (for JWT expiration)
  async getTokenIssuedAt(): Promise<number> {
    const value = await SecureStore.getItemAsync(TOKEN_ISSUED_AT_KEY)
    return value ? parseInt(value, 10) : 0
  }

  // Check if token is expired based on issued time and default JWT expiry (15 minutes)
  // JWT tokens expire in 15 minutes by default
  async isTokenExpired(): Promise<boolean> {
    const issuedAt = await this.getTokenIssuedAt()
    if (!issuedAt) return true
    const now = Date.now()
    const elapsed = now - issuedAt
    // 15 minutes = 900000 ms, use 14 minutes to be safe and refresh before expiry
    const JWT_EXPIRY = 14 * 60 * 1000
    return elapsed > JWT_EXPIRY
  }
}

export const tokenStorage = new TokenStorage()

// Standalone activity tracking function for use in components/hooks
export function trackActivity(): void {
  tokenStorage.updateActivity()
}
