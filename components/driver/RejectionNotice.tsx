import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { showToast } from '@/hooks/useToast';

interface RejectionNoticeProps {
  rejectionReason: string;
  rejectedDocument: 'license' | 'vehicle';
  onDismiss: () => void;
  onReupload: (frontImage: string, backImage?: string) => Promise<void>;
}

export function RejectionNotice({
  rejectionReason,
  rejectedDocument,
  onDismiss,
  onReupload,
}: RejectionNoticeProps) {
  const { colors } = useTheme();
  const [licenseFront, setLicenseFront] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<string | null>(null);
  const [vehicleImage, setVehicleImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isLicense = rejectedDocument === 'license';
  const canSubmit = isLicense ? (licenseFront && licenseBack) : vehicleImage;

  const takePhoto = async (type: 'front' | 'back' | 'vehicle') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Please grant camera permissions' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (type === 'front') setLicenseFront(uri);
      else if (type === 'back') setLicenseBack(uri);
      else setVehicleImage(uri);
    }
  };

  const handleUpload = async () => {
    if (!canSubmit) {
      showToast({ 
        type: 'error', 
        message: isLicense ? 'Please take both front and back photos' : 'Please take a photo' 
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 [RejectionNotice] Starting upload...');
      if (isLicense && licenseFront && licenseBack) {
        console.log('📤 [RejectionNotice] Uploading license (front + back)');
        await onReupload(licenseFront, licenseBack);
      } else if (vehicleImage) {
        console.log('📤 [RejectionNotice] Uploading vehicle photo');
        await onReupload(vehicleImage);
      }
      console.log('✅ [RejectionNotice] Upload successful');
      showToast({ type: 'success', message: 'Document uploaded successfully' });
      onDismiss();
    } catch (error: any) {
      console.error('❌ [RejectionNotice] Upload failed:', error);
      showToast({ 
        type: 'error', 
        message: error?.message || 'Failed to upload document' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>


      <View style={styles.content}>
        <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>Rejection Reason:</Text>
        <Text style={[styles.reasonText, { color: colors.text }]}>{rejectionReason}</Text>

        <Text style={[styles.documentLabel, { color: colors.text }]}>
          Please re-upload: {isLicense ? 'Driver License' : 'Vehicle Photo'}
        </Text>

        {isLicense ? (
          <>
            {/* License Front */}
            <View style={styles.photoSection}>
              <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>License Front</Text>
              {licenseFront ? (
                <Image source={{ uri: licenseFront }} style={styles.previewImage} />
              ) : (
                <TouchableOpacity
                  onPress={() => takePhoto('front')}
                  style={[styles.photoButton, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}
                >
                  <Camera size={32} color={colors.primary} />
                  <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* License Back */}
            <View style={styles.photoSection}>
              <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>License Back</Text>
              {licenseBack ? (
                <Image source={{ uri: licenseBack }} style={styles.previewImage} />
              ) : (
                <TouchableOpacity
                  onPress={() => takePhoto('back')}
                  style={[styles.photoButton, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}
                >
                  <Camera size={32} color={colors.primary} />
                  <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.photoSection}>
            <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>Vehicle Photo</Text>
            {vehicleImage ? (
              <Image source={{ uri: vehicleImage }} style={styles.previewImage} />
            ) : (
              <TouchableOpacity
                onPress={() => takePhoto('vehicle')}
                style={[styles.photoButton, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}
              >
                <Camera size={32} color={colors.primary} />
                <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={handleUpload}
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            (!canSubmit || isUploading) && { opacity: 0.5 }
          ]}
          disabled={!canSubmit || isUploading}
        >
          <Text style={[styles.submitButtonText, { color: colors.surface }]}>
            {isUploading ? 'Uploading...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  reasonLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
    lineHeight: fontSize.md * 1.5,
  },
  documentLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  photoSection: {
    marginBottom: spacing.lg,
  },
  photoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  photoButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  photoButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
