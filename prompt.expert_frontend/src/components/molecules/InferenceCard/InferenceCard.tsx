import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain } from 'lucide-react';
import { Badge } from '../../atoms/Badge';
import type { EnrichPromptResponse } from '../../../types/api.types';

interface InferenceCardProps {
  enrichData: EnrichPromptResponse;
  /** When true, card starts collapsed (AI response already arrived) */
  autoCollapsed?: boolean;
  className?: string;
}

export function InferenceCard({ enrichData, autoCollapsed = false, className = '' }: InferenceCardProps) {
  const [expanded, setExpanded] = useState(!autoCollapsed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-2xl border border-white/08 bg-white/03 overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/04 transition-colors"
        aria-expanded={expanded}
        id={`inference-card-toggle-${enrichData.messageId}`}
      >
        <div className="flex items-center gap-2.5 text-white/60">
          <Brain size={14} />
          <span className="text-xs font-medium">Sistema Experto</span>
          <span className="text-xs text-white/30">
            {enrichData.appliedInferences.length} inferencias
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-white/40" />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3 border-t border-white/06 pt-3">
              {/* Applied inferences */}
              <div>
                <p className="text-xs text-white/35 mb-2 uppercase tracking-widest">Inferencias</p>
                <div className="flex flex-wrap gap-1.5">
                  {enrichData.appliedInferences.map((inf) => (
                    <Badge key={inf} variant="inference">{inf}</Badge>
                  ))}
                </div>
              </div>

              {/* Enriched prompt */}
              <div>
                <p className="text-xs text-white/35 mb-2 uppercase tracking-widest">Prompt enriquecido</p>
                <div className="rounded-xl bg-black/40 border border-white/06 p-3">
                  <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {enrichData.enrichedPrompt}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
