import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { spacing, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';

export function WalletBalanceSkeleton() {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
        <Skeleton width={80} height={24} style={styles.eyeIcon} />
        <Skeleton width={150} height={40} style={styles.mainBalance} />
        <Skeleton width={100} height={16} style={styles.balanceLabel} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <View style={styles.actionButton}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <Skeleton width={60} height={14} style={styles.buttonLabel} />
        </View>
        <View style={styles.actionButton}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <Skeleton width={60} height={14} style={styles.buttonLabel} />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Skeleton width="80%" height={24} style={styles.statAmount} />
          <Skeleton width="60%" height={14} style={styles.statLabel} />
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Skeleton width="80%" height={24} style={styles.statAmount} />
          <Skeleton width="60%" height={14} style={styles.statLabel} />
        </View>
      </View>
    </View>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.transactionList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.transactionItem, { backgroundColor: colors.background }]}>
          <View style={styles.transactionLeft}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.transactionInfo}>
              <Skeleton width={120} height={16} style={styles.transactionName} />
              <Skeleton width={80} height={12} style={styles.transactionTime} />
            </View>
          </View>
          <Skeleton width={60} height={16} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  eyeIcon: {
    marginBottom: spacing.sm,
  },
  mainBalance: {
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonLabel: {
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statAmount: {
    marginBottom: spacing.xs,
  },
  statLabel: {
    marginTop: spacing.xs,
  },
  transactionList: {
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  transactionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  transactionName: {
    marginBottom: spacing.xs,
  },
  transactionTime: {
    marginTop: spacing.xs,
  },
});
