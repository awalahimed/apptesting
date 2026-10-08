import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { Button } from '@/components/ui';
import { AmountInput } from './AmountInput';

interface TopUpBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onTopup: (amount: string) => void;
  isLoading?: boolean;
}

export const TopUpBottomSheet: React.FC<TopUpBottomSheetProps> = ({
  visible,
  onClose,
  onTopup,
  isLoading = false,
}) => {
  const { colors, isDark } = useTheme();
  const [amount, setAmount] = useState('');

  const handleContinue = () => {
    if (amount && parseFloat(amount) > 0) {
      onTopup(amount);
    }
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const fee = parseFloat(amount) * 0.025 || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Top Up Wallet</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enter the amount you want to add to your wallet. Payment will be processed through Chapa.
          </Text>

          <AmountInput
            value={amount}
            onChange={setAmount}
            currency="ETB"
            fee={fee}
            label="Amount"
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={isLoading ? 'Processing...' : 'Continue to Payment'}
            onPress={handleContinue}
            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          />
        </View>
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
    gap: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
});
