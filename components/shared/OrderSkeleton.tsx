import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

export const OrderSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.skeleton, styles.titleSkeleton]} />
              <View style={[styles.skeleton, styles.subtitleSkeleton]} />
            </View>
            <View style={[styles.skeleton, styles.badgeSkeleton]} />
          </View>
          <View style={[styles.skeleton, styles.contentSkeleton]} />
          <View style={styles.footer}>
            <View style={[styles.skeleton, styles.priceSkeleton]} />
            <View style={[styles.skeleton, styles.buttonSkeleton]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  titleSkeleton: {
    width: '60%',
    height: 20,
    borderRadius: borderRadius.sm,
  },
  subtitleSkeleton: {
    width: '40%',
    height: 14,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  badgeSkeleton: {
    width: 80,
    height: 24,
    borderRadius: borderRadius.md,
  },
  contentSkeleton: {
    width: '100%',
    height: 16,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  priceSkeleton: {
    width: 100,
    height: 20,
    borderRadius: borderRadius.sm,
  },
  buttonSkeleton: {
    width: 100,
    height: 36,
    borderRadius: borderRadius.md,
  },
  skeleton: {
    backgroundColor: colors.border,
  },
});
