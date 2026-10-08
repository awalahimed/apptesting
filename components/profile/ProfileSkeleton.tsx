import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';

export function ProfileSkeleton() {
  const { colors } = useTheme();
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.backButton}>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
        <View style={styles.headerTitle}>
          <Skeleton width={127} height={24} borderRadius={4} />
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Profile Photo with Badge */}
        <View style={styles.photoContainer}>
          <Skeleton width={104} height={104} borderRadius={52} style={styles.photo} />
          <View style={styles.badgeContainer}>
            <Skeleton width={28} height={28} borderRadius={14} />
          </View>
        </View>
        {/* Name */}
        <Skeleton width={146} height={21} borderRadius={4} />
        {/* Joined text */}
        <Skeleton width={114} height={18} borderRadius={4} />
      </View>

      {/* Settings Menu */}
      <View style={styles.settingsContainer}>
        {/* Personal Info */}
        <View style={styles.settingsItem}>
          <View style={styles.leftSection}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={styles.labelSection}>
              <Skeleton width={58} height={18} borderRadius={4} />
              <Skeleton width={126} height={18} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={25} height={18} borderRadius={4} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Phone */}
        <View style={styles.settingsItem}>
          <View style={styles.leftSection}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={styles.labelSection}>
              <Skeleton width={42} height={18} borderRadius={4} />
              <Skeleton width={112} height={18} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={25} height={18} borderRadius={4} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Email */}
        <View style={styles.settingsItem}>
          <View style={styles.leftSection}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={styles.labelSection}>
              <Skeleton width={33} height={18} borderRadius={4} />
              <Skeleton width={123} height={18} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={25} height={18} borderRadius={4} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Change Password */}
        <View style={[styles.settingsItem, { height: 48 }]}>
          <View style={styles.leftSection}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <View style={styles.labelSection}>
              <Skeleton width={112} height={18} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={16} height={16} borderRadius={4} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 44,
    marginTop: 7,
  },
  backButton: {
    width: 36,
    height: 21,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
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
  photoContainer: {
    width: 104,
    height: 104,
    position: 'relative',
  },
  photo: {
    position: 'absolute',
  },
  badgeContainer: {
    position: 'absolute',
    top: -12,
    right: 30,
  },
  settingsContainer: {
    paddingHorizontal: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 12,
  },
});
