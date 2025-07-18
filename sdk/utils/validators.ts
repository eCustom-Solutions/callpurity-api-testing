export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // US phone number regex: +1-XXX-XXX-XXXX or 1-XXX-XXX-XXXX or XXX-XXX-XXXX
  const phoneRegex = /^(\+?1-?)?(\d{3})-?(\d{3})-?(\d{4})$/;
  return phoneRegex.test(phoneNumber);
};

export const isValidEIN = (ein: string): boolean => {
  // EIN format: XX-XXXXXXX (2 digits, hyphen, 7 digits)
  const einRegex = /^\d{2}-\d{7}$/;
  return einRegex.test(ein);
}; 