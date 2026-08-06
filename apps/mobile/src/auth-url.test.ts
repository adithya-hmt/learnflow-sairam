import { expect, test } from '@jest/globals';
import { parseAuthSessionUrl } from './lib/auth-url';

test('parses Supabase mobile OAuth tokens and rejects provider errors', () => {
  expect(parseAuthSessionUrl('learnflow://auth/callback#access_token=access&refresh_token=refresh'))
    .toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  expect(() => parseAuthSessionUrl('learnflow://auth/callback#error=access_denied&error_description=Wrong+account'))
    .toThrow('Wrong account');
  expect(() => parseAuthSessionUrl('learnflow://auth/callback#access_token=missing-refresh'))
    .toThrow('incomplete');
});
