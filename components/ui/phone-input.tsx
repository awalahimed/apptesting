import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';

interface CountryCode {
  code: string;
  dial: string;
  flag: string;
}

const countryCodes: CountryCode[] = [
  { code: 'ET', dial: '+251', flag: '🇪🇹' },
  { code: 'BD', dial: '+880', flag: '🇧🇩' },
  { code: 'US', dial: '+1', flag: '🇺🇸' },
  { code: 'UK', dial: '+44', flag: '🇬🇧' },
  { code: 'IN', dial: '+91', flag: '🇮🇳' },
  { code: 'PK', dial: '+92', flag: '🇵🇰' },
  { code: 'CN', dial: '+86', flag: '🇨🇳' },
];

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChangeText, error, ...props }: PhoneInputProps) {
  const { colors } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setModalVisible(false);
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && { borderColor: colors.primary },
          error && { borderColor: colors.error },
        ]}
      >
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.dialCode}>{selectedCountry.dial}</Text>

        <TextInput
          style={styles.input}
          placeholder="Your mobile number"
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="phone-pad"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                  <Text style={styles.countryDial}>{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flag: {
    fontSize: 24,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.inputBorder,
    marginHorizontal: spacing.sm,
  },
  dialCode: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.inputText,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  countryCode: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  countryDial: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});