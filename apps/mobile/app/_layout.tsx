import { useEffect } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '@/store';
import { startAuthLifecycle } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/auth';
import { colors } from '@/theme';
import { syncOutbox } from '@/lib/sync';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });
SplashScreen.setOptions({ duration: 500, fade: true });
export default function RootLayout() {
  const setOnline = useAppStore((x) => x.setOnline);
  useEffect(() => { startAuthLifecycle(); return NetInfo.addEventListener((state) => { const online = Boolean(state.isConnected); setOnline(online); if (online) void syncOutbox().then((result) => { if (result.synced) void client.invalidateQueries(); }); }); }, [setOnline]);
  return <QueryClientProvider client={client}><AuthProvider><RootNavigator /></AuthProvider></QueryClientProvider>;
}

function RootNavigator() {
  const auth = useAuth();
  const [segment] = useSegments();
  if (auth.loading) return null;
  const publicRoute = segment === 'login' || segment === 'credits';
  if (auth.configured && !auth.session && !publicRoute) return <Redirect href="/login" />;
  if ((!auth.configured || auth.session) && segment === 'login') return <Redirect href="/(tabs)" />;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.ink, headerShadowVisible: false, contentStyle: { backgroundColor: colors.paper } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="login" options={{ headerShown: false }} /><Stack.Screen name="activity" options={{ title: 'Phone activity' }} /><Stack.Screen name="connections" options={{ title: 'Connections' }} /><Stack.Screen name="credits" options={{ title: 'Credits' }} /><Stack.Screen name="workspace" options={{ title: 'Role workspace' }} /><Stack.Screen name="notifications" options={{ title: 'Notifications' }} /><Stack.Screen name="social" options={{ title: 'Sairam Social', presentation: 'card' }} /><Stack.Screen name="scan-attendance" options={{ title: 'Scan attendance' }} /><Stack.Screen name="attendance-submit" options={{ title: 'Mark attendance' }} /><Stack.Screen name="course/[id]" options={{ title: 'Course' }} /><Stack.Screen name="assignment/[id]" options={{ title: 'Assignment' }} /><Stack.Screen name="lesson/[id]" options={{ title: 'Lesson' }} /></Stack></>;
}
