import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { SettingsItem } from '@/components/profile/SettingsItem';
import { EditBottomSheet } from '@/components/profile/EditBottomSheet';
import { VerifiedBadge } from '@/components/profile/VerifiedBadge';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  ArrowLeft,
  Smartphone,
  Lock,
  Camera,
} from 'lucide-react-native';
import { spacing, fontWeight, fontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineAwareAPI } from '@/hooks/useOfflineAwareAPI';
import { OfflineStorage, CacheKeys } from '@/utils/offlineStorage';
import { showToast } from '@/hooks/useToast';
import { uploadImageWithReplace } from '@/utils/upload';
import { config } from '@/config/config';
import { orpc as client } from '@/hooks/orpc';

type EditSheetType = 'name' | 'phone' | 'password';

export default function Profile() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { session, updateUser, refreshSession } = useAuth();
  const { networkState, api } = useOfflineAwareAPI();

  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [name, setName] = useState(session?.user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Bottom sheet states
  const [editSheetType, setEditSheetType] = useState<EditSheetType | null>(null);

  const fetchProfile = useCallback(async (useCache: boolean = true) => {
    if (!session?.user?.id) return;
    
    try {
      // Try to get cached data first if offline
      if (!networkState.isOnline && useCache) {
        const cachedProfile = await OfflineStorage.get(CacheKeys.PROFILE(session.user.id));
        if (cachedProfile) {
          console.log('Using cached profile data');
          setProfileData(cachedProfile);
          setName(cachedProfile.name || '');
          return;
        }
      }

      // Make API call with offline handling
      const result = await api.getProfile(session.user.id, {
        showOfflineMessage: true,
        retryOnReconnect: true,
        fallbackData: profileData, // Use current data as fallback
      });

      if (result.success) {
        setProfileData(result.user);
        setName(result.user.name || '');
        
        // Cache the data for offline use (expires in 1 hour)
        await OfflineStorage.set(CacheKeys.PROFILE(session.user.id), result.user, 60);
      }
    } catch (error) {
      console.error('[Profile] Error fetching profile:', error);
      
      // Try to load cached data as fallback
      if (useCache) {
        const cachedProfile = await OfflineStorage.get(CacheKeys.PROFILE(session.user.id));
        if (cachedProfile) {
          console.log('Using cached profile data after error');
          setProfileData(cachedProfile);
          setName(cachedProfile.name || '');
          showToast({ type: 'info', message: 'Using cached data' });
        }
      }
    }
  }, [session?.user?.id, networkState.isOnline, api, profileData]);

  const getProfilePhotoUrl = () => {
    // If user just picked a new photo, show that first
    if (profilePhoto) return { uri: profilePhoto };

    // Check profileData from backend first
    if (profileData?.image) {
      const image = profileData.image;
      const uri = image.startsWith('/')
        ? `${config.api.baseUrl}${image}`
        : image;
      return { uri };
    }

    // Fallback to session image
    if (session?.user?.image) {
      const uri = session.user.image.startsWith('/')
        ? `${config.api.baseUrl}${session.user.image}`
        : session.user.image;
      return { uri };
    }
    return null;
  };

  const getVerificationStatus = () => {
    const status = session?.user?.accountStatus || profileData?.accountStatus;
    if (status === 'verified' || status === 'active') {
      return 'verified';
    }
    if (status === 'pending') {
      return 'pending';
    }
    if (status === 'banned' || status === 'suspended') {
      return 'banned';
    }
    if (status === 'rejected') {
      return 'rejected';
    }
    return 'unverified';
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSession?.();
      await fetchProfile(false); // Don't use cache on manual refresh
    } finally {
      setRefreshing(false);
    }
  }, [refreshSession, fetchProfile]);

  useEffect(() => {
    if (session?.user?.id) {
      refreshSession?.();
      fetchProfile();
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      if (!name) setName(session.user.name || '');
    }
  }, [session?.user?.name]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Permission required' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets[0]) {
      const photoUri = result.assets[0].uri;
      setProfilePhoto(photoUri);
      await handleSavePhoto(photoUri);
    }
  };

  const handleSavePhoto = async (photoUri: string) => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      let oldImagePath: string | null = null;
      const currentImage = profileData?.image || session?.user?.image;

      if (currentImage) {
        oldImagePath = currentImage.replace('/uploads/', '');
      }

      const profilePhotoId = await uploadImageWithReplace(photoUri, oldImagePath, {
        userId: session.user.id,
        documentType: 'profile_photo',
      });

      const updateResult = await client.profile.updateProfile({
        userId: session.user.id,
        profilePhotoId,
      });

      if (updateResult.user) {
        // Update both local state and session
        if (updateResult.user.image) {
          setProfileData((prev: any) => ({
            ...prev,
            image: updateResult.user.image,
          }));
        }

        await updateUser({
          image: updateResult.user.image,
        });
      }

      setProfilePhoto(null);
      showToast({ type: 'success', message: 'Photo updated' });
      
      // Stay on profile page - don't navigate away
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Failed to update photo' });
      setProfilePhoto(null); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (type: EditSheetType, value: string) => {
    if (!session?.user?.id) return;
    setIsLoading(true);

    try {
      if (type === 'name') {
        const result = await client.profile.updateProfile({
          userId: session.user.id,
          name: value,
        });
        if (result.user) {
          setName(result.user.name || '');
          updateUser({ name: result.user.name });
          showToast({ type: 'success', message: 'Name updated' });
        }
      } else if (type === 'phone') {
        // Handle phone update with OTP
        const [phoneNumber, otp] = value.split('|');
        if (otp) {
          // Verify OTP and update phone
          const result = await client.profile.verifyAndUpdatePhone({
            userId: session.user.id,
            newPhoneNumber: phoneNumber,
            otp: otp,
          });
          if (result.success) {
            showToast({ type: 'success', message: 'Phone number updated' });
            await refreshSession?.();
            setEditSheetType(null);
          } else {
            showToast({ type: 'error', message: result.message || 'Invalid OTP' });
            return; // Don't close sheet on error
          }
        } else {
          // Send OTP
          await client.profile.sendPhoneUpdateOTP({
            userId: session.user.id,
            newPhoneNumber: phoneNumber,
          });
          showToast({ type: 'success', message: 'OTP sent to your phone' });
          return; // Don't close sheet, wait for OTP
        }
      } else if (type === 'password') {
        const [current, newPass] = value.split('|');
        if (!current || !newPass) {
          showToast({ type: 'error', message: 'Please fill all fields' });
          return;
        }
        await client.profile.changePassword({
          userId: session.user.id,
          currentPassword: current,
          newPassword: newPass,
        });
        showToast({ type: 'success', message: 'Password changed' });
      }
      setEditSheetType(null);
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Failed to update' });
    } finally {
      setIsLoading(false);
    }
  };

  const getJoinedText = () => {
    console.log('Profile data:', profileData);
    console.log('CreatedAt:', profileData?.createdAt);
    
    if (profileData?.createdAt) {
      const createdAt = new Date(profileData.createdAt);
      console.log('Parsed createdAt:', createdAt);
      
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
      if (diffYears >= 1) {
        return `Joined ${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
      }
      if (diffMonths >= 1) {
        return `Joined ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      }
      if (diffDays >= 1) {
        return `Joined ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }
      return 'Joined today';
    }
    return 'Joined recently';
  };

  if (!profileData && !session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  const verificationStatus = getVerificationStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              // Redirect based on user role
              if (session?.user?.role === 'driver') {
                router.replace('/(tabs)/driver/home');
              } else {
                router.replace('/(tabs)/user/home');
              }
            }}>
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Profile Photo Container with Badge */}
            <View style={styles.profilePhotoWrapper}>
              <TouchableOpacity style={styles.profilePhotoContainer} onPress={handlePickImage} activeOpacity={0.8}>
                <View style={styles.photoBorder}>
                  <View style={styles.photoWithOverlay}>
                    {getProfilePhotoUrl() ? (
                      <Image
                        key={profilePhoto || profileData?.image || session?.user?.image || 'default'}
                        source={getProfilePhotoUrl()!}
                        style={styles.profilePhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.profilePhotoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                        <User size={36} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={[styles.photoEditOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)' }]}>
                      <Camera size={24} color={colors.white} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Verification Badge - Positioned at top center of photo */}
              <View style={styles.verifiedBadgeContainer}>
                <VerifiedBadge
                  status={verificationStatus}
                  accountStatus={session?.user?.accountStatus}
                />
              </View>
            </View>

            <Text style={[styles.profileName, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.joinedText, { color: colors.textSecondary }]}>{getJoinedText()}</Text>
          </View>

          {/* Settings Menu */}
          <View style={styles.settingsContainer}>
            <SettingsItem
              icon={<User size={20} color="#5732BF" />}
              iconBackground="#E6DDFF"
              label="Personal info"
              value={name}
              onPress={() => setEditSheetType('name')}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingsItem
              icon={<Smartphone size={20} color="#2A917E" />}
              iconBackground="#C9EBE5"
              label="Phone"
              value={session?.user?.phoneNumber || 'Not set'}
              onPress={() => setEditSheetType('phone')}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingsItem
              icon={<Lock size={20} color="#B83232" />}
              iconBackground="#FFD6D6"
              label="Change password"
              onPress={() => setEditSheetType('password')}
            />

            {/* Documents Section - Only show for drivers */}
            {session?.user?.role === 'driver' && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <SettingsItem
                  icon={<Text style={{ fontSize: 20 }}>📄</Text>}
                  iconBackground="#FFF4E6"
                  label="Documents"
                  value="Manage vehicle images"
                  onPress={() => router.push('/(tabs)/shared/documents')}
                />
              </>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Bottom Sheets */}
      <EditBottomSheet
        type="name"
        value={name}
        visible={editSheetType === 'name'}
        onClose={() => setEditSheetType(null)}
        onSave={(value) => handleSave('name', value)}
        placeholder="Enter your name"
      />

      <EditBottomSheet
        type="phone"
        value={session?.user?.phoneNumber || ''}
        visible={editSheetType === 'phone'}
        onClose={() => setEditSheetType(null)}
        onSave={(value) => handleSave('phone', value)}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />

      <EditBottomSheet
        type="password"
        value=""
        visible={editSheetType === 'password'}
        onClose={() => setEditSheetType(null)}
        onSave={(value) => handleSave('password', value)}
        secureTextEntry
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 44,
    marginTop: 7,
  },
  backButton: {
    width: 36,
    height: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    gap: 8,
  },
  profilePhotoContainer: {
    marginBottom: 0,
  },
  profilePhotoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 104,
    height: 104,
  },
  photoBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: '#4FBCA8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoWithOverlay: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  photoEditOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadgeContainer: {
    position: 'absolute',
    top: -12,
    right: 25,
    zIndex: 100,
  },
  profileName: {
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  joinedText: {
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 8,
  },
});
