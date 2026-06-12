import client from './client';
import type {
  EnrichPromptRequest,
  EnrichPromptResponse,
  SendMessageResponse,
} from '../types/api.types';

/** POST /api/chats/{chatId}/messages/enrich — Fase 1: Enriquecer prompt con inferencias Prolog */
export async function enrichPrompt(
  chatId: number,
  payload: EnrichPromptRequest
): Promise<EnrichPromptResponse> {
  const { data } = await client.post<EnrichPromptResponse>(
    `/chats/${chatId}/messages/enrich`,
    payload
  );
  return data;
}

/** POST /api/messages/{messageId}/send — Fase 2: Enviar prompt enriquecido a la IA */
export async function sendMessage(messageId: number): Promise<SendMessageResponse> {
  const { data } = await client.post<SendMessageResponse>(`/messages/${messageId}/send`);
  return data;
}

/** POST /api/messages/{messageId}/retry — Reintentar generación de respuesta IA */
export async function retryMessage(messageId: number): Promise<SendMessageResponse> {
  const { data } = await client.post<SendMessageResponse>(`/messages/${messageId}/retry`);
  return data;
}
