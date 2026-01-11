function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(value) {
  if (!isNonEmptyString(value)) return null;
  return value.trim().toLowerCase();
}

function normalizePhone(value) {
  if (!isNonEmptyString(value)) return null;
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return null;
  return digits;
}

function normalizePhoneTR(value) {
  const digits = normalizePhone(value);
  if (!digits) return null;

  // Normalize common TR variants to "90XXXXXXXXXX" (digits only, no '+')
  if (digits.startsWith('0') && digits.length === 11) {
    return `90${digits.slice(1)}`;
  }
  if (digits.startsWith('90') && digits.length === 12) {
    return digits;
  }
  if (digits.length === 10) {
    return `90${digits}`;
  }
  return digits;
}

function isValidEmail(value) {
  if (!isNonEmptyString(value)) return false;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  normalizeEmail,
  normalizePhone,
  normalizePhoneTR
};
