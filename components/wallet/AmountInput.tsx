import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  fee?: number;
  label?: string;
  error?: string;
  maxAmount?: number;
}

export function AmountInput({
  value,
  onChange,
  currency = 'ETB',
  fee = 0,
  label = 'Amount',
  error,
  maxAmount,
}: AmountInputProps) {
  const { colors } = useTheme();
  const numericValue = parseFloat(value) || 0;
  const total = numericValue + fee;
  const quickAmounts = [500, 1000, 5000, 10000];

  const handleQuickAmount = (amount: number) => {
    onChange(amount.toString());
  };

  const hasError = !!error;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {maxAmount !== undefined && (
          <Text style={[styles.maxAmount, { color: colors.textSecondary }]}>
            Max: {currency} {maxAmount.toFixed(2)}
          </Text>
        )}
      </View>
      
      <View style={[
        styles.inputContainer, 
        { 
          borderColor: hasError ? colors.error : colors.border, 
          backgroundColor: colors.card 
        }
      ]}>
        <Text style={[styles.currency, { color: colors.textSecondary }]}>{currency}</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {hasError && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}

      <View style={styles.quickAmounts}>
        {quickAmounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.quickButton,
              { 
                backgroundColor: numericValue === amount ? colors.primary : colors.backgroundSecondary,
                borderColor: numericValue === amount ? colors.primary : colors.border
              }
            ]}
            onPress={() => handleQuickAmount(amount)}
          >
            <Text style={[
              styles.quickButtonText,
              { color: numericValue === amount ? colors.white : colors.text }
            ]}>
              {amount}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {numericValue > 0 && (
        <View style={[styles.breakdown, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{label}:</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>{currency} {numericValue.toFixed(2)}</Text>
          </View>
          {fee > 0 && (
            <>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Fee (3%):</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>{currency} {fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.breakdownRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>{currency} {total.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  maxAmount: {
    fontSize: fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  currency: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    padding: 0,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  quickButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  breakdown: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: fontSize.sm,
  },
  breakdownValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});

