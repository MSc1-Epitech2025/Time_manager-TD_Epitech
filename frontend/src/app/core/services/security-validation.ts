import { Injectable } from '@angular/core';
import { z } from 'zod';

// safe string
const safeString = z
  .string()
  .refine(
    (val) => !/[<>\"'`]/.test(val),
    { message: 'Invalid characters' }
  );

// safe email
const safeEmail = z
  .string()
  .email()
  .refine(
    (val) => !/[<>\"'`]/.test(val),
    { message: 'Invalid email' }
  );

// XSS protection
const xssProtection = z
  .string()
  .refine(
    (val) => {
      const dangerous = /<script|onerror=|onclick=|onload=|javascript:|data:text\/html/i;
      return !dangerous.test(val);
    },
    { message: 'Potentially dangerous content' }
  );

// login schema
export const loginSchema = z.object({
  email: safeEmail,
  password: z.string().min(6).max(128),
  remember: z.boolean().optional(),
});

// user creation
export const userCreationSchema = z.object({
  firstName: safeString.min(1).max(50),
  lastName: safeString.min(1).max(50),
  email: safeEmail,
  phone: safeString.max(20).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  poste: safeString.max(100).optional(),
});

// generic text
export const textInputSchema = z.string().pipe(xssProtection);

@Injectable({ providedIn: 'root' })
export class SecurityValidationService {
  validateLogin(data: unknown) {
    return loginSchema.parse(data);
  }

  validateUserCreation(data: unknown) {
    return userCreationSchema.parse(data);
  }

  validateText(text: string) {
    return textInputSchema.parse(text);
  }

  sanitizeString(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;');
  }

  isValidInput(input: string): boolean {
    try {
      textInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }
}
