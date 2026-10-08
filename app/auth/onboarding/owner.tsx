import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Input, Button } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { showToast } from '@/hooks/useToast';
import { uploadImageWithReplace } from '@/utils/upload';
import { orpc } from '@/hooks/orpc';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/utils/tokenStorage';
import { userRoles } from '@/constants/userRoles';
import { PhotoUpload } from '@/components/onboarding/PhotoUpload';

export default function OwnerOnboardingScreen() {
  const { session, refreshSession, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const userRole = session?.user?.role;
      const storedUser = await tokenStorage.getUser();
      const storedRole = storedUser?.role;

      if (userRole === userRoles.OWNER_SHOP || storedRole === userRoles.OWNER_SHOP) {
        router.replace('/user/home');
      }
    };

    checkOnboardingStatus();
  }, [session?.user?.role]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      showToast({
        type: 'error',
        message: 'Camera permission is required',
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setProfilePhoto(null);
  }, []);

  const handleSkip = useCallback(async () => {
    await completeOnboarding(null);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!name.trim()) {
      showToast({ type: 'error', message: 'Please enter your name' });
      return;
    }

    let profilePhotoId: string | undefined;
    if (profilePhoto) {
      setIsUploading(true);
      try {
        const oldImagePath = session?.user?.image ? session.user.image.replace('/uploads/', '') : null;
        profilePhotoId = await uploadImageWithReplace(profilePhoto, oldImagePath, {
          userId: session?.user?.id,
          documentType: 'profile_photo',
          onProgress: (progress) => console.log(`Upload progress: ${progress}%`),
        });
      } catch (error) {
        showToast({ type: 'error', message: 'Failed to upload profile photo' });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    await completeOnboarding(profilePhotoId);
  }, [name, profilePhoto, session?.user?.id, session?.user?.image]);

  const completeOnboarding = useCallback(async (profilePhotoId: string | undefined | null) => {
    setIsSubmitting(true);

    try {
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error('Please login first');
      }

      const result = await orpc.onboarding.updateOwnerProfile({
        userId,
        name: name.trim() || undefined,
        profilePhotoId: profilePhotoId || undefined,
      });

      if (!result.success) {
        throw new Error('Failed to update profile');
      }

      await updateUser({
        role: userRoles.OWNER_SHOP,
        name: name.trim() || session?.user?.name,
        image: profilePhotoId ? `/uploads/${profilePhotoId}` : session?.user?.image,
      });

      const currentUser = session?.user;
      if (currentUser) {
        await tokenStorage.setToken({
          token: session?.token || '',
          refreshToken: await tokenStorage.getRefreshToken() || '',
          user: {
            ...currentUser,
            role: userRoles.OWNER_SHOP,
            name: name.trim() || currentUser.name,
          },
        });
      }

      showToast({ type: 'success', message: 'Profile completed!' });
      router.replace('/user/home');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already completed onboarding')) {
        showToast({ type: 'info', message: 'Profile already completed' });
        router.replace('/user/home');
        return;
      }
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to complete onboarding',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [session?.user, session?.token, name, updateUser]);

  const isLoading = isSubmitting || isUploading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerText}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
          </View>

          <PhotoUpload
            photo={profilePhoto}
            onPickImage={handlePickImage}
            onRemovePhoto={handleRemovePhoto}
            title="Profile Photo"
            description="Add a photo to personalize your account (optional)"
            size={140}
            aspectRatio="square"
            required={false}
          />

          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!isLoading}
          />

          <Text style={styles.hint}>
            You can always update your profile later in profile 
          </Text>
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <Button
            title={isUploading ? 'Uploading...' : 'Continue'}
            onPress={handleContinue}
            loading={isSubmitting || isUploading}
            fullWidth
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    position: 'relative',
  },
  skipButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    padding: spacing.sm,
    zIndex: 10,
  },
  skipButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 140,
  },
  headerText: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
