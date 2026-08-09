import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Button, Card, Pill, Screen, s } from '@/components';
import { parseAttendanceQr, type AttendanceQr } from '@/attendance-qr';
import { recordAttendanceScan } from '@/attendance-receipts';
import { useProfile } from '@/data/hooks';
import { useTimetable } from '@/data/hooks';
import { currentTimetableSlot } from '@/timetable';
import { getScheduleStatus, isWeekday } from '@/studentData';
import { colors } from '@/theme';
import { useAuth } from '@/auth';

export default function ScanAttendance() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<AttendanceQr | null>(null);
  const [scanning, setScanning] = useState(true);
  const { data: profile } = useProfile();
  const { data: liveSlots = [] } = useTimetable();
  const auth = useAuth();
  if (!permission) return null;
  if (!permission.granted) return <Screen title="Scan attendance" subtitle="Use the live QR shown in your classroom.">
    <Card><Text style={a.title}>Camera access is needed</Text><Text style={[s.body, a.body]}>LearnFlow only uses the camera to read the attendance QR. It does not record video.</Text><Button label="Allow camera" onPress={() => void requestPermission()} /></Card>
  </Screen>;
  const onScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    try {
      const qr = parseAttendanceQr(data);
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = auth.configured ? currentTimetableSlot(liveSlots, now) : (isWeekday(day) ? getScheduleStatus(day, now).current : null);
      const actorId = auth.configured ? (profile?.id || auth.session?.user.id) : 'demo-student';
      if (!actorId) { Alert.alert('Profile unavailable', 'Wait for your signed-in profile to load before scanning.'); return; }
      const scheduleLabel = !schedule ? 'No timetable window now' : auth.configured ? `${(schedule as typeof liveSlots[number]).displayTitle} · ${(schedule as typeof liveSlots[number]).startsAt}–${(schedule as typeof liveSlots[number]).endsAt}` : `${(schedule as { title: string; start: string; end: string }).title} · ${(schedule as { start: string }).start}–${(schedule as { end: string }).end}`;
      await recordAttendanceScan({ actorId, classCode: qr.classCode, token: qr.token, schedule: scheduleLabel, inWindow: Boolean(schedule) });
      setResult(qr);
      setScanning(false);
    } catch (error) { Alert.alert('Invalid QR', error instanceof Error ? error.message : 'Scan the live classroom attendance QR.'); }
  };
  return <Screen title="Scan attendance" subtitle="Point your camera at the classroom QR.">
    {!result && <View style={a.cameraFrame}><CameraView style={StyleSheet.absoluteFill} facing="back" onBarcodeScanned={scanning ? onScanned : undefined} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} /><View style={a.target}><View style={a.corner} /><View style={[a.corner, a.topRight]} /><View style={[a.corner, a.bottomLeft]} /><View style={[a.corner, a.bottomRight]} /></View></View>}
    {result && <Card style={a.success}><Pill text="QR READ" tone="green" /><Text style={a.title}>Class {result.classCode}</Text><Text style={s.body}>Token captured. LearnFlow can now fill your college ID on the live page.</Text><Button label="Mark attendance" onPress={() => router.push({ pathname: '/attendance-submit', params: { url: result.url, classCode: result.classCode } })} /><Button label="Scan again" secondary onPress={() => { setResult(null); setScanning(true); }} /></Card>}
    <Button label="Back to attendance" secondary onPress={() => router.back()} />
  </Screen>;
}

const a = StyleSheet.create({
  cameraFrame: { height: 390, overflow: 'hidden', borderRadius: 22, backgroundColor: colors.navy, position: 'relative' }, target: { position: 'absolute', left: '15%', right: '15%', top: '20%', bottom: '20%' },
  corner: { position: 'absolute', width: 42, height: 42, borderColor: colors.white, borderTopWidth: 4, borderLeftWidth: 4, top: 0, left: 0 }, topRight: { left: undefined, right: 0, borderLeftWidth: 0, borderRightWidth: 4 }, bottomLeft: { top: undefined, bottom: 0, borderTopWidth: 0, borderBottomWidth: 4 }, bottomRight: { top: undefined, left: undefined, right: 0, bottom: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 4, borderBottomWidth: 4 },
  success: { gap: 12 }, title: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 10 }, body: { marginBottom: 4 },
});
