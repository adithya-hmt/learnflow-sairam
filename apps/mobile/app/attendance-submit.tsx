import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Card, Pill, Screen, s } from '@/components';
import { student } from '@/studentData';
import { useProfile } from '@/data/hooks';
import { colors } from '@/theme';

const scriptFor = (studentId: string) => `
  (function () {
    const id = ${JSON.stringify(studentId)};
    let submitted = false;
    const report = (value) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'attendance', value }));
    const fillAndSubmit = () => {
      const input = document.getElementById('studentid');
      if (!input) return false;
      input.value = id;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const button = document.querySelector('button[onclick*="submitAttendance"]');
      if (button && !submitted) {
        submitted = true;
        setTimeout(() => button.click(), 250);
        report('Submitting attendance for ' + id);
      }
      return true;
    };
    const timer = setInterval(() => { if (fillAndSubmit()) clearInterval(timer); }, 150);
    setTimeout(() => clearInterval(timer), 30000);
    const observer = new MutationObserver(() => {
      const message = document.getElementById('msg');
      if (message && message.innerText.trim()) report(message.innerText.trim());
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  })();
  true;
`;
const Browser = WebView as any;

export default function AttendanceSubmit() {
  const { url, classCode } = useLocalSearchParams<{ url: string; classCode: string }>();
  const { data: profile } = useProfile();
  const studentId = profile?.rollNo || student.rollNo;
  const [status, setStatus] = useState('Opening the live attendance page…');
  const webView = useRef<any>(null);
  const onMessage = (event: any) => {
    try { const message = JSON.parse(event.nativeEvent.data); if (message.type === 'attendance') setStatus(message.value); } catch { /* page messages are best-effort */ }
  };
  if (!url) return <Screen title="Attendance" subtitle="The scanned QR link was incomplete."><Card><Text style={s.body}>Scan the classroom QR again.</Text></Card></Screen>;
  return <Screen title={`Class ${classCode || 'attendance'}`} subtitle={`Using SCC ID ${studentId}`}>
    <Card style={a.status}><Pill text="LIVE QR" tone="green" /><Text style={a.statusText}>{status}</Text></Card>
    <View style={a.browser}><Browser ref={webView} source={{ uri: url }} javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled injectedJavaScript={scriptFor(studentId)} injectedJavaScriptForMainFrameOnly={false} onMessage={onMessage} startInLoadingState renderLoading={() => <ActivityIndicator color={colors.blue} size="large" />} /></View>
    <Card><Text style={a.note}>LearnFlow scanned this live QR and filled the signed-in student ID. Keep this page open until the attendance result appears.</Text></Card>
    <Text onPress={() => router.back()} style={a.back}>Back to scanner</Text>
  </Screen>;
}

const a = StyleSheet.create({ status: { backgroundColor: colors.mint, borderColor: '#B7E4D8', gap: 9 }, statusText: { color: colors.ink, fontWeight: '800', lineHeight: 20 }, browser: { height: 520, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, note: { color: colors.muted, fontSize: 12, lineHeight: 18 }, back: { color: colors.blue, textAlign: 'center', fontWeight: '800', padding: 12 },
});
