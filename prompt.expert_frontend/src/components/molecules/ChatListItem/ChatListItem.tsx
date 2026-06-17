import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ChatResponse } from '../../../types/api.types';
import { useRenameChat, useDeleteChat } from '../../../hooks/useChats';
import { useChatStore } from '../../../store/chat.store';

interface ChatListItemProps {
  chat: ChatResponse;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { activeChatId, setActiveChatId } = useChatStore();
  const { mutate: renameChat } = useRenameChat();
  const { mutate: deleteChat } = useDeleteChat();

  const isActive = activeChatId === chat.chatId;

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  function handleRename() {
    setMenuOpen(false);
    setRenaming(true);
  }

  function commitRename() {
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== chat.title) {
      renameChat({ chatId: chat.chatId, payload: { title: trimmed } });
    }
    setRenaming(false);
  }

  function handleDelete() {
    setMenuOpen(false);
    deleteChat(chat.chatId);
    if (isActive) setActiveChatId(null);
  }

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150
        ${isActive
          ? 'bg-[var(--color-surface-3)] text-[var(--color-text-primary)] font-medium'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
        }`}
      onClick={() => !renaming && setActiveChatId(chat.chatId)}
    >
      {renaming ? (
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') { setNewTitle(chat.title); setRenaming(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none border-b border-[var(--color-border)] pb-0.5"
        />
      ) : (
        <span className="flex-1 text-sm truncate">{chat.title}</span>
      )}

      {/* Menu button — visible on hover or active */}
      <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          id={`chat-menu-${chat.chatId}`}
          aria-label="Opciones del chat"
          onClick={() => setMenuOpen((o) => !o)}
          className={`p-1 rounded-md transition-all duration-100
            ${menuOpen ? 'opacity-100 bg-[var(--color-surface-4)]' : 'opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-4)]'}
          `}
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Context menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-7 z-50 glass rounded-xl overflow-hidden min-w-[160px] shadow-xl"
            >
              <button
                onClick={handleRename}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Pencil size={13} />
                Renombrar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
