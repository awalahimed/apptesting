import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Camera, Trash2, GripVertical } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useAlert } from '@/components/shared/CustomAlert';
import { orpc } from '@/hooks/orpc';
import { showToast } from '@/hooks/useToast';
import { Button } from '@/components/ui';
import { uploadImageWithReplace } from '@/utils/upload';
import { config } from '@/config/config';
import React from 'react';

interface VehicleImage {
  id: string;
  fileId: string;
  imageType: 'front' | 'back' | 'side' | 'interior' | 'other';
  description: string | null;
  displayOrder: number;
  fileName?: string;
  mimeType?: string;
  size?: number;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  isLegacy?: boolean;
}

interface DocumentEditSheetProps {
  visible: boolean;
  onClose: () => void;
  vehicleImages: VehicleImage[];
  driverId: string;
}

interface EditableImage extends VehicleImage {
  isNew?: boolean;
  localUri?: string;
  isUploading?: boolean;
  isDeleting?: boolean;
}

const IMAGE_TYPE_OPTIONS = [
  { value: 'front', label: 'Front View', emoji: '🚗' },
  { value: 'back', label: 'Back View', emoji: '🚙' },
  { value: 'side', label: 'Side View', emoji: '🚐' },
  { value: 'interior', label: 'Interior', emoji: '🪑' },
  { value: 'other', label: 'Other', emoji: '📷' },
] as const;

