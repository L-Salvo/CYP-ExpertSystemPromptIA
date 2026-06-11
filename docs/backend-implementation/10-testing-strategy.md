# 10 — Testing Strategy

**Fuente:** `CONTROLLER_LAYER.md`, `06-service-layer.md`  
**Framework:** JUnit 5 + Spring Boot Test + Mockito

---

## Pirámide de testing

```
           ┌─────────────────────┐
           │   E2E / Manual      │  ← Docker Compose levantado, pruebas manuales
           └─────────────────────┘
         ┌───────────────────────────┐
         │   Integration Tests       │  ← @SpringBootTest + base de datos real
         └───────────────────────────┘
       ┌─────────────────────────────────┐
       │   Controller Tests (MockMvc)    │  ← @WebMvcTest + servicios mockeados
       └─────────────────────────────────┘
     ┌─────────────────────────────────────────┐
     │        Unit Tests                       │  ← JUnit 5 + Mockito, sin Spring
     └─────────────────────────────────────────┘
```

---

## Dependencias necesarias en `pom.xml`

Las siguientes dependencias ya están presentes o deben agregarse:

```
spring-boot-starter-webmvc-test     ← MockMvc, @WebMvcTest
spring-boot-starter-data-jpa-test   ← @DataJpaTest
spring-boot-starter-security-test   ← @WithMockUser
H2 (scope test)                     ← base de datos en memoria para tests de repositorios
  → <dependency groupId="com.h2database" artifactId="h2" scope="test" />
```

---

## Estructura de paquetes de test

```
src/test/java/com/cyp/prompt/expert_backend/
├── unit/
│   ├── service/
│   │   ├── ProfileServiceTest.java
│   │   ├── SkillServiceTest.java
│   │   ├── ChatServiceTest.java
│   │   ├── ExpertSystemServiceTest.java
│   │   └── AIServiceTest.java
│   └── service/prompt/
│       └── PromptBuilderTest.java
├── controller/
│   ├── ProfileControllerTest.java
│   ├── SkillControllerTest.java
│   ├── ChatControllerTest.java
│   ├── ExpertSystemControllerTest.java
│   └── AIControllerTest.java
├── repository/
│   ├── UserRepositoryTest.java
│   ├── ChatRepositoryTest.java
│   └── MessageRepositoryTest.java
└── integration/
    └── EnrichmentFlowIntegrationTest.java
```

---

## 1. Unit Tests de Servicios

**Anotaciones:** ninguna anotación de Spring. Solo JUnit 5 y Mockito.  
**Dependencias:** todos los colaboradores (repositorios, clientes) se mockean con `@Mock` / `when(...).thenReturn(...)`.

### `ProfileServiceTest`

| Método a testear | Escenario | Verificación |
|---|---|---|
| `getProfile` | Usuario existe con skills | Devuelve `ProfileResponse` con skills correctas |
| `getProfile` | Usuario no existe | Lanza `ResourceNotFoundException` |
| `updateSkillLevel` | UserSkill existente | Actualiza nivel, devuelve `SkillResponse` correcta |
| `updateSkillLevel` | UserSkill nueva | Crea nueva UserSkill, devuelve `SkillResponse` correcta |
| `updateSkillLevel` | Skill no existe | Lanza `ResourceNotFoundException` |

### `ChatServiceTest`

| Método a testear | Escenario | Verificación |
|---|---|---|
| `createChat` | Datos válidos | Devuelve `ChatResponse` con `messageCount=0` |
| `getChats` | Usuario con chats | Devuelve lista ordenada por `updatedAt` DESC |
| `getChats` | Usuario sin chats | Devuelve lista vacía |
| `getChatById` | Chat existe y pertenece al usuario | Devuelve `ChatDetailResponse` con mensajes |
| `getChatById` | Chat no existe | Lanza `ResourceNotFoundException` |
| `renameChat` | Datos válidos | Devuelve `RenameChatResponse` con nuevo título |
| `deleteChat` | Chat existe | Llama a `chatRepository.delete` |

### `ExpertSystemServiceTest`

| Método a testear | Escenario | Verificación |
|---|---|---|
| `enrichPrompt` | Flujo completo exitoso | Persiste Message, actualiza updatedAt, devuelve `EnrichPromptResponse` correcto |
| `enrichPrompt` | Chat no encontrado | Lanza `ResourceNotFoundException` |
| `enrichPrompt` | Prolog lanza excepción | Lanza `ExternalServiceException`, no persiste nada |
| `enrichPrompt` | `appliedInferences` vacíos | Maneja lista vacía correctamente |

### `AIServiceTest`

| Método a testear | Escenario | Verificación |
|---|---|---|
| `sendMessage` | `aiResponse == null` | Llama AI, persiste, devuelve `SendMessageResponse` |
| `sendMessage` | `aiResponse != null` | Lanza `ConflictException` (409) |
| `sendMessage` | Mensaje no encontrado | Lanza `ResourceNotFoundException` |
| `sendMessage` | AI no disponible | Lanza `ExternalServiceException` |
| `retryMessage` | Con o sin `aiResponse` | Siempre llama AI y sobreescribe |

### `PromptBuilderTest`

| Método | Escenario | Verificación |
|---|---|---|
| `buildPrologRequest` | Usuario universitario con 2 skills | `PrologRequest` contiene todos los campos correctos |
| `buildPrologRequest` | Usuario sin skills | Lista de skills vacía en el request |
| `buildEnrichedPrompt` | Con inferencias y recomendaciones | El prompt contiene el texto original al final |
| `buildEnrichedPrompt` | Inferencias vacías | No lanza excepción; devuelve prompt básico con contexto de usuario |

---

