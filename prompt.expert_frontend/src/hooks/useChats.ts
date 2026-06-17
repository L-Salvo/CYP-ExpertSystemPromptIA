import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChats, createChat, renameChat, deleteChat } from '../api/chat.api';
import { toast } from '../shared/ui';
import type { CreateChatRequest, RenameChatRequest } from '../types/api.types';

export const CHATS_KEY = ['chats'] as const;

/** Query: GET /api/chats */
export function useChats() {
  return useQuery({
    queryKey: CHATS_KEY,
    queryFn: getChats,
    staleTime: 1000 * 30, // 30 s
  });
}

/** Mutation: POST /api/chats */
export function useCreateChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatRequest) => createChat(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHATS_KEY });
    },
  });
}

/** Mutation: PATCH /api/chats/{chatId} */
export function useRenameChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, payload }: { chatId: number; payload: RenameChatRequest }) =>
      renameChat(chatId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHATS_KEY });
      toast.success('Conversación renombrada');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'No se pudo renombrar la conversación');
    },
  });
}

/** Mutation: DELETE /api/chats/{chatId} */
export function useDeleteChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: number) => deleteChat(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHATS_KEY });
      toast.success('Conversación eliminada');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'No se pudo eliminar la conversación');
    },
  });
}
