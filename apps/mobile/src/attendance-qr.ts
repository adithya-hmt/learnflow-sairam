export type AttendanceQr = { url: string; classCode: string; token: string };
export const canOpenAttendanceBridge = (input: { configured: boolean; authenticated: boolean; sccId: string | null | undefined }) => input.configured && input.authenticated && Boolean(input.sccId?.trim());

export function parseAttendanceQr(value: string): AttendanceQr {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('This is not a valid attendance QR.'); }
  if (url.protocol !== 'https:' || !/^(script\.google\.com|script\.googleusercontent\.com)$/i.test(url.hostname)) throw new Error('Scan the live classroom attendance QR.');
  const classCode = url.searchParams.get('v')?.trim();
  const token = url.searchParams.get('t')?.trim();
  if (!classCode || !token) throw new Error('This attendance QR is missing its class or token.');
  return { url: url.toString(), classCode, token };
}