## 2. Controller Tests (MockMvc)

**Anotación:** `@WebMvcTest(XxxController.class)`  
**Comportamiento:** levanta solo el contexto web (sin JPA, sin servicios reales). El servicio se mockea con `@MockBean`.

### `ProfileControllerTest`

```
@WebMvcTest(ProfileController.class)

GET /api/profile
  → 200 OK: servicio devuelve ProfileResponse mock → verificar campos en JSON
  → 404 Not Found: servicio lanza ResourceNotFoundException → verificar estructura ErrorResponse

PUT /api/profile/skills/{skillId}
  → 200 OK: request válido (level=5)
  → 400 Bad Request: level=0 (falla @Min(1))
  → 400 Bad Request: level=11 (falla @Max(10))
  → 400 Bad Request: level=null (falla @NotNull)
  → 404 Not Found: servicio lanza ResourceNotFoundException
```

### `ChatControllerTest`

```
@WebMvcTest(ChatController.class)

POST /api/chats
  → 201 Created: body válido
  → 400 Bad Request: title vacío

GET /api/chats
  → 200 OK: lista con chatId, title, messageCount, timestamps

GET /api/chats/{chatId}
  → 200 OK: ChatDetailResponse con mensajes
  → 404 Not Found

PATCH /api/chats/{chatId}
  → 200 OK: title actualizado
  → 400 Bad Request: title vacío
  → 404 Not Found

DELETE /api/chats/{chatId}
  → 204 No Content
  → 404 Not Found
```

### `ExpertSystemControllerTest`

```
@WebMvcTest(ExpertSystemController.class)

POST /api/chats/{chatId}/messages/enrich
  → 201 Created: body válido con appliedInferences, enrichedPrompt, aiResponse=null
  → 400 Bad Request: prompt vacío
  → 404 Not Found: chat no encontrado
  → 503 Service Unavailable: Prolog no disponible
```

### `AIControllerTest`

```
@WebMvcTest(AIController.class)

POST /api/messages/{messageId}/send
  → 200 OK: respuesta de IA correcta
  → 404 Not Found: mensaje no encontrado
  → 409 Conflict: mensaje ya tiene aiResponse
  → 503 Service Unavailable: IA no disponible

POST /api/messages/{messageId}/retry
  → 200 OK: nueva respuesta
  → 404 Not Found
  → 503 Service Unavailable
```

### Configuración de seguridad en tests

Como `SecurityConfig` permite todo, los tests deben pasar sin autenticación. Si en el futuro se agrega JWT, se puede usar `@WithMockUser` de `spring-security-test`.

---

## 3. Repository Tests

**Anotación:** `@DataJpaTest`  
**Base de datos:** H2 en memoria (configurar en `application-test.properties`)  
**Comportamiento:** levanta solo el contexto JPA. Cada test corre en una transacción que se revierte al finalizar.

### `ChatRepositoryTest`

```
@DataJpaTest

findByIdAndUserId:
  → Devuelve el chat cuando id y userId son correctos
  → Devuelve Optional.empty() cuando userId no coincide (verifica ownership)

findChatsWithMessageCount:
  → Chat con 3 mensajes → messageCount=3
  → Chat sin mensajes → messageCount=0
  → Ordenados por updatedAt DESC
```

### `MessageRepositoryTest`

```
@DataJpaTest

findByChatIdOrderByCreatedAtAsc:
  → Mensajes del chat en orden cronológico correcto
  → No devuelve mensajes de otros chats

findByIdAndChatUserId:
  → Devuelve mensaje cuando messageId y userId son correctos
  → Devuelve Optional.empty() cuando userId no coincide
```

### `UserSkillRepositoryTest`

```
@DataJpaTest

findByUserId:
  → Devuelve todas las skills del usuario
  → No devuelve skills de otros usuarios

findByUserIdAndSkillId:
  → Devuelve la relación específica
  → Devuelve Optional.empty() si no existe
```

---

## 4. Integration Test

**Anotación:** `@SpringBootTest(webEnvironment = RANDOM_PORT)`  
**Base de datos:** PostgreSQL de test (via `@Testcontainers` + `@Container PostgreSQLContainer`) o H2.  
**Propósito:** verificar el flujo completo de enriquecimiento desde el HTTP request hasta la base de datos.

### `EnrichmentFlowIntegrationTest`

```
Prerrequisitos:
  - Usuario con skills persistido en DB de test
  - Chat creado para ese usuario
  - PrologClient mockeado con @MockBean (no se llama a Prolog real en tests)
  - AIClient mockeado con @MockBean

Escenario: flujo completo exitoso
  1. POST /api/chats/{chatId}/messages/enrich { "prompt": "Explícame Docker" }
  2. Verificar 201 Created
  3. Verificar que messageId en respuesta existe en la base de datos
  4. Verificar que appliedInferences y enrichedPrompt están persistidos
  5. Verificar que aiResponse es null
  6. Verificar que chat.updatedAt fue actualizado

Escenario: Prolog falla
  1. MockBean lanza ExternalServiceException
  2. Verificar 503 Service Unavailable
  3. Verificar que NO se creó ningún mensaje en la base de datos
```

---

## Convenciones para todos los tests

1. **Nombres de métodos:** `methodName_scenario_expectedBehavior` (ej: `getProfile_whenUserNotFound_throwsResourceNotFoundException`).
2. **Estructura AAA:** Arrange / Act / Assert.
3. **No usar base de datos real** en unit tests ni en controller tests.
4. **No mockear la capa que se está testeando**: los repository tests prueban contra H2, los service tests mockean los repositorios.
5. **Un assert principal por test** para claridad de error en caso de falla.

---

*Siguiente documento: `11-implementation-order.md`*
