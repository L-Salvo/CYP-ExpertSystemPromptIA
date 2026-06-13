import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Cpu, Brain } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { InferenceCard } from '../InferenceCard';
import { Badge } from '../../atoms/Badge';
import { useRetryMessage } from '../../../hooks/useChat';
import { useChatStore } from '../../../store/chat.store';
import type { MessageResponse } from '../../../types/api.types';

const animatedPrompts = new Set<string>();

function TypewriterText({ text, speed = 15, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const tokens = text.split(/(\s+)/);
    let currentIdx = 0;
    let currentStr = '';

    const interval = setInterval(() => {
      if (currentIdx >= tokens.length) {
        clearInterval(interval);
        onComplete?.();
        return;
      }
      currentStr += tokens[currentIdx];
      setDisplayedText(currentStr);
      currentIdx++;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <>{displayedText}</>;
}

interface MessageBubbleProps {
  message: MessageResponse;
  isVirtual?: boolean;
  onVirtualComplete?: () => void;
}

export function MessageBubble({ message, isVirtual = false, onVirtualComplete }: MessageBubbleProps) {
  const { mutate: retry, isPending: retrying } = useRetryMessage();
  const { pipelineState } = useChatStore();
  const [currentStepText, setCurrentStepText] = useState('');

  // Local states for coordinating the collapse and response display for virtual messages
  const [showDoneStatus, setShowDoneStatus] = useState(false);
  const [collapseThought, setCollapseThought] = useState(false);
  const [revealResponse, setRevealResponse] = useState(!isVirtual || !!message.aiResponse);

  // Animate word-by-word only if the message is fresh (created in the last 8 seconds)
  const isRecent = new Date().getTime() - new Date(message.createdAt).getTime() < 8000;
  const [shouldAnimate] = useState(isRecent && !animatedPrompts.has(message.originalPrompt));

  useEffect(() => {
    if (message.aiResponse && shouldAnimate) {
      animatedPrompts.add(message.originalPrompt);
    }
  }, [message.aiResponse, message.originalPrompt, shouldAnimate]);

  // Effect to detect AI response and trigger the smooth transition sequences
  useEffect(() => {
    if (isVirtual && message.aiResponse && !revealResponse) {
      setTimeout(() => {
        setShowDoneStatus(true);
      }, 0);

      const collapseTimer = setTimeout(() => {
        setCollapseThought(true);
      }, 1500);

      const revealTimer = setTimeout(() => {
        setRevealResponse(true);
      }, 1850);

      return () => {
        clearTimeout(collapseTimer);
        clearTimeout(revealTimer);
      };
    }
  }, [isVirtual, message.aiResponse, revealResponse]);

  // Trigger completion immediately if typewriter animation is not used
  useEffect(() => {
    if (isVirtual && revealResponse && !shouldAnimate) {
      const timer = setTimeout(() => {
        onVirtualComplete?.();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isVirtual, revealResponse, shouldAnimate, onVirtualComplete]);

  // Step cycler for the virtual thought process loading status
  useEffect(() => {
    if (!isVirtual || revealResponse) return;
    
    let interval: ReturnType<typeof setInterval> | undefined;
    if (pipelineState === 'enriching') {
      const steps = [
        'Consultando base de datos PostgreSQL...',
        'Evaluando reglas lógicas en SWI-Prolog...',
        'Analizando perfil técnico y nivel de conocimiento...',
        'Identificando dependencias y tecnologías...',
        'Enriqueciendo prompt original con inferencias...'
      ];
      let idx = 0;
      setTimeout(() => {
        setCurrentStepText(steps[0]);
      }, 0);
      interval = setInterval(() => {
        idx = (idx + 1) % steps.length;
        setCurrentStepText(steps[idx]);
      }, 6000);
    } else if (pipelineState === 'sending') {
      const steps = [
        'Conectando con modelo de IA...',
        'Enviando prompt enriquecido...',
        'Procesando respuesta adaptada...',
        'Persistiendo respuesta final...'
      ];
      let idx = 0;
      setTimeout(() => {
        setCurrentStepText(steps[0]);
      }, 0);
      interval = setInterval(() => {
        idx = (idx + 1) % steps.length;
        setCurrentStepText(steps[idx]);
      }, 6000);
    } else {
      setTimeout(() => {
        setCurrentStepText('');
      }, 0);
    }
    return () => clearInterval(interval);
  }, [isVirtual, revealResponse, pipelineState]);

  // Build a synthetic EnrichPromptResponse for InferenceCard
  const enrichData = {
    messageId: message.messageId,
    chatId: message.chatId,
    originalPrompt: message.originalPrompt,
    appliedInferences: message.appliedInferences,
    enrichedPrompt: message.enrichedPrompt,
    aiResponse: null as null,
    createdAt: message.createdAt,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-5 py-4"
    >
      {/* User message turn */}
      <div className="flex justify-end pl-12">
        <div className="max-w-[75%] bg-white/06 text-white/95 rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-[15px] leading-relaxed">{message.originalPrompt}</p>
        </div>
      </div>

      {/* Assistant message turn */}
      <div className="flex items-start gap-4 pr-4">
        {/* Modern Sparkles/CPU Avatar */}
        <div className="w-8 h-8 rounded-full bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-cyan-500/05">
          <Cpu size={14} className="text-cyan-400" />
        </div>

        {/* Content Column */}
        <motion.div layout className="flex-1 flex flex-col gap-4 min-w-0">
          <AnimatePresence mode="popLayout">
            {isVirtual && !revealResponse ? (
              <motion.div
                key="thought-loader"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3 w-full"
              >
                {/* Dynamic thought process loader inside the assistant turn */}
                <div className="flex items-center gap-2 text-white/45 text-xs font-medium py-1">
                  <Brain size={13} className="text-cyan-500/80 animate-pulse" />
                  <span>Proceso de pensamiento (Prolog)</span>
                  {message.appliedInferences.length > 0 && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-white/35 font-normal">
                        {message.appliedInferences.length} inferencias
                      </span>
                    </>
                  )}
                </div>

                <motion.div
                  initial={{ height: 'auto', opacity: 1 }}
                  animate={{
                    height: collapseThought ? 0 : 'auto',
                    opacity: collapseThought ? 0 : 1,
                  }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="overflow-hidden pl-4 pb-2 pt-1 flex flex-col gap-3.5 border-l border-white/08 ml-1.5 mt-0.5"
                >
                  {showDoneStatus || pipelineState === 'done' ? (
                    <div className="flex items-center gap-2.5 min-h-[22px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 shadow-sm shadow-green-500/25" />
                      <span className="text-xs text-green-400/90 font-mono font-medium animate-pulse">
                        ✓ Procesamiento finalizado con éxito.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 min-h-[22px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentStepText}
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -3 }}
                          transition={{ duration: 0.25 }}
                          className="text-xs text-white/45 font-mono"
                        >
                          {currentStepText}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}

                  {message.appliedInferences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.appliedInferences.map((inf) => (
                        <Badge key={inf} variant="inference">{inf}</Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="response-content"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-4"
              >
                {/* Inference card — auto-collapsed since AI response exists */}
                <InferenceCard enrichData={enrichData} autoCollapsed={true} className="max-w-2xl" />

                 {/* AI response text */}
                {message.aiResponse && (
                  <div className="flex flex-col gap-3">
                    <div className="text-[15px] text-white/90 leading-relaxed whitespace-pre-wrap">
                      {shouldAnimate && isVirtual ? (
                        <TypewriterText text={message.aiResponse} onComplete={onVirtualComplete} />
                      ) : (
                        message.aiResponse
                      )}
                    </div>
                    <motion.div
                      initial={isRecent ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      {!isVirtual && (
                        <Button
                          id={`retry-${message.messageId}`}
                          variant="ghost"
                          size="sm"
                          loading={retrying}
                          onClick={() => retry(message.messageId)}
                          className="self-start text-white/30 hover:text-white/60 hover:bg-white/05 px-2 py-1 h-auto gap-1.5 transition-all mt-1"
                        >
                          <RotateCcw size={12} />
                          <span className="text-xs">Reintentar</span>
                        </Button>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
