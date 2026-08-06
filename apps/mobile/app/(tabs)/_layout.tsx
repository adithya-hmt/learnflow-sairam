import { Redirect, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme';
import { useAuth } from '@/auth';
export default function TabLayout() { const auth = useAuth(); if (auth.configured && !auth.loading && !auth.session) return <Redirect href="/login" />; return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#81909E', tabBarStyle: { height: 68, paddingTop: 8, backgroundColor: colors.white, borderTopColor: colors.line }, tabBarLabelStyle: { fontWeight: '700', fontSize: 11, marginBottom: 8 } }}>
  <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} /> }} />
  <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'book' : 'book-outline'} size={21} color={color} /> }} />
  <Tabs.Screen name="campus" options={{ title: 'Campus', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'school' : 'school-outline'} size={21} color={color} /> }} />
  <Tabs.Screen name="plan" options={{ title: 'Calendar', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={21} color={color} /> }} />
  <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={21} color={color} /> }} />
  <Tabs.Screen name="progress" options={{ href: null }} />
  <Tabs.Screen name="profile" options={{ href: null }} />
</Tabs>; }
