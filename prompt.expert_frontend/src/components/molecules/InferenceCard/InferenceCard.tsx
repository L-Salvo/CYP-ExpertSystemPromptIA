import { useState } from 'react';
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
    <div className={`bg-transparent border-0 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-white/45 hover:text-white/70 transition-colors py-1 text-xs font-medium focus:outline-none cursor-pointer"
        aria-expanded={expanded}
        id={`inference-card-toggle-${enrichData.messageId}`}
      >
        <Brain size={13} className="text-cyan-500/80" />
        <span>Proceso de pensamiento (Prolog)</span>
        <span className="text-white/20">•</span>
        <span className="text-white/35 font-normal">
          {enrichData.appliedInferences.length} inferencias
        </span>
        <ChevronDown
          size={12}
          className={`text-white/30 ml-1 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Body — Smooth CSS Grid Height Transition */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-4 pb-2 pt-2 flex flex-col gap-3.5 border-l border-white/08 ml-1.5 mt-1">
            {/* Applied inferences */}
            {enrichData.appliedInferences.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Inferencias aplicadas</p>
                <div className="flex flex-wrap gap-1.5">
                  {enrichData.appliedInferences.map((inf) => (
                    <Badge key={inf} variant="inference">{inf}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Enriched prompt */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Prompt enriquecido</p>
              <div className="border-l border-white/10 pl-3 py-1 bg-transparent">
                <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap font-mono">
                  {enrichData.enrichedPrompt}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
