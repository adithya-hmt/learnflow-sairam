import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, ScrollView, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, shadow } from './theme';

export function Screen({ children, title, subtitle, action }: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode }>) {
  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.eyebrow}>SRI SAIRAM · LEARNFLOW</Text><Text style={s.title}>{title}</Text>{subtitle && <Text style={s.subtitle}>{subtitle}</Text>}</View>{action}</View>
    {children}
  </ScrollView></SafeAreaView>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[s.card, style]}>{children}</View>; }
export function Section({ title, action, onAction, children }: PropsWithChildren<{ title: string; action?: string; onAction?: () => void }>) { return <View style={s.section}><View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{action && (onAction ? <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}><Text style={s.link}>{action}</Text></Pressable> : <Text style={s.link}>{action}</Text>)}</View>{children}</View>; }
export function Pill({ text, tone = 'blue' }: { text: string; tone?: 'blue' | 'green' | 'gold' | 'coral' }) { return <View style={[s.pill, s[`${tone}Pill`]]}><Text style={[s.pillText, s[`${tone}Text`]]}>{text}</Text></View>; }
export function Progress({ value, color = colors.blue }: { value: number; color?: string }) { return <View style={s.track}><View style={[s.fill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>; }
export function Button({ label, onPress, secondary = false }: { label: string; onPress?: () => void; secondary?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[s.button, secondary && s.buttonSecondary]}><Text style={[s.buttonText, secondary && { color: colors.navy }]}>{label}</Text></Pressable>; }
export function EmptyState({ icon, image, title, text }: { icon?: ComponentProps<typeof Ionicons>['name']; image?: ImageSourcePropType; title: string; text: string }) { return <Card style={{ alignItems: 'center' }}>{image ? <Image accessibilityLabel={`${title}. ${text}`} source={image} style={s.emptyImage} /> : <><View style={s.emptyIcon}><Ionicons name={icon || 'checkmark-circle-outline'} size={28} color={colors.blue} /></View><Text style={s.emptyTitle}>{title}</Text><Text style={[s.body, { textAlign: 'center' }]}>{text}</Text></>}</Card>; }

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, screen: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }, eyebrow: { color: colors.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1.25, marginBottom: 7 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 5, lineHeight: 20 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 17, borderWidth: 1, borderColor: colors.line, ...shadow },
  section: { gap: 11, marginTop: 17 }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 }, link: { fontSize: 13, fontWeight: '700', color: colors.blue },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 }, row: { flexDirection: 'row', alignItems: 'center' }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' }, pillText: { fontSize: 11, fontWeight: '800' }, bluePill: { backgroundColor: colors.sky }, blueText: { color: colors.blue }, greenPill: { backgroundColor: colors.mint }, greenText: { color: colors.green }, goldPill: { backgroundColor: '#F9ECCB' }, goldText: { color: '#8D650E' }, coralPill: { backgroundColor: '#F8E3DF' }, coralText: { color: colors.coral },
  track: { height: 7, backgroundColor: '#E9EFED', borderRadius: 99, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 99 },
  button: { minHeight: 48, backgroundColor: colors.blue, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' }, buttonSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, buttonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, emptyImage: { width: '100%', height: 310, resizeMode: 'contain' }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 4 },
});
