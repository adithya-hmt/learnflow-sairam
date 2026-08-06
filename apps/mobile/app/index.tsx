import { Redirect } from 'expo-router';
import { useAuth } from '@/auth';
export default function Index() { const auth = useAuth(); if (auth.loading) return null; return <Redirect href={auth.configured && !auth.session ? '/login' : '/(tabs)'} />; }
