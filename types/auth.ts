/**
 * Authentication types for the app
 */

export interface AuthUser {
  id: string
  name: string
  email: string
  image: string | null
  phoneNumber: string
  phoneNumberVerified: boolean
  role: string
  accountStatus?: string
  banned?: boolean
}

export interface AuthSession {
  user: AuthUser
  session: {
    token: string
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
