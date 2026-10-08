import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { Button, Input } from '@/components/ui';
import { orpc } from '@/hooks/orpc';
import { showToast } from '@/hooks/useToast';

interface Bank {
  id: string;
  name: string;
  swift?: string;
}

interface AddBankAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBankAccountSheet: React.FC<AddBankAccountSheetProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchBanks();
    }
  }, [visible]);

  const fetchBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const result = await orpc.paymentMethod.getBanks();
      if (result.success && result.banks) {
        setBanks(result.banks);
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to load banks' });
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setShowBankPicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedBank || !accountName.trim() || !accountNumber.trim()) {
      showToast({ type: 'error', message: 'Please fill all fields' });
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.paymentMethod.create({
        type: 'bank_account',
        provider: selectedBank.name,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        isDefault: false,
      });

      showToast({ type: 'success', message: 'Bank account added successfully' });
      handleClose();
      onSuccess();
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Failed to add bank account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedBank(null);
    setAccountName('');
    setAccountNumber('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Add Bank Account</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bank Selector */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Select Bank</Text>
            <TouchableOpacity
              style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowBankPicker(true)}
              disabled={isLoadingBanks}
            >
              {isLoadingBanks ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={[styles.pickerText, { color: selectedBank ? colors.text : colors.textSecondary }]}>
                    {selectedBank ? selectedBank.name : 'Choose a bank'}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Account Name */}
          <View style={styles.field}>
            <Input
              label="Account Holder Name"
              placeholder="Enter account holder name"
              value={accountName}
              onChangeText={setAccountName}
              autoCapitalize="words"
            />
          </View>

          {/* Account Number */}
          <View style={styles.field}>
            <Input
              label="Account Number"
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />
          </View>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Make sure the account details are correct. Withdrawals will be sent to this account.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={isSubmitting ? 'Adding...' : 'Add Bank Account'}
            onPress={handleSubmit}
            disabled={!selectedBank || !accountName.trim() || !accountNumber.trim() || isSubmitting}
            loading={isSubmitting}
          />
        </View>

        {/* Bank Picker Modal */}
        <Modal
          visible={showBankPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowBankPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {banks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    { borderBottomColor: colors.border },
                    selectedBank?.id === bank.id && { backgroundColor: colors.primaryOpacity10 }
                  ]}
                  onPress={() => handleSelectBank(bank)}
                >
                  <Text style={[styles.bankName, { color: colors.text }]}>{bank.name}</Text>
                  {bank.swift && (
                    <Text style={[styles.bankSwift, { color: colors.textSecondary }]}>{bank.swift}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: fontSize.md,
  },
  note: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  pickerModal: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  pickerList: {
    flex: 1,
  },
  bankItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  bankName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  bankSwift: {
    fontSize: fontSize.sm,
  },
});
