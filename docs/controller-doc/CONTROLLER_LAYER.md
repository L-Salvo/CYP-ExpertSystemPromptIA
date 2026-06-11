# Capa Controller — Spring Boot

**Proyecto:** Sistema Experto para Personalización Inteligente de Prompts  
**Versión:** 1.0  
**Fecha:** 2026-06-10  
**Estado:** Esqueleto compilable — mocks activos, servicios pendientes

---

## Índice

1. [Resumen](#1-resumen)
2. [Stack y dependencias](#2-stack-y-dependencias)
3. [Estructura de paquetes](#3-estructura-de-paquetes)
4. [Enums](#4-enums)
5. [DTOs Request](#5-dtos-request)
6. [DTOs Response](#6-dtos-response)
7. [Controllers](#7-controllers)
   - [ProfileController](#profilecontroller)
   - [SkillController](#skillcontroller)
   - [ChatController](#chatcontroller)
   - [ExpertSystemController](#expertsystemcontroller)
   - [AIController](#aicontroller)
8. [Configuración](#8-configuración)
9. [Convenciones aplicadas](#9-convenciones-aplicadas)
10. [Próximos pasos](#10-próximos-pasos)

---

## 1. Resumen

Esta capa representa el **esqueleto compilable de la API REST** del backend Spring Boot. Su único propósito en esta etapa es congelar el contrato entre el frontend (React) y el backend, de modo que ambos equipos puedan trabajar en paralelo.

Todos los endpoints devuelven **respuestas mock** con datos de ejemplo extraídos del `API_CONTRACT.md`. No contiene lógica de negocio, acceso a base de datos, integración con Prolog ni integración con IA.

---

## 2. Stack y dependencias

| Tecnología | Versión |
|---|---|
| Java | 21 |
| Spring Boot | 4.0.6 |
| spring-boot-starter-webmvc | (incluido en Spring Boot) |
| spring-boot-starter-validation | (incluido en Spring Boot) |
| springdoc-openapi-starter-webmvc-ui | 2.8.9 |
| Lombok | (incluido en Spring Boot) |

> **Nota:** Si `springdoc-openapi 2.8.9` presenta incompatibilidades con Spring Boot 4.x en runtime, actualizar a springdoc 3.x cuando esté disponible. Las anotaciones Swagger (`@Tag`, `@Operation`, `@ApiResponse`) no cambian entre versiones.

---

## 3. Estructura de paquetes

```
src/main/java/com/cyp/prompt/expert_backend/
├── config/
│   ├── OpenApiConfig.java
│   └── SecurityConfig.java
├── controller/
│   ├── AIController.java
│   ├── ChatController.java
│   ├── ExpertSystemController.java
│   ├── ProfileController.java
│   └── SkillController.java
├── dto/
│   ├── request/
│   │   ├── CreateChatRequest.java
│   │   ├── EnrichPromptRequest.java
│   │   ├── RenameChatRequest.java
│   │   └── UpdateSkillLevelRequest.java
│   └── response/
│       ├── ChatDetailResponse.java
│       ├── ChatResponse.java
│       ├── EnrichPromptResponse.java
│       ├── ErrorResponse.java
│       ├── MessageResponse.java
│       ├── ProfileResponse.java
│       ├── RenameChatResponse.java
│       ├── SendMessageResponse.java
│       ├── SkillCatalogResponse.java
│       └── SkillResponse.java
└── enums/
    └── EducationLevel.java
```

**No generado intencionalmente:** `service/`, `repository/`, `entity/`

---

## 4. Enums

### `EducationLevel`

Representa el nivel de educación del usuario. Usado en `ProfileResponse` y como parte del perfil que el sistema experto envía a Prolog.

| Valor | Descripción |
|---|---|
| `SECONDARY_STUDENT` | Estudiante secundario |
| `TERTIARY_STUDENT` | Estudiante terciario |
| `UNIVERSITY_STUDENT` | Estudiante universitario |
| `GRADUATED` | Graduado |
| `POSTGRADUATE` | Posgrado |

> El campo `studyYear` en `ProfileResponse` solo aplica cuando el valor es `SECONDARY_STUDENT`, `TERTIARY_STUDENT` o `UNIVERSITY_STUDENT`. En los demás casos debe ser `null`.

---

## 5. DTOs Request

Todos los DTOs de request están implementados como **Java records**. Todos aplican Jakarta Validation.

### `UpdateSkillLevelRequest`

Usado en `PUT /api/profile/skills/{skillId}`.

| Campo | Tipo | Validaciones |
|---|---|---|
| `level` | `Integer` | `@NotNull`, `@Min(1)`, `@Max(10)` |

### `CreateChatRequest`

Usado en `POST /api/chats`.

| Campo | Tipo | Validaciones |
|---|---|---|
| `title` | `String` | `@NotBlank`, `@Size(max=255)` |

### `RenameChatRequest`

Usado en `PATCH /api/chats/{chatId}`.

| Campo | Tipo | Validaciones |
|---|---|---|
| `title` | `String` | `@NotBlank`, `@Size(max=255)` |

### `EnrichPromptRequest`

Usado en `POST /api/chats/{chatId}/messages/enrich`.

| Campo | Tipo | Validaciones |
|---|---|---|
| `prompt` | `String` | `@NotBlank`, `@Size(max=4000)` |

---

## 6. DTOs Response

Todos los DTOs de response están implementados como **Java records**. Usan `Instant` para fechas (formato ISO-8601).

### `ProfileResponse`

Respuesta completa del perfil del usuario.

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | `Long` | |
| `name` | `String` | |
| `email` | `String` | |
| `educationLevel` | `EducationLevel` | Enum |
| `studyYear` | `Integer` | Nullable |
| `worksInIT` | `Boolean` | |
| `skills` | `List<SkillResponse>` | |
| `createdAt` | `Instant` | |

### `SkillResponse`

Skill asociada al perfil del usuario, con nivel de conocimiento. Usada dentro de `ProfileResponse` y como respuesta de `PUT /api/profile/skills/{skillId}`.

| Campo | Tipo |
|---|---|
| `skillId` | `Long` |
| `name` | `String` |
| `level` | `Integer` (1–10) |

### `SkillCatalogResponse`

Skill del catálogo global. Usada en `GET /api/skills`. No incluye `level` (el nivel es relativo al usuario), incluye `category`.

| Campo | Tipo |
|---|---|
| `skillId` | `Long` |
| `name` | `String` |
| `category` | `SkillCategory` (enum serializado como `String` en JSON: `BACKEND`, `FRONTEND`, `DATABASE`, `DEVOPS`, `CLOUD`, `PROGRAMMING_LANGUAGE`, `OTHER`) |

### `ChatResponse`

Resumen de un chat sin mensajes. Usado en `POST /api/chats` y `GET /api/chats`.

| Campo | Tipo |
|---|---|
| `chatId` | `Long` |
| `title` | `String` |
| `messageCount` | `Integer` |
| `createdAt` | `Instant` |
| `updatedAt` | `Instant` |

### `ChatDetailResponse`

Chat completo con mensajes. Usado en `GET /api/chats/{chatId}`.

| Campo | Tipo |
|---|---|
| `chatId` | `Long` |
| `title` | `String` |
| `createdAt` | `Instant` |
| `updatedAt` | `Instant` |
| `messages` | `List<MessageResponse>` |

### `RenameChatResponse`

Respuesta al renombrar un chat. Devuelve solo los campos afectados. Usado en `PATCH /api/chats/{chatId}`.

| Campo | Tipo |
|---|---|
| `chatId` | `Long` |
| `title` | `String` |
| `updatedAt` | `Instant` |

### `MessageResponse`

Representa un mensaje dentro de un chat con todo su ciclo de vida: prompt original → inferencias → prompt enriquecido → respuesta IA.

| Campo | Tipo | Notas |
|---|---|---|
| `messageId` | `Long` | |
| `chatId` | `Long` | |
| `originalPrompt` | `String` | |
| `appliedInferences` | `List<String>` | Inferencias de Prolog |
| `enrichedPrompt` | `String` | |
| `aiResponse` | `String` | Nullable |
| `createdAt` | `Instant` | |

### `EnrichPromptResponse`

Respuesta del sistema experto tras enriquecer un prompt. `aiResponse` siempre es `null` en esta etapa (ver ADR-002 y ADR-005). Usado en `POST /api/chats/{chatId}/messages/enrich`.

| Campo | Tipo | Notas |
|---|---|---|
| `messageId` | `Long` | ID a usar en `/send` |
| `chatId` | `Long` | |
| `originalPrompt` | `String` | |
| `appliedInferences` | `List<String>` | |
| `enrichedPrompt` | `String` | |
| `aiResponse` | `String` | Siempre `null` aquí |
| `createdAt` | `Instant` | |

### `SendMessageResponse`

Respuesta de la IA. Usado en `POST /api/messages/{messageId}/send` y `POST /api/messages/{messageId}/retry`.

| Campo | Tipo |
|---|---|
| `messageId` | `Long` |
| `response` | `String` |

### `ErrorResponse`

Estructura estándar de error para todos los endpoints.

| Campo | Tipo | Ejemplo |
|---|---|---|
| `status` | `int` | `404` |
| `error` | `String` | `"Not Found"` |
| `message` | `String` | `"Chat not found with id: 42"` |
| `timestamp` | `Instant` | `"2026-06-10T14:30:00Z"` |

---

## 7. Controllers

### `ProfileController`

**Base path:** `/api/profile`  
**Tag Swagger:** `Profile`

| Método | Path | Descripción | Request | Response | Códigos HTTP |
|---|---|---|---|---|---|
| `GET` | `/api/profile` | Obtener perfil del usuario | — | `ProfileResponse` | 200, 404 |
| `PUT` | `/api/profile/skills/{skillId}` | Actualizar nivel de una skill | `UpdateSkillLevelRequest` | `SkillResponse` | 200, 400, 404 |

---

### `SkillController`

**Base path:** `/api/skills`  
**Tag Swagger:** `Skills`

| Método | Path | Descripción | Query params | Response | Códigos HTTP |
|---|---|---|---|---|---|
| `GET` | `/api/skills` | Listar catálogo de skills | `category` (opcional, `String`; el `SkillService` lo normaliza a `SkillCategory` con `toUpperCase`) | `List<SkillCatalogResponse>` | 200 |

---

### `ChatController`

**Base path:** `/api/chats`  
**Tag Swagger:** `Chats`

| Método | Path | Descripción | Request | Response | Códigos HTTP |
|---|---|---|---|---|---|
| `POST` | `/api/chats` | Crear chat | `CreateChatRequest` | `ChatResponse` | 201, 400 |
| `GET` | `/api/chats` | Listar chats | — | `List<ChatResponse>` | 200 |
| `GET` | `/api/chats/{chatId}` | Obtener chat completo con mensajes | — | `ChatDetailResponse` | 200, 404 |
| `PATCH` | `/api/chats/{chatId}` | Renombrar chat | `RenameChatRequest` | `RenameChatResponse` | 200, 400, 404 |
| `DELETE` | `/api/chats/{chatId}` | Eliminar chat y sus mensajes | — | — (vacío) | 204, 404 |

---

### `ExpertSystemController`

**Base path:** `/api/chats`  
**Tag Swagger:** `Expert System`

Este controller comparte base path con `ChatController` por coherencia semántica (`/api/chats/{chatId}/messages/enrich`). Spring los resuelve sin conflicto porque el path completo es distinto.

| Método | Path | Descripción | Request | Response | Códigos HTTP |
|---|---|---|---|---|---|
| `POST` | `/api/chats/{chatId}/messages/enrich` | Enriquecer prompt con sistema experto | `EnrichPromptRequest` | `EnrichPromptResponse` | 201, 400, 404, 503 |

**Flujo interno (a implementar con servicios):**
1. Recuperar perfil del usuario desde PostgreSQL.
2. Enviar perfil + prompt al servicio Prolog (`POST /infer`).
3. Construir el prompt enriquecido con las inferencias recibidas.
4. Persistir el mensaje con `aiResponse: null`.
5. Devolver `EnrichPromptResponse` con el `messageId`.

El `messageId` devuelto es el identificador que el frontend debe conservar para llamar a `POST /api/messages/{messageId}/send`.

---

### `AIController`

**Base path:** `/api/messages`  
**Tag Swagger:** `AI`

| Método | Path | Descripción | Request | Response | Códigos HTTP |
|---|---|---|---|---|---|
| `POST` | `/api/messages/{messageId}/send` | Enviar prompt enriquecido a la IA | — | `SendMessageResponse` | 200, 400, 404, 409, 503 |
| `POST` | `/api/messages/{messageId}/retry` | Reintentar generación de respuesta IA | — | `SendMessageResponse` | 200, 404, 503 |

**Diferencia entre `/send` y `/retry`:**

- `/send` — solo válido si `aiResponse` es `null`. Si ya existe respuesta, devuelve `409 Conflict`.
- `/retry` — sobrescribe la respuesta existente. Válido en cualquier estado.

---

## 8. Configuración

### `SecurityConfig`

Spring Security está deshabilitado temporalmente. Todos los endpoints son públicos (`permitAll()`). CSRF deshabilitado.

```java
// TODO: Implementar autenticación (JWT / OAuth2) — fuera del alcance v1
```

### `OpenApiConfig`

Configura los metadatos del Swagger UI:

- **Título:** Sistema Experto para Personalización de Prompts — API
- **Versión:** v1
- **URL Swagger UI:** `http://localhost:8080/swagger-ui/index.html` (por defecto de springdoc)

---

## 9. Convenciones aplicadas

**Records para DTOs:** todos los DTOs de request y response son `record` de Java. No requieren Lombok. Son inmutables por diseño.

**Jakarta Validation en requests:** `@Valid` se aplica en todos los parámetros de request body en los controllers. Las validaciones se declaran en los propios records.

**`Instant` para fechas:** todas las fechas usan `java.time.Instant`, que serializa a ISO-8601 con zona UTC. Compatible con el formato definido en el contrato (`2026-06-10T14:30:00Z`).

**Swagger en todos los endpoints:** cada endpoint tiene `@Operation`, `@ApiResponse` y `@Parameter` donde corresponde. Cada controller tiene `@Tag`.

**Separación SkillResponse / SkillCatalogResponse:** el contrato define que en el perfil la skill lleva `level` y en el catálogo lleva `category`. Se crearon dos records separados para respetar exactamente la forma de cada respuesta.

**`@RequestMapping` compartido:** `ExpertSystemController` y `ChatController` comparten base path `/api/chats`. Spring MVC los distingue por el path completo del método.

---

## 10. Próximos pasos

Los siguientes componentes deben implementarse en iteraciones posteriores, conectando cada controller con su service correspondiente:

| Componente | Controller que lo consume |
|---|---|
| `ProfileService` | `ProfileController` |
| `SkillService` | `SkillController`, `ProfileController` |
| `ChatService` | `ChatController` |
| `ExpertSystemService` | `ExpertSystemController` |
| `AIService` | `AIController` |
| `PrologClient` (RestClient/WebClient) | `ExpertSystemService` |
| `AIClient` (RestClient/WebClient) | `AIService` |
| Entidades JPA (`User`, `Chat`, `Message`, `Skill`) | Repositories |
| `GlobalExceptionHandler` (`@ControllerAdvice`) | Todos — para formatear `ErrorResponse` |
| Autenticación JWT / OAuth2 | `SecurityConfig` |

---

*Documento generado el 2026-06-10. Actualizar a medida que se implementen los servicios.*
