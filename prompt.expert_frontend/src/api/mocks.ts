/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  ProfileResponse,
  SkillCatalogItem,
  ChatResponse,
  ChatDetailResponse,
  MessageResponse,
  EnrichPromptResponse,
  SendMessageResponse,
  RenameChatResponse,
  SkillResponse,
  EducationLevel,
  RegisterUserResponse,
  LoginResponse,
  UserResponse,
} from '../types/api.types';

// ============================================================
// Base de Datos Simulada en LocalStorage
// ============================================================

const STORAGE_KEY = 'prompt_expert_mock_db_v2';

interface MockUser {
  userId: number;
  name: string;
  email: string;
  password: string; // texto plano — demo
  educationLevel: EducationLevel | null;
  studyYear: number | null;
  worksInIT: boolean | null;
  skills: SkillResponse[];
  createdAt: string;
}

interface MockDB {
  users: MockUser[];
  skillsCatalog: SkillCatalogItem[];
  chats: ChatResponse[];
  messages: Record<number, MessageResponse[]>;
}

const DEFAULT_CATALOG: SkillCatalogItem[] = [
  { skillId: 1, name: 'Java', category: 'BACKEND' },
  { skillId: 2, name: 'React', category: 'FRONTEND' },
  { skillId: 3, name: 'Docker', category: 'DEVOPS' },
  { skillId: 4, name: 'PostgreSQL', category: 'DATABASE' },
  { skillId: 5, name: 'Kubernetes', category: 'DEVOPS' },
  { skillId: 6, name: 'AWS', category: 'CLOUD' },
  { skillId: 7, name: 'Spring Boot', category: 'BACKEND' },
  { skillId: 8, name: 'TypeScript', category: 'PROGRAMMING_LANGUAGE' },
  { skillId: 9, name: 'Python', category: 'PROGRAMMING_LANGUAGE' },
  { skillId: 10, name: 'Git', category: 'OTHER' },
];

const DEFAULT_USERS: MockUser[] = [
  {
    userId: 1,
    name: 'Lautaro',
    email: 'lautaro@example.com',
    password: 'demo',
    educationLevel: 'UNIVERSITY_STUDENT',
    studyYear: 3,
    worksInIT: true,
    skills: [
      { skillId: 1, name: 'Java', level: 8 },
      { skillId: 3, name: 'Docker', level: 2 },
      { skillId: 4, name: 'PostgreSQL', level: 5 },
    ],
    createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
  },
];

const DEFAULT_CHATS: ChatResponse[] = [
  {
    chatId: 12,
    title: 'Aprendiendo Docker',
    messageCount: 1,
    createdAt: new Date('2026-06-10T14:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-10T14:05:00Z').toISOString(),
  },
];

const DEFAULT_MESSAGES: Record<number, MessageResponse[]> = {
  12: [
    {
      messageId: 15,
      chatId: 12,
      originalPrompt: 'Explícame Docker',
      enrichedPrompt:
        'El usuario es estudiante universitario de tercer año que trabaja en IT y tiene nivel avanzado en Java (8/10) pero nivel inicial en Docker (2/10). Explícame Docker desde una perspectiva de backend Java, usando Maven y el ecosistema JVM como punto de referencia.',
      appliedInferences: ['backend_developer', 'needs_docker', 'use_java_examples'],
      aiResponse:
        'Docker es una plataforma de contenedores que permite empaquetar aplicaciones junto con sus dependencias en unidades aisladas llamadas contenedores. Pensándolo desde Java: es similar a tener un JAR ejecutable, pero que incluye también el JDK, el sistema operativo y todas las dependencias del sistema. Como tienes nivel inicial (2/10), lo mejor es ver un ejemplo simple de Dockerfile para una app Spring Boot con Maven...',
      createdAt: new Date('2026-06-10T14:05:00Z').toISOString(),
    },
  ],
};

function loadDB(): MockDB {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignorar error y recrear
    }
  }
  const db: MockDB = {
    users: DEFAULT_USERS,
    skillsCatalog: DEFAULT_CATALOG,
    chats: DEFAULT_CHATS,
    messages: DEFAULT_MESSAGES,
  };
  saveDB(db);
  return db;
}

