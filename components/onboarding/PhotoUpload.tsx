import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera, X } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface PhotoUploadProps {
  photo: string | null;
  onPickImage: () => void;
  onRemovePhoto: () => void;
  title: string;
  description?: string;
  size?: number;
  aspectRatio?: 'square' | 'landscape';
  required?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photo,
  onPickImage,
  onRemovePhoto,
  title,
  description,
  size = 120,
  aspectRatio = 'square',
  required = false,
}) => {
  const isSquare = aspectRatio === 'square';
  const containerStyle = isSquare
    ? { width: size, height: size, borderRadius: size / 2 }
    : { width: '100%' as const, height: size * 0.85, borderRadius: 16 };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      
      {description && <Text style={styles.description}>{description}</Text>}

      <View style={styles.photoWrapper}>
        <TouchableOpacity
          style={[styles.uploadBox, containerStyle, photo && styles.uploadBoxWithPhoto]}
          onPress={onPickImage}
          activeOpacity={0.8}
        >
          {photo ? (
            <>
              <Image 
                source={{ uri: photo }} 
                style={[styles.photo, containerStyle]}
                resizeMode={isSquare ? 'cover' : 'contain'}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onRemovePhoto();
                }}
              >
                <X size={19} color={colors.surface} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.cameraIcon}>
                <Camera size={32} color={colors.primary} />
              </View>
              <Text style={styles.placeholderText}>Tap to take photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  required: {
    fontSize: fontSize.md,
    color: colors.error,
    marginLeft: 4,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  photoWrapper: {
    alignItems: 'center',
  },
  uploadBox: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadBoxWithPhoto: {
    borderStyle: 'solid',
    borderColor: colors.success,
    backgroundColor: colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  cameraIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 50,
    right: 50,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
