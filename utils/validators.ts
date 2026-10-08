
/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (basic international)
 */
const PHONE_REGEX = /^\+?[\d\s-()]{10,}$/;

/**
 * Password strength requirements
 */
const PASSWORD_REGEX = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Validates an email address
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Invalid email format';
  return null;
};

/**
 * Validates a phone number
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  if (!PHONE_REGEX.test(phone)) return 'Invalid phone number format';
  return null;
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';

  if (password.length < PASSWORD_REGEX.minLength) {
    return `Password must be at least ${PASSWORD_REGEX.minLength} characters`;
  }

  if (!PASSWORD_REGEX.hasUppercase.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!PASSWORD_REGEX.hasLowercase.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!PASSWORD_REGEX.hasNumber.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!PASSWORD_REGEX.hasSpecial.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
};

/**
 * Validates password confirmation
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

/**
 * Validates required field
 */
export const validateRequired = (
  value: string | number | undefined | null,
  fieldName: string
): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validates minimum length
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

/**
 * Validates maximum length
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
};

/**
 * Validates a number range
 */
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): string | null => {
  if (value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
};

/**
 * Validates URL format
 */
export const validateUrl = (url: string): string | null => {
  if (!url) return null; // Optional field
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format';
  }
};

/**
 * Validates username
 */
export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';

  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }

  return null;
};

/**
 * Form validation hook result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string | null>;
}

/**
 * Validates form fields
 */
export const validateForm = (
  values: Record<string, string>,
  rules: Record<string, ((value: string) => string | null)[]>
): ValidationResult => {
  const errors: Record<string, string | null> = {};

  Object.keys(values).forEach((key) => {
    const value = values[key];
    const fieldRules = rules[key];

    if (fieldRules) {
      for (const rule of fieldRules) {
        const error = rule(value);
        if (error) {
          errors[key] = error;
          break;
        }
      }
    }
  });

  return {
    isValid: Object.values(errors).every((error) => error === null),
    errors,
  };
};
