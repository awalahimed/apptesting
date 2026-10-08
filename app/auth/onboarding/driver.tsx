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
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { showToast } from '@/hooks/useToast';
import { uploadImageWithReplace } from '@/utils/upload';
import { orpc } from '@/hooks/orpc';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/utils/tokenStorage';
import { userRoles, accountStatus } from '@/constants/userRoles';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { PhotoUpload } from '@/components/onboarding/PhotoUpload';
import { VehicleSelector } from '@/components/onboarding/VehicleSelector';

type Step = 'profile' | 'license-front' | 'license-back' | 'vehicle-photo';

export default function DriverOnboardingScreen() {
  const { session, refreshSession, updateUser } = useAuth();
  const params = useLocalSearchParams();
  const isReupload = params.reupload === 'true';
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [name, setName] = useState('');
  const [carType, setCarType] = useState<'motorcycle' | 'car' | 'truck' | ''>('');
  const [plateNumber, setPlateNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [licenseFront, setLicenseFront] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isReupload) {
        const userRole = session?.user?.role;
        const userStatus = session?.user?.accountStatus;
        if (userRole !== userRoles.DRIVER || userStatus !== accountStatus.FLAGGED) {
          router.replace('/(tabs)/driver/home');
        }
        return;
      }

      const userRole = session?.user?.role;
      const storedUser = await tokenStorage.getUser();
      const storedRole = storedUser?.role;

      if (userRole === userRoles.DRIVER || storedRole === userRoles.DRIVER) {
        router.replace('/(tabs)/driver/home');
      }
    };

    checkOnboardingStatus();
  }, [session?.user?.role, isReupload]);

  const handlePickImage = useCallback(async (type: 'profile' | 'licenseFront' | 'licenseBack' | 'vehiclePhoto') => {
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
      allowsEditing: type === 'profile',
      aspect: type === 'profile' ? [1, 1] : [16, 10],
      quality: 0.8,
      cameraType: type === 'profile' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      exif: false,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (type === 'profile') {
        setProfilePhoto(uri);
      } else if (type === 'licenseFront') {
        setLicenseFront(uri);
      } else if (type === 'licenseBack') {
        setLicenseBack(uri);
      } else if (type === 'vehiclePhoto') {
        setVehiclePhoto(uri);
      }
    }
  }, []);

  const handleRemovePhoto = useCallback((type: 'profile' | 'licenseFront' | 'licenseBack' | 'vehiclePhoto') => {
    if (type === 'profile') {
      setProfilePhoto(null);
    } else if (type === 'licenseFront') {
      setLicenseFront(null);
    } else if (type === 'licenseBack') {
      setLicenseBack(null);
    } else if (type === 'vehiclePhoto') {
      setVehiclePhoto(null);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 'license-front') setCurrentStep('profile');
    else if (currentStep === 'license-back') setCurrentStep('license-front');
    else if (currentStep === 'vehicle-photo') setCurrentStep('license-back');
  }, [currentStep]);

  const handleContinue = useCallback(() => {
    if (currentStep === 'profile') {
      if (!name.trim()) {
        showToast({ type: 'error', message: 'Please enter your name' });
        return;
      }
      if (!carType) {
        showToast({ type: 'error', message: 'Please select your vehicle type' });
        return;
      }
      if (!plateNumber.trim()) {
        showToast({ type: 'error', message: 'Please enter your plate number' });
        return;
      }
      if (!profilePhoto) {
        showToast({ type: 'error', message: 'Please upload your profile photo' });
        return;
      }
      setCurrentStep('license-front');
    } else if (currentStep === 'license-front') {
      if (!licenseFront) {
        showToast({ type: 'error', message: 'Please upload your license front' });
        return;
      }
      setCurrentStep('license-back');
    } else if (currentStep === 'license-back') {
      if (!licenseBack) {
        showToast({ type: 'error', message: 'Please upload your license back' });
        return;
      }
      setCurrentStep('vehicle-photo');
    }
  }, [currentStep, name, carType, plateNumber, profilePhoto, licenseFront, licenseBack]);

  const handleCompleteOnboarding = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error('Please login first');
      }

      setIsUploading(true);
      const oldProfilePath = session?.user?.image ? session.user.image.replace('/uploads/', '') : null;
      const profilePhotoId = profilePhoto ? await uploadImageWithReplace(profilePhoto, oldProfilePath, { userId, documentType: 'profile_photo' }) : undefined;
      const licenseFrontId = await uploadImageWithReplace(licenseFront!, null, { userId, documentType: 'license_front' });
      const licenseBackId = await uploadImageWithReplace(licenseBack!, null, { userId, documentType: 'license_back' });
      const vehiclePhotoId = vehiclePhoto ? await uploadImageWithReplace(vehiclePhoto, null, { userId, documentType: 'vehicle_photo' }) : undefined;
      setIsUploading(false);

      try {
        await refreshSession();
      } catch (error) {
        console.log('Session refresh failed, continuing with existing session');
      }

      let result;
      if (isReupload) {
        result = await orpc.onboarding.reuploadDriverLicense({
          userId,
          licenseFrontId,
          licenseBackId,
        });

        await updateUser({
          accountStatus: accountStatus.PENDING,
        });
      } else {
        try {
          result = await orpc.onboarding.updateDriverProfile({
            userId,
            name: name.trim(),
            profilePhotoId,
            licenseFrontId,
            licenseBackId,
            vehiclePhotoId,
            vehicleType: carType,
            plateNumber: plateNumber.trim(),
          });
        } catch (error) {
          console.log('First attempt failed, refreshing session and retrying:', error);
          await refreshSession();
          result = await orpc.onboarding.updateDriverProfile({
            userId,
            name: name.trim(),
            profilePhotoId,
            licenseFrontId,
            licenseBackId,
            vehiclePhotoId,
            vehicleType: carType,
            plateNumber: plateNumber.trim(),
          });
        }

        await updateUser({
          role: userRoles.DRIVER,
          name: name.trim() || session?.user?.name,
          image: profilePhotoId ? `/uploads/${profilePhotoId}` : session?.user?.image,
        });
      }

      if (!result.success) {
        throw new Error('Failed to update profile');
      }

      const currentUser = session?.user;
      if (currentUser) {
        await tokenStorage.setToken({
          token: session?.token || '',
          refreshToken: await tokenStorage.getRefreshToken() || '',
          user: {
            ...currentUser,
            role: userRoles.DRIVER,
            name: isReupload ? currentUser.name : (name.trim() || currentUser.name),
            accountStatus: isReupload ? accountStatus.PENDING : currentUser.accountStatus,
          },
        });
      }

      showToast({
        type: 'success',
        message: isReupload ? 'License re-uploaded! Pending approval.' : 'Profile completed! License pending approval.',
      });

      router.replace('/(tabs)/driver/home');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already completed onboarding')) {
        showToast({ type: 'info', message: 'Profile already completed' });
        router.replace('/(tabs)/driver/home');
        return;
      }
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to complete onboarding',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }, [session?.user, session?.token, name, profilePhoto, licenseFront, licenseBack, vehiclePhoto, carType, plateNumber, updateUser, isReupload]);

  const isLoading = isSubmitting || isUploading;

  // Generate progress steps
  const getStepStatus = (stepId: Step): 'completed' | 'current' | 'pending' => {
    if (stepId === currentStep) return 'current';
    
    const stepOrder: Step[] = ['profile', 'license-front', 'license-back', 'vehicle-photo'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  const progressSteps = [
    { id: 'profile', label: 'Profile', status: getStepStatus('profile') },
    { id: 'license-front', label: 'License Front', status: getStepStatus('license-front') },
    { id: 'license-back', label: 'License Back', status: getStepStatus('license-back') },
    { id: 'vehicle-photo', label: 'Vehicle', status: getStepStatus('vehicle-photo') },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <>
            <PhotoUpload
              photo={profilePhoto}
              onPickImage={() => handlePickImage('profile')}
              onRemovePhoto={() => handleRemovePhoto('profile')}
              title="Profile Photo"
              description="Take a clear photo of yourself"
              size={140}
              aspectRatio="square"
              required
            />

            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isLoading}
            />

            <VehicleSelector
              selectedVehicle={carType}
              onSelectVehicle={setCarType}
            />

            <Input
              label="Plate Number"
              placeholder="Enter your vehicle plate number"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </>
        );

      case 'license-front':
        return (
          <PhotoUpload
            photo={licenseFront}
            onPickImage={() => handlePickImage('licenseFront')}
            onRemovePhoto={() => handleRemovePhoto('licenseFront')}
            title="Driver's License - Front"
            description="Take a clear photo of the front of your driver's license"
            size={580}
            aspectRatio="landscape"
            required
          />
        );

      case 'license-back':
        return (
          <PhotoUpload
            photo={licenseBack}
            onPickImage={() => handlePickImage('licenseBack')}
            onRemovePhoto={() => handleRemovePhoto('licenseBack')}
            title="Driver's License - Back"
            description="Take a clear photo of the back of your driver's license"
            size={580}
            aspectRatio="landscape"
            required
          />
        );

      case 'vehicle-photo':
        return (
          <>
            <PhotoUpload
              photo={vehiclePhoto}
              onPickImage={() => handlePickImage('vehiclePhoto')}
              onRemovePhoto={() => handleRemovePhoto('vehiclePhoto')}
              title="Vehicle Photo"
              description={`- Take a side photo of your ${carType} \n- Your license will be reviewed and approved within 24-48 hours`}
              size={580}
              aspectRatio="landscape"
              required
            />

          </>
        );
    }
  };

  const canContinue = () => {
    if (currentStep === 'profile') {
      return name.trim() && carType && plateNumber.trim() && profilePhoto;
    } else if (currentStep === 'license-front') {
      return licenseFront;
    } else if (currentStep === 'license-back') {
      return licenseBack;
    } else if (currentStep === 'vehicle-photo') {
      return vehiclePhoto;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Fixed Header with Progress Bar */}
      <View style={styles.header}>
        <ProgressBar steps={progressSteps} />
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
          {renderStepContent()}
        </ScrollView>

        {/* Fixed Footer with Buttons */}
        <View style={styles.footer}>
          <View style={styles.buttonGroup}>
            {currentStep !== 'profile' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={isLoading}
              >
                <ChevronLeft size={20} color={colors.text} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <Button
              title={
                currentStep === 'vehicle-photo'
                  ? isSubmitting
                    ? 'Creating Account...'
                    : 'Complete'
                  : 'Continue'
              }
              onPress={currentStep === 'vehicle-photo' ? handleCompleteOnboarding : handleContinue}
              loading={isSubmitting}
              disabled={!canContinue()}
              style={currentStep === 'profile' ? styles.fullWidthButton : styles.continueButton}
            />
          </View>
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
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  backButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  continueButton: {
    flex: 2,
  },
  fullWidthButton: {
    flex: 1,
  },
  approvalNote: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
