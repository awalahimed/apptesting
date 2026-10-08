import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { X, Megaphone } from 'lucide-react-native';
import RenderHtml from 'react-native-render-html';
import { fontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { wp, hp, rf } from '@/utils/responsive';
import { orpc } from '@/hooks/orpc';

interface Announcement {
  id: string;
  title: string;
  message: string;
  targetType: string;
  createdAt: string;
  expiresAt?: string | null;
}

export function AnnouncementBanner() {
  const { width: contentWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await orpc.announcement.getForUser();
      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = (data.announcements || []).filter((announcement: any) => {
        if (!announcement.expiresAt) return true; // No expiry date means always active
        return new Date(announcement.expiresAt) > now; // Only show if not expired
      }).map((announcement: any) => ({
        ...announcement,
        createdAt: new Date(announcement.createdAt).toISOString(),
        expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString() : null,
      }));
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      // Silently fail - announcements are optional
      console.log('Could not fetch announcements');
    }
  };

  const activeAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  if (activeAnnouncements.length === 0) return null;

  const currentAnnouncement = activeAnnouncements[currentIndex];

  const handleDismiss = () => {
    setDismissed(prev => new Set([...prev, currentAnnouncement.id]));
    if (currentIndex >= activeAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.banner, { 
          backgroundColor: colors.primaryOpacity10,
          borderLeftColor: colors.primary,
        }]}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer]}>
          <Megaphone size={rf(20)} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {currentAnnouncement.title}
          </Text>
          <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
            {currentAnnouncement.message}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <X size={rf(18)} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: colors.primaryOpacity10 }]}>
                <Megaphone size={rf(24)} color={colors.primary} />
              </View>
              <TouchableOpacity
                onPress={() => setIsExpanded(false)}
                style={styles.modalCloseButton}
              >
                <X size={rf(24)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{currentAnnouncement.title}</Text>
              <RenderHtml
                contentWidth={contentWidth - wp(8)}
                source={{ html: currentAnnouncement.message }}
                baseStyle={{
                  color: colors.text,
                  fontSize: fontSize.md,
                  lineHeight: fontSize.md * 1.6,
                }}
                tagsStyles={{
                  p: { marginTop: 0, marginBottom: hp(1) },
                  h2: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: hp(0.5) },
                  ul: { marginLeft: wp(4) },
                  ol: { marginLeft: wp(4) },
                  li: { marginBottom: hp(0.5) },
                  img: { 
                    maxWidth: wp(50),
                    height: 'auto',
                    borderRadius: wp(2),
                    marginVertical: hp(1),
                  },
                }}
                enableExperimentalMarginCollapsing={true}
              />
              <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
                {new Date(currentAnnouncement.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              {activeAnnouncements.length > 1 && (
                <TouchableOpacity onPress={handleNext} style={[styles.nextButton, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.nextButtonText, { color: colors.text }]}>
                    Next ({currentIndex + 1}/{activeAnnouncements.length})
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  handleDismiss();
                  setIsExpanded(false);
                }}
                style={[styles.dismissButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.dismissButtonText, { color: colors.surface }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    padding: wp(3),
    marginHorizontal: wp(4),
    marginVertical: hp(1),
    borderRadius: wp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: wp(3),
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  preview: {
    fontSize: fontSize.sm,
  },
  closeButton: {
    padding: wp(1),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  modalContent: {
    borderRadius: wp(3),
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
  },
  modalIconContainer: {
    padding: wp(2),
    borderRadius: wp(2),
  },
  modalCloseButton: {
    padding: wp(1),
  },
  modalBody: {
    padding: wp(4),
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: hp(2),
  },
  modalMessage: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    marginBottom: hp(2),
  },
  modalDate: {
    fontSize: fontSize.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: wp(2),
    padding: wp(4),
    borderTopWidth: 1,
  },
  nextButton: {
    flex: 1,
    padding: hp(1.5),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  dismissButton: {
    flex: 1,
    padding: hp(1.5),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
