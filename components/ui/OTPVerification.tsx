import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ExpoClipboard from 'expo-clipboard';
import { Button } from './button';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/hooks/useToast';

interface OTPVerificationProps {
  phone: string;
  rememberMe?: boolean;
  onSuccess?: (userRole: string) => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export function OTPVerification({
  phone,
  rememberMe = false,
  onSuccess,
  onBack,
  title = 'Enter OTP', // eslint-disable-line @typescript-eslint/no-unused-vars
  subtitle, // eslint-disable-line @typescript-eslint/no-unused-vars
}: OTPVerificationProps) {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const {
    error,
    resendLoginOTP,
    verifyLoginOTP,
    clearError,
  } = useAuth();

  const handleOTPChange = useCallback((text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste - use functional update to get latest state
      const pastedText = text.replace(/[^0-9]/g, '').slice(0, 6);
      setOtp((currentOtp) => {
        const newOtp = [...currentOtp];
        pastedText.split('').forEach((char, i) => {
          if (index + i < 6) {
            newOtp[index + i] = char;
          }
        });
        return newOtp;
      });
      // Focus next empty input or last filled one
      const nextFocusIndex = Math.min(index + pastedText.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    // Handle single character input - use functional update
    const cleanedText = text.replace(/[^0-9]/g, '');
    setOtp((currentOtp) => {
      const newOtp = [...currentOtp];
      newOtp[index] = cleanedText;
      return newOtp;
    });

    if (cleanedText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyPress = useCallback((e: any, index: number) => {
    // Store key before async state update (React event pooling)
    const key = e.nativeEvent?.key;

    setOtp((currentOtp) => {
      if (key === 'Backspace' && !currentOtp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return currentOtp;
    });
  }, []);

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

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    try {
      // Get OTP code from current state
      const otpCode = otp.join('');

      if (otpCode.length !== 6) {
        showToast({ type: 'error', message: 'Please enter all 6 digits' });
        return { success: false, error: 'Please enter all 6 digits' };
      }

      const result = await verifyLoginOTP(phone, otpCode, rememberMe);
      if (result.success) {
        showToast({ type: 'success', message: 'Login successful!' });
        
        if (onSuccess) {
          // Immediately call onSuccess to trigger navigation
          const userRole = (result as any)?.user?.role || 'unknown';
          onSuccess(userRole);
        } else {
          router.replace('/user/home' as any);
        }
      } else {
        showToast({ type: 'error', message: (result as any).error || 'Invalid OTP' });
      }
      return result;
    } catch (error) {
      console.error('OTP verification error:', error);
      showToast({ type: 'error', message: 'Verification failed. Please try again.' });
      return { success: false, error: 'Verification failed' };
    } finally {
      // Keep loading state active a bit longer to prevent UI flicker
      setTimeout(() => setIsVerifying(false), 500);
    }
  }, [phone, otp, verifyLoginOTP, rememberMe, onSuccess, router]);

  const handleResend = useCallback(async () => {
    setIsResending(true);
    clearError();

    try {
      const result = await resendLoginOTP(phone);
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
  }, [phone, resendLoginOTP, clearError]);

  // Compute if all OTP fields are filled
  const isAllFilled = otp.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        We sent a <Text style={styles.boldText}>6-digit code</Text> to{' '}
        <Text style={styles.boldText}>{phone}</Text>
      </Text>

      <View style={styles.otpContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref
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
        onPress={handleResend}
        disabled={isResending}
      >
        <Text style={styles.resendText}>
          {isResending ? 'Sending...' : "Didn't receive code? Resend"}
        </Text>
      </TouchableOpacity>

      <Button
        title="Verify"
        onPress={handleVerify}
        loading={isVerifying}
        fullWidth
        disabled={!isAllFilled}
      />

      {onBack && (
        <TouchableOpacity style={styles.goBackButton} onPress={onBack}>
          <Text style={styles.goBackText}>Go back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  otpInput: {
    flex: 1,
    maxWidth: 60,
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
  otpInputError: {
    borderColor: colors.error,
  },
});

export default OTPVerification;
