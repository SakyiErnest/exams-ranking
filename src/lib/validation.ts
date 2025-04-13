import { z } from 'zod';

/**
 * Reusable validation for email fields.
 * - Trims whitespace.
 * - Normalizes to lowercase for consistency.
 * - Validates email format.
 * - Ensures field is not empty.
 */
const emailSchema = z.string()
  .trim()
  .toLowerCase() // Normalize to lowercase
  .email('Please enter a valid email address')
  .nonempty('Email is required');

/**
 * Reusable validation for password fields.
 * - Ensures field is not empty.
 * - Sets minimum length (increased to 8 for complexity).
 * - Sets maximum length (e.g., 72 for bcrypt compatibility).
 * - Enforces basic complexity (example: requires lowercase, uppercase, and number).
 * Adjust or remove .regex() based on your specific security requirements.
 */
const passwordSchema = z.string()
  .nonempty('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  // Example complexity: at least one lowercase, one uppercase, one digit.
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
         'Password must contain at least one uppercase letter, one lowercase letter, and one number');

/**
 * Login form validation schema.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().nonempty('Password is required'), // Login doesn't usually need full complexity check on input
});

/**
 * Registration form validation schema.
 */
export const registerSchema = z.object({
  name: z.string()
    .trim()
    .nonempty('Full name is required')
    .min(2, 'Name must be at least 2 characters') // Added min length
    .max(50, 'Name cannot exceed 50 characters'),
  email: emailSchema, // Uses reusable email schema
  password: passwordSchema, // Uses reusable password schema (with complexity)
  confirmPassword: z.string()
    .nonempty('Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Error applies to the confirmation field
});

/**
 * Profile update validation schema.
 */
export const profileUpdateSchema = z.object({
  displayName: z.string()
    .trim()
    .nonempty('Display name is required')
    .min(2, 'Display name must be at least 2 characters') // Added min length
    .max(50, 'Display name cannot exceed 50 characters'),
  // Email is optional for profile update:
  // - If provided, it must be valid (and will be lowercased).
  // - If not provided (undefined), validation passes for this field.
  email: emailSchema.optional(),
});

/**
 * Password change validation schema.
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().nonempty('Current password is required'),
  // Reuse the main password schema for the new password rules
  newPassword: passwordSchema,
  confirmNewPassword: z.string().nonempty('Please confirm your new password'),
})
// First refinement: Check if new password and confirmation match
.refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ['confirmNewPassword'], // Error applies to the confirmation field
})
// Second refinement: Check if new password is different from the current one
.refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from the current password',
  path: ['newPassword'], // Error applies to the new password field
});

// Export types derived from the schemas for TypeScript usage.
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;