function saveDB(db: MockDB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ============================================================
// Helpers de usuario
// ============================================================

const STUDENT_LEVELS: EducationLevel[] = ['SECONDARY_STUDENT', 'TERTIARY_STUDENT', 'UNIVERSITY_STUDENT'];

function computeOnboardingComplete(u: MockUser): boolean {
  if (u.educationLevel == null || u.worksInIT == null) return false;
  const yearOk = STUDENT_LEVELS.includes(u.educationLevel) ? u.studyYear != null : true;
  return yearOk && u.skills.length > 0;
}

function toProfileResponse(u: MockUser): ProfileResponse {
  return {
    userId: u.userId,
    name: u.name,
    email: u.email,
    educationLevel: u.educationLevel as EducationLevel,
    studyYear: u.studyYear,
    worksInIT: u.worksInIT as boolean,
    skills: u.skills,
    createdAt: u.createdAt,
  };
}

function toUserResponse(u: MockUser): UserResponse {
  return {
    userId: u.userId,
    name: u.name,
    email: u.email,
    educationLevel: u.educationLevel,
    studyYear: u.studyYear,
    worksInIT: u.worksInIT,
    onboardingComplete: computeOnboardingComplete(u),
    skills: u.skills,
  };
}

function getHeader(config: AxiosRequestConfig, name: string): string | undefined {
  const h: any = config.headers;
  if (!h) return undefined;
  if (typeof h.get === 'function') return h.get(name) ?? undefined;
  return h[name] ?? h[name.toLowerCase()];
}

function getActiveUser(db: MockDB, config: AxiosRequestConfig): MockUser | undefined {
  const raw = getHeader(config, 'X-User-Id');
  const id = raw ? parseInt(String(raw), 10) : 1;
  return db.users.find((u) => u.userId === id) ?? db.users[0];
}

// ============================================================
// Helper para construir la respuesta Axios
// ============================================================

function makeResponse<T>(data: T, status = 200, config: AxiosRequestConfig): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 201 ? 'Created' : status === 204 ? 'No Content' : 'OK',
    headers: {},
    config: config as any,
  };
}

