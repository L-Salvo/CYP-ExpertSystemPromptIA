import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface UIStore {
  isSidebarOpen: boolean;
  isProfileModalOpen: boolean;
  theme: Theme;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleProfileModal: () => void;
  setProfileModalOpen: (open: boolean) => void;
  closeAllPanels: () => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

// On small screens the sidebar starts collapsed (it overlays content there).
const initialSidebarOpen =
  typeof window === 'undefined' ? true : window.innerWidth >= 768;

export const useUIStore = create<UIStore>((set, get) => ({
  isSidebarOpen: initialSidebarOpen,
  isProfileModalOpen: false,
  theme: (localStorage.getItem('theme') as Theme) || 'dark',

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleProfileModal: () => set((s) => ({ isProfileModalOpen: !s.isProfileModalOpen })),
  setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  closeAllPanels: () =>
    set({ isProfileModalOpen: false }),

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    set({ theme: nextTheme });
    get().initializeTheme();
  },

  initializeTheme: () => {
    const activeTheme = get().theme;
    if (activeTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  },
}));

// Run initialization immediately on load
useUIStore.getState().initializeTheme();
