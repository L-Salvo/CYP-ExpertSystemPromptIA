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
} from '../types/api.types';

// ============================================================
// Base de Datos Simulada en LocalStorage
// ============================================================

const STORAGE_KEY = 'prompt_expert_mock_db';

interface MockDB {
  profile: ProfileResponse;
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

const DEFAULT_PROFILE: ProfileResponse = {
  userId: 1,
  name: 'Lautaro',
  email: 'lautaro@example.com',
  educationLevel: 'UNIVERSITY_STUDENT',
  studyYear: 3,
  worksInIT: true,
  skills: [
    { skillId: 1, name: 'Java', level: 8 },
    { skillId: 3, name: 'Docker', level: 2 },
    { skillId: 4, name: 'PostgreSQL', level: 5 },
  ],
  createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
};

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
      enrichedPrompt: 'El usuario es estudiante universitario de tercer año que trabaja en IT y tiene nivel avanzado en Java (8/10) pero nivel inicial en Docker (2/10). Explícame Docker desde una perspectiva de backend Java, usando Maven y el ecosistema JVM como punto de referencia.',
      appliedInferences: ['backend_developer', 'needs_docker', 'use_java_examples'],
      aiResponse: 'Docker es una plataforma de contenedores que permite empaquetar aplicaciones junto con sus dependencias en unidades aisladas llamadas contenedores. Pensándolo desde Java: es similar a tener un JAR ejecutable, pero que incluye también el JDK, el sistema operativo y todas las dependencias del sistema. Como tienes nivel inicial (2/10), lo mejor es ver un ejemplo simple de Dockerfile para una app Spring Boot con Maven...',
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
    profile: DEFAULT_PROFILE,
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
        error: status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Internal Server Error',
        message,
        timestamp: new Date().toISOString(),
      },
    },
  };
  return Promise.reject(errorObj);
}

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

  // 1. GET /api/profile
  if (cleanUrl === '/profile' && method === 'GET') {
    return makeResponse(db.profile, 200, config);
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

    // Actualizar o agregar skill en el perfil
    let updatedSkill: SkillResponse;
    const existingSkillIdx = db.profile.skills.findIndex((s) => s.skillId === skillId);
    if (existingSkillIdx !== -1) {
      db.profile.skills[existingSkillIdx].level = level;
      updatedSkill = db.profile.skills[existingSkillIdx];
    } else {
      const newSkill: SkillResponse = {
        skillId,
        name: catalogItem.name,
        level,
      };
      db.profile.skills.push(newSkill);
      updatedSkill = newSkill;
    }

    saveDB(db);
    return makeResponse(updatedSkill, 200, config);
  }

  // 3. GET /api/skills
  if (cleanUrl === '/skills' && method === 'GET') {
    // Leer parámetro category
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
    // Ordenar chats por updatedAt descendente
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

    // Simular inferencias de Prolog basadas en las skills del usuario
    const inferences: string[] = ['student_profile'];
    const recommendations: string[] = [];

    // Ver si el usuario tiene Java, Docker, etc.
    const javaSkill = db.profile.skills.find((s) => s.name.toLowerCase() === 'java');
    const dockerSkill = db.profile.skills.find((s) => s.name.toLowerCase() === 'docker');
    
    if (db.profile.worksInIT) {
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

    // Generar prompt enriquecido mockeado
    const userSummary = `El usuario es ${db.profile.educationLevel.toLowerCase().replace('_', ' ')} que ${db.profile.worksInIT ? 'trabaja' : 'no trabaja'} en IT. Nivel de Java: ${javaSkill?.level || 0}/10. Nivel de Docker: ${dockerSkill?.level || 0}/10.`;
    const enrichedPrompt = `[System Context: ${userSummary} Inferences: [${inferences.join(', ')}]] ${prompt}. Por favor, adapta la respuesta a mi perfil técnico y nivel de conocimiento.`;

    // Obtener un nuevo ID de mensaje
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

    // Inicializar mensajes si no existe
    if (!db.messages[chatId]) {
      db.messages[chatId] = [];
    }
    db.messages[chatId].push(newMessage);

    // Actualizar metadata del chat
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

    // Buscar el mensaje en todos los chats
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

    // Generar respuesta ficticia de IA basada en el prompt original
    const responseText = `Esta es una respuesta simulada por el mock del frontend para tu prompt: "${msg.originalPrompt}".\n\n` +
      `Se ha aplicado el contexto de tu perfil técnico:\n` +
      `- Inferencia detectada: ${msg.appliedInferences.join(', ')}\n\n` +
      `Como tu nivel de conocimientos ha sido considerado en la formulación del prompt enriquecido, la IA generaría una explicación adaptada a tu perfil. Para "Java" y "Docker", se asume una perspectiva del ecosistema backend de Spring Boot, simplificando la contenerización si es necesario.`;

    db.messages[foundChatId][foundMsgIdx].aiResponse = responseText;
    
    // Actualizar updatedAt del chat
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

    // Actualizar updatedAt del chat
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
