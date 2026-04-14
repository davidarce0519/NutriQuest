import { create } from 'zustand';
import { User } from '../../domain/models';

interface AuthState {
  user:        User | null;
  isLoading:   boolean;
  isHydrated:  boolean;
  setUser:     (user: User | null) => void;
  setLoading:  (v: boolean) => void;
  setHydrated: (v: boolean) => void;
  clear:       () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:       null,
  isLoading:  false,
  isHydrated: false,

  setUser:     (user) => set({ user }),
  setLoading:  (v)    => set({ isLoading: v }),
  setHydrated: (v)    => set({ isHydrated: v }),
  clear:       ()     => set({ user: null, isLoading: false }),
}));
