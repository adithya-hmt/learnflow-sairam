import { z } from 'zod';

export const socialPostInput = z.object({ text: z.string().trim().min(1).max(1000), mediaUrl: z.url().optional() });
export interface SocialAdapter { readonly source: string; publish(input: z.infer<typeof socialPostInput>): Promise<{ externalId: string }>; }
export const localSocialAdapter: SocialAdapter = { source: 'learnflow', async publish(input) { socialPostInput.parse(input); return { externalId: `local-${Date.now()}` }; } };

export const attendanceSignal = z.object({ kind: z.enum(['nfc', 'qr', 'ble', 'kiosk', 'display', 'lab']), deviceId: z.string().min(3), sessionId: z.string().uuid(), capturedAt: z.iso.datetime(), calibration: z.number().default(1) });
export interface HardwareAdapter { readonly kind: z.infer<typeof attendanceSignal>['kind']; read(): Promise<z.infer<typeof attendanceSignal>>; }
export function validateHardwareSignal(value: unknown) { return attendanceSignal.parse(value); }
