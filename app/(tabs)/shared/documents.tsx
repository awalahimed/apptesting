import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/AuthContext';
import { useTheme } from '@/hooks/ThemeContext';
import { orpc } from '@/hooks/orpc';
import { showToast } from '@/hooks/useToast';
import { DocumentEditSheet } from '@/components/driver';
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

export default function Documents() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const [vehicleImages, setVehicleImages] = useState<VehicleImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditSheet, setShowEditSheet] = useState(false);

  // Only allow drivers to access this page
  useEffect(() => {
    if (session?.user?.role !== 'driver') {
      router.replace('/(tabs)/shared/settings');
      return;
    }
  }, [session?.user?.role, router]);

  const loadVehicleImages = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      
      // First try to migrate legacy vehicle photo if needed
      try {
        await orpc.driverDocuments.migrateLegacyVehiclePhoto({
          driverId: session.user.id,
        });
      } catch (error) {
        // Migration error is not critical, continue loading
        console.log('Legacy migration skipped:', error);
      }

      const result = await orpc.driverDocuments.getVehicleImages({
        driverId: session.user.id,
      });

      if (result.success) {
        // Type cast the images to ensure proper typing
        const typedImages: VehicleImage[] = result.images.map(img => ({
          ...img,
          imageType: img.imageType as 'front' | 'back' | 'side' | 'interior' | 'other',
          displayOrder: img.displayOrder || 0,
          fileName: img.fileName || '',
          mimeType: img.mimeType || '',
          size: img.size || 0,
          url: img.url || '',
          createdAt: typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString(),
          updatedAt: typeof img.updatedAt === 'string' ? img.updatedAt : img.updatedAt.toISOString(),
        }));
        setVehicleImages(typedImages);
      } else {
        showToast({ type: 'error', message: 'Failed to load vehicle images' });
      }
    } catch (error: any) {
      console.error('Failed to load vehicle images:', error);
      showToast({ type: 'error', message: error.message || 'Failed to load vehicle images' });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadVehicleImages();
  }, [loadVehicleImages]);

  const handleEditDocuments = () => {
    setShowEditSheet(true);
  };

  const handleSheetClose = () => {
    setShowEditSheet(false);
    // Reload images after editing
    loadVehicleImages();
  };

  const getImageTypeLabel = (type: string) => {
    switch (type) {
      case 'front': return 'Front View';
      case 'back': return 'Back View';
      case 'side': return 'Side View';
      case 'interior': return 'Interior';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getImageTypeEmoji = (type: string) => {
    switch (type) {
      case 'front': return '🚗';
      case 'back': return '🚙';
      case 'side': return '🚐';
      case 'interior': return '🪑';
      case 'other': return '📷';
      default: return '📷';
    }
  };

  if (session?.user?.role !== 'driver') {
    return null; // Don't render anything for non-drivers
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Documents</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditDocuments}
        >
          <Edit3 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Images Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🚗 Vehicle Images
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {vehicleImages.length}/5 images
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading images...
              </Text>
            </View>
          ) : vehicleImages.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No vehicle images
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Add images of your vehicle to help customers identify you
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleEditDocuments}
              >
                <Plus size={20} color={colors.white} />
                <Text style={[styles.addButtonText, { color: colors.white }]}>
                  Add Images
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagesGrid}>
              {vehicleImages.map((image, index) => (
                <View key={image.id} style={[styles.imageCard, { backgroundColor: colors.card }]}>
                  <Image 
                    source={{ uri: `${config.api.baseUrl}${image.url}` }}
                    style={styles.vehicleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageInfo}>
                    <View style={styles.imageHeader}>
                      <Text style={[styles.imageType, { color: colors.text }]}>
                        {getImageTypeEmoji(image.imageType)} {getImageTypeLabel(image.imageType)}
                      </Text>
                      <Text style={[styles.imageOrder, { color: colors.textMuted }]}>
                        #{index + 1}
                      </Text>
                    </View>
                    {image.description && (
                      <Text style={[styles.imageDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {image.description}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* License Documents Section - Read Only */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📄 License Documents
            </Text>
            <Text style={[styles.readOnlyBadge, { 
              color: colors.textMuted, 
              backgroundColor: colors.backgroundSecondary 
            }]}>
              Read Only
            </Text>
          </View>
          <Text style={[styles.licenseNote, { color: colors.textSecondary }]}>
            License documents cannot be edited here. Contact support if you need to update your license.
          </Text>
        </View>

        {/* Edit Button */}
        <View style={styles.editButtonContainer}>
          <TouchableOpacity 
            style={[styles.editDocumentsButton, { backgroundColor: colors.primary }]}
            onPress={handleEditDocuments}
          >
            <Edit3 size={20} color={colors.white} />
            <Text style={[styles.editDocumentsButtonText, { color: colors.white }]}>
              Edit Vehicle Images
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Document Edit Sheet */}
      <DocumentEditSheet
        visible={showEditSheet}
        onClose={handleSheetClose}
        vehicleImages={vehicleImages}
        driverId={session?.user?.id || ''}
      />
    </SafeAreaView>
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
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  editButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  readOnlyBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  imagesGrid: {
    gap: spacing.md,
  },
  imageCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
  },
  imageInfo: {
    padding: spacing.md,
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  imageType: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  imageOrder: {
    fontSize: fontSize.sm,
  },
  imageDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  licenseNote: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  editButtonContainer: {
    padding: spacing.lg,
  },
  editDocumentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  editDocumentsButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});