/**
 * User role definitions and access control
 * These must match the backend schema definitions
 */

// All user roles in the system
export const userRoles = {
  UNKNOWN: 'unknown',
  ADMIN: 'admin',
  OWNER_SHOP: 'user',
  AGENT_DELALA: 'agent_delala',
  DRIVER: 'driver',
  CALL_CENTER: 'call_center',
} as const;

export type UserRole = (typeof userRoles)[keyof typeof userRoles];

// Account status definitions
export const accountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  FLAGGED: 'flagged',
} as const;

export type AccountStatus = (typeof accountStatus)[keyof typeof accountStatus];

// Roles allowed to access the mobile app (after onboarding)
export const MOBILE_ALLOWED_ROLES: UserRole[] = [
  userRoles.OWNER_SHOP,
  userRoles.DRIVER,
  userRoles.AGENT_DELALA,
];

/**
 * Check if a user role is allowed to access the mobile app
 */
export const isMobileRoleAllowed = (role: string | undefined | null): boolean => {
  if (!role) return false;
  return MOBILE_ALLOWED_ROLES.includes(role as UserRole);
};

/**
 * Check if user needs to complete onboarding
 */
export const needsOnboarding = (role: string | undefined | null): boolean => {
  return role === userRoles.UNKNOWN;
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case userRoles.UNKNOWN:
      return 'Unknown';
    case userRoles.ADMIN:
      return 'Administrator';
    case userRoles.OWNER_SHOP:
      return 'Shop Owner';
    case userRoles.AGENT_DELALA:
      return 'Agent Delala';
    case userRoles.DRIVER:
      return 'Driver';
    case userRoles.CALL_CENTER:
      return 'Call Center';
    default:
      return 'Unknown';
  }
};

/**
 * Error messages for role-based access control
 */
export const ROLE_ERROR_MESSAGES = {
  NOT_ALLOWED: 'This account type is not allowed to access the mobile app.',
  USE_WEB_PLATFORM: 'Please use the web platform to access your account.',
  CONTACT_ADMIN: 'If you believe this is an error, please contact support.',
  COMPLETE_ONBOARDING: 'Please complete your profile setup to continue.',
};
