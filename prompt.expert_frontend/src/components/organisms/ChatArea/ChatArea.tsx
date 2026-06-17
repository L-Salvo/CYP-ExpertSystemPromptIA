/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageBubble } from '../../molecules/MessageBubble';
import { MessageInput } from '../MessageInput';
import { Button } from '../../atoms/Button';
import { Skeleton } from '../../../shared/ui';
import { useChatStore } from '../../../store/chat.store';
import { useChatDetail, chatDetailKey } from '../../../hooks/useChat';
import { useCreateChat } from '../../../hooks/useChats';
import { enrichPrompt, sendMessage } from '../../../api/message.api';

export function ChatArea() {
  const {
    activeChatId,
    pipelineState,
    pendingMessage,
    pipelineError,
    resetPipeline,
    setActiveChatId,
    setPipelineState,
    setPendingMessage,
    setPipelineError,
  } = useChatStore();

  const qc = useQueryClient();
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [tempAiResponse, setTempAiResponse] = useState<string | null>(null);

  const { data: chatDetail, isLoading: isChatLoading } = useChatDetail(activeChatId);
  const { mutate: createChat, isPending: creatingChat } = useCreateChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { mutate: enrichAndSend } = useMutation({
    // pipelineState/pendingPrompt are already set by handleSubmit before this
    // mutation starts (see below) — doing it there too, instead of here, avoids
    // a render where activeChatId just changed but the pipeline still looks idle.
    mutationFn: async ({ chatId, prompt }: { chatId: number; prompt: string }) => {
      // Fase 1: Enriquecer prompt con Prolog
      const enrichData = await enrichPrompt(chatId, { prompt });
      setPendingMessage(enrichData);

      // Fase 2: Enviar prompt enriquecido a la IA
      setPipelineState('sending');
      const sendData = await sendMessage(enrichData.messageId);
      return sendData;
    },
    onSuccess: (data) => {
      setTempAiResponse(data.response);
      setPipelineState('done');
    },
    onError: (err: any) => {
      setPipelineError(err.message ?? 'Error en el procesamiento del mensaje');
      setPipelineState('error');
    },
  });

  const handleVirtualComplete = () => {
    if (activeChatId) {
      qc.invalidateQueries({ queryKey: chatDetailKey(activeChatId) }).then(() => {
        resetPipeline();
        setPendingPrompt(null);
        setTempAiResponse(null);
      });
    } else {
      resetPipeline();
      setPendingPrompt(null);
      setTempAiResponse(null);
    }
  };

  const messages = chatDetail?.messages ?? [];
  const noChatSelected = activeChatId === null;

  // The pending message only counts as "saved" once the persisted copy actually
  // has its AI response. Otherwise the intermediate fetch (enriched, aiResponse: null)
  // would hide the virtual turn before the response is revealed — the new-chat bug.
  const isPendingMessageSaved = pendingMessage
    ? messages.some((m) => m.messageId === pendingMessage.messageId && m.aiResponse !== null)
    : false;

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isPendingPromptSaved = lastMessage
    ? lastMessage.originalPrompt === pendingPrompt && lastMessage.aiResponse !== null
    : false;

  const isAlreadySaved = isPendingMessageSaved || isPendingPromptSaved;

  // Virtual message representing the active thought pipeline turn
  const virtualMsg = (pipelineState !== 'idle' && pendingPrompt && !isAlreadySaved) ? {
    messageId: pendingMessage?.messageId ?? -999,
    chatId: activeChatId || -1,
    originalPrompt: pendingPrompt,
    appliedInferences: pendingMessage?.appliedInferences ?? [],
    enrichedPrompt: pendingMessage?.enrichedPrompt ?? '',
    aiResponse: tempAiResponse,
    createdAt: new Date().toISOString(),
  } : null;

  // While the virtual turn is active, drop its persisted (still response-less) twin
  // from the list so they never collide on the same React key.
  const displayMessages = virtualMsg
    ? [...messages.filter((m) => m.messageId !== virtualMsg.messageId), virtualMsg]
    : messages;

  const prevChatIdRef = useRef<number | null>(activeChatId);

  // Scroll to bottom when chat switches
  useEffect(() => {
    if (activeChatId !== prevChatIdRef.current) {
      // Switched chat: scroll to bottom instantly
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      prevChatIdRef.current = activeChatId;
    }
  }, [activeChatId]);

  // Force scroll to bottom when a question starts processing (pipeline state active)
  useEffect(() => {
    if (pipelineState !== 'idle') {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'auto',
        });
      }
    }
  }, [pipelineState]);

  // Autoscroll as the container grows (e.g. during typewriter typing or thinking-step badges).
  // Read through a ref so this effect mounts once and never re-subscribes the observer.
  const pipelineStateRef = useRef(pipelineState);
  useEffect(() => {
    pipelineStateRef.current = pipelineState;
  }, [pipelineState]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const innerContainer = scrollContainer.firstElementChild;
    if (!innerContainer) return;

    let rafId: number | null = null;

    const resizeObserver = new ResizeObserver(() => {
      // Only auto-follow the bottom while a turn is actively being processed
      // (thinking steps growing, response typing). Once a turn is settled,
      // expanding/collapsing its "Proceso de pensamiento" card must never
      // move the viewport — the conversation stays exactly where it is.
      if (pipelineStateRef.current === 'idle') return;

      const threshold = 150; // px
      const isNearBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= threshold;
      if (!isNearBottom) return;

      // Coalesce rapid resize events (CSS expand transitions fire one per frame)
      // into a single smooth glide instead of stacking instant jumps.
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
        rafId = null;
      });
    });

    resizeObserver.observe(innerContainer);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  function handleSubmit(prompt: string) {
    // Scroll to bottom instantly on submit to ensure viewport is positioned at the end
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'auto',
      });
    }

    // Flip into "processing" synchronously, before the chat even exists. This
    // guarantees the virtual thinking turn is already showing by the time
    // activeChatId changes below — otherwise there's an in-between render
    // (chat just created, detail query loading, pipeline still idle) where the
    // view briefly resolves to loading/empty and remounts, causing a visible jump.
    setPipelineState('enriching');
    setPendingPrompt(prompt);
    setTempAiResponse(null);

    if (activeChatId) {
      enrichAndSend({ chatId: activeChatId, prompt });
    } else {
      createChat(
        { title: prompt.slice(0, 60) },
        {
          onSuccess: (newChat) => {
            setActiveChatId(newChat.chatId);
            // setActiveChatId resets pipelineState to 'idle' as a side effect
            // (meant to clear a stale pipeline when switching to a different
            // existing chat). Re-affirm 'enriching' right after, so this brand
            // new chat never has a render where the pipeline looks idle.
            setPipelineState('enriching');
            enrichAndSend({ chatId: newChat.chatId, prompt });
          },
          onError: (err: any) => {
            setPipelineError(err.message ?? 'Error al crear el chat');
            setPipelineState('error');
          }
        }
      );
    }
  }

  const busy = creatingChat || pipelineState === 'enriching' || pipelineState === 'sending';

  // Single source of truth for what fills the conversation area. Rendered through
  // one AnimatePresence so the states crossfade cleanly instead of popping/overlapping.
  //
  // The `pipelineState !== 'idle'` branch is a deliberate safety net: while a turn
  // is being processed (right after submit, even before the new chat/virtual
  // message has fully materialized) the loading skeleton must never be able to
  // show — only the thinking process and, eventually, the response.
  const view: 'welcome' | 'loading' | 'empty' | 'content' =
    noChatSelected ? 'welcome'
    : displayMessages.length > 0 || pipelineState !== 'idle' ? 'content'
    : isChatLoading && !busy ? 'loading'
    : 'empty';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Messages / Welcome area ───────────────────────────── */}
      {/* scrollbar-gutter reserves the scrollbar's space at all times, so it
          appearing/disappearing as the thinking-process card expands never
          shifts the content horizontally. */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-6 [scrollbar-gutter:stable]"
      >
        <div className="max-w-4xl mx-auto px-4 w-full flex flex-col gap-6">

          {/* Single conversation view — crossfades cleanly between states */}
          <AnimatePresence mode="wait">
            {view === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[60vh]"
              >
                <div className="w-16 h-16 rounded-2xl glow-neon-accent flex items-center justify-center mb-2">
                  <Sparkles size={26} className="text-[var(--color-aurora-1)]" />
                </div>
                <h1 className="text-4xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                  ¿En qué puedo ayudarte?
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed">
                  El sistema experto analizará tu perfil y enriquecerá tu consulta
                  con inferencias Prolog personalizadas.
                </p>
              </motion.div>
            )}

            {view === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-5 py-4">
                    <div className="flex justify-end pl-12">
                      <Skeleton shape="block" width="45%" height={40} className="rounded-2xl" />
                    </div>
                    <div className="flex items-start gap-4 pr-4">
                      <Skeleton shape="circle" width={32} height={32} />
                      <div className="flex-1 flex flex-col gap-2 pt-1">
                        <Skeleton shape="line" width="92%" />
                        <Skeleton shape="line" width="78%" />
                        <Skeleton shape="line" width="55%" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {view === 'empty' && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[60vh]"
              >
                <div className="w-12 h-12 rounded-xl glow-cyan flex items-center justify-center mb-2">
                  <Sparkles size={20} className="text-[var(--color-aurora-1)]" />
                </div>
                <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                  ¿En qué puedo ayudarte?
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-sm leading-relaxed">
                  Escribí tu consulta y el sistema experto la enriquecerá con tu perfil.
                </p>
              </motion.div>
            )}

            {view === 'content' && (
              <motion.div
                key={`content-${activeChatId ?? 'draft'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-6"
              >
                {displayMessages.map((msg) => (
                  <MessageBubble
                    key={msg.messageId}
                    message={msg}
                    isVirtual={msg.messageId === virtualMsg?.messageId}
                    onVirtualComplete={msg.messageId === virtualMsg?.messageId ? handleVirtualComplete : undefined}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error notifications */}
          <AnimatePresence>
            {pipelineState === 'error' && pipelineError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-4 py-2"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-error)]/10 border border-[var(--color-error)]/25 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={14} className="text-[var(--color-error)]" />
                </div>
                <div className="flex-1 flex flex-col gap-3 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3.5">
                  <p className="text-sm text-[var(--color-error)]">{pipelineError}</p>
                  <Button variant="danger" size="sm" onClick={resetPipeline} className="self-start">
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
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
