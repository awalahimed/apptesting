import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, CreditCard, Smartphone } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { PaymentMethod } from '@/hooks/wallet/usePaymentMethods';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onPress?: () => void;
  selected?: boolean;
}

export function PaymentMethodCard({ method, onPress, selected }: PaymentMethodCardProps) {
  const isBankAccount = method.type === 'bank_account';
  const maskedNumber = method.accountNumber.replace(/\d(?=\d{4})/g, '*');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['#270685', '#4A148C', '#6A1B9A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, selected && styles.selectedCard]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            {isBankAccount ? (
              <CreditCard size={24} color={colors.background} />
            ) : (
              <Smartphone size={24} color={colors.background} />
            )}
          </View>
          {(method.isDefault || selected) && (
            <View style={styles.badge}>
              <Check size={14} color={colors.success} strokeWidth={3} />
              <Text style={styles.badgeText}>
                {method.isDefault ? 'Default' : 'Selected'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.provider}>{method.provider}</Text>
          <Text style={styles.accountNumber}>{maskedNumber}</Text>
          <Text style={styles.accountName}>{method.accountName}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardContent: {
    gap: spacing.xs,
  },
  provider: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  accountNumber: {
    fontSize: fontSize.md,
    color: colors.background,
    opacity: 0.9,
    letterSpacing: 1,
  },
  accountName: {
    fontSize: fontSize.sm,
    color: colors.background,
    opacity: 0.8,
  },
});
