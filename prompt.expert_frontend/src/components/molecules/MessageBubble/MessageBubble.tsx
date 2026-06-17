import { useState, useEffect } from 'react';
import { Cpu, Brain } from 'lucide-react';
import { InferenceCard } from '../InferenceCard';
import { Badge } from '../../atoms/Badge';
import { useChatStore } from '../../../store/chat.store';
import { THINKING_STEP_DURATION_MS, RESPONSE_TYPEWRITER_SPEED_MS } from '../../../config/chat.config';
import type { MessageResponse } from '../../../types/api.types';

const animatedPrompts = new Set<string>();

function TypewriterText({ text, speed = RESPONSE_TYPEWRITER_SPEED_MS, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
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
  const { pipelineState } = useChatStore();
  const [currentStepText, setCurrentStepText] = useState('');

  // Local state for coordinating the response display for virtual messages
  const [revealResponse, setRevealResponse] = useState(!isVirtual || !!message.aiResponse);

  // Animate word-by-word only if the message is fresh (created in the last 8 seconds)
  const isRecent = new Date().getTime() - new Date(message.createdAt).getTime() < 8000;
  const [shouldAnimate] = useState(isRecent && !animatedPrompts.has(message.originalPrompt));

  useEffect(() => {
    if (message.aiResponse && shouldAnimate) {
      animatedPrompts.add(message.originalPrompt);
    }
  }, [message.aiResponse, message.originalPrompt, shouldAnimate]);

  // Effect to detect AI response and trigger immediate display
  useEffect(() => {
    if (isVirtual && message.aiResponse && !revealResponse) {
      setRevealResponse(true);
    }
  }, [isVirtual, message.aiResponse, revealResponse]);

  // Trigger completion immediately if typewriter animation is not used
  useEffect(() => {
    if (isVirtual && revealResponse && !shouldAnimate) {
      onVirtualComplete?.();
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
      setCurrentStepText(steps[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % steps.length;
        setCurrentStepText(steps[idx]);
      }, THINKING_STEP_DURATION_MS);
    } else if (pipelineState === 'sending') {
      const steps = [
        'Conectando con modelo de IA...',
        'Enviando prompt enriquecido...',
        'Procesando respuesta adaptada...',
        'Persistiendo respuesta final...'
      ];
      let idx = 0;
      setCurrentStepText(steps[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % steps.length;
        setCurrentStepText(steps[idx]);
      }, THINKING_STEP_DURATION_MS);
    } else {
      setCurrentStepText('');
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
    <div className="flex flex-col gap-5 py-4">
      {/* User message turn */}
      <div className="flex justify-end pl-12">
        <div className="max-w-[75%] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-[15px] leading-relaxed">{message.originalPrompt}</p>
        </div>
      </div>

      {/* Assistant message turn */}
      <div className="flex items-start gap-4 pr-4">
        {/* Modern Sparkles/CPU Avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--color-aurora-1)]/10 border border-[var(--color-aurora-1)]/25 flex items-center justify-center flex-shrink-0">
          <Cpu size={14} className="text-[var(--color-aurora-1)]" />
        </div>

        {/* Content Column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {isVirtual && !revealResponse ? (
            <div className="flex flex-col gap-3 w-full">
              {/* Dynamic thought process loader inside the assistant turn */}
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-xs font-medium py-1">
                <Brain size={13} className="text-[var(--color-aurora-1)] animate-pulse" />
                <span>Proceso de pensamiento (Prolog)</span>
                {message.appliedInferences.length > 0 && (
                  <>
                    <span className="text-[var(--color-text-muted)]">•</span>
                    <span className="text-[var(--color-text-muted)] font-normal">
                      {message.appliedInferences.length} inferencias
                    </span>
                  </>
                )}
              </div>

              <div className="pl-4 pb-2 pt-1 flex flex-col gap-3.5 border-l border-[var(--color-border)] ml-1.5 mt-0.5">
                <div className="flex items-center gap-2.5 min-h-[22px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-1)] animate-ping flex-shrink-0" />
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {currentStepText}
                  </span>
                </div>

                {message.appliedInferences.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {message.appliedInferences.map((inf) => (
                      <Badge key={inf} variant="inference">{inf}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Inference card — auto-collapsed since AI response exists */}
              <InferenceCard enrichData={enrichData} autoCollapsed={true} className="max-w-2xl" />

              {/* AI response text */}
              {message.aiResponse && (
                <div className="flex flex-col gap-3">
                  <div className="text-[15px] text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                    {shouldAnimate && isVirtual ? (
                      <TypewriterText text={message.aiResponse} onComplete={onVirtualComplete} />
                    ) : (
                      message.aiResponse
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
