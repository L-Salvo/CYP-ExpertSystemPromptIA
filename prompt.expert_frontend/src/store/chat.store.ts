import { create } from 'zustand';
import type { EnrichPromptResponse } from '../types/api.types';

export type PipelineState =
  | 'idle'
  | 'enriching'       // Fase 1: POST /enrich en curso
  | 'awaiting_confirm' // Fase 1 completada, esperando que el usuario confirme Fase 2
  | 'sending'         // Fase 2: POST /send en curso
  | 'done'            // Pipeline completado
  | 'error';           // Error en cualquier fase

interface ChatStore {
  activeChatId: number | null;
  pipelineState: PipelineState;
  pendingMessage: EnrichPromptResponse | null; // resultado de Fase 1, usado para Fase 2
  pipelineError: string | null;

  setActiveChatId: (chatId: number | null) => void;
  setPipelineState: (state: PipelineState) => void;
  setPendingMessage: (msg: EnrichPromptResponse | null) => void;
  setPipelineError: (error: string | null) => void;
  resetPipeline: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeChatId: null,
  pipelineState: 'idle',
  pendingMessage: null,
  pipelineError: null,

  setActiveChatId: (chatId) =>
    set({ activeChatId: chatId, pipelineState: 'idle', pendingMessage: null, pipelineError: null }),

  setPipelineState: (state) => set({ pipelineState: state }),
  setPendingMessage: (msg) => set({ pendingMessage: msg }),
  setPipelineError: (error) => set({ pipelineError: error }),

  resetPipeline: () =>
    set({ pipelineState: 'idle', pendingMessage: null, pipelineError: null }),
}));
