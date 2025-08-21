/**
 * Centralized phone number normalization utility
 * Handles various formats and ensures consistent 10-digit DID output
 */

export function normalizeToDidNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  
  // Convert to string and trim
  const str = String(input).trim();
  if (!str) return null;
  
  // Remove all non-digit characters
  const digits = str.replace(/\D/g, '');
  if (!digits) return null;
  
  // Handle country codes and normalize to 10 digits
  let normalized: string;
  
  if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code: +1XXXXXXXXXX -> XXXXXXXXXX
    normalized = digits.slice(1);
  } else if (digits.length === 10) {
    // Already 10 digits
    normalized = digits;
  } else if (digits.length > 11) {
    // Very long number, try to extract last 10 digits
    normalized = digits.slice(-10);
  } else {
    // Invalid length
    return null;
  }
  
  // Validate the normalized number
  if (!/^[2-9]\d{9}$/.test(normalized)) {
    return null;
  }
  
  return normalized;
}

/**
 * Batch normalize an array of phone numbers
 */
export function normalizePhoneNumbers(inputs: (string | null | undefined)[]): string[] {
  return inputs
    .map(normalizeToDidNumber)
    .filter((num): num is string => num !== null);
}

/**
 * Check if two phone numbers are equivalent after normalization
 */
export function arePhoneNumbersEqual(num1: string, num2: string): boolean {
  const norm1 = normalizeToDidNumber(num1);
  const norm2 = normalizeToDidNumber(num2);
  return norm1 !== null && norm2 !== null && norm1 === norm2;
}
