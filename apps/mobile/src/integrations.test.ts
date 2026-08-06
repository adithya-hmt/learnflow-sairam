import { expect, test } from '@jest/globals';
import { socialPostInput, validateHardwareSignal } from './lib/integrations';

test('social post input trims surrounding text', () => {
  expect(socialPostInput.parse({ text: '  Build Night  ' }).text).toBe('Build Night');
});

test('social post input accepts a valid media URL', () => {
  expect(socialPostInput.parse({ text: 'Announcement', mediaUrl: 'https://example.com/image.png' }).mediaUrl)
    .toBe('https://example.com/image.png');
});

test('social post input rejects text longer than one thousand characters', () => {
  expect(() => socialPostInput.parse({ text: 'x'.repeat(1001) })).toThrow();
});

test('hardware signal applies the default calibration', () => {
  const signal = validateHardwareSignal({
    kind: 'qr',
    deviceId: 'scanner-01',
    sessionId: '11111111-1111-4111-8111-111111111111',
    capturedAt: '2026-08-06T10:00:00.000Z',
  });

  expect(signal.calibration).toBe(1);
});

test('hardware signal rejects unsupported device kinds', () => {
  expect(() => validateHardwareSignal({
    kind: 'camera',
    deviceId: 'camera-01',
    sessionId: '11111111-1111-4111-8111-111111111111',
    capturedAt: '2026-08-06T10:00:00.000Z',
  })).toThrow();
});
