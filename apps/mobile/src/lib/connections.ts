import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type ConnectionId = 'gmail' | 'google_calendar' | 'google_drive' | 'google_classroom' | 'google_meet' | 'google_docs' | 'google_sheets' | 'hackerrank' | 'skillrack' | 'sail' | 'obsidian' | 'super_productivity';
export type ConnectionCategory = 'workspace' | 'learning' | 'workflow';
export type ConnectionAction = 'import' | 'export';

export type ConnectionDefinition = {
  id: ConnectionId;
  category: ConnectionCategory;
  label: string;
  action: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  launch: 'web' | 'deep-link';
  url: string;
  credentialsStored: false;
  limitation: string;
};

export const connections: readonly ConnectionDefinition[] = [
  { id: 'gmail', category: 'workspace', label: 'Gmail', action: 'Open inbox', icon: 'mail-outline', color: '#EA4335', launch: 'web', url: 'https://mail.google.com/mail/', credentialsStored: false, limitation: 'College inbox in your existing Google session.' },
  { id: 'google_calendar', category: 'workspace', label: 'Google Calendar', action: 'Open calendar', icon: 'calendar-outline', color: '#4285F4', launch: 'web', url: 'https://calendar.google.com/calendar/', credentialsStored: false, limitation: 'Meetings and personal events stay in Google Workspace.' },
  { id: 'google_drive', category: 'workspace', label: 'Google Drive', action: 'Open files', icon: 'folder-open-outline', color: '#0F9D58', launch: 'web', url: 'https://drive.google.com/drive/my-drive', credentialsStored: false, limitation: 'Uses the browser session; LearnFlow stores no Drive credentials.' },
  { id: 'google_classroom', category: 'workspace', label: 'Google Classroom', action: 'Open classes', icon: 'school-outline', color: '#0F9D58', launch: 'web', url: 'https://classroom.google.com/', credentialsStored: false, limitation: 'Official Classroom handoff; direct sync requires Sairam admin approval.' },
  { id: 'google_meet', category: 'workspace', label: 'Google Meet', action: 'Open Meet', icon: 'videocam-outline', color: '#00897B', launch: 'web', url: 'https://meet.google.com/', credentialsStored: false, limitation: 'Join or start meetings with your college account.' },
  { id: 'google_docs', category: 'workspace', label: 'Google Docs', action: 'Open documents', icon: 'document-text-outline', color: '#4285F4', launch: 'web', url: 'https://docs.google.com/document/', credentialsStored: false, limitation: 'Create and edit documents in the official Google app or browser.' },
  { id: 'google_sheets', category: 'workspace', label: 'Google Sheets', action: 'Open sheets', icon: 'grid-outline', color: '#0F9D58', launch: 'web', url: 'https://docs.google.com/spreadsheets/', credentialsStored: false, limitation: 'Open spreadsheets without copying Workspace data into LearnFlow.' },
  { id: 'hackerrank', category: 'learning', label: 'HackerRank', action: 'Practice coding', icon: 'code-slash-outline', color: '#00A76F', launch: 'web', url: 'https://www.hackerrank.com/dashboard', credentialsStored: false, limitation: 'Official practice dashboard; progress import waits for an approved API.' },
  { id: 'skillrack', category: 'learning', label: 'SkillRack', action: 'Open SkillRack', icon: 'terminal-outline', color: '#E97721', launch: 'web', url: 'https://www.skillrack.com/', credentialsStored: false, limitation: 'Mandatory PGPA practice portal; LearnFlow stores no SkillRack password.' },
  { id: 'sail', category: 'learning', label: 'SAIL Student', action: 'Open SAIL', icon: 'stats-chart-outline', color: '#4338CA', launch: 'web', url: 'https://sailstudent.sairamit.edu.in/', credentialsStored: false, limitation: 'Uses your roll number on the official portal; no SAIL password is stored.' },
  { id: 'obsidian', category: 'workflow', label: 'Obsidian', action: 'Add today to Obsidian', icon: 'diamond-outline', color: '#7C3AED', launch: 'deep-link', url: 'obsidian://open', credentialsStored: false, limitation: 'Appends a local daily note to your UltronVault.' },
  { id: 'super_productivity', category: 'workflow', label: 'Super Productivity', action: 'Open task board', icon: 'checkmark-done-outline', color: '#2563EB', launch: 'web', url: 'https://app.super-productivity.com/', credentialsStored: false, limitation: 'Opens the local-first planner without accessing its task database.' },
];

const definitionById = new Map(connections.map((connection) => [connection.id, connection]));
const googleIds = new Set<ConnectionId>(['gmail', 'google_calendar', 'google_drive', 'google_classroom', 'google_meet', 'google_docs', 'google_sheets']);
const safePart = (value: string, label: string) => {
  if (!value || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`${label} contains unsafe characters`);
  return value;
};

export function getConnection(id: ConnectionId): ConnectionDefinition {
  const connection = definitionById.get(id);
  if (!connection) throw new Error(`Unknown connection: ${id}`);
  return connection;
}

export function buildConnectionUrl(id: ConnectionId, options: { accountEmail?: string; vault?: string; file?: string } = {}): string {
  const connection = getConnection(id);
  if (id === 'obsidian') {
    const params = new URLSearchParams();
    if (options.vault) params.set('vault', safePart(options.vault, 'Vault name'));
    if (options.file) params.set('file', safePart(options.file, 'File name'));
    const query = params.toString();
    return query ? `${connection.url}?${query}` : connection.url;
  }
  if (!googleIds.has(id) || !options.accountEmail) return connection.url;
  const url = new URL(connection.url);
  url.searchParams.set('authuser', safePart(options.accountEmail.trim().toLowerCase(), 'Account email'));
  return url.toString();
}

export function buildObsidianDailyUrl(content: string, vault = 'UltronVault'): string {
  if (!content.trim() || content.length > 4000 || content.includes('\0')) throw new Error('Daily note content is invalid');
  return `obsidian://daily?${new URLSearchParams({ vault: safePart(vault, 'Vault name'), content, append: 'true' })}`;
}

/** A local, credential-free handoff for the app's own file picker/export flow. */
export function buildLocalIntent(id: ConnectionId, action: ConnectionAction, filename?: string): string {
  getConnection(id);
  const params = new URLSearchParams({ provider: id, action });
  if (filename) params.set('filename', safePart(filename, 'Filename'));
  return `learnflow://connections/file?${params.toString()}`;
}
