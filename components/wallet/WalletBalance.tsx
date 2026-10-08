import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUp, Eye, EyeOff, Plus } from 'lucide-react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { formatCurrency } from '@/utils/formatters';

interface WalletBalanceProps {
  balance: string;
  totalTopup?: string;
  totalWithdrawn?: string;
  showTopup?: boolean;
  showWithdraw?: boolean;
  onTopup?: () => void;
  onWithdraw?: () => void;
  isLoading?: boolean;
}

export function WalletBalance({
  balance,
  totalTopup,
  totalWithdrawn,
  showTopup = false,
  showWithdraw = false,
  onTopup,
  onWithdraw,
  isLoading = false,
}: WalletBalanceProps) {
  const { colors, isDark } = useTheme();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const formatAmount = (amount: string) => {
    return formatCurrency(parseFloat(amount || '0'));
  };

  const maskAmount = () => '****';

  return (
    <View style={styles.container}>
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <View style={styles.balanceHeader}>
          <Text style={[styles.balanceLabel, { color: colors.background }]}>Main Balance</Text>
          <TouchableOpacity
            onPress={() => setIsBalanceVisible(!isBalanceVisible)}
            style={styles.eyeButton}
          >
            {isBalanceVisible ? (
              <Eye size={20} color={colors.background} />
            ) : (
              <EyeOff size={20} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.mainContent}>
          <View style={styles.balanceSection}>
            <Text 
              style={[styles.balanceAmount, { color: colors.background }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {isBalanceVisible ? formatAmount(balance) : maskAmount()}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.rightSection}>
            {showTopup && onTopup && (
              <TouchableOpacity
                onPress={onTopup}
                disabled={isLoading}
                style={styles.topupButton}
              >
                <Plus size={16} color={colors.background} strokeWidth={2.5} />
                <Text style={[styles.topupButtonText, { color: colors.background }]}>Top Up</Text>
              </TouchableOpacity>
            )}
            
            {showWithdraw && onWithdraw && (
              <TouchableOpacity
                onPress={onWithdraw}
                disabled={isLoading}
                style={styles.withdrawButton}
              >
                <ArrowUp size={16} color={colors.background} strokeWidth={2.5} />
                <Text style={[styles.topupButtonText, { color: colors.background }]}>Withdraw</Text>
              </TouchableOpacity>
            )}
            
            {totalTopup && (
              <View style={styles.statItem}>
                <Text 
                  style={[styles.statAmount, { color: colors.background }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {isBalanceVisible ? formatAmount(totalTopup) : maskAmount()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.background }]}>Total Topped Up</Text>
              </View>
            )}
            
            {totalWithdrawn && (
              <View style={styles.statItem}>
                <Text 
                  style={[styles.statAmount, { color: colors.background }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {isBalanceVisible ? formatAmount(totalWithdrawn) : maskAmount()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.background }]}>Total Withdrawn</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  balanceSection: {
    flex: 1,
  },
  balanceAmount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  rightSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  topupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  topupButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  statItem: {
    alignItems: 'center',
  },
  statAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: fontSize.xs,
    opacity: 0.8,
    textAlign: 'center',
  },
});
