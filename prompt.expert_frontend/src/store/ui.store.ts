import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface UIStore {
  isSidebarOpen: boolean;
  isProfileDrawerOpen: boolean;
  isSkillsModalOpen: boolean;
  theme: Theme;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleProfileDrawer: () => void;
  toggleSkillsModal: () => void;
  closeAllPanels: () => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isSidebarOpen: true,
  isProfileDrawerOpen: false,
  isSkillsModalOpen: false,
  theme: (localStorage.getItem('theme') as Theme) || 'dark',

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleProfileDrawer: () => set((s) => ({ isProfileDrawerOpen: !s.isProfileDrawerOpen })),
  toggleSkillsModal: () => set((s) => ({ isSkillsModalOpen: !s.isSkillsModalOpen })),
  closeAllPanels: () =>
    set({ isProfileDrawerOpen: false, isSkillsModalOpen: false }),

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
