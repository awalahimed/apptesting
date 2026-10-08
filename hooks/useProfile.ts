/**
 * Profile Hook
 *
 * Centralized profile management operations.
 */

import { useState, useCallback } from 'react'
import { orpc } from './orpc'
import { tokenStorage } from '../utils/tokenStorage'

interface ProfileData {
  id: string
  name: string
  email: string
  phoneNumber: string
  maskedPhoneNumber?: string
  image: string | null
  role: string
  accountStatus: string | null
  banned: boolean | null
}

interface UseProfileReturn {
  // State
  profile: ProfileData | null
  isLoading: boolean
  error: string | null

  // Operations
  fetchProfile: (userId: string) => Promise<ProfileData | null>
  updateProfile: (data: { userId: string; name?: string; profilePhotoId?: string }) => Promise<boolean>
  changePassword: (data: { userId: string; currentPassword: string; newPassword: string }) => Promise<boolean>
  sendPhoneUpdateOTP: (data: { userId: string; newPhoneNumber: string }) => Promise<boolean>
  verifyAndUpdatePhone: (data: { userId: string; newPhoneNumber: string; otp: string }) => Promise<boolean>
  uploadProfilePhoto: (photoUri: string, userId: string) => Promise<string | null>

  // Cleanup
  clearError: () => void
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchProfile = useCallback(async (userId: string): Promise<ProfileData | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await orpc.profile.getProfile({ userId })
      if (result.success && result.user) {
        const profileData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phoneNumber: result.user.phoneNumber,
          image: result.user.image,
          role: result.user.role,
          accountStatus: result.user.accountStatus,
          banned: result.user.banned,
        } as ProfileData
        setProfile(profileData)
        return profileData
      }
      return null
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch profile')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: { userId: string; name?: string; profilePhotoId?: string }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await orpc.profile.updateProfile(data)
      if (result.success) {
        // Refresh profile data
        if (profile) {
          setProfile({ ...profile, name: data.name || profile.name })
        }
        return true
      }
      return false
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  const changePassword = useCallback(async (data: { userId: string; currentPassword: string; newPassword: string }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await orpc.profile.changePassword(data)
      return result.success
    } catch (err: any) {
      setError(err?.message || 'Failed to change password')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendPhoneUpdateOTP = useCallback(async (data: { userId: string; newPhoneNumber: string }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await orpc.profile.sendPhoneUpdateOTP(data)
      return result.success
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyAndUpdatePhone = useCallback(async (data: { userId: string; newPhoneNumber: string; otp: string }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await orpc.profile.verifyAndUpdatePhone(data)
      return result.success
    } catch (err: any) {
      setError(err?.message || 'Failed to verify phone')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadProfilePhoto = useCallback(async (photoUri: string, userId: string): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      // Dynamic import to avoid circular dependency
      const { uploadImage } = await import('../utils/upload')
      const photoId = await uploadImage(photoUri, {
        userId,
        documentType: 'profile_photo',
      })
      return photoId
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photo')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    sendPhoneUpdateOTP,
    verifyAndUpdatePhone,
    uploadProfilePhoto,
    clearError,
  }
}
