import { create } from 'zustand';
import type { Role } from './domain';

type AppState = { role: Role; online: boolean; setRole: (role: Role) => void; setOnline: (online: boolean) => void };
export const useAppStore = create<AppState>((set) => ({
  role: 'student', online: true, setRole: (role) => set({ role }), setOnline: (online) => set({ online }),
}));
