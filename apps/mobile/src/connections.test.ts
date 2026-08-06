import { expect, test } from '@jest/globals';
import { buildConnectionUrl, buildLocalIntent, buildObsidianDailyUrl, connections, getConnection } from './lib/connections';

test('connections are credential-free and point to official destinations', () => {
  expect(connections).toHaveLength(12);
  expect(connections.every(connection => connection.credentialsStored === false)).toBe(true);
  expect(buildConnectionUrl('google_drive')).toBe('https://drive.google.com/drive/my-drive');
  expect(buildConnectionUrl('google_classroom', { accountEmail: 'secl25cs08@sairamtap.edu.in' })).toBe('https://classroom.google.com/?authuser=secl25cs08%40sairamtap.edu.in');
  expect(getConnection('sail').url).toBe('https://sailstudent.sairamit.edu.in/');
  expect(getConnection('skillrack').url).toBe('https://www.skillrack.com/');
  expect(getConnection('super_productivity').url).toBe('https://app.super-productivity.com/');
});

test('Obsidian links encode vault and file names', () => {
  expect(buildConnectionUrl('obsidian', { vault: 'College Notes', file: 'AI/Week 1.md' }))
    .toBe('obsidian://open?vault=College+Notes&file=AI%2FWeek+1.md');
  expect(buildObsidianDailyUrl('# LearnFlow\n- Review AI')).toContain('obsidian://daily?vault=UltronVault&content=');
});

test('local import/export intents never include credentials and reject control characters', () => {
  expect(buildLocalIntent('google_drive', 'export', 'notes.json')).toBe('learnflow://connections/file?provider=google_drive&action=export&filename=notes.json');
  expect(() => buildLocalIntent('obsidian', 'import', 'bad\nname')).toThrow();
});
