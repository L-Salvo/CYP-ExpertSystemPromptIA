import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PanelLeftClose, PanelLeft, User, Sun, Moon } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { SearchInput } from '../../molecules/SearchInput';
import { ChatListItem } from '../../molecules/ChatListItem';
import { useChats, useCreateChat } from '../../../hooks/useChats';
import { useUIStore } from '../../../store/ui.store';
import { useChatStore } from '../../../store/chat.store';

export function Sidebar() {
  const [search, setSearch] = useState('');
  const { isSidebarOpen, toggleSidebar, toggleProfileDrawer, theme, toggleTheme } = useUIStore();
  const { setActiveChatId } = useChatStore();
  const { data: chats = [], isLoading } = useChats();
  const { mutate: createChat, isPending: creating } = useCreateChat();

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleNewChat() {
    createChat(
      { title: 'Nueva conversación' },
      { onSuccess: (newChat) => setActiveChatId(newChat.chatId) }
    );
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
              <Button
                id="new-chat-btn"
                variant="glass"
                size="md"
                loading={creating}
                onClick={handleNewChat}
                className="w-full justify-start gap-2.5 border border-[var(--color-border)]"
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
                <div className="flex justify-center pt-8">
                  <span className="text-xs text-[var(--color-text-muted)] animate-pulse">Cargando...</span>
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
                onClick={toggleProfileDrawer}
                className="w-full justify-start gap-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <User size={15} />
                Mi perfil
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
