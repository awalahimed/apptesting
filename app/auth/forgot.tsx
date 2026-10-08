import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, PhoneInput } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/hooks/useToast';
import * as ExpoClipboard from 'expo-clipboard';

export default function ForgotScreen() {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const {
    error,
    isLoading,
    sendResetOTP,
    resetPassword,
    clearError,
  } = useAuth();

  // Phone validation
  const validatePhone = useCallback((value: string) => {
    if (!value) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (value.length < 9) {
      setPhoneError('Phone number is too short');
      return false;
    }
    if (!/^[0-9]+$/.test(value)) {
      setPhoneError('Phone number must contain only digits');
      return false;
    }
    setPhoneError('');
    return true;
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    if (value.length > 0) {
      validatePhone(value);
    } else {
      setPhoneError('');
    }
  }, [validatePhone]);

  // Password validation
  const validatePassword = useCallback((value: string) => {
    if (!value) {
      setNewPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      return false;
    }
    setNewPasswordError('');
    return true;
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setNewPassword(value);
    if (value.length > 0) {
      validatePassword(value);
    } else {
      setNewPasswordError('');
    }
    // Re-validate confirm password if it has a value
    if (confirmPassword) {
      if (value !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  }, [validatePassword, confirmPassword]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
    if (value.length > 0) {
      if (value !== newPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('Please confirm your password');
    }
  }, [newPassword]);

  const handleOTPChange = useCallback((text: string, index: number) => {
    if (text.length > 1) {
      const pastedText = text.replace(/[^0-9]/g, '').slice(0, 6);
      const newOtp = [...otp];
      pastedText.split('').forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
    }
    const cleanedText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanedText;
    setOtp(newOtp);
    if (cleanedText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  // Check clipboard for OTP on mount
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        await ExpoClipboard.getStringAsync();
      } catch {
        // Ignore clipboard errors
      }
    };
    checkClipboard();
  }, []);

  const handleSendOTP = useCallback(async () => {
    clearError();
    if (!validatePhone(phone)) {
      showToast({ type: 'error', message: phoneError || 'Please enter a valid phone number' });
      return;
    }

    setIsSendingOtp(true);
    try {
      const result = await sendResetOTP(phone);
      if (result.success) {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setStep('otp');
        showToast({ type: 'success', message: 'OTP sent successfully' });
      } else {
        showToast({ type: 'error', message: result.message });
      }
    } finally {
      setIsSendingOtp(false);
    }
  }, [phone, phoneError, validatePhone, sendResetOTP, clearError]);

  const handleResendOTP = useCallback(async () => {
    setIsResending(true);
    clearError();
    try {
      const result = await sendResetOTP(phone);
      if (result.success) {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        showToast({ type: 'success', message: 'OTP sent successfully' });
      } else {
        showToast({ type: 'error', message: result.message });
      }
    } finally {
      setIsResending(false);
    }
  }, [phone, sendResetOTP, clearError]);

  const handleVerifyOTP = useCallback(async () => {
    clearError();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast({ type: 'error', message: 'Please enter all 6 digits' });
      return;
    }

    setStep('reset');
  }, [otp, clearError]);

  const handleResetPassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      showToast({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      showToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsResetting(true);
    clearError();
    try {
      const result = await resetPassword({
        phoneNumber: phone,
        code: otp.join(''),
        newPassword,
      });

      if (result.success) {
        showToast({ type: 'success', message: 'Password reset successfully!' });
        router.replace('/auth/login');
      } else {
        showToast({ type: 'error', message: result.message });
      }
    } finally {
      setIsResetting(false);
    }
  }, [phone, otp, newPassword, confirmPassword, resetPassword, clearError]);

  const handleGoBack = useCallback(() => {
    clearError();
    if (step === 'phone') {
      if (router.canGoBack()) {
        router.back();
      }
    } else {
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
    }
  }, [step, clearError]);

  const getTitle = () => {
    switch (step) {
      case 'phone':
        return 'Forgot Password';
      case 'otp':
        return 'Enter OTP';
      case 'reset':
        return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'phone':
        return 'Enter your phone number to receive a code';
      case 'otp':
        return `We sent a 6-digit code to ${phone}`;
      case 'reset':
        return 'Enter your new password';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {step === 'phone' && (
            <>
              <PhoneInput
                value={phone}
                onChangeText={handlePhoneChange}
                error={phoneError}
              />

              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={isSendingOtp}
                fullWidth
              />
            </>
          )}

          {step === 'otp' && (
            <View style={styles.otpContainer}>
              <Text style={styles.description}>
                We sent a <Text style={styles.boldText}>6-digit code</Text> to{' '}
                <Text style={styles.boldText}>{phone}</Text>
              </Text>

              <View style={styles.otpInputs}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      error && styles.otpInputError,
                    ]}
                    value={otp[index]}
                    onChangeText={(text) => handleOTPChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                    secureTextEntry
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={isResending}
              >
                <Text style={styles.resendText}>
                  {isResending ? 'Sending...' : "Didn't receive code? Resend"}
                </Text>
              </TouchableOpacity>

              <Button
                title="Verify & Reset"
                onPress={handleVerifyOTP}
                loading={isVerifying}
                fullWidth
                disabled={otp.some(digit => digit === '')}
              />

              <TouchableOpacity style={styles.goBackButton} onPress={() => {
                clearError(); // Clear errors when going back
                setStep('phone');
                setOtp(['', '', '', '', '', '']);
              }}>
                <Text style={styles.goBackText}>Go back</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'reset' && (
            <>
              <Input
                placeholder="New Password"
                value={newPassword}
                onChangeText={handlePasswordChange}
                error={newPasswordError}
                secureTextEntry
              />

              <Input
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                error={confirmPasswordError}
                secureTextEntry
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={isResetting}
                fullWidth
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Import PhoneInput separately

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  otpContainer: {
    width: '100%',
    paddingVertical: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  resendText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  goBackButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  goBackText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
