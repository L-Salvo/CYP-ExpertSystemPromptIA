import client from './client';
import type {
  ChatResponse,
  ChatDetailResponse,
  CreateChatRequest,
  RenameChatRequest,
  RenameChatResponse,
} from '../types/api.types';

/** GET /api/chats — Listar todos los chats del usuario */
export async function getChats(): Promise<ChatResponse[]> {
  const { data } = await client.get<ChatResponse[]>('/chats');
  return data;
}

/** POST /api/chats — Crear un nuevo chat */
export async function createChat(payload: CreateChatRequest): Promise<ChatResponse> {
  const { data } = await client.post<ChatResponse>('/chats', payload);
  return data;
}

/** GET /api/chats/{chatId} — Obtener chat completo con mensajes */
export async function getChatDetail(chatId: number): Promise<ChatDetailResponse> {
  const { data } = await client.get<ChatDetailResponse>(`/chats/${chatId}`);
  return data;
}

/** PATCH /api/chats/{chatId} — Renombrar un chat */
export async function renameChat(
  chatId: number,
  payload: RenameChatRequest
): Promise<RenameChatResponse> {
  const { data } = await client.patch<RenameChatResponse>(`/chats/${chatId}`, payload);
  return data;
}

/** DELETE /api/chats/{chatId} — Eliminar un chat y sus mensajes */
export async function deleteChat(chatId: number): Promise<void> {
  await client.delete(`/chats/${chatId}`);
}
