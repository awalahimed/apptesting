import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';

interface AddPaymentMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    type: 'bank_account' | 'mobile_money';
    provider: string;
    accountNumber: string;
    accountName: string;
    isDefault: boolean;
  }) => Promise<{ success: boolean }>;
  onSuccess?: () => void; // Called after successfully adding account
}

const PROVIDERS = {
  mobile_money: ['Telebirr', 'CBE Birr', 'M-Pesa'],
  bank_account: ['Commercial Bank of Ethiopia', 'Awash Bank', 'Bank of Abyssinia', 'Dashen Bank'],
};

export const AddPaymentMethodSheet: React.FC<AddPaymentMethodSheetProps> = ({
  visible,
  onClose,
  onAdd,
  onSuccess,
}) => {
  const [type, setType] = useState<'bank_account' | 'mobile_money'>('mobile_money');
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!provider || !accountNumber || !accountName) return;

    setIsSubmitting(true);
    try {
      const result = await onAdd({
        type,
        provider,
        accountNumber,
        accountName,
        isDefault,
      });

      if (result.success) {
        // Reset form
        setType('mobile_money');
        setProvider('');
        setAccountNumber('');
        setAccountName('');
        setIsDefault(false);
        
        // Call success callback to go back to TopUp sheet
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setType('mobile_money');
    setProvider('');
    setAccountNumber('');
    setAccountName('');
    setIsDefault(false);
    onClose();
  };

  const isValid = provider && accountNumber && accountName;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Account</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, type === 'mobile_money' && styles.radioOptionActive]}
                onPress={() => {
                  setType('mobile_money');
                  setProvider('');
                }}
              >
                <View style={[styles.radio, type === 'mobile_money' && styles.radioActive]}>
                  {type === 'mobile_money' && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, type === 'mobile_money' && styles.radioLabelActive]}>Mobile Money</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, type === 'bank_account' && styles.radioOptionActive]}
                onPress={() => {
                  setType('bank_account');
                  setProvider('');
                }}
              >
                <View style={[styles.radio, type === 'bank_account' && styles.radioActive]}>
                  {type === 'bank_account' && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, type === 'bank_account' && styles.radioLabelActive]}>Bank Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Select Provider</Text>
            <View style={styles.providerList}>
              {PROVIDERS[type].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.providerOption, provider === p && styles.providerOptionActive]}
                  onPress={() => setProvider(p)}
                >
                  <Text style={[styles.providerText, provider === p && styles.providerTextActive]}>
                    {p}
                  </Text>
                  {provider === p && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Account Details</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder={type === 'mobile_money' ? 'Phone number' : 'Account number'}
                placeholderTextColor={colors.textMuted}
                keyboardType={type === 'mobile_money' ? 'phone-pad' : 'numeric'}
              />
              <TextInput
                style={styles.input}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Account holder name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
              {isDefault && <Check size={14} color={colors.background} />}
            </View>
            <Text style={styles.checkboxLabel}>Set as default payment method</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isSubmitting ? 'Saving...' : 'Save Account'}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  radioOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  radioLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  providerList: {
    gap: spacing.sm,
  },
  providerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  providerOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity10,
  },
  providerText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  providerTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  inputGroup: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
