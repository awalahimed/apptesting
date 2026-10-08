import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Plus, ArrowLeft, X } from 'lucide-react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { Button } from '@/components/ui';
import { PaymentMethodCard } from './PaymentMethodCard';
import { AmountInput } from './AmountInput';
import { usePaymentMethods } from '@/hooks/wallet/usePaymentMethods';
import { AddBankAccountSheet } from './AddBankAccountSheet';

type WithdrawStep = 'select-account' | 'enter-amount';

interface WithdrawBottomSheetProps {
  visible: boolean;
  availableBalance: number;
  onClose: () => void;
  onWithdraw: (amount: string, methodId: string) => void;
}

export const WithdrawBottomSheet: React.FC<WithdrawBottomSheetProps> = ({
  visible,
  availableBalance,
  onClose,
  onWithdraw,
}) => {
  const { colors } = useTheme();
  const { methods, refetch } = usePaymentMethods();
  const [step, setStep] = useState<WithdrawStep>('select-account');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [showAddBankSheet, setShowAddBankSheet] = useState(false);

  const handleSelectAccount = () => {
    if (selectedMethod) {
      setStep('enter-amount');
    }
  };

  const handleBack = () => {
    setStep('select-account');
  };

  const handleContinue = () => {
    if (selectedMethod && amount) {
      onWithdraw(amount, selectedMethod);
    }
  };

  const handleClose = () => {
    setStep('select-account');
    setSelectedMethod(null);
    setAmount('');
    onClose();
  };

  const handleAddAccount = () => {
    setShowAddBankSheet(true);
  };

  const handleBankAccountAdded = () => {
    refetch();
  };

  const fee = parseFloat(amount) * 0.03 || 0;
  const youReceive = parseFloat(amount) - fee || 0;
  const numericAmount = parseFloat(amount) || 0;
  const isAmountValid = numericAmount > 0 && numericAmount <= availableBalance;
  const isAmountTooHigh = numericAmount > availableBalance;
  const isAmountTooLow = amount !== '' && numericAmount <= 0;

  // Determine error message
  let amountError = '';
  if (isAmountTooHigh) {
    amountError = `Insufficient balance. Maximum: ETB ${availableBalance.toFixed(2)}`;
  } else if (isAmountTooLow) {
    amountError = 'Amount must be greater than 0';
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {step === 'select-account' ? (
          <>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Withdraw Funds</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleAddAccount} style={styles.addButton}>
                  <Plus size={20} color={colors.primary} />
                  <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.balanceInfo, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
              <Text style={[styles.balanceAmount, { color: colors.primary }]}>ETB {availableBalance.toFixed(2)}</Text>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {methods.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No withdrawal accounts added</Text>
                  <Button
                    title="Add Withdrawal Account"
                    onPress={handleAddAccount}
                    style={styles.emptyButton}
                  />
                </View>
              ) : (
                methods.map((method) => (
                  <View key={method.id} style={styles.cardWrapper}>
                    <PaymentMethodCard
                      method={method}
                      selected={selectedMethod === method.id}
                      onPress={() => setSelectedMethod(method.id)}
                    />
                  </View>
                ))
              )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Button
                title="Select & Continue"
                onPress={handleSelectAccount}
                disabled={!selectedMethod}
              />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>Withdraw Amount</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.balanceInfo, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
              <Text style={[styles.balanceAmount, { color: colors.primary }]}>ETB {availableBalance.toFixed(2)}</Text>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.selectedAccount, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>Withdraw to:</Text>
                <Text style={[styles.selectedValue, { color: colors.text }]}>
                  {methods.find(m => m.id === selectedMethod)?.provider} -
                  {' '}****{methods.find(m => m.id === selectedMethod)?.accountNumber.slice(-4)}
                </Text>
              </View>

              <AmountInput
                value={amount}
                onChange={setAmount}
                currency="ETB"
                fee={fee}
                label="Withdrawal"
                error={amountError}
                maxAmount={availableBalance}
              />

              {isAmountValid && (
                <View style={[styles.receiveInfo, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.receiveLabel, { color: colors.text }]}>You'll receive:</Text>
                  <Text style={[styles.receiveAmount, { color: colors.success }]}>ETB {youReceive.toFixed(2)}</Text>
                </View>
              )}

              <Text style={[styles.processingTime, { color: colors.textSecondary }]}>Processing time: 1-3 business days</Text>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Button
                title="Confirm Withdrawal"
                onPress={handleContinue}
                disabled={!isAmountValid}
              />
            </View>
          </>
        )}
      </View>

      <AddBankAccountSheet
        visible={showAddBankSheet}
        onClose={() => setShowAddBankSheet(false)}
        onSuccess={handleBankAccountAdded}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  backButton: {
    padding: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
  },
  balanceInfo: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
  },
  emptyButton: {
    minWidth: 200,
  },
  selectedAccount: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectedLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  selectedValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  receiveInfo: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiveLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  receiveAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  processingTime: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
