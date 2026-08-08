import { useEffect, useState } from 'react';
import { NativeModules, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Pill, Screen, s } from '@/components';
import { parseAttendanceQr } from '@/attendance-qr';
import { updateAttendanceReceipt } from '@/attendance-receipts';
import { student } from '@/studentData';
import { useProfile } from '@/data/hooks';
import { colors } from '@/theme';

type BridgeResult = { status: 'confirmed' | 'rejected' | 'unverified' | 'cancelled'; message: string };
const attendanceBridge = NativeModules.AttendanceBridge as { open(url: string, studentId: string, classCode: string): Promise<BridgeResult> } | undefined;

export default function AttendanceSubmit() {
  const { url, classCode } = useLocalSearchParams<{ url: string; classCode: string }>();
  const { data: profile } = useProfile();
  const studentId = profile?.rollNo || student.rollNo;
  const [status, setStatus] = useState('Opening the secure attendance screen…');
  const [tone, setTone] = useState<'blue' | 'green' | 'coral' | 'gold'>('blue');

  useEffect(() => {
    if (!url || !attendanceBridge) { setStatus('Automatic attendance is available in the native Android app.'); setTone('coral'); return; }
    let active = true;
    try {
      const qr = parseAttendanceQr(url);
      void attendanceBridge.open(qr.url, studentId, qr.classCode).then(async (result) => {
        if (!active) return;
        setStatus(result.message);
        setTone(result.status === 'confirmed' ? 'green' : result.status === 'rejected' ? 'coral' : 'gold');
        if (result.status === 'confirmed' || result.status === 'rejected' || result.status === 'unverified') await updateAttendanceReceipt(qr.token, result.status);
      }).catch((error: unknown) => {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : 'The secure attendance screen could not be opened.');
        setTone('coral');
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Scan the classroom QR again.');
      setTone('coral');
    }
    return () => { active = false; };
  }, [studentId, url]);

  return <Screen title={`Class ${classCode || 'attendance'}`} subtitle={`Using SCC ID ${studentId}`}>
    <Card style={a.status}><Pill text={tone === 'green' ? 'CONFIRMED' : tone === 'coral' ? 'ATTENTION' : 'SECURE BRIDGE'} tone={tone} /><Text style={a.statusText}>{status}</Text></Card>
    <Card><Text style={s.body}>LearnFlow fills your SCC ID inside the verified college form. Attendance is shown as confirmed only after the college page reports success.</Text></Card>
    <Button label="Back to attendance" secondary onPress={() => router.replace('/(tabs)/attendance')} />
  </Screen>;
}

const a = StyleSheet.create({ status: { gap: 9 }, statusText: { color: colors.ink, fontWeight: '800', lineHeight: 20 } });
