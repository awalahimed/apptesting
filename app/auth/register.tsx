import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  PhoneInput,
  Input,
  Button,
  Checkbox,
} from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/hooks/useToast';
import { tokenStorage } from '@/utils/tokenStorage';
import * as ExpoClipboard from 'expo-clipboard';

export default function RegisterScreen() {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeError, setReferralCodeError] = useState('');
  const [referralReward, setReferralReward] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const {
    isLoading,
    register,
    sendRegisterOTP,
    clearError,
    verifyRegisterOTP,
  } = useAuth();

  // Validate referral code
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length === 0) {
      setReferralCodeError('');
      setReferralReward('');
      return;
    }

    if (code.length !== 6) {
      setReferralCodeError('Referral code must be 6 characters');
      setReferralReward('');
      return;
    }

    setIsValidatingCode(true);
    try {
      const { orpc } = await import('@/hooks/orpc');
      const result = await orpc.referral.validateCode({ code: code.toUpperCase() });
      
      if (result.valid) {
        setReferralCodeError('');
        setReferralReward(result.reward || '');
      } else {
        setReferralCodeError('Invalid referral code');
        setReferralReward('');
      }
    } catch (error) {
      setReferralCodeError('Failed to validate code');
      setReferralReward('');
    } finally {
      setIsValidatingCode(false);
    }
  }, []);

  const handleReferralCodeChange = useCallback((value: string) => {
    const upperValue = value.toUpperCase();
    setReferralCode(upperValue);
    
    if (upperValue.length === 6) {
      validateReferralCode(upperValue);
    } else if (upperValue.length === 0) {
      setReferralCodeError('');
      setReferralReward('');
    }
  }, [validateReferralCode]);

  // Real-time phone validation
  const validatePhone = useCallback((value: string) => {
    if (!value) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!/^[97]/.test(value)) {
      setPhoneError('Phone number must start with 9 or 7');
      return false;
    }
    if (value.length < 9) {
      setPhoneError('Phone number is too short');
      return false;
    }
    if (value.length > 15) {
      setPhoneError('Phone number is too long');
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
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(value)) {
      setPasswordError('Password must contain at least one capital letter');
      return false;
    }
    if (!/[0-9]/.test(value)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (value.length > 0) {
      validatePassword(value);
    } else {
      setPasswordError('');
    }
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
      if (value !== password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [password]);

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

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        await ExpoClipboard.getStringAsync();
      } catch {
      }
    };
    checkClipboard();
  }, []);

  const handleContinue = async () => {
    if (!validatePhone(phone)) {
      showToast({ type: 'error', message: phoneError || 'Please enter a valid phone number' });
      return;
    }
    if (!validatePassword(password)) {
      showToast({ type: 'error', message: passwordError || 'Please enter a valid password' });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (!termsAccepted) {
      showToast({ type: 'error', message: 'Please accept terms and conditions' });
      return;
    }

    setIsSendingOtp(true);
    clearError();
    try {
      const regResult = await register(phone, password);
      if (!regResult.success) {
        showToast({ type: 'error', message: regResult.message });
        return;
      }

      const result = await sendRegisterOTP(phone);
      if (result.success) {
        setOtp(['', '', '', '', '', '']);
        setStep('otp');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        showToast({ type: 'success', message: 'OTP sent successfully' });
      } else {
        showToast({ type: 'error', message: result.message });
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOTP = useCallback(async () => {
    if (!validatePhone(phone)) {
      showToast({ type: 'error', message: phoneError || 'Please enter a valid phone number' });
      return;
    }

    setIsResending(true);
    clearError();
    try {
      const result = await sendRegisterOTP(phone);
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
  }, [phone, phoneError, validatePhone, sendRegisterOTP, clearError]);

  const handleVerifyOTP = useCallback(async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast({ type: 'error', message: 'Please enter all 6 digits' });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyRegisterOTP(phone, otpCode);
      if (result.success) {
        if (referralCode && referralCode.length === 6) {
          try {
            const { orpc } = await import('@/hooks/orpc');
            await orpc.referral.applyCode({ referralCode });
          } catch (error) {
            console.error('Failed to apply referral code:', error);
          }
        }

        showToast({ type: 'success', message: 'Phone verified! Complete your profile.' });
        router.replace('/auth/role-selection');
      } else {
        showToast({ type: 'error', message: result.error || 'Invalid OTP' });
      }
    } finally {
      setIsVerifying(false);
    }
  }, [phone, otp, referralCode, verifyRegisterOTP, router]);

  const openTerms = () => {
    Linking.openURL('https://mytrucket.com/privacy');
  };

  const openPrivacy = () => {
    Linking.openURL('https://mytrucket.com/privacy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {step === 'otp' ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('form')}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ) : (
              router.canGoBack() && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
              )
            )}
          </View>

          {step === 'form' ? (
            <>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>Sign up with your phone number</Text>
              </View>

              <View style={styles.form}>
                <PhoneInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  error={phoneError}
                  rightIcon={phone && !phoneError ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : undefined}
                />

                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  error={passwordError}
                  secureTextEntry
                  rightIcon={password && !passwordError ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : undefined}
                />

                <Input
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  error={confirmPasswordError}
                  secureTextEntry
                  rightIcon={confirmPassword && !confirmPasswordError && confirmPassword === password ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : undefined}
                />

                <View>
                  <Input
                    placeholder="Referral Code (Optional)"
                    value={referralCode}
                    onChangeText={handleReferralCodeChange}
                    error={referralCodeError}
                    maxLength={6}
                    autoCapitalize="characters"
                    rightIcon={
                      isValidatingCode ? (
                        <Text style={{ color: colors.textSecondary }}>...</Text>
                      ) : referralCode && !referralCodeError && referralReward ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      ) : undefined
                    }
                  />
                  {referralReward && !referralCodeError && (
                    <View style={styles.referralRewardBox}>
                      <Ionicons name="gift" size={16} color={colors.success} />
                      <Text style={styles.referralRewardText}>
                        You'll earn {referralReward} ETB on your first order!
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.termsContainer}>
                  <Checkbox
                    checked={termsAccepted}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    label={
                      <Text style={styles.termsText}>
                        By signing up, you agree to the{' '}
                        <Text style={styles.link} onPress={openTerms}>
                          Terms of service
                        </Text>{' '}
                        and{' '}
                        <Text style={styles.link} onPress={openPrivacy}>
                          Privacy policy
                        </Text>
                        .
                      </Text>
                    }
                  />
                </View>

                <Button
                  title="Continue"
                  onPress={handleContinue}
                  loading={isSendingOtp}
                  fullWidth
                />

                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/auth/login')}>
                    <Text style={styles.footerLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Verify your phone</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to{' '}
                  <Text style={styles.boldText}>{phone}</Text>
                </Text>
              </View>

              <View style={styles.otpContainer}>
                <View style={styles.otpInputs}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
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
                  title="Verify & Continue"
                  onPress={handleVerifyOTP}
                  loading={isVerifying}
                  fullWidth
                  disabled={otp.some(digit => digit === '')}
                />

                <TouchableOpacity style={styles.goBackButton} onPress={() => setStep('form')}>
                  <Text style={styles.goBackText}>Go back</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
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
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  form: {
    gap: spacing.lg,
  },
  otpContainer: {
    width: '100%',
    paddingVertical: spacing.md,
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
  termsContainer: {
    marginVertical: spacing.sm,
  },
  termsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  link: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  referralRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight || '#E8F5E9',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  referralRewardText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
});
