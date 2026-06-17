import { motion } from 'framer-motion';
import { useUIStore } from '../../../store/ui.store';
import { useIsMobile } from '../../../shared/hooks';
import { Sidebar } from '../../organisms/Sidebar';
import { ProfileModal } from '../../organisms/ProfileModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen } = useUIStore();
  const isMobile = useIsMobile();

  // On mobile the sidebar floats over the content (no horizontal push).
  const contentShift = isSidebarOpen && !isMobile ? '260px' : '0px';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-0)]">
      {/* Sidebar (fixed position, managed internally) */}
      <Sidebar />

      {/* Main content area — shifts right when sidebar is open (desktop only) */}
      <motion.main
        animate={{ marginLeft: contentShift }}
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
      <ProfileModal />
    </div>
  );
}

