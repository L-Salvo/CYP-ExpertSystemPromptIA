import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PanelLeftClose, PanelLeft, User, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { SearchInput } from '../../molecules/SearchInput';
import { ChatListItem } from '../../molecules/ChatListItem';
import { useChats } from '../../../hooks/useChats';
import { Skeleton } from '../../../shared/ui';
import { useIsMobile } from '../../../shared/hooks';
import { useUIStore } from '../../../store/ui.store';
import { useChatStore } from '../../../store/chat.store';
import { useSessionStore } from '../../../store/session.store';

export function Sidebar() {
  const [search, setSearch] = useState('');
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, toggleProfileModal, theme, toggleTheme } = useUIStore();
  const { activeChatId, setActiveChatId } = useChatStore();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  function handleLogout() {
    setActiveChatId(null);
    logout();
  }
  const { data: chats = [], isLoading } = useChats();
  const isMobile = useIsMobile();

  // On mobile, close the overlay sidebar after picking a conversation.
  useEffect(() => {
    if (isMobile && activeChatId !== null) setSidebarOpen(false);
  }, [activeChatId, isMobile, setSidebarOpen]);

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // "Nueva conversación" abre un borrador (no persiste nada). El chat se crea
  // recién al enviar el primer mensaje (ver ChatArea.handleSubmit), de modo que
  // los chats iniciados pero nunca usados no quedan en la sidebar.
  function handleNewChat() {
    setActiveChatId(null);
    if (isMobile) setSidebarOpen(false);
  }

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
        className="fixed top-4 left-4 z-50 w-9 h-9 rounded-xl glass flex items-center justify-center
          text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all duration-150"
      >
        {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
      </button>

      {/* Mobile backdrop — closes the overlay sidebar on tap */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-[var(--color-scrim)] backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            className="fixed inset-y-0 left-0 z-40 w-[260px] flex flex-col glass border-r border-[var(--color-border)]"
          >
            {/* Header spacer for toggle button */}
            <div className="h-16" />

            {/* New conversation button */}
            <div className="px-3 pb-3">
              {/* variant="ghost" + solid surface bg instead of "glass": this button
                  already sits on the sidebar's own backdrop-blur, and stacking a
                  second backdrop-filter under the active:scale press caused a
                  one-frame flash where the rounded corners briefly render unclipped. */}
              <Button
                id="new-chat-btn"
                variant="ghost"
                size="md"
                onClick={handleNewChat}
                className="w-full justify-start gap-2.5 border border-[var(--color-border)] !bg-[var(--color-surface-2)] hover:!bg-[var(--color-surface-3)]"
              >
                <Plus size={15} />
                Nueva conversación
              </Button>
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
              <SearchInput value={search} onChange={setSearch} />
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5">
              {isLoading ? (
                <div className="flex flex-col gap-1 pt-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} shape="line" height={36} className="rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] text-center pt-8 px-4">
                  {search ? 'Sin resultados' : 'No hay conversaciones aún'}
                </p>
              ) : (
                filtered.map((chat) => (
                  <ChatListItem key={chat.chatId} chat={chat} />
                ))
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-3 border-t border-[var(--color-border)] flex flex-col gap-1">
              <Button
                id="theme-toggle-btn"
                variant="ghost"
                size="md"
                onClick={toggleTheme}
                className="w-full justify-start gap-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </Button>

              <Button
                id="profile-btn"
                variant="ghost"
                size="md"
                onClick={toggleProfileModal}
                className="w-full justify-start gap-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <User size={15} />
                Mi perfil
              </Button>

              {user && (
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-[var(--color-border)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] border border-[var(--color-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-primary)] flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user.email}</p>
                  </div>
                  <Button
                    id="logout-btn"
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                    className="flex-shrink-0 h-7 w-7"
                  >
                    <LogOut size={14} />
                  </Button>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
