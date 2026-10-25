import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeAccountId, buildApiUrl } from '../utils';

describe('sanitizeText', () => {
  it('removes angle brackets from text', () => {
    expect(sanitizeText('<Franklyn>')).toBe('Franklyn');
  });

  it('removes whitespace at the beginning and end', () => {
    expect(sanitizeText('  Franklyn  ')).toBe('Franklyn');
  });

  it('returns an empty string for null input', () => {
    expect(sanitizeText(null)).toBe('');
  });

  it('limits the result to 100 characters', () => {
    expect(sanitizeText('A'.repeat(120))).toHaveLength(100);
  });
});

describe('sanitizeAccountId', () => {
  it('accepts a 36-character hexadecimal and hyphen ID', () => {
    expect(sanitizeAccountId('123e4567-e89b-12d3-a456-426614174000'))
      .toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('rejects an account ID with an invalid format', () => {
    expect(sanitizeAccountId('invalid-account-id')).toBeNull();
  });

  it('trims surrounding whitespace from a valid ID', () => {
    expect(sanitizeAccountId('  123e4567-e89b-12d3-a456-426614174000  '))
      .toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});

describe('buildApiUrl', () => {
  it('uses the default API URL when no environment URL is configured', () => {
    expect(buildApiUrl('/api/accounts'))
      .toBe('http://localhost:8080/api/accounts');
  });

  it('removes unsupported characters from the path', () => {
    expect(buildApiUrl('/api/accounts?id=<123>'))
      .toBe('http://localhost:8080/api/accountsid123');
  });

  it('handles null input', () => {
    expect(buildApiUrl(null)).toBe('http://localhost:8080');
  });
});
