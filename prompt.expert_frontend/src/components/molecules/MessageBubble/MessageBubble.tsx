import { motion } from 'framer-motion';
import { RotateCcw, User, Cpu } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { InferenceCard } from '../InferenceCard';
import { useRetryMessage } from '../../../hooks/useChat';
import type { MessageResponse } from '../../../types/api.types';

interface MessageBubbleProps {
  message: MessageResponse;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { mutate: retry, isPending: retrying } = useRetryMessage();

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
      className="flex flex-col gap-3"
    >
      {/* User message */}
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[75%] bg-white/08 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-white/85 leading-relaxed">{message.originalPrompt}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-white/60" />
        </div>
      </div>

      {/* Inference card — auto-collapsed since AI response exists */}
      <InferenceCard enrichData={enrichData} autoCollapsed={!!message.aiResponse} />

      {/* AI response */}
      {message.aiResponse && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white/06 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Cpu size={14} className="text-white/50" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="bg-white/04 border border-white/08 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                {message.aiResponse}
              </p>
            </div>
            <Button
              id={`retry-${message.messageId}`}
              variant="ghost"
              size="sm"
              loading={retrying}
              onClick={() => retry(message.messageId)}
              className="self-start text-white/30 hover:text-white/60"
            >
              <RotateCcw size={12} />
              Reintentar
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