function makeErrorResponse(message: string, status = 404, config: AxiosRequestConfig): Promise<never> {
  const errorObj = {
    config: config as any,
    response: {
      status,
      data: {
        status,
        error:
          status === 400 ? 'Bad Request'
          : status === 401 ? 'Unauthorized'
          : status === 404 ? 'Not Found'
          : status === 409 ? 'Conflict'
          : 'Internal Server Error',
        message,
        timestamp: new Date().toISOString(),
      },
    },
  };
  return Promise.reject(errorObj);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================
// Custom Axios Adapter
// ============================================================

export async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  // Simular latencia de red (600ms a 1000ms)
  const delay = Math.floor(Math.random() * 400) + 600;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const db = loadDB();
  const url = config.url || '';
  const method = (config.method || 'GET').toUpperCase();

  // Limpiar query params de la URL para el ruteo básico
  const [cleanUrl] = url.split('?');

  // Parsear el body si es string
  let body: any = null;
  if (config.data) {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  }

  // ──────────────────────────────────────────────────────────
  // USERS — Registro, Login, Onboarding
  // ──────────────────────────────────────────────────────────

  // POST /api/users/register
  if (cleanUrl === '/users/register' && method === 'POST') {
    const { name, email, password } = body ?? {};
    if (!name || !email || !password) {
      return makeErrorResponse('name, email y password son obligatorios', 400, config);
    }
    if (!EMAIL_RE.test(email)) {
      return makeErrorResponse('Formato de email inválido', 400, config);
    }
    if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      return makeErrorResponse('El email ya está registrado', 409, config);
    }
    const newId = db.users.length > 0 ? Math.max(...db.users.map((u) => u.userId)) + 1 : 1;
    const newUser: MockUser = {
      userId: newId,
      name,
      email,
      password,
      educationLevel: null,
      studyYear: null,
      worksInIT: null,
      skills: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDB(db);
    const res: RegisterUserResponse = { userId: newId, onboardingComplete: false };
    return makeResponse(res, 201, config);
  }

  // POST /api/users/login
  if (cleanUrl === '/users/login' && method === 'POST') {
    const { email, password } = body ?? {};
    if (!email || !password) {
      return makeErrorResponse('email y password son obligatorios', 400, config);
    }
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) {
      return makeErrorResponse('No existe un usuario con ese email', 404, config);
    }
    if (user.password !== password) {
      return makeErrorResponse('Credenciales inválidas', 401, config);
    }
    const res: LoginResponse = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      onboardingComplete: computeOnboardingComplete(user),
    };
    return makeResponse(res, 200, config);
  }

  // GET /api/users/{id}
  if (cleanUrl.startsWith('/users/') && method === 'GET') {
    const id = parseInt(cleanUrl.substring('/users/'.length), 10);
    const user = db.users.find((u) => u.userId === id);
    if (isNaN(id) || !user) {
      return makeErrorResponse(`Usuario con ID ${id} no encontrado`, 404, config);
    }
    return makeResponse(toUserResponse(user), 200, config);
  }

  // PUT /api/users/{id}/onboarding
  if (cleanUrl.startsWith('/users/') && cleanUrl.endsWith('/onboarding') && method === 'PUT') {
    const parts = cleanUrl.split('/');
    const id = parseInt(parts[2], 10);
    const userIdx = db.users.findIndex((u) => u.userId === id);
    if (isNaN(id) || userIdx === -1) {
      return makeErrorResponse(`Usuario con ID ${id} no encontrado`, 404, config);
    }
    const { educationLevel, studyYear, worksInIT, skills } = body ?? {};
    if (!educationLevel || typeof worksInIT !== 'boolean') {
      return makeErrorResponse('educationLevel y worksInIT son obligatorios', 400, config);
    }
    if (!Array.isArray(skills) || skills.length === 0) {
      return makeErrorResponse('Debe indicar al menos una skill', 400, config);
    }
    for (const s of skills) {
      if (typeof s.level !== 'number' || s.level < 1 || s.level > 10) {
        return makeErrorResponse('Cada nivel debe estar entre 1 y 10', 400, config);
      }
    }
    // Validación previa: todas las skillIds deben existir (sin modificar el perfil)
    const resolved: SkillResponse[] = [];
    for (const s of skills) {
      const cat = db.skillsCatalog.find((c) => c.skillId === s.skillId);
      if (!cat) {
        return makeErrorResponse(`Skill con ID ${s.skillId} no encontrada`, 404, config);
      }
      resolved.push({ skillId: cat.skillId, name: cat.name, level: s.level });
    }
    const user = db.users[userIdx];
    user.educationLevel = educationLevel;
    user.studyYear = STUDENT_LEVELS.includes(educationLevel) ? (studyYear ?? null) : null;
    user.worksInIT = worksInIT;
    user.skills = resolved;
    saveDB(db);
    return makeResponse(toUserResponse(user), 200, config);
  }

  // ──────────────────────────────────────────────────────────
  // PROFILE (usuario activo por X-User-Id)
  // ──────────────────────────────────────────────────────────

  // 1. GET /api/profile
  if (cleanUrl === '/profile' && method === 'GET') {
    const user = getActiveUser(db, config);
    if (!user) return makeErrorResponse('Perfil no encontrado', 404, config);
    return makeResponse(toProfileResponse(user), 200, config);
  }

  // 2. PUT /api/profile/skills/{skillId}
  if (cleanUrl.startsWith('/profile/skills/') && method === 'PUT') {
    const skillIdStr = cleanUrl.substring('/profile/skills/'.length);
    const skillId = parseInt(skillIdStr, 10);
    const level = body?.level;

    if (isNaN(skillId) || typeof level !== 'number' || level < 1 || level > 10) {
      return makeErrorResponse('Nivel fuera de rango (1-10) o id de habilidad inválido', 400, config);
    }

    const catalogItem = db.skillsCatalog.find((s) => s.skillId === skillId);
    if (!catalogItem) {
      return makeErrorResponse(`Habilidad con ID ${skillId} no existe en el catálogo`, 404, config);
    }

    const user = getActiveUser(db, config);
    if (!user) return makeErrorResponse('Perfil no encontrado', 404, config);

    let updatedSkill: SkillResponse;
    const existingSkillIdx = user.skills.findIndex((s) => s.skillId === skillId);
    if (existingSkillIdx !== -1) {
      user.skills[existingSkillIdx].level = level;
      updatedSkill = user.skills[existingSkillIdx];
    } else {
      updatedSkill = { skillId, name: catalogItem.name, level };
      user.skills.push(updatedSkill);
    }

    saveDB(db);
    return makeResponse(updatedSkill, 200, config);
  }

  // 3. GET /api/skills
  if (cleanUrl === '/skills' && method === 'GET') {
    const category = config.params?.category || new URLSearchParams(url.split('?')[1] || '').get('category');
    if (category) {
      const upperCategory = category.toUpperCase();
      const validCategories = ['BACKEND', 'FRONTEND', 'DATABASE', 'DEVOPS', 'CLOUD', 'PROGRAMMING_LANGUAGE', 'OTHER'];
      if (!validCategories.includes(upperCategory)) {
        return makeErrorResponse(`Valor de categoría no reconocido: ${category}`, 400, config);
      }
      const filtered = db.skillsCatalog.filter((s) => s.category.toUpperCase() === upperCategory);
      return makeResponse(filtered, 200, config);
    }
    return makeResponse(db.skillsCatalog, 200, config);
  }

  // 4. GET /api/chats
  if (cleanUrl === '/chats' && method === 'GET') {
    const sortedChats = [...db.chats].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return makeResponse(sortedChats, 200, config);
  }

  // 5. POST /api/chats
  if (cleanUrl === '/chats' && method === 'POST') {
    const title = body?.title || 'Nuevo Chat';
    const newId = db.chats.length > 0 ? Math.max(...db.chats.map((c) => c.chatId)) + 1 : 1;

    const newChat: ChatResponse = {
      chatId: newId,
      title,
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.chats.push(newChat);
    db.messages[newId] = [];

    saveDB(db);
    return makeResponse(newChat, 201, config);
  }

  // 6. GET /api/chats/{chatId}
  if (cleanUrl.startsWith('/chats/') && !cleanUrl.endsWith('/enrich') && method === 'GET') {
    const chatIdStr = cleanUrl.substring('/chats/'.length);
    const chatId = parseInt(chatIdStr, 10);
    const chat = db.chats.find((c) => c.chatId === chatId);

    if (isNaN(chatId) || !chat) {
      return makeErrorResponse(`Chat con ID ${chatId} no encontrado`, 404, config);
    }

    const messages = db.messages[chatId] || [];
    const chatDetail: ChatDetailResponse = {
      chatId: chat.chatId,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages,
    };
    return makeResponse(chatDetail, 200, config);
  }

  // 7. PATCH /api/chats/{chatId}
  if (cleanUrl.startsWith('/chats/') && !cleanUrl.endsWith('/enrich') && method === 'PATCH') {
    const chatIdStr = cleanUrl.substring('/chats/'.length);
    const chatId = parseInt(chatIdStr, 10);
    const chatIdx = db.chats.findIndex((c) => c.chatId === chatId);

    if (isNaN(chatId) || chatIdx === -1) {
      return makeErrorResponse(`Chat con ID ${chatId} no encontrado`, 404, config);
    }

    const title = body?.title;
    if (!title) {
      return makeErrorResponse('El título es requerido', 400, config);
    }

    db.chats[chatIdx].title = title;
    db.chats[chatIdx].updatedAt = new Date().toISOString();

    const renameResponse: RenameChatResponse = {
      chatId: db.chats[chatIdx].chatId,
      title: db.chats[chatIdx].title,
      updatedAt: db.chats[chatIdx].updatedAt,
    };

    saveDB(db);
    return makeResponse(renameResponse, 200, config);
  }

  // 8. DELETE /api/chats/{chatId}
  if (cleanUrl.startsWith('/chats/') && !cleanUrl.endsWith('/enrich') && method === 'DELETE') {
    const chatIdStr = cleanUrl.substring('/chats/'.length);
    const chatId = parseInt(chatIdStr, 10);
    const chatIdx = db.chats.findIndex((c) => c.chatId === chatId);

    if (isNaN(chatId) || chatIdx === -1) {
      return makeErrorResponse(`Chat con ID ${chatId} no encontrado`, 404, config);
    }

    db.chats.splice(chatIdx, 1);
    delete db.messages[chatId];

    saveDB(db);
    return makeResponse(null, 204, config);
  }

  // 9. POST /api/chats/{chatId}/messages/enrich
  if (cleanUrl.startsWith('/chats/') && cleanUrl.endsWith('/messages/enrich') && method === 'POST') {
    const parts = cleanUrl.split('/');
    const chatId = parseInt(parts[2], 10);
    const chatIdx = db.chats.findIndex((c) => c.chatId === chatId);

    if (isNaN(chatId) || chatIdx === -1) {
      return makeErrorResponse(`Chat con ID ${chatId} no encontrado`, 404, config);
    }

    const prompt = body?.prompt;
    if (!prompt || prompt.trim() === '') {
      return makeErrorResponse('El prompt no puede estar vacío', 400, config);
    }

    // El usuario se deriva del dueño del chat; en el mock usamos el usuario activo.
    const user = getActiveUser(db, config) ?? db.users[0];

    const inferences: string[] = ['student_profile'];
    const recommendations: string[] = [];

    const javaSkill = user.skills.find((s) => s.name.toLowerCase() === 'java');
    const dockerSkill = user.skills.find((s) => s.name.toLowerCase() === 'docker');

    if (user.worksInIT) {
      inferences.push('works_in_it');
    }

    if (javaSkill) {
      if (javaSkill.level >= 7) {
        inferences.push('expert_java');
        recommendations.push('Usar ejemplos avanzados de Spring Boot / JVM');
      } else {
        inferences.push('beginner_java');
        recommendations.push('Evitar tecnicismos avanzados de la JVM');
      }
    }

    if (dockerSkill) {
      if (dockerSkill.level < 4) {
        inferences.push('needs_docker_basics');
        recommendations.push('Explicar conceptos de contenedores de forma básica');
      } else {
        inferences.push('advanced_docker');
        recommendations.push('Usar configuraciones multi-stage en Dockerfile');
      }
    }

    const eduText = (user.educationLevel ?? 'unknown').toLowerCase().replace('_', ' ');
    const userSummary = `El usuario es ${eduText} que ${user.worksInIT ? 'trabaja' : 'no trabaja'} en IT. Nivel de Java: ${javaSkill?.level || 0}/10. Nivel de Docker: ${dockerSkill?.level || 0}/10.`;
    const enrichedPrompt = `[System Context: ${userSummary} Inferences: [${inferences.join(', ')}]] ${prompt}. Por favor, adapta la respuesta a mi perfil técnico y nivel de conocimiento.`;

    let maxMsgId = 0;
    Object.values(db.messages).forEach((msgs) => {
      msgs.forEach((m) => {
        if (m.messageId > maxMsgId) maxMsgId = m.messageId;
      });
    });
    const newMessageId = maxMsgId + 1;

    const newMessage: MessageResponse = {
      messageId: newMessageId,
      chatId,
      originalPrompt: prompt,
      appliedInferences: inferences,
      enrichedPrompt,
      aiResponse: null,
      createdAt: new Date().toISOString(),
    };

    if (!db.messages[chatId]) {
      db.messages[chatId] = [];
    }
    db.messages[chatId].push(newMessage);

    db.chats[chatIdx].messageCount = db.messages[chatId].length;
    db.chats[chatIdx].updatedAt = new Date().toISOString();

    const enrichResponse: EnrichPromptResponse = {
      messageId: newMessageId,
      chatId,
      originalPrompt: prompt,
      appliedInferences: inferences,
      enrichedPrompt,
      aiResponse: null,
      createdAt: newMessage.createdAt,
    };

    saveDB(db);
    return makeResponse(enrichResponse, 201, config);
  }

  // 10. POST /api/messages/{messageId}/send
  if (cleanUrl.startsWith('/messages/') && cleanUrl.endsWith('/send') && method === 'POST') {
    const parts = cleanUrl.split('/');
    const messageId = parseInt(parts[2], 10);

    let foundChatId = -1;
    let foundMsgIdx = -1;

    for (const [cId, msgs] of Object.entries(db.messages)) {
      const idx = msgs.findIndex((m) => m.messageId === messageId);
      if (idx !== -1) {
        foundChatId = parseInt(cId, 10);
        foundMsgIdx = idx;
        break;
      }
    }

    if (foundMsgIdx === -1) {
      return makeErrorResponse(`Mensaje con ID ${messageId} no encontrado`, 404, config);
    }

    const msg = db.messages[foundChatId][foundMsgIdx];
    if (msg.aiResponse !== null) {
      return makeErrorResponse('El mensaje ya tiene respuesta de la IA. Usa /retry en su lugar.', 409, config);
    }

    const responseText = `Esta es una respuesta simulada por el mock del frontend para tu prompt: "${msg.originalPrompt}".\n\n` +
      `Se ha aplicado el contexto de tu perfil técnico:\n` +
      `- Inferencia detectada: ${msg.appliedInferences.join(', ')}\n\n` +
      `Como tu nivel de conocimientos ha sido considerado en la formulación del prompt enriquecido, la IA generaría una explicación adaptada a tu perfil. Para "Java" y "Docker", se asume una perspectiva del ecosistema backend de Spring Boot, simplificando la contenerización si es necesario.`;

    db.messages[foundChatId][foundMsgIdx].aiResponse = responseText;

    const chatIdx = db.chats.findIndex((c) => c.chatId === foundChatId);
    if (chatIdx !== -1) {
      db.chats[chatIdx].updatedAt = new Date().toISOString();
    }

    const sendResponse: SendMessageResponse = {
      messageId,
      response: responseText,
    };

    saveDB(db);
    return makeResponse(sendResponse, 200, config);
  }

  // 11. POST /api/messages/{messageId}/retry
  if (cleanUrl.startsWith('/messages/') && cleanUrl.endsWith('/retry') && method === 'POST') {
    const parts = cleanUrl.split('/');
    const messageId = parseInt(parts[2], 10);

    let foundChatId = -1;
    let foundMsgIdx = -1;

    for (const [cId, msgs] of Object.entries(db.messages)) {
      const idx = msgs.findIndex((m) => m.messageId === messageId);
      if (idx !== -1) {
        foundChatId = parseInt(cId, 10);
        foundMsgIdx = idx;
        break;
      }
    }

    if (foundMsgIdx === -1) {
      return makeErrorResponse(`Mensaje con ID ${messageId} no encontrado`, 404, config);
    }

    const msg = db.messages[foundChatId][foundMsgIdx];
    const retryCount = Math.floor(Math.random() * 100) + 1;
    const responseText = `[Generación reintentada #${retryCount}]\n\n` +
      `Esta es una respuesta regenerada simulada para tu prompt: "${msg.originalPrompt}".\n\n` +
      `Optimizada con las inferencias: ${msg.appliedInferences.join(', ')}.`;

    db.messages[foundChatId][foundMsgIdx].aiResponse = responseText;

    const chatIdx = db.chats.findIndex((c) => c.chatId === foundChatId);
    if (chatIdx !== -1) {
      db.chats[chatIdx].updatedAt = new Date().toISOString();
    }

    const sendResponse: SendMessageResponse = {
      messageId,
      response: responseText,
    };

    saveDB(db);
    return makeResponse(sendResponse, 200, config);
  }

  return makeErrorResponse(`Ruta de API mock no implementada o método no soportado: ${method} ${cleanUrl}`, 404, config);
}
