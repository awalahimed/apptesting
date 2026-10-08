import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { LogoutButton } from '@/components/user/Sidebar';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function AccountSuspendedScreen() {
  const { session } = useAuth();
  const user = session?.user;

  // Check if this is a ban (banned field) or suspension (account_status)
  const isBanned = (user as any)?.banned;
  const banReason = (user as any)?.ban_reason;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <AlertCircle size={100} color={colors.error} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isBanned ? 'Account Banned' : 'Account Suspended'}
        </Text>

        {/* Show ban reason only if it exists */}
        {banReason && (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonText}>{banReason}</Text>
          </View>
        )}

        {/* Contact support */}
        <Text style={styles.contactText}>
          Contact support: <Text style={styles.contactEmail}>support@mytrack.com</Text>
        </Text>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <LogoutButton variant="button" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  reasonCard: {
    width: '100%',
    backgroundColor: colors.errorLight + '15',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  reasonText: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  contactEmail: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  logoutContainer: {
    width: '100%',
    position: 'absolute',
    bottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
