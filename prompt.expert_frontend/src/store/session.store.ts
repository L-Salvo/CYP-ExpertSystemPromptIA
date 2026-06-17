import { create } from 'zustand';
import type { LoginResponse } from '../types/api.types';

const SESSION_KEY = 'prompt_expert_session';
const USER_ID_KEY = 'userId'; // leído por el interceptor de axios (X-User-Id)

export interface SessionUser {
  userId: number;
  name: string;
  email: string;
  onboardingComplete: boolean;
}

interface SessionStore {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  setOnboardingComplete: (complete: boolean) => void;
}

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function persist(user: SessionUser | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(USER_ID_KEY, String(user.userId));
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }
}

const initial = loadSession();

export const useSessionStore = create<SessionStore>((set, get) => ({
  user: initial,
  isAuthenticated: initial !== null,

  login: (data) => {
    const user: SessionUser = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      onboardingComplete: data.onboardingComplete,
    };
    persist(user);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    persist(null);
    set({ user: null, isAuthenticated: false });
  },

  setOnboardingComplete: (complete) => {
    const current = get().user;
    if (!current) return;
    const user = { ...current, onboardingComplete: complete };
    persist(user);
    set({ user });
  },
}));
