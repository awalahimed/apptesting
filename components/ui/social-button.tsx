import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';

interface SocialButtonProps {
  type: 'google' | 'telegram';
  onPress: () => void;
  loading?: boolean;
}

export function SocialButton({ type, onPress, loading }: SocialButtonProps) {
  const icon = type === 'google' ? 'logo-google' : 'send';
  const label = type === 'google' ? 'Continue with Google' : 'Sign up with Telegram';
  const iconColor = type === 'google' ? colors.google : colors.telegram;

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
      <View style={styles.iconContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Ionicons name={icon as any} size={20} color={iconColor} />
        )}
      </View>
      <Text style={[styles.text, loading && styles.textLoading]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  textLoading: {
    color: colors.textSecondary,
  },
});