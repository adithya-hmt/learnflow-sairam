import { expect, test } from '@jest/globals';
import { safeExternalUrl } from './lib/link-validation';

test('external links allow approved app and web schemes only', () => {
  expect(safeExternalUrl('https://sairam.edu.in/route-map/')).toContain('sairam.edu.in');
  expect(safeExternalUrl('obsidian://daily?vault=UltronVault')).toContain('obsidian://');
  expect(() => safeExternalUrl('javascript:alert(1)')).toThrow();
  expect(() => safeExternalUrl('http://example.com')).toThrow();
  expect(() => safeExternalUrl('https://user:password@example.com')).toThrow();
});
