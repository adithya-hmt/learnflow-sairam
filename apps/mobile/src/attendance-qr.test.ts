import { expect, test } from '@jest/globals';
import { parseAttendanceQr } from './attendance-qr';

test('parses the classroom Google Apps Script QR', () => {
  expect(parseAttendanceQr('https://script.google.com/macros/s/deploy/exec?v=G4104&t=IJPHFU')).toMatchObject({ classCode: 'G4104', token: 'IJPHFU' });
});

test('rejects unrelated or incomplete links', () => {
  expect(() => parseAttendanceQr('https://example.com/?v=G4104&t=IJPHFU')).toThrow();
  expect(() => parseAttendanceQr('https://script.google.com/macros/s/deploy/exec?v=G4104')).toThrow();
});
