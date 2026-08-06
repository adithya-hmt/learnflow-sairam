import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, EmptyState, Pill, Screen, Section, s } from '@/components';
import { can, roleLabels } from '@/domain';
import { useProfile, useCourses } from '@/data/hooks';
import { queryKeys } from '@/data';
import { supabase } from '@/lib/supabase';
import { socialPostInput } from '@/lib/integrations';
import { colors } from '@/theme';

export default function Workspace() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: courses = [] } = useCourses();
  const [title, setTitle] = useState('');
  const role = profile?.role ?? 'student';
  const submit = async () => {
    if (!supabase || !profile) return Alert.alert('Demo mode', 'Connect Supabase and sign in to create live records.');
    try {
      if (can(role, 'publish_social') && !can(role, 'grade')) {
        const input = socialPostInput.parse({ text: title });
        const { data: club } = await supabase.from('clubs').select('id').eq('coordinator_id', profile.id).maybeSingle();
        if (!club) throw new Error('No club is assigned to this coordinator.');
        const { error } = await supabase.from('social_posts').insert({ author_id: profile.id, club_id: club.id, body: input.text, club_name: 'Campus club' });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: queryKeys.socialPosts });
      } else if (can(role, 'grade')) {
        const course = courses.find((item) => item.facultyId === profile.id) ?? courses[0];
        if (!course) throw new Error('Create or assign a course before adding work.');
        if (title.trim().length < 3) throw new Error('Enter an assignment title.');
        const { error } = await supabase.from('assignments').insert({ course_id: course.id, title: title.trim(), created_by: profile.id, instructions: 'Open LearnFlow for full instructions.' });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
      }
      setTitle(''); Alert.alert('Published', 'The new item is now available to its permitted audience.');
    } catch (error) { Alert.alert('Could not publish', error instanceof Error ? error.message : 'Please try again.'); }
  };

  if (role === 'student') return <Screen title="Student workspace"><EmptyState icon="school-outline" title="Learning is your workspace" text="Use Learn, Plan and Progress to manage your semester." /></Screen>;
  const label = can(role, 'publish_social') && !can(role, 'grade') ? 'Campus update' : can(role, 'grade') ? 'Assignment title' : 'Operational note';
  return <Screen title={roleLabels[role]} subtitle="Least-privilege tools for your assigned scope"><Card style={w.summary}><Pill text="RLS ENFORCED" tone="green" /><Text style={w.summaryTitle}>{can(role, 'manage_platform') ? 'Institution operations' : can(role, 'manage_department') ? `${profile?.department ?? 'Department'} operations` : can(role, 'mentor') ? 'Assigned mentees' : can(role, 'grade') ? 'Teaching and assessment' : 'Club publishing'}</Text><Text style={s.body}>The database rechecks your role, department, course ownership, club assignment, and student relationship for every operation.</Text></Card>
    {(can(role, 'grade') || can(role, 'publish_social')) && <Section title={can(role, 'publish_social') && !can(role, 'grade') ? 'Publish to Sairam Social' : 'Create learning work'}><Card><Text style={w.label}>{label}</Text><TextInput value={title} onChangeText={setTitle} placeholder={label} placeholderTextColor="#8A97A3" style={w.input} /><View style={{ marginTop: 12 }}><Button label="Publish" onPress={submit} /></View></Card></Section>}
    {can(role, 'mentor') && <Section title="Mentoring"><Card><Text style={w.summaryTitle}>Mentee access is assignment-based</Text><Text style={s.body}>Only active mentor relationships can expose student progress or attendance. Grades and roles remain read-only.</Text></Card></Section>}
  </Screen>;
}
const w = StyleSheet.create({ summary: { backgroundColor: colors.mint, borderColor: '#C6E2D8', gap: 9 }, summaryTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 6 }, input: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, borderRadius: 13, padding: 13, color: colors.ink } });
