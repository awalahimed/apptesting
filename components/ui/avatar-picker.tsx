import { useState } from 'react';
import { useAlert } from '@/components/shared/CustomAlert';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Camera, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { VerifiedBadge } from '@/components/profile/VerifiedBadge';

type VerificationStatus = 'verified' | 'pending' | 'banned' | 'rejected' | 'unverified';

interface AvatarPickerProps {
  imageUri?: string;
  onImageSelected?: (uri: string) => void;
  size?: number;
  editable?: boolean;
  verificationStatus?: VerificationStatus;
  accountStatus?: string | null;
}

export function AvatarPicker({
  imageUri,
  onImageSelected,
  size = 100,
  editable = true,
  verificationStatus,
  accountStatus,
}: AvatarPickerProps) {
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(imageUri);

  const pickImage = async () => {
    if (!editable) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload a profile picture.'
      );
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
      const uri = result.assets[0].uri;
      setLocalImageUri(uri);
      onImageSelected?.(uri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity
          style={[
            styles.avatarContainer,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          onPress={pickImage}
          disabled={!editable}
          activeOpacity={editable ? 0.7 : 1}
        >
          {localImageUri ? (
            <Image
              source={{ uri: localImageUri }}
              style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
            />
          ) : (
            <View
              style={[
                styles.placeholderContainer,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <User size={size * 0.5} color={colors.textMuted} />
            </View>
          )}

          {editable && (
            <View style={styles.editButtonContainer}>
              <View style={styles.editButton}>
                <Camera size={16} color={colors.background} strokeWidth={2.5} />
              </View>
            </View>
          )}
        </TouchableOpacity>
        
        {verificationStatus && (
          <VerifiedBadge 
            status={verificationStatus} 
            accountStatus={accountStatus}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    backgroundColor: colors.backgroundSecondary,
  },
  placeholderContainer: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
});