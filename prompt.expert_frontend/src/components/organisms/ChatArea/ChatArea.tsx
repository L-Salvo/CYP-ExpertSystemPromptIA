import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, AlertCircle } from 'lucide-react';
import { MessageBubble } from '../../molecules/MessageBubble';
import { InferenceCard } from '../../molecules/InferenceCard';
import { MessageInput } from '../MessageInput';
import { Spinner } from '../../atoms/Spinner';
import { Button } from '../../atoms/Button';
import { useChatStore } from '../../../store/chat.store';
import { useEnrichPrompt, useSendMessage, useChatDetail } from '../../../hooks/useChat';
import { useCreateChat } from '../../../hooks/useChats';

export function ChatArea() {
  const { activeChatId, pipelineState, pendingMessage, pipelineError, resetPipeline, setActiveChatId } =
    useChatStore();
  const { data: chatDetail } = useChatDetail(activeChatId);
  const { mutate: enrich } = useEnrichPrompt();
  const { mutate: send, isPending: sending } = useSendMessage();
  const { mutate: createChat, isPending: creatingChat } = useCreateChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = chatDetail?.messages ?? [];
  const hasMessages = messages.length > 0 || pipelineState !== 'idle';
  const noChatSelected = activeChatId === null;

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pipelineState]);

  function handleSubmit(prompt: string) {
    if (activeChatId) {
      // Chat ya existe — enriquecer directamente
      enrich({ chatId: activeChatId, payload: { prompt } });
    } else {
      // No hay chat activo — crear uno primero y luego enriquecer
      createChat(
        { title: prompt.slice(0, 60) },
        {
          onSuccess: (newChat) => {
            setActiveChatId(newChat.chatId);
            enrich({ chatId: newChat.chatId, payload: { prompt } });
          },
        }
      );
    }
  }

  function handleSend() {
    if (!pendingMessage) return;
    send(pendingMessage.messageId);
  }

  const busy = creatingChat || pipelineState === 'enriching' || pipelineState === 'sending';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Messages / Welcome area ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-4xl mx-auto px-4 w-full flex flex-col gap-6">

          {/* Welcome state — visible when no chat is selected */}
          <AnimatePresence>
            {noChatSelected && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[60vh]"
              >
                <div className="w-16 h-16 rounded-2xl glow-neon-accent flex items-center justify-center mb-2">
                  <Sparkles size={26} className="text-cyan-400" />
                </div>
                <h1 className="text-4xl font-semibold text-white/90 tracking-tight">
                  ¿En qué puedo ayudarte?
                </h1>
                <p className="text-sm text-white/45 max-w-md leading-relaxed">
                  El sistema experto analizará tu perfil y enriquecerá tu consulta
                  con inferencias Prolog personalizadas.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state — visible when chat exists but has no messages */}
          <AnimatePresence>
            {!noChatSelected && !hasMessages && (
              <motion.div
                key="empty"
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[60vh]"
              >
                <div className="w-12 h-12 rounded-xl glow-cyan flex items-center justify-center mb-2">
                  <Sparkles size={20} className="text-cyan-400" />
                </div>
                <h2 className="text-3xl font-semibold text-white/80 tracking-tight">
                  ¿En qué puedo ayudarte?
                </h2>
                <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                  Escribí tu consulta y el sistema experto la enriquecerá con tu perfil.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persisted messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.messageId} message={msg} />
          ))}

          {/* Pipeline: Phase 1 — Enriching */}
          <AnimatePresence>
            {pipelineState === 'enriching' && (
              <motion.div
                key="enriching"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-end">
                  <div className="bg-white/08 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
                    <span className="text-sm text-white/40 italic">Analizando...</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/08 bg-white/03 px-4 py-4 glow-pulse">
                  <Spinner label="Sistema Experto pensando... consultando Prolog" />
                </div>
              </motion.div>
            )}

            {/* Pipeline: Phase 1 done — awaiting user confirm for Phase 2 */}
            {pipelineState === 'awaiting_confirm' && pendingMessage && (
              <motion.div
                key="awaiting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <InferenceCard enrichData={pendingMessage} autoCollapsed={false} className="glow-purple border-purple-500/30" />
                <div className="flex items-center gap-3">
                  <Button
                    id="send-to-ai-btn"
                    variant="primary"
                    size="md"
                    onClick={handleSend}
                    loading={sending}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-500/20 border-0"
                  >
                    <Send size={14} />
                    Enviar a la IA
                  </Button>
                  <Button
                    id="cancel-send-btn"
                    variant="ghost"
                    size="md"
                    onClick={resetPipeline}
                  >
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Pipeline: Phase 2 — Sending to AI */}
            {pipelineState === 'sending' && (
              <motion.div
                key="sending"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/08 bg-white/03 px-4 py-4 glow-pulse"
              >
                <Spinner label="Generando respuesta de IA..." />
              </motion.div>
            )}

            {/* Pipeline: Error */}
            {pipelineState === 'error' && pipelineError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/06 px-4 py-3"
              >
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-300">{pipelineError}</p>
                  <Button variant="danger" size="sm" onClick={resetPipeline}>
                    Descartar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area — ALWAYS visible ───────────────────────── */}
      <div className="pb-6 pt-2 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 w-full">
          <MessageInput onSubmit={handleSubmit} forceBusy={busy} />
          <p className="text-center text-xs text-white/20 mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
