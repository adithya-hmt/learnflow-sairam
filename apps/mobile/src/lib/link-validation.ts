export function safeExternalUrl(value: string): string {
  const url = new URL(value);
  if (!['https:', 'obsidian:'].includes(url.protocol) || url.username || url.password) throw new Error('Unsupported external link');
  return value;
}
