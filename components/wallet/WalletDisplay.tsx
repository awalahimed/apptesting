import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Transaction } from '@/hooks/wallet/useWallet';

export const BalanceCard = ({ title, amount, color = '#D1F4E8' }: { title: string; amount: string; color?: string }) => (
  <View style={[styles.balanceCard, { backgroundColor: color }]}>
    <Text style={styles.balanceAmount}>{amount}</Text>
    <Text style={styles.balanceTitle}>{title}</Text>
  </View>
);

export const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const isExpense = transaction.type === 'expense';

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: isExpense ? '#FFE5E5' : '#D1F4E8' }
        ]}>
          {isExpense ? (
            <ArrowDown size={20} color={colors.error} strokeWidth={2.5} />
          ) : (
            <ArrowUp size={20} color={colors.success} strokeWidth={2.5} />
          )}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionName}>{transaction.name}</Text>
          <Text style={styles.transactionTime}>{transaction.time}</Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: isExpense ? colors.error : colors.success }
      ]}>
        {isExpense ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  balanceTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
