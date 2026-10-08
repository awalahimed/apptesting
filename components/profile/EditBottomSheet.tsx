import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { PhoneInput } from '@/components/ui';
import { useTheme } from '@/hooks/ThemeContext';

export type EditSheetType = 'name' | 'phone' | 'password';

interface EditBottomSheetProps {
  type: EditSheetType;
  value: string;
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function EditBottomSheet({
  type,
  value,
  visible,
  onClose,
  onSave,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
}: EditBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const [inputValue, setInputValue] = React.useState('');
  const [inputSecondValue, setInputSecondValue] = React.useState('');
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRefs = React.useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (type === 'phone') {
      setInputValue(''); // Start empty for phone update
      setIsOtpSent(false);
    } else {
      setInputValue(value);
    }
    setInputSecondValue('');
  }, [value, type, visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, // Move to final position (middle)
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT, // Move back down
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getTitle = () => {
    switch (type) {
      case 'name':
        return 'Edit Name';
      case 'phone':
        return isOtpSent ? 'Verify OTP' : 'Update Phone';
      case 'password':
        return 'Change Password';
      default:
        return 'Edit';
    }
  };

  const getButtonText = () => {
    if (type === 'phone') {
      return isOtpSent ? 'Verify' : 'Send OTP';
    }
    return 'Save';
  };

  const handleOTPChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pastedText = text.replace(/[^0-9]/g, '').slice(0, 6);
      const newOtp = [...otp];
      pastedText.split('').forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextFocusIndex = Math.min(index + pastedText.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const cleanedText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanedText;
    setOtp(newOtp);

    if (cleanedText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    const key = e.nativeEvent?.key;
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSave = () => {
    if (type === 'phone') {
      if (!isOtpSent) {
        // Send OTP
        setPhoneNumber(inputValue);
        onSave(inputValue); // This will trigger OTP send
        setIsOtpSent(true);
        setInputValue(''); // Clear for OTP input
      } else {
        // Verify OTP
        const otpCode = otp.join('');
        if (otpCode.length === 6) {
          onSave(phoneNumber + '|' + otpCode);
        }
      }
      return;
    }

    if (type === 'password') {
      if (inputValue && inputSecondValue) {
        onSave(inputValue + '|' + inputSecondValue);
      }
    } else {
      if (inputValue.trim()) {
        onSave(inputValue.trim());
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '') && otp.join('').length === 6;
  const isFormValid = type === 'phone' && isOtpSent ? isOtpComplete : inputValue.trim();
  const isPasswordValid = type === 'password' ? inputValue && inputSecondValue : true;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.card },
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {type === 'password' ? (
            <>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Current password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                autoFocus
              />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }]}
                value={inputSecondValue}
                onChangeText={setInputSecondValue}
                placeholder="New password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
              />
            </>
          ) : type === 'phone' && isOtpSent ? (
            <>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Enter the 6-digit code sent to {phoneNumber}</Text>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[styles.otpInput, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      color: colors.inputText
                    }]}
                    value={otp[index]}
                    onChangeText={(text) => handleOTPChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>
            </>
          ) : type === 'phone' ? (
            <PhoneInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="New phone number"
            />
          ) : (
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText
              }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={placeholder}
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType={keyboardType}
              autoCapitalize="none"
              secureTextEntry={secureTextEntry}
              autoFocus
            />
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.text },
              (!isFormValid || !isPasswordValid) && [styles.buttonDisabled, { backgroundColor: colors.textMuted }],
            ]}
            onPress={handleSave}
            disabled={!isFormValid || !isPasswordValid}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>{getButtonText()}</Text>
          </TouchableOpacity>

          {type === 'phone' && isOtpSent && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => setIsOtpSent(false)}
            >
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>Change Phone Number</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    height: SCREEN_HEIGHT * 0.6, // 60% of screen height
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.1, // Start 10% below to show in middle
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Sora',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  helperText: {
    fontFamily: 'Sora',
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Sora',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    // backgroundColor handled dynamically
  },
  buttonText: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontFamily: 'Sora',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