export function DocumentEditSheet({ visible, onClose, vehicleImages, driverId }: DocumentEditSheetProps) {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const [images, setImages] = useState<EditableImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize images when sheet opens
  useEffect(() => {
    if (visible) {
      setImages(vehicleImages.map(img => ({ ...img })));
    }
  }, [visible, vehicleImages]);

  const handleAddImage = useCallback(async () => {
    if (images.length >= 5) {
      showToast({ type: 'error', message: 'Maximum of 5 images allowed' });
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ title: 'Permission needed', message: 'Please grant camera roll permissions to add images' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: EditableImage = {
          id: `temp_${Date.now()}`,
          fileId: '',
          imageType: 'other',
          description: '',
          displayOrder: images.length,
          fileName: '',
          mimeType: '',
          size: 0,
          url: '',
          localUri: result.assets[0].uri,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isNew: true,
          isUploading: false,
        };

        setImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast({ type: 'error', message: 'Failed to pick image' });
    }
  }, [images.length]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const nonDeletingImages = images.filter(img => !img.isDeleting);
    const uploadedImages = nonDeletingImages.filter(img => !img.isNew);
    const newImages = nonDeletingImages.filter(img => img.isNew);
    
    // Check if deletion is allowed
    if (image.isNew) {
      // For new images: only prevent deletion if it's the only image and there are no uploaded images
      if (uploadedImages.length === 0 && newImages.length <= 1) {
        showToast({ type: 'error', message: 'At least one vehicle image is required' });
        return;
      }
    } else {
      // For uploaded images: prevent deletion if it's the last uploaded image
      if (uploadedImages.length <= 1) {
        showToast({ type: 'error', message: 'At least one vehicle image is required' });
        return;
      }
    }

    showAlert({
      title: 'Delete Image',
      message: 'Are you sure you want to delete this image?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (image.isNew) {
              setImages(prev => prev.filter(img => img.id !== imageId));
            } else if (image.isLegacy) {
              setImages(prev => prev.filter(img => img.id !== imageId));
              showToast({ type: 'success', message: 'Legacy image removed' });
            } else {
              setImages(prev => prev.map(img => 
                img.id === imageId ? { ...img, isDeleting: true } : img
              ));

              try {
                await orpc.driverDocuments.deleteVehicleImage({
                  imageId,
                  driverId,
                });
                
                setImages(prev => prev.filter(img => img.id !== imageId));
                showToast({ type: 'success', message: 'Image deleted successfully' });
              } catch (error: any) {
                console.error('Failed to delete image:', error);
                setImages(prev => prev.map(img => 
                  img.id === imageId ? { ...img, isDeleting: false } : img
                ));
                showToast({ type: 'error', message: error.message || 'Failed to delete image' });
              }
            }
          },
        },
      ]
    });
  }, [images, driverId, showAlert]);

  const handleUpdateImage = useCallback((imageId: string, updates: Partial<EditableImage>) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    ));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Upload new images first
      const newImages = images.filter(img => img.isNew && img.localUri);
      
      for (const image of newImages) {
        if (!image.localUri) continue;
        
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, isUploading: true } : img
        ));

        try {
          // Upload the image
          const fileId = await uploadImageWithReplace(image.localUri, null, {
            userId: driverId,
            documentType: 'vehicle_photo',
          });

          // Add to database
          await orpc.driverDocuments.addVehicleImage({
            driverId,
            fileId,
            imageType: image.imageType,
            description: image.description || undefined,
            displayOrder: image.displayOrder,
          });

          setImages(prev => prev.map(img => 
            img.id === image.id ? { ...img, isUploading: false, fileId } : img
          ));
        } catch (error: any) {
          console.error('Failed to upload image:', error);
          setImages(prev => prev.map(img => 
            img.id === image.id ? { ...img, isUploading: false } : img
          ));
          throw error;
        }
      }

      // Update existing images (skip legacy images)
      const existingImages = images.filter(img => !img.isNew && !img.isDeleting && !img.isLegacy);
      
      for (const image of existingImages) {
        try {
          await orpc.driverDocuments.updateVehicleImage({
            imageId: image.id,
            driverId,
            imageType: image.imageType,
            description: image.description || undefined,
            displayOrder: image.displayOrder,
          });
        } catch (error: any) {
          console.error('Failed to update image:', error);
          throw error;
        }
      }

      showToast({ type: 'success', message: 'Vehicle images updated successfully' });
      onClose();
    } catch (error: any) {
      console.error('Failed to save images:', error);
      showToast({ type: 'error', message: error.message || 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  }, [images, driverId, onClose]);

  const getImageUri = (image: EditableImage) => {
    if (image.localUri) return image.localUri;
    if (image.url) return `${config.api.baseUrl}${image.url}`;
    return null;
  };

  const getImageTypeLabel = (type: string) => {
    const option = IMAGE_TYPE_OPTIONS.find(opt => opt.value === type);
    return option ? `${option.emoji} ${option.label}` : type;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Vehicle Images</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add 2-5 images of your vehicle. Customers will see these to identify you.
          </Text>

          {/* Images */}
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={image.id} style={[styles.imageItem, { backgroundColor: colors.card }]}>
                {/* Image */}
                <View style={styles.imageContainer}>
                  {getImageUri(image) ? (
                    <Image 
                      source={{ uri: getImageUri(image)! }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                      <Camera size={32} color={colors.textMuted} />
                    </View>
                  )}
                  
                  {/* Loading overlay */}
                  {(image.isUploading || image.isDeleting) && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color={colors.white} />
                    </View>
                  )}

                  {/* Delete button logic */}
                  {(() => {
                    const nonDeletingImages = images.filter(img => !img.isDeleting);
                    const uploadedImages = nonDeletingImages.filter(img => !img.isNew);
                    const newImages = nonDeletingImages.filter(img => img.isNew);
                    
                    let canDelete = false;
                    
                    if (image.isNew) {
                      // For new images:
                      if (uploadedImages.length > 0) {
                        // If there are uploaded images, new images can always be deleted
                        canDelete = true;
                      } else {
                        // If no uploaded images, only allow deleting new images if there are multiple new images
                        canDelete = newImages.length > 1;
                      }
                    } else {
                      // For uploaded images: can delete only if there are multiple uploaded images
                      canDelete = uploadedImages.length > 1;
                    }
                    
                    return canDelete ? (
                      <TouchableOpacity 
                        style={[styles.deleteButton, { backgroundColor: colors.error }]}
                        onPress={() => handleDeleteImage(image.id)}
                        disabled={image.isUploading || image.isDeleting}
                      >
                        <Trash2 size={16} color={colors.white} />
                      </TouchableOpacity>
                    ) : null;
                  })()}
                </View>

                {/* Image Details */}
                <View style={styles.imageDetails}>
                  {/* Image Type Selector */}
                  <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                    {IMAGE_TYPE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.typeOption,
                          { 
                            backgroundColor: image.imageType === option.value 
                              ? colors.primary 
                              : colors.backgroundSecondary 
                          }
                        ]}
                        onPress={() => handleUpdateImage(image.id, { imageType: option.value })}
                      >
                        <Text style={[
                          styles.typeOptionText,
                          { 
                            color: image.imageType === option.value 
                              ? colors.white 
                              : colors.text 
                          }
                        ]}>
                          {option.emoji} {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Description */}
                  <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.descriptionInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.inputBackground 
                    }]}
                    value={image.description || ''}
                    onChangeText={(text) => handleUpdateImage(image.id, { description: text })}
                    placeholder="Add a description for this image..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            ))}

            {/* Add Image Button */}
            {images.length < 5 && (
              <TouchableOpacity 
                style={[styles.addImageButton, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderStyle: 'dashed'
                }]}
                onPress={handleAddImage}
              >
                <Plus size={32} color={colors.primary} />
                <Text style={[styles.addImageText, { color: colors.primary }]}>
                  Add Image
                </Text>
                <Text style={[styles.addImageSubtext, { color: colors.textSecondary }]}>
                  {images.length}/5 images
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            loading={isSaving}
            disabled={images.length === 0}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginVertical: spacing.lg,
  },
  imagesContainer: {
    gap: spacing.lg,
  },
  imageItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDetails: {
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  typeSelector: {
    marginBottom: spacing.sm,
  },
  typeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  typeOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  addImageButton: {
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  addImageText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
  },
  addImageSubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});