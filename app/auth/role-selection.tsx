import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Truck, Users, LogOut } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { userRoles } from '@/constants/userRoles';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/hooks/useToast';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    id: userRoles.OWNER_SHOP,
    title: 'User',
    description: 'Order delivery services',
    icon: User,
    color: colors.primary,
  },
  {
    id: userRoles.DRIVER,
    title: 'Driver',
    description: 'Deliver orders to customers',
    icon: Truck,
    color: '#10b981',
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { session, isAuthenticated, isLoading, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/auth/login');
  }, [logout, router]);

  // Initialize - wait for auth to be ready
  useEffect(() => {
    // Skip if still loading
    if (isLoading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated || !session?.user) {
      router.replace('/auth/login');
      return;
    }

    // Check if phone is verified - if not, redirect back to register
    if (!session.user.phoneNumberVerified) {
      showToast({ type: 'error', message: 'Please verify your phone number first' });
      router.replace('/auth/register');
      return;
    }

    // Check if user already has a valid role (not unknown)
    const userRole = session.user.role;
    if (userRole && userRole !== userRoles.UNKNOWN) {
      // Redirect based on current role
      if (userRole === userRoles.DRIVER) {
        router.replace('/(tabs)/driver/home');
      } else if (userRole === userRoles.OWNER_SHOP) {
        router.replace('/user/home');
      }
    }
  }, [isLoading, isAuthenticated, session, router]);

  // Show loading or nothing while initializing
  if (isLoading) {
    return null;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !session?.user) {
    return null;
  }

  const handleRoleSelect = useCallback((roleId: string) => {
    setSelectedRole(roleId);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedRole) {
      showToast({ type: 'error', message: 'Please select a role first' });
      return;
    }

    if (!session?.user?.id) {
      showToast({ type: 'error', message: 'Please login first' });
      router.replace('/auth/login');
      return;
    }

    // Navigate to appropriate onboarding screen based on role
    if (selectedRole === userRoles.OWNER_SHOP) {
      router.push('/auth/onboarding/owner');
    } else if (selectedRole === userRoles.DRIVER) {
      router.push('/auth/onboarding/driver');
    }
  }, [selectedRole, session, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select the option that best describes you
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.rolesContainer}>
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  isSelected && styles.roleCardSelected,
                  isSelected && { borderColor: role.color },
                ]}
                onPress={() => handleRoleSelect(role.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: role.color + '20' },
                  ]}
                >
                  <Icon size={32} color={role.color} />
                </View>

                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>

                {isSelected && (
                  <View
                    style={[styles.checkmark, { backgroundColor: role.color }]}
                  >
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text
            style={[
              styles.continueButtonText,
              !selectedRole && styles.continueButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>

        {/* Logout Link */}
        <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>

          <Text style={styles.logoutText}>Switch Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rolesContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleCardSelected: {
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  checkmarkText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  continueButtonTextDisabled: {
    color: colors.textSecondary,
  },
  logoutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  logoutText: {
    color: colors.info,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
