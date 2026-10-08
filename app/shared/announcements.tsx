import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Megaphone, Calendar } from 'lucide-react-native';
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

export default function AnnouncementsScreen() {
  const { width: contentWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const data = await orpc.announcement.getForUser();
      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = (data.announcements || []).filter((announcement: Announcement) => {
        if (!announcement.expiresAt) return true; // No expiry date means always active
        return new Date(announcement.expiresAt) > now; // Only show if not expired
      });
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      // Silently fail - just show empty state
      console.log('Could not fetch announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={rf(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Announcements</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Megaphone size={rf(48)} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No announcements</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Check back later for updates</Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <View key={announcement.id} style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryOpacity10 }]}>
                  <Megaphone size={rf(20)} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{announcement.title}</Text>
                  <View style={styles.dateRow}>
                    <Calendar size={rf(14)} color={colors.textSecondary} />
                    <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{formatDate(announcement.createdAt)}</Text>
                  </View>
                </View>
              </View>

              <RenderHtml
                contentWidth={contentWidth - wp(8) - wp(8)}
                source={{ html: announcement.message }}
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
                    width: '100%',
                    maxWidth: '100%', 
                    height: 'auto',
                    borderRadius: wp(2),
                    marginVertical: hp(1),
                  },
                }}
                enableExperimentalMarginCollapsing={true}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
  },
  backButton: {
    padding: wp(2),
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  placeholder: {
    width: wp(10),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: wp(4),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: hp(2),
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: hp(1),
  },
  card: {
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: hp(1.5),
  },
  iconContainer: {
    padding: wp(2),
    borderRadius: wp(2),
    marginRight: wp(3),
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: hp(0.5),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  cardDate: {
    fontSize: fontSize.sm,
  },
  cardMessage: {
    // Removed - now using RenderHtml
  },
  expiryBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(1.5),
    alignSelf: 'flex-start',
    marginTop: hp(1),
  },
  expiryBadgeWarning: {
    // Removed - now applied inline
  },
  expiryText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  expiryTextWarning: {
    // Removed - now applied inline
  },
});
