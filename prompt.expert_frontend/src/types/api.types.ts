// ============================================================
// API Contract v1 — TypeScript Type Definitions
// Mapeado estrictamente desde API_CONTRACT.md
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type EducationLevel =
  | 'SECONDARY_STUDENT'
  | 'TERTIARY_STUDENT'
  | 'UNIVERSITY_STUDENT'
  | 'GRADUATED'
  | 'POSTGRADUATE';

// ── Profile ──────────────────────────────────────────────────

export interface SkillResponse {
  skillId: number;
  name: string;
  level: number; // 1–10
}

export interface SkillCatalogItem {
  skillId: number;
  name: string;
  category: string;
}

export interface ProfileResponse {
  userId: number;
  name: string;
  email: string;
  educationLevel: EducationLevel;
  studyYear: number | null;
  worksInIT: boolean;
  skills: SkillResponse[];
  createdAt: string; // ISO-8601
}

// ── Requests ─────────────────────────────────────────────────

export interface UpdateSkillLevelRequest {
  level: number; // 1–10
}

export interface CreateChatRequest {
  title: string;
}

export interface RenameChatRequest {
  title: string;
}

export interface EnrichPromptRequest {
  prompt: string;
}

// ── Chat ─────────────────────────────────────────────────────

export interface ChatResponse {
  chatId: number;
  title: string;
  messageCount: number;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface MessageResponse {
  messageId: number;
  chatId: number;
  originalPrompt: string;
  appliedInferences: string[];
  enrichedPrompt: string;
  aiResponse: string | null;
  createdAt: string; // ISO-8601
}

export interface ChatDetailResponse {
  chatId: number;
  title: string;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  messages: MessageResponse[];
}

// ── Expert System / AI ───────────────────────────────────────

export interface EnrichPromptResponse {
  messageId: number;
  chatId: number;
  originalPrompt: string;
  appliedInferences: string[];
  enrichedPrompt: string;
  aiResponse: null;
  createdAt: string; // ISO-8601
}

export interface SendMessageResponse {
  messageId: number;
  response: string;
}

// ── Error ─────────────────────────────────────────────────────

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string; // ISO-8601
}

// ── Rename response (PATCH /api/chats/{chatId}) ──────────────

export interface RenameChatResponse {
  chatId: number;
  title: string;
  updatedAt: string; // ISO-8601
}
