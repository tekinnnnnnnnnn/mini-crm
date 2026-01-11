const { normalizeEmail, normalizePhone, normalizePhoneTR, isValidEmail } = require('../src/lib/validation');

describe('validation helpers (unit)', () => {
  test('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  TEST@EXAMPLE.COM ')).toBe('test@example.com');
  });

  test('normalizePhone keeps digits only', () => {
    expect(normalizePhone('+90 (532) 111-22-33')).toBe('905321112233');
  });

  test('normalizePhoneTR normalizes TR prefixes', () => {
    expect(normalizePhoneTR('0532 111 2233')).toBe('905321112233');
    expect(normalizePhoneTR('+90 532 111 2233')).toBe('905321112233');
    expect(normalizePhoneTR('5321112233')).toBe('905321112233');
  });

  test('isValidEmail basic cases', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('bad@@mail')).toBe(false);
  });
});
