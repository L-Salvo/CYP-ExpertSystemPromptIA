/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageBubble } from '../../molecules/MessageBubble';
import { MessageInput } from '../MessageInput';
import { Button } from '../../atoms/Button';
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

  const { data: chatDetail } = useChatDetail(activeChatId);
  const { mutate: createChat, isPending: creatingChat } = useCreateChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { mutate: enrichAndSend } = useMutation({
    mutationFn: async ({ chatId, prompt }: { chatId: number; prompt: string }) => {
      setPipelineState('enriching');
      setPendingPrompt(prompt);
      setTempAiResponse(null);
      
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
  const hasMessages = messages.length > 0 || pipelineState !== 'idle';
  const noChatSelected = activeChatId === null;

  // Find if the pending message has already been saved as a message in the chat detail
  const isPendingMessageSaved = pendingMessage
    ? messages.some((m) => m.messageId === pendingMessage.messageId)
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

  // Autoscroll as the container grows (e.g. during typewriter typing or message additions)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const innerContainer = scrollContainer.firstElementChild;
    if (!innerContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      const threshold = 150; // px
      const isNearBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= threshold;

      if (isNearBottom) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'auto',
        });
      }
    });

    resizeObserver.observe(innerContainer);

    return () => {
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

    if (activeChatId) {
      enrichAndSend({ chatId: activeChatId, prompt });
    } else {
      createChat(
        { title: prompt.slice(0, 60) },
        {
          onSuccess: (newChat) => {
            setActiveChatId(newChat.chatId);
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Messages / Welcome area ───────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden py-6">
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

          {/* Messages list including active virtual message in a single array to allow React reconciliation */}
          {[...messages, ...(virtualMsg ? [virtualMsg] : [])].map((msg) => (
            <MessageBubble
              key={msg.messageId}
              message={msg}
              isVirtual={msg.messageId === virtualMsg?.messageId}
              onVirtualComplete={msg.messageId === virtualMsg?.messageId ? handleVirtualComplete : undefined}
            />
          ))}

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
                <div className="w-8 h-8 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={14} className="text-red-400" />
                </div>
                <div className="flex-1 flex flex-col gap-3 rounded-xl border border-red-500/15 bg-red-500/05 px-4 py-3.5">
                  <p className="text-sm text-red-300">{pipelineError}</p>
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
          <p className="text-center text-xs text-white/20 mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
