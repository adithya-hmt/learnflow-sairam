import { useQuery } from '@tanstack/react-query';
import { getAchievements, getAssignments, getAttendance, getCalendarEvents, getCourseProgress, getCourses, getCurrentProfile, getLesson, getLessons, getNotifications, getSocialPosts, queryKeys } from './index';

export const useProfile = () => useQuery({ queryKey: queryKeys.profile, queryFn: getCurrentProfile });
export const useCourses = () => useQuery({ queryKey: queryKeys.courses, queryFn: getCourses });
export const useLessons = (courseId: string) => useQuery({ queryKey: queryKeys.lessons(courseId), queryFn: () => getLessons(courseId), enabled: Boolean(courseId) });
export const useLesson = (id: string) => useQuery({ queryKey: queryKeys.lesson(id), queryFn: () => getLesson(id), enabled: Boolean(id) });
export const useAssignments = () => useQuery({ queryKey: queryKeys.assignments, queryFn: getAssignments });
export const useEvents = () => useQuery({ queryKey: queryKeys.events, queryFn: getCalendarEvents });
export const useNotifications = () => useQuery({ queryKey: queryKeys.notifications, queryFn: getNotifications });
export const useSocialPosts = () => useQuery({ queryKey: queryKeys.socialPosts, queryFn: getSocialPosts });
export const useAttendance = () => useQuery({ queryKey: queryKeys.attendance(), queryFn: () => getAttendance() });
export const useAchievements = () => useQuery({ queryKey: queryKeys.achievements(), queryFn: () => getAchievements() });
export const useCourseProgress = () => useQuery({ queryKey: queryKeys.progress, queryFn: getCourseProgress });
