import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Where would you go?",
  value,
  onChangeText,
  onFocus,
}) => {
  return (
    <View style={styles.container}>
      <Search size={20} color={colors.textMuted} strokeWidth={2} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.inputText,
  },
});