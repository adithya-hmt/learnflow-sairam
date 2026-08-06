import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/auth';
import { Button } from '@/components';
import { colors } from '@/theme';

const formSchema = z.object({
  email: z.email().refine((value) => value.toLowerCase().endsWith('@sairamtap.edu.in'), 'Use your Sairam college email'),
  password: z.string().min(8),
});
type Form = z.infer<typeof formSchema>;

export default function Login() {
  const auth = useAuth();
  const [usePassword, setUsePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, setError, formState: { errors } } = useForm<Form>({ defaultValues: { email: 'secl25cs08@sairamtap.edu.in', password: '' } });

  const google = async () => {
    setBusy(true);
    try { if (await auth.signInWithGoogle()) router.replace('/(tabs)'); }
    catch (error) { Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const password = handleSubmit(async (input) => {
    const parsed = formSchema.safeParse(input);
    if (!parsed.success) { for (const issue of parsed.error.issues) setError(issue.path[0] as keyof Form, { message: issue.message }); return; }
    setBusy(true);
    try { await auth.signIn(parsed.data.email, parsed.data.password); router.replace('/(tabs)'); }
    catch (error) { Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  });

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={x.screen}>
    <ScrollView contentContainerStyle={x.content} keyboardShouldPersistTaps="handled">
      <View style={x.brand}><Image source={require('../assets/brand/learnflow-wordmark.png')} style={x.wordmark} /><Text style={x.eyebrow}>SRI SAIRAM ENGINEERING COLLEGE</Text><Text style={x.title}>Your college day,{`\n`}in one place.</Text><Text style={x.subtitle}>Classes, attendance, Workspace and focused study—built around your real routine.</Text></View>
      <View style={x.card}>
        <Text style={x.cardTitle}>Sign in to LearnFlow</Text><Text style={x.account}>For students and staff with a <Text style={x.accountStrong}>@sairamtap.edu.in</Text> account</Text>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void google()} style={({ pressed }) => [x.google, pressed && x.pressed]}>
          {busy && !usePassword ? <ActivityIndicator color={colors.ink} /> : <Ionicons name="logo-google" size={20} color="#4285F4" />}<Text style={x.googleText}>Continue with Sairam Google</Text>
        </Pressable>
        <View style={x.divider}><View style={x.line} /><Text style={x.or}>OR</Text><View style={x.line} /></View>
        <Pressable accessibilityRole="button" onPress={() => setUsePassword((value) => !value)} style={x.fallback}><Text style={x.fallbackText}>{usePassword ? 'Hide password sign-in' : 'Use LearnFlow password'}</Text><Ionicons name={usePassword ? 'chevron-up' : 'chevron-down'} size={16} color={colors.blue} /></Pressable>
        {usePassword && <View style={x.passwordForm}><Field control={control} name="email" label="College email" keyboardType="email-address" error={errors.email?.message} /><Field control={control} name="password" label="Password" secureTextEntry error={errors.password?.message} />{busy ? <ActivityIndicator color={colors.blue} /> : <Button label="Sign in" onPress={password} />}</View>}
      </View>
      <View style={x.securityRow}><Ionicons name="shield-checkmark-outline" size={15} color={colors.green} /><Text style={x.security}>College accounts only · no SAIL or SkillRack passwords stored</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Field({ control, name, label, error, ...props }: { control: ReturnType<typeof useForm<Form>>['control']; name: keyof Form; label: string; error?: string; keyboardType?: 'email-address'; secureTextEntry?: boolean }) {
  return <View><Text style={x.label}>{label}</Text><Controller control={control} name={name} render={({ field }) => <TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} value={field.value} onChangeText={field.onChange} style={[x.input, error && x.inputError]} placeholder={label} placeholderTextColor="#8A97A3" {...props} />} />{error && <Text style={x.error}>{error}</Text>}</View>;
}

const x = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper }, content: { flexGrow: 1, padding: 24, justifyContent: 'center' }, brand: { marginBottom: 23 }, wordmark: { width: 226, height: 58, resizeMode: 'contain', marginLeft: -4, marginBottom: 17 },
  eyebrow: { color: colors.blue, fontSize: 10, letterSpacing: 1.5, fontWeight: '900' }, title: { color: colors.ink, fontSize: 33, lineHeight: 38, fontWeight: '900', marginTop: 7 }, subtitle: { color: colors.muted, lineHeight: 20, marginTop: 7, maxWidth: 340 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 14, borderWidth: 1, borderColor: colors.line }, cardTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' }, account: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: -6 }, accountStrong: { color: colors.ink, fontWeight: '800' },
  google: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, googleText: { color: colors.ink, fontWeight: '900', fontSize: 14 }, pressed: { opacity: 0.72 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 }, line: { flex: 1, height: 1, backgroundColor: colors.line }, or: { color: colors.muted, fontSize: 10, fontWeight: '800' }, fallback: { minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }, fallbackText: { color: colors.blue, fontWeight: '800', fontSize: 13 }, passwordForm: { gap: 13 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 6 }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink }, inputError: { borderColor: colors.coral }, error: { color: colors.coral, fontSize: 11, marginTop: 4 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }, security: { color: colors.muted, textAlign: 'center', fontSize: 10 },
});
