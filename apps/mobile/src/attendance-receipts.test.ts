import { expect, test } from '@jest/globals';
import { fingerprint } from './attendance-receipts';

test('fingerprint is stable without storing the raw attendance token', () => {
  expect(fingerprint('IJPHFU')).toBe(fingerprint('IJPHFU'));
  expect(fingerprint('IJPHFU')).not.toBe(fingerprint('OTHER'));
});
