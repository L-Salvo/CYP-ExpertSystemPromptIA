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

// ── Auth & Onboarding (API_CONTRACT §3.bis) ──────────────────

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string; // texto plano — demo
}

export interface RegisterUserResponse {
  userId: number;
  onboardingComplete: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  name: string;
  email: string;
  onboardingComplete: boolean;
}

/** Skill seleccionada en el onboarding (skillId + nivel). */
export interface OnboardingSkill {
  skillId: number;
  level: number; // 1–10
}

export interface OnboardingRequest {
  educationLevel: EducationLevel;
  studyYear: number | null;
  worksInIT: boolean;
  skills: OnboardingSkill[]; // reemplaza por completo las existentes; mínimo 1
}

/** GET /api/users/{id} y respuesta de onboarding. Campos de perfil null antes del onboarding. */
export interface UserResponse {
  userId: number;
  name: string;
  email: string;
  educationLevel: EducationLevel | null;
  studyYear: number | null;
  worksInIT: boolean | null;
  onboardingComplete: boolean;
  skills: SkillResponse[];
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
