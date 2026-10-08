import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button, Input } from '@/components/ui';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'paypal' | 'cash';
  label: string;
  details: string;
  icon: React.ReactNode;
  color: string;
}

interface DepositMoneyModalProps {
  visible: boolean;
  onClose: () => void;
}

const PaymentMethodCard = ({
  method,
  isSelected,
  onPress,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.paymentCard,
      isSelected && styles.paymentCardSelected,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.paymentCardContent}>
      <View style={[styles.paymentIcon, { backgroundColor: method.color }]}>
        {method.icon}
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentLabel}>{method.label}</Text>
        <Text style={styles.paymentDetails}>{method.details}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export function DepositMoneyModal({ visible, onClose }: DepositMoneyModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('1');

  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'visa',
      label: 'VISA',
      details: '**** **** **** 8970\nExpires 03/25',
      icon: <Text style={styles.visaText}>VISA</Text>,
      color: '#1A1F71',
    },
    {
      id: '2',
      type: 'mastercard',
      label: 'Mastercard',
      details: '**** **** **** 8970\nExpires 03/25',
      icon: (
        <View style={styles.mastercardIcon}>
          <View style={[styles.mastercardCircle, styles.mastercardRed]} />
          <View style={[styles.mastercardCircle, styles.mastercardYellow]} />
        </View>
      ),
      color: '#EB001B',
    },
    {
      id: '3',
      type: 'paypal',
      label: 'PayPal',
      details: 'mailaddress@mail.com',
      icon: <Text style={styles.paypalText}>P</Text>,
      color: '#003087',
    },
    {
      id: '4',
      type: 'cash',
      label: 'Cash',
      details: 'Default Method',
      icon: <Text style={styles.cashText}>$</Text>,
      color: '#6B7280',
    },
  ];

  const handleConfirm = () => {
    console.log('Deposit Amount:', amount);
    console.log('Selected Payment Method:', selectedMethod);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Amount</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Input
              placeholder="Enter Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.amountInput}
            />
            <TouchableOpacity onPress={() => console.log('Add payment method')}>
              <Text style={styles.addPaymentText}>Add payment Method</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentMethodsSection}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            
            <View style={styles.paymentMethodsList}>
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  isSelected={selectedMethod === method.id}
                  onPress={() => setSelectedMethod(method.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.footer}>
          <Button
            title="Confirm"
            onPress={handleConfirm}
            fullWidth
            style={styles.confirmButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  headerRight: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  amountSection: {
    marginBottom: spacing.lg,
  },
  amountInput: {
    fontSize: fontSize.md,
  },
  addPaymentText: {
    fontSize: fontSize.sm,
    color: colors.info,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  paymentMethodsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  paymentMethodsList: {
    gap: spacing.sm,
  },
  paymentCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F2',
  },
  paymentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  paymentIcon: {
    width: 50,
    height: 34,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visaText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  mastercardIcon: {
    flexDirection: 'row',
    position: 'relative',
  },
  mastercardCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  mastercardRed: {
    backgroundColor: '#EB001B',
    position: 'absolute',
    left: 0,
  },
  mastercardYellow: {
    backgroundColor: '#FF5F00',
    position: 'absolute',
    left: 10,
  },
  paypalText: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  cashText: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  paymentDetails: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  confirmButton: {
    height: 52,
  },
});