import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

const DEVICE_ID_KEY = 'learnflow.device-id';

export async function registerForPushNotifications() {
  if (!supabase) throw new Error('Connect Supabase before registering notifications.');
  if (Constants.executionEnvironment === 'storeClient') throw new Error('Remote push notifications require a LearnFlow development build; Expo Go does not support them on Android.');
  const Notifications = await import('expo-notifications');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('learning', { name: 'Learning updates', importance: Notifications.AndroidImportance.DEFAULT });
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.status === 'granted' ? existing : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Notification permission was not granted.');
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Set an EAS project ID before requesting remote push tokens.');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before registering this device.');
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) { deviceId = globalThis.crypto.randomUUID(); await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId); }
  const { error } = await supabase.from('device_registrations').upsert({ user_id: user.id, device_id: deviceId, platform: Platform.OS, push_token: token, capabilities: ['notifications'], last_seen_at: new Date().toISOString() }, { onConflict: 'user_id,device_id' });
  if (error) throw error;
  return token;
}
