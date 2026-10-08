import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const buttonStyle: ViewStyle[] = [
    styles.button,
    variant === 'primary' ? styles.primaryButton : undefined,
    variant === 'secondary' ? styles.secondaryButton : undefined,
    variant === 'outline' ? styles.outlineButton : undefined,
    fullWidth ? styles.fullWidth : undefined,
    (disabled || loading) ? styles.disabled : undefined,
    style as ViewStyle,
  ].filter((s): s is ViewStyle => s !== undefined);

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.background : colors.primary}
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.success,
  },
  secondaryButton: {
    backgroundColor: colors.backgroundSecondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.text,
  },
});