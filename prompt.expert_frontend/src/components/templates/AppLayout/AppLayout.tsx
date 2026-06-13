import { motion } from 'framer-motion';
import { useUIStore } from '../../../store/ui.store';
import { Sidebar } from '../../organisms/Sidebar';
import { ProfileDrawer } from '../../organisms/ProfileDrawer';
import { SkillsModal } from '../../organisms/SkillsModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-0)]">
      {/* Sidebar (fixed position, managed internally) */}
      <Sidebar />

      {/* Main content area — shifts right when sidebar is open */}
      <motion.main
        animate={{ marginLeft: isSidebarOpen ? '260px' : '0px' }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Top bar spacer for toggle button */}
        <div className="h-14 flex-shrink-0" />

        {/* Page content */}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </motion.main>

      {/* Global overlays */}
      <ProfileDrawer />
      <SkillsModal />
    </div>
  );
}

