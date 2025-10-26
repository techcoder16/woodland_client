/**
 * Phone number validation utilities
 */

export const validatePhoneNumber = (phoneNumber: string | number): boolean => {
  if (!phoneNumber) return true; // Allow empty phone numbers
  
  // Convert to string and remove all spaces and special characters
  const cleaned = phoneNumber.toString().replace(/[\s\-\(\)]/g, '');
  
  // Check if it's just digits (10-15 digits) and doesn't start with 0
  return /^[1-9]\d{9,14}$/.test(cleaned);
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove all spaces and special characters except + at the beginning
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
};

export const getPhoneNumberError = (phoneNumber: string | number): string | null => {
  if (!phoneNumber) return null;
  
  if (!validatePhoneNumber(phoneNumber)) {
    return 'Please enter a valid phone number format (e.g., 1234567890)';
  }
  
  return null;
};
