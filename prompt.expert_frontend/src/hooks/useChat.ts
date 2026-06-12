import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatDetail } from '../api/chat.api';
import { enrichPrompt, sendMessage, retryMessage } from '../api/message.api';
import { useChatStore } from '../store/chat.store';
import type { EnrichPromptRequest } from '../types/api.types';

export const chatDetailKey = (chatId: number) => ['chats', chatId] as const;

/** Query: GET /api/chats/{chatId} */
export function useChatDetail(chatId: number | null) {
  return useQuery({
    queryKey: chatId ? chatDetailKey(chatId) : ['chats', 'none'],
    queryFn: () => getChatDetail(chatId!),
    enabled: chatId !== null,
    staleTime: 1000 * 10,
  });
}

/** Mutation: POST /api/chats/{chatId}/messages/enrich (Fase 1) */
export function useEnrichPrompt() {
  const { setPipelineState, setPendingMessage, setPipelineError } = useChatStore();
  return useMutation({
    mutationFn: ({ chatId, payload }: { chatId: number; payload: EnrichPromptRequest }) => {
      setPipelineState('enriching');
      return enrichPrompt(chatId, payload);
    },
    onSuccess: (data) => {
      setPendingMessage(data);
      setPipelineState('awaiting_confirm');
    },
    onError: (err: { message: string }) => {
      setPipelineError(err.message ?? 'Error al enriquecer el prompt');
      setPipelineState('error');
    },
  });
}

/** Mutation: POST /api/messages/{messageId}/send (Fase 2) */
export function useSendMessage() {
  const qc = useQueryClient();
  const { setPipelineState, setPipelineError, resetPipeline, activeChatId } = useChatStore();
  return useMutation({
    mutationFn: (messageId: number) => {
      setPipelineState('sending');
      return sendMessage(messageId);
    },
    onSuccess: () => {
      setPipelineState('done');
      if (activeChatId) {
        qc.invalidateQueries({ queryKey: chatDetailKey(activeChatId) });
      }
      // Small delay before resetting so the "done" state is visible
      setTimeout(resetPipeline, 500);
    },
    onError: (err: { message: string }) => {
      setPipelineError(err.message ?? 'Error al generar respuesta IA');
      setPipelineState('error');
    },
  });
}

/** Mutation: POST /api/messages/{messageId}/retry */
export function useRetryMessage() {
  const qc = useQueryClient();
  const { activeChatId } = useChatStore();
  return useMutation({
    mutationFn: (messageId: number) => retryMessage(messageId),
    onSuccess: () => {
      if (activeChatId) {
        qc.invalidateQueries({ queryKey: chatDetailKey(activeChatId) });
      }
    },
  });
}
