import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import PhoneActivity, { type PhoneUsage } from '../modules/expo-phone-activity';
import { Button, Card, Pill, Progress, Screen, Section, s } from '@/components';
import { colors } from '@/theme';

const formatMinutes = (minutes: number) => minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export default function Activity() {
  const [usage, setUsage] = useState<PhoneUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supported = Platform.OS === 'android' && Boolean(PhoneActivity);

  const refresh = useCallback(async () => {
    if (!supported || !PhoneActivity) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setUsage(await PhoneActivity.getUsageAsync(1)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not read phone activity.'); }
    finally { setLoading(false); }
  }, [supported]);

  useEffect(() => {
    void refresh();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => listener.remove();
  }, [refresh]);

  if (!supported) return <Screen title="Phone activity" subtitle="A private view of your Android screen time"><Card><Pill text="ANDROID BUILD REQUIRED" tone="gold" /><Text style={a.stateTitle}>Install the LearnFlow Android build</Text><Text style={s.body}>Expo Go and web previews cannot read Android usage data. The signed Android app can, after you grant Usage Access.</Text></Card><Privacy /></Screen>;
  if (loading) return <Screen title="Phone activity" subtitle="Reading today’s on-device summary"><Card><Text style={s.body}>Loading activity…</Text></Card></Screen>;
  if (error) return <Screen title="Phone activity" subtitle="A private view of your Android screen time"><Card><Text style={a.stateTitle}>Activity unavailable</Text><Text style={s.body}>{error}</Text><View style={{ marginTop: 14 }}><Button label="Try again" onPress={() => void refresh()} /></View></Card><Privacy /></Screen>;
  if (!usage?.permissionGranted) return <Screen title="Phone activity" subtitle="A private view of your Android screen time"><Card><Pill text="OFF BY DEFAULT" tone="green" /><Text style={a.stateTitle}>You control this</Text><Text style={s.body}>Turn on Usage Access for LearnFlow to show today’s total and most-used apps. You can revoke it anytime in Android Settings.</Text><View style={{ marginTop: 14 }}><Button label="Open Usage Access" onPress={() => void PhoneActivity?.openUsageAccessSettingsAsync()} /></View></Card><Privacy /></Screen>;

  const max = Math.max(1, usage.apps[0]?.minutes ?? 1);
  return <Screen title="Phone activity" subtitle="Today · refreshed from Android">
    <Card style={a.hero}><Text style={a.heroLabel}>SCREEN TIME TODAY</Text><Text style={a.total}>{formatMinutes(usage.totalMinutes)}</Text><Text style={a.heroBody}>{usage.apps.length} apps used · on-device only</Text></Card>
    <Section title="Most used apps">{usage.apps.length ? usage.apps.map((app, index) => <Card key={app.packageName} style={a.app}><View style={a.rank}><Text style={a.rankText}>{index + 1}</Text></View><View style={{ flex: 1 }}><View style={a.appTop}><Text numberOfLines={1} style={a.appName}>{app.name}</Text><Text style={a.time}>{formatMinutes(app.minutes)}</Text></View><Progress value={(app.minutes / max) * 100} color={index === 0 ? colors.coral : colors.blue} /></View></Card>) : <Card><Text style={s.body}>No app activity has been recorded today.</Text></Card>}</Section>
    <Button label="Refresh" secondary onPress={() => void refresh()} /><Privacy />
  </Screen>;
}

function Privacy() { return <View style={a.privacy}><Text style={a.privacyTitle}>Private by design</Text><Text style={a.privacyText}>LearnFlow reads Android’s summary only while this screen is open. It does not capture messages, typed text, browsing content or screenshots, and it does not upload usage data.</Text></View>; }

const a = StyleSheet.create({
  stateTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 14, marginBottom: 7 }, hero: { backgroundColor: colors.navy, borderColor: colors.navy }, heroLabel: { color: '#9FC5D4', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, total: { color: 'white', fontSize: 42, fontWeight: '900', marginTop: 7 }, heroBody: { color: '#D3E2E9', fontSize: 12, marginTop: 3 },
  app: { flexDirection: 'row', alignItems: 'center', gap: 12 }, rank: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }, rankText: { color: colors.blue, fontWeight: '900' }, appTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 9 }, appName: { flex: 1, color: colors.ink, fontWeight: '800' }, time: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  privacy: { padding: 16, marginTop: 14, backgroundColor: colors.mint, borderRadius: 17 }, privacyTitle: { color: colors.green, fontWeight: '900', fontSize: 13 }, privacyText: { color: '#4F7166', fontSize: 11, lineHeight: 17, marginTop: 4 },
});
