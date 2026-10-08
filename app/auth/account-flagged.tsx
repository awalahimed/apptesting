import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flag } from 'lucide-react-native';
import { LogoutButton } from '@/components/user/LogoutButton';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function AccountFlaggedScreen() {
  const { session } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Flag size={80} color={colors.error} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Account Flagged</Text>

        {/* Description */}
        <Text style={styles.description}>
          Your account has been flagged for suspicious activity and is under investigation.
        </Text>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Why was my account flagged?</Text>
          <Text style={styles.detailsText}>
            Your account may have been flagged due to:{'\n\n'}
            • Unusual activity patterns{'\n'}
            • Multiple reports from other users{'\n'}
            • Potential violation of terms of service{'\n'}
            • Security concerns
          </Text>
        </View>

        {/* Action Card */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>What should I do?</Text>
          <Text style={styles.actionText}>
            1. Review our terms of service{'\n'}
            2. Contact our support team{'\n'}
            3. Provide any necessary documentation{'\n'}
            4. Wait for our team to review your case
          </Text>
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ Continued violations may result in permanent account suspension.
          </Text>
        </View>

        {/* User Info */}
        {session?.user && (
          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoLabel}>Account:</Text>
            <Text style={styles.userInfoValue}>
              {session.user.phoneNumber || session.user.email}
            </Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Contact Support</Text>
          <Text style={styles.contactText}>
            To appeal or resolve this issue:
          </Text>
          <Text style={styles.contactEmail}>support@mytrack.com</Text>
        </View>

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
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.errorLight + '20',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  detailsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  detailsText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  actionCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  warningCard: {
    width: '100%',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  userInfoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  userInfoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userInfoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  contactCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  contactEmail: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  logoutContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: spacing.xl,
  },
});
