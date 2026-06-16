# API Contract — v1

**Proyecto:** Sistema Experto para Personalización Inteligente de Prompts  
**Versión:** 1.0  
**Fecha:** 2026-06-10  
**Estado:** Borrador activo

---

## Índice

1. [Introducción](#1-introducción)
2. [Convenciones](#2-convenciones)
3. [ProfileController](#3-profilecontroller)
3.bis. [UserController — Registro, Login y Onboarding](#3bis-usercontroller--registro-login-y-onboarding)
4. [ChatController](#4-chatcontroller)
5. [ExpertSystemController](#5-expertsystemcontroller)
6. [AIController](#6-aicontroller)
7. [Modelos de Datos](#7-modelos-de-datos)
8. [Flujos Principales](#8-flujos-principales)
9. [Endpoints Internos de Prolog](#9-endpoints-internos-de-prolog)

---

## 1. Introducción

Este documento define el contrato oficial de la API REST entre el frontend (React) y el backend (Spring Boot) para la versión 1 del sistema.

Su propósito es servir como referencia estable y compartida durante el desarrollo, de modo que ambos equipos puedan trabajar en paralelo con expectativas alineadas sobre estructura de requests, responses y códigos de error.

El sistema permite gestionar perfiles de usuario, enriquecer prompts mediante inferencias realizadas por SWI-Prolog, y opcionalmente enviar esos prompts enriquecidos a un modelo de IA externo.

> **Nota:** Los [Endpoints Internos de Prolog](#9-endpoints-internos-de-prolog) están documentados en la sección 9 pero **no forman parte de este contrato**. Son exclusivamente para comunicación interna entre Spring Boot y el servicio Prolog.

---

## 2. Convenciones

| Convención | Valor |
|---|---|
| **Base URL** | `/api` |
| **Formato** | JSON (`application/json`) |
| **Encoding** | UTF-8 |
| **Fechas** | ISO-8601 — `2026-06-10T14:30:00Z` |
| **Autenticación** | **Demo (sin tokens):** header `X-User-Id` identifica al usuario (ver abajo) |
| **Identificadores** | Enteros (`Long`) en todos los IDs |

### Autenticación demo (`X-User-Id`)

> ⚠️ **Solo para la demo académica.** No hay Spring Security, JWT, sesiones ni cookies. Las passwords se guardan en **texto plano**. **No usar en producción.**

El usuario se registra (`POST /api/users/register`) e inicia sesión (`POST /api/users/login`). El login **no** devuelve token: el frontend almacena el `userId` y lo reenvía en el header **`X-User-Id`** en cada request a endpoints con dueño.

- Endpoints que requieren `X-User-Id` (actor): `ProfileController` (`/api/profile**`), `ChatController` (`/api/chats` crear/listar/obtener/renombrar/eliminar) y `AIController` (`/api/messages/**`). Si falta el header → `400 Bad Request`.
- **Excepción — `POST /api/chats/{chatId}/messages/enrich`:** **no** usa `X-User-Id`. El usuario se deriva del **dueño del chat** (`chat.user`), de modo que el sistema experto siempre usa el perfil real del propietario.
- Endpoints públicos (sin header): `POST /api/users/register`, `POST /api/users/login`, `POST /api/users`, `GET /api/users/{id}`, `PUT /api/users/{id}/onboarding`, `GET /api/skills`.

### Estructura de errores

Todos los errores siguen la misma estructura:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Chat not found with id: 42",
  "timestamp": "2026-06-10T14:30:00Z"
}
```

---

## 3. ProfileController

### `GET /api/profile`

Obtener el perfil completo del usuario autenticado, incluyendo sus skills y niveles de conocimiento.

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **URL** | `/api/profile` |
| **Path params** | — |
| **Query params** | — |
| **Request body** | — |

**Response body** `200 OK`

```json
{
  "userId": 1,
  "name": "Lautaro",
  "email": "lautaro@example.com",
  "educationLevel": "UNIVERSITY_STUDENT",
  "studyYear": 3,
  "worksInIT": true,
  "skills": [
    {
      "skillId": 3,
      "name": "Docker",
      "level": 2
    },
    {
      "skillId": 7,
      "name": "Java",
      "level": 8
    }
  ],
  "createdAt": "2026-01-15T10:00:00Z"
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Perfil obtenido correctamente |
| `404` | Perfil no encontrado |

---

### `PUT /api/profile/skills/{skillId}`

Actualizar el nivel de conocimiento del usuario para una skill específica.

| Campo | Valor |
|---|---|
| **Método** | `PUT` |
| **URL** | `/api/profile/skills/{skillId}` |
| **Path params** | `skillId` — ID de la skill a actualizar |
| **Query params** | — |

**Request body**

```json
{
  "level": 5
}
```

> **Valores válidos para `level`:** entero entre `1` y `10` (inclusive).  
> Interpretación orientativa: 1–3 básico · 4–7 intermedio · 8–10 avanzado.  
> La categorización es responsabilidad del sistema experto y no se almacena.

**Response body** `200 OK`

```json
{
  "skillId": 3,
  "name": "Docker",
  "level": 5
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Nivel actualizado correctamente |
| `400` | Valor de `level` fuera del rango 1–10 |
| `404` | Skill no encontrada |

---

### `GET /api/skills`

Obtener el catálogo completo de skills disponibles en el sistema.

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **URL** | `/api/skills` |
| **Path params** | — |
| **Query params** | `category` (opcional) — filtrar por categoría (ver `SkillCategory`) |

**Response body** `200 OK`

```json
[
  {
    "skillId": 1,
    "name": "Java",
    "category": "BACKEND"
  },
  {
    "skillId": 2,
    "name": "React",
    "category": "FRONTEND"
  },
  {
    "skillId": 3,
    "name": "Docker",
    "category": "DEVOPS"
  }
]
```

**Sobre el query param `category`:**

- Acepta el nombre del enum en cualquier capitalización (`backend`, `BACKEND`, `Backend`). La capa de servicio lo normaliza con `toUpperCase()` antes de buscar en la base.
- Si el valor no corresponde a ningún miembro de `SkillCategory`, la respuesta es `400 Bad Request`. Se interpreta como parámetro inválido, no como ausencia de resultados.
- Valores válidos: `BACKEND`, `FRONTEND`, `DATABASE`, `DEVOPS`, `CLOUD`, `PROGRAMMING_LANGUAGE`, `OTHER`.

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Catálogo obtenido correctamente |
| `400` | Valor de `category` no reconocido (no pertenece a `SkillCategory`) |

---

## 3.bis UserController — Registro, Login y Onboarding

Gestión de alta de usuarios, **autenticación demo** (registro + login) y completado de perfil (onboarding). El login devuelve el `userId`; el frontend lo almacena y lo reenvía en el header `X-User-Id` (ver [Autenticación demo](#autenticación-demo-x-user-id)).

> **Estado del perfil — `onboardingComplete`:** es un valor **calculado, no persistido**. Es `true` cuando el usuario tiene presentes `educationLevel`, `studyYear`, `worksInIT` **y** al menos una skill asociada; `false` en caso contrario.

> ⚠️ **Seguridad (demo):** las passwords se almacenan en **texto plano** (sin hashing). No hay tokens ni sesiones. Simplificación deliberada para la demo académica.

### `POST /api/users/register`

Registra un usuario con credenciales. El perfil queda vacío hasta el onboarding.

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/users/register` |
| **Request body** | `RegisterUserRequest` |

**Request body**

```json
{
  "name": "Pedro",
  "email": "pedro@test.com",
  "password": "1234"
}
```

> `name`, `email` y `password` obligatorios. `email` con formato válido y **único**.

**Response body** `201 Created`

```json
{
  "userId": 5,
  "onboardingComplete": false
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `201` | Usuario registrado |
| `400` | `name`/`email`/`password` ausentes o `email` inválido |
| `409` | El `email` ya está registrado |

---

### `POST /api/users/login`

Autentica por email + password (texto plano, demo). **No** emite token ni sesión.

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/users/login` |
| **Request body** | `LoginRequest` |

**Request body**

```json
{
  "email": "pedro@test.com",
  "password": "1234"
}
```

**Response body** `200 OK`

```json
{
  "userId": 5,
  "name": "Pedro",
  "email": "pedro@test.com",
  "onboardingComplete": true
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Login correcto |
| `400` | `email`/`password` ausentes o `email` inválido |
| `401` | Password incorrecta (`Credenciales inválidas`) |
| `404` | No existe un usuario con ese email |

> **Convención de errores:** email inexistente → `404` (coherente con `ResourceNotFoundException` del resto del sistema); password incorrecta → `401`.

---

### `POST /api/users`

Registra un usuario nuevo con datos mínimos. El perfil (`educationLevel`, `studyYear`, `worksInIT`, `skills`) queda vacío hasta completar el onboarding.

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/users` |
| **Path params** | — |
| **Request body** | `CreateUserRequest` |

**Request body**

```json
{
  "name": "Juan Perez",
  "email": "juan@example.com"
}
```

> `name` obligatorio (no vacío). `email` obligatorio, con formato válido y **único** en el sistema.

**Response body** `201 Created`

```json
{
  "userId": 2,
  "name": "Juan Perez",
  "email": "juan@example.com"
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `201` | Usuario creado correctamente |
| `400` | `name`/`email` ausentes o `email` con formato inválido |
| `409` | El `email` ya está registrado |

---

### `GET /api/users/{id}`

Devuelve la información del usuario y el estado de su onboarding.

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **URL** | `/api/users/{id}` |
| **Path params** | `id` — ID del usuario |
| **Request body** | — |

**Response body** `200 OK` (usuario recién registrado, sin onboarding)

```json
{
  "userId": 2,
  "name": "Juan Perez",
  "email": "juan@example.com",
  "educationLevel": null,
  "studyYear": null,
  "worksInIT": null,
  "onboardingComplete": false,
  "skills": []
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Usuario obtenido correctamente |
| `404` | Usuario no encontrado |

---

### `PUT /api/users/{id}/onboarding`

Completa el onboarding del perfil: actualiza los datos del usuario y **reemplaza por completo** sus skills por las indicadas.

| Campo | Valor |
|---|---|
| **Método** | `PUT` |
| **URL** | `/api/users/{id}/onboarding` |
| **Path params** | `id` — ID del usuario |
| **Request body** | `OnboardingRequest` |

**Request body**

```json
{
  "educationLevel": "UNIVERSITY_STUDENT",
  "studyYear": 3,
  "worksInIT": true,
  "skills": [
    { "skillId": 1, "level": 8 },
    { "skillId": 2, "level": 7 }
  ]
}
```

> `educationLevel` y `worksInIT` obligatorios. `studyYear` opcional (aplica a estudiantes). `skills` debe tener al menos un elemento; cada `level` entre `1` y `10`. Las skills indicadas **reemplazan** las existentes (las anteriores se eliminan). Si alguna `skillId` no existe, la operación se rechaza con `404` **sin modificar** el perfil (validación previa).

**Response body** `200 OK`

```json
{
  "userId": 2,
  "name": "Juan Perez",
  "email": "juan@example.com",
  "educationLevel": "UNIVERSITY_STUDENT",
  "studyYear": 3,
  "worksInIT": true,
  "onboardingComplete": true,
  "skills": [
    { "skillId": 1, "name": "Java", "level": 8 },
    { "skillId": 2, "name": "Spring Boot", "level": 7 }
  ]
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Onboarding completado correctamente |
| `400` | Request inválido (campos obligatorios ausentes o `level` fuera de 1–10) |
| `404` | Usuario o alguna `skillId` no encontrados |

---

### Flujo de onboarding (ejemplo de uso)

```
1. POST /api/users                  → 201 { userId: 2, ... }            (alta mínima)
2. GET  /api/users/2                 → 200 { onboardingComplete: false } (perfil vacío)
3. GET  /api/skills                  → catálogo para elegir skillIds
4. PUT  /api/users/2/onboarding      → 200 { onboardingComplete: true }  (perfil completo)
5. GET  /api/users/2                 → 200 { onboardingComplete: true }
```

---

## 4. ChatController

> **Todos los endpoints de esta sección requieren el header `X-User-Id`** (usuario actor). Falta del header → `400`. Ver [Autenticación demo](#autenticación-demo-x-user-id).

### `POST /api/chats`

Crear un nuevo chat para el usuario.

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/chats` |
| **Path params** | — |
| **Query params** | — |

**Request body**

```json
{
  "title": "Aprendiendo Docker"
}
```

**Response body** `201 Created`

```json
{
  "chatId": 12,
  "title": "Aprendiendo Docker",
  "messageCount": 0,
  "createdAt": "2026-06-10T14:00:00Z",
  "updatedAt": "2026-06-10T14:00:00Z"
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `201` | Chat creado correctamente |
| `400` | Request inválido |

---

### `GET /api/chats`

Listar todos los chats del usuario ordenados por fecha de última actividad descendente.

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **URL** | `/api/chats` |
| **Path params** | — |
| **Query params** | — |

**Response body** `200 OK`

```json
[
  {
    "chatId": 12,
    "title": "Aprendiendo Docker",
    "messageCount": 4,
    "createdAt": "2026-06-10T14:00:00Z",
    "updatedAt": "2026-06-10T15:30:00Z"
  },
  {
    "chatId": 8,
    "title": "Spring Boot con JPA",
    "messageCount": 7,
    "createdAt": "2026-06-08T09:00:00Z",
    "updatedAt": "2026-06-09T11:00:00Z"
  }
]
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Lista obtenida correctamente |

---

### `GET /api/chats/{chatId}`

Obtener un chat completo con todos sus mensajes.

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **URL** | `/api/chats/{chatId}` |
| **Path params** | `chatId` — ID del chat |
| **Query params** | — |

**Response body** `200 OK`

```json
{
  "chatId": 12,
  "title": "Aprendiendo Docker",
  "createdAt": "2026-06-10T14:00:00Z",
  "updatedAt": "2026-06-10T15:30:00Z",
  "messages": [
    {
      "messageId": 15,
      "originalPrompt": "Explícame Docker",
      "enrichedPrompt": "Eres un desarrollador Java con nivel principiante en Docker...",
      "appliedInferences": ["backend_developer", "needs_docker", "use_java_examples"],
      "aiResponse": "Docker es una plataforma de contenedores que...",
      "createdAt": "2026-06-10T14:05:00Z"
    }
  ]
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Chat obtenido correctamente |
| `404` | Chat no encontrado |

---

### `PATCH /api/chats/{chatId}`

Renombrar un chat existente.

| Campo | Valor |
|---|---|
| **Método** | `PATCH` |
| **URL** | `/api/chats/{chatId}` |
| **Path params** | `chatId` — ID del chat |

**Request body**

```json
{
  "title": "Docker para backend developers"
}
```

**Response body** `200 OK`

```json
{
  "chatId": 12,
  "title": "Docker para backend developers",
  "updatedAt": "2026-06-10T16:00:00Z"
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Chat renombrado correctamente |
| `400` | Request inválido |
| `404` | Chat no encontrado |

---

### `DELETE /api/chats/{chatId}`

Eliminar un chat y todos sus mensajes asociados.

| Campo | Valor |
|---|---|
| **Método** | `DELETE` |
| **URL** | `/api/chats/{chatId}` |
| **Path params** | `chatId` — ID del chat |

**Response body** — vacío

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `204` | Chat eliminado correctamente |
| `404` | Chat no encontrado |

> **Nota:** La eliminación es permanente e incluye todos los mensajes del chat.

---

## 5. ExpertSystemController

### `POST /api/chats/{chatId}/messages/enrich`

**Caso de uso principal del sistema.** Recibe el prompt original del usuario, consulta su perfil en PostgreSQL, ejecuta las inferencias en Prolog y devuelve el prompt enriquecido junto con las inferencias aplicadas. En esta etapa **no se consulta ningún modelo de IA**.

> **Usuario:** se deriva del **dueño del chat** (`chat.user`). Este endpoint **no** requiere el header `X-User-Id`. Así, dos chats de usuarios distintos producen prompts enriquecidos distintos para la misma consulta (cada uno usa su perfil real).

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/chats/{chatId}/messages/enrich` |
| **Path params** | `chatId` — ID del chat al que pertenecerá el mensaje |

**Request body**

```json
{
  "prompt": "Explícame Docker"
}
```

**Response body** `201 Created`

```json
{
  "messageId": 15,
  "chatId": 12,
  "originalPrompt": "Explícame Docker",
  "appliedInferences": [
    "backend_developer",
    "needs_docker",
    "use_java_examples"
  ],
  "enrichedPrompt": "El usuario es estudiante universitario de tercer año que trabaja en IT y tiene nivel avanzado en Java (8/10) pero nivel inicial en Docker (2/10). Explícame Docker desde una perspectiva de backend Java, usando Maven y el ecosistema JVM como punto de referencia.",
  "aiResponse": null,
  "createdAt": "2026-06-10T14:05:00Z"
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `201` | Prompt enriquecido generado y mensaje persistido |
| `400` | Prompt vacío o request inválido |
| `404` | Chat no encontrado |
| `503` | Servicio Prolog no disponible |

> **Notas importantes:**
> - El mensaje se persiste en la base de datos con `aiResponse: null`.
> - El `messageId` devuelto es el que debe usarse para llamar a `POST /api/messages/{messageId}/send` si el usuario decide enviar el prompt a la IA.
> - El estado completo y actualizado del mensaje siempre puede obtenerse mediante `GET /api/chats/{chatId}`, que devuelve la conversación completa con todos sus mensajes.
> - El frontend debe mostrar el pipeline de progreso durante esta llamada (ver ADR-008).

---

## 6. AIController

### `POST /api/messages/{messageId}/send`

Enviar el prompt enriquecido de un mensaje existente al modelo de IA configurado. La respuesta se persiste en el mensaje y se devuelve al frontend.

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/messages/{messageId}/send` |
| **Path params** | `messageId` — ID del mensaje a enviar |
| **Request body** | — |

**Response body** `200 OK`

```json
{
  "messageId": 15,
  "response": "Docker es una plataforma de contenedores que permite empaquetar aplicaciones junto con sus dependencias en unidades aisladas llamadas contenedores. Pensándolo desde Java: es similar a tener un JAR ejecutable, pero que incluye también el JDK, el sistema operativo y todas las dependencias del sistema..."
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Respuesta recibida y persistida correctamente |
| `404` | Mensaje no encontrado |
| `409` | El mensaje ya tiene una respuesta de IA (usar `/retry`) |
| `503` | Servicio de IA no disponible |

> **Nota:** Solo puede llamarse a este endpoint si el mensaje ya tiene un `enrichedPrompt`. Si `enrichedPrompt` es null, el backend responderá con `400`.

---

### `POST /api/messages/{messageId}/retry`

Reintentar la generación de la respuesta de IA para un mensaje que ya fue enviado anteriormente. Sobrescribe la respuesta anterior.

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **URL** | `/api/messages/{messageId}/retry` |
| **Path params** | `messageId` — ID del mensaje |
| **Request body** | — |

**Response body** `200 OK`

```json
{
  "messageId": 15,
  "response": "Docker es una plataforma de contenedores..."
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Nueva respuesta generada y persistida correctamente |
| `404` | Mensaje no encontrado |
| `503` | Servicio de IA no disponible |

---

## 7. Modelos de Datos

### `ProfileResponse`

```json
{
  "userId": 1,
  "name": "string",
  "email": "string",
  "educationLevel": "SECONDARY_STUDENT | TERTIARY_STUDENT | UNIVERSITY_STUDENT | GRADUATED | POSTGRADUATE",
  "studyYear": "integer | null",
  "worksInIT": "boolean",
  "skills": ["SkillResponse"],
  "createdAt": "ISO-8601"
}
```

> **`studyYear`** solo aplica cuando `educationLevel` es `SECONDARY_STUDENT`, `TERTIARY_STUDENT` o `UNIVERSITY_STUDENT`. En cualquier otro caso debe ser `null`.

---

### `SkillResponse`

```json
{
  "skillId": 1,
  "name": "string",
  "level": "integer (1–10)"
}
```

> El campo `category` se omite de las respuestas del perfil. Está disponible únicamente en el catálogo (`GET /api/skills`) donde no lleva `level`, ya que el nivel es siempre relativo al usuario.

---

### `UpdateSkillLevelRequest`

```json
{
  "level": "integer (1–10)"
}
```

---

### `RegisterUserRequest`

```json
{
  "name": "string",
  "email": "string (formato email, único)",
  "password": "string (texto plano — demo)"
}
```

---

### `RegisterUserResponse`

```json
{
  "userId": 5,
  "onboardingComplete": false
}
```

---

### `LoginRequest`

```json
{
  "email": "string",
  "password": "string (texto plano — demo)"
}
```

---

### `LoginResponse`

```json
{
  "userId": 5,
  "name": "string",
  "email": "string",
  "onboardingComplete": true
}
```

---

### `CreateUserRequest`

```json
{
  "name": "string",
  "email": "string (formato email, único)"
}
```

---

### `CreateUserResponse`

```json
{
  "userId": 2,
  "name": "string",
  "email": "string"
}
```

---

### `OnboardingRequest`

```json
{
  "educationLevel": "SECONDARY_STUDENT | TERTIARY_STUDENT | UNIVERSITY_STUDENT | GRADUATED | POSTGRADUATE",
  "studyYear": "integer | null",
  "worksInIT": "boolean",
  "skills": [
    { "skillId": "integer", "level": "integer (1–10)" }
  ]
}
```

---

### `UserResponse`

`onboardingComplete` es calculado (no persistido). Los campos de perfil pueden ser `null` antes de completar el onboarding.

```json
{
  "userId": 2,
  "name": "string",
  "email": "string",
  "educationLevel": "EducationLevel | null",
  "studyYear": "integer | null",
  "worksInIT": "boolean | null",
  "onboardingComplete": false,
  "skills": ["SkillResponse"]
}
```

---

### `ChatResponse`

```json
{
  "chatId": 1,
  "title": "string",
  "messageCount": 0,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

---

### `ChatDetailResponse`

Extiende `ChatResponse` incluyendo el listado de mensajes.

```json
{
  "chatId": 1,
  "title": "string",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "messages": ["MessageResponse"]
}
```

---

### `CreateChatRequest`

```json
{
  "title": "string"
}
```

---

### `RenameChatRequest`

```json
{
  "title": "string"
}
```

---

### `MessageResponse`

```json
{
  "messageId": 1,
  "chatId": 1,
  "originalPrompt": "string",
  "appliedInferences": ["string"],
  "enrichedPrompt": "string",
  "aiResponse": "string | null",
  "createdAt": "ISO-8601"
}
```

---

### `EnrichPromptRequest`

```json
{
  "prompt": "string"
}
```

---

### `EnrichPromptResponse`

```json
{
  "messageId": 1,
  "chatId": 1,
  "originalPrompt": "string",
  "appliedInferences": ["string"],
  "enrichedPrompt": "string",
  "aiResponse": null,
  "createdAt": "ISO-8601"
}
```

---

### `SendMessageResponse`

```json
{
  "messageId": 1,
  "response": "string"
}
```

---

### `ErrorResponse`

```json
{
  "status": 0,
  "error": "string",
  "message": "string",
  "timestamp": "ISO-8601"
}
```

---

## 8. Flujos Principales

### Flujo de enriquecimiento

```mermaid
sequenceDiagram
    participant React
    participant Spring as Spring Boot
    participant PG as PostgreSQL
    participant Prolog as SWI-Prolog

    React->>Spring: POST /api/chats/{chatId}/messages/enrich { prompt }
    Spring->>PG: SELECT perfil del usuario
    PG-->>Spring: UserProfile
    Spring->>Prolog: POST /infer { prompt, userProfile }
    Prolog-->>Spring: { inferences, recommendations, additionalContext }
    Spring->>Spring: Construir enrichedPrompt
    Spring->>PG: INSERT Message (originalPrompt, appliedInferences, enrichedPrompt)
    Spring-->>React: EnrichPromptResponse { messageId, enrichedPrompt, appliedInferences }
```

> El frontend debe mostrar el progreso de cada etapa al usuario durante esta llamada (ver ADR-008).

---

### Flujo de envío a IA

```mermaid
sequenceDiagram
    participant React
    participant Spring as Spring Boot
    participant PG as PostgreSQL
    participant AI as Modelo de IA

    React->>Spring: POST /api/messages/{messageId}/send
    Spring->>PG: SELECT Message (enrichedPrompt)
    PG-->>Spring: Message
    Spring->>AI: enrichedPrompt
    AI-->>Spring: Respuesta generada
    Spring->>PG: UPDATE Message (aiResponse)
    Spring-->>React: SendMessageResponse { messageId, response }
```

---

### Flujo completo de una conversación

```mermaid
sequenceDiagram
    participant React
    participant Spring as Spring Boot

    React->>Spring: POST /api/chats
    Spring-->>React: ChatResponse { chatId }

    React->>Spring: GET /api/chats/{chatId}
    Spring-->>React: ChatDetailResponse { chatId, messages[] }

    React->>Spring: POST /api/chats/{chatId}/messages/enrich { prompt }
    Spring-->>React: EnrichPromptResponse { messageId, enrichedPrompt, appliedInferences }

    Note over React: Usuario revisa el prompt enriquecido (puede editarlo)

    React->>Spring: POST /api/messages/{messageId}/send
    Spring-->>React: SendMessageResponse { messageId, response }

    React->>Spring: GET /api/chats/{chatId}
    Spring-->>React: ChatDetailResponse actualizado con aiResponse
```

---

## 9. Endpoints Internos de Prolog

> ⚠️ **Esta sección documenta la interfaz interna entre Spring Boot y el servicio SWI-Prolog.**  
> Estos endpoints **no forman parte del contrato con el frontend** y el cliente React nunca debe llamarlos directamente.  
> Se documentan aquí únicamente como referencia para el equipo de backend.

---

### `POST /infer`

Ejecutar las reglas de inferencia del sistema experto sobre el perfil del usuario y el prompt recibido.

**Consumidor:** Spring Boot (exclusivamente)  
**Proveedor:** Servicio SWI-Prolog

**Request body**

```json
{
  "prompt": "Explícame Docker",
  "userProfile": {
    "educationLevel": "UNIVERSITY_STUDENT",
    "studyYear": 3,
    "worksInIT": true,
    "skills": [
      {
        "name": "Java",
        "level": 8
      },
      {
        "name": "Docker",
        "level": 2
      }
    ]
  }
}
```

**Response body** `200 OK`

```json
{
  "inferences": [
    "backend_developer",
    "needs_docker",
    "use_java_examples"
  ],
  "recommendations": [
    "Usar analogía con máquinas virtuales",
    "Incluir ejemplo con docker run",
    "Contextualizar desde el ecosistema Java"
  ],
  "additionalContext": "Nivel principiante confirmado. Usuario familiarizado con Maven, se puede referenciar como analogía de gestión de dependencias."
}
```

**Códigos HTTP**

| Código | Descripción |
|---|---|
| `200` | Inferencias generadas correctamente |
| `400` | Request malformado |
| `500` | Error interno en el motor de inferencia |

> **Notas:**
> - Spring Boot es el único cliente autorizado de este endpoint.
> - Prolog no accede a PostgreSQL. Todos los datos del perfil deben ser provistos por Spring Boot en el request (ver ADR-006).
> - La comunicación ocurre dentro de la red interna de Docker Compose mediante el nombre del servicio.

---

*Documento generado el 2026-06-10. Para modificaciones, coordinar con ambos equipos (frontend y backend) antes de aplicar cambios que afecten el contrato.*
