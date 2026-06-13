# 11 — Implementation Order

**Propósito:** guía de implementación paso a paso para desarrollar el backend completo junto a Claude Code.  
**Cómo usar este documento:** cada paso es una sesión de trabajo autocontenida. Al finalizar cada paso, el proyecto debe compilar y el criterio de aceptación debe cumplirse antes de avanzar.

---

## Mapa general

```mermaid
graph LR
    P1[Paso 1<br/>application.properties] --> P2[Paso 2<br/>Entidades JPA]
    P2 --> P3[Paso 3<br/>Converter]
    P3 --> P4[Paso 4<br/>Repositories]
    P4 --> P5[Paso 5<br/>Excepciones + Handler]
    P5 --> P6[Paso 6<br/>ProfileService + SkillService]
    P6 --> P7[Paso 7<br/>ChatService]
    P7 --> P8[Paso 8<br/>Conectar controllers básicos]
    P8 --> P9[Paso 9<br/>PrologClient + DTOs]
    P9 --> P10[Paso 10<br/>PromptBuilder]
    P10 --> P11[Paso 11<br/>ExpertSystemService]
    P11 --> P12[Paso 12<br/>AIClient]
    P12 --> P13[Paso 13<br/>AIService]
    P13 --> P14[Paso 14<br/>Conectar controllers restantes]
    P14 --> P15[Paso 15<br/>data.sql seed]
    P15 --> P16[Paso 16<br/>Actuator]
    P16 --> P17[Paso 17<br/>Tests unitarios]
    P17 --> P18[Paso 18<br/>Tests de controllers]
    P18 --> P19[Paso 19<br/>Tests de repositorios]
    P19 --> P20[Paso 20<br/>Docker Compose]
```

---

## PASO 1 — Configuración inicial de la aplicación

**Dependencias previas:** ninguna  
**Documentos de referencia:** `09-docker-compose-architecture.md`

### Archivos a crear

```
src/main/resources/application.properties
src/main/resources/application-dev.properties
src/main/resources/application-prod.properties
```

### Contenido de `application.properties`

```properties
spring.application.name=prompt-expert-backend
server.port=8080

# JPA
spring.jpa.open-in-view=false
spring.jpa.show-sql=false

# Jackson
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.time-zone=UTC
```

### Contenido de `application-dev.properties`

```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/expert_prompts_dev
spring.datasource.username=expert_user
spring.datasource.password=expert_pass
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Prolog (mock en dev)
prolog.mock=true
prolog.service.base-url=http://localhost:8081

# AI (mock en dev)
ai.mock=true

# Logging
logging.level.com.cyp=DEBUG
```

### Contenido de `application-prod.properties`

```properties
# Se leen desde variables de entorno (Docker Compose)
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

spring.jpa.hibernate.ddl-auto=validate

prolog.service.base-url=${PROLOG_SERVICE_BASE_URL}
prolog.service.connect-timeout-ms=${PROLOG_SERVICE_CONNECT_TIMEOUT_MS:3000}
prolog.service.read-timeout-ms=${PROLOG_SERVICE_READ_TIMEOUT_MS:10000}

ai.provider.base-url=${AI_PROVIDER_BASE_URL}
ai.provider.api-key=${AI_PROVIDER_API_KEY}
ai.provider.model=${AI_PROVIDER_MODEL:gpt-4o-mini}
```

### Criterio de aceptación

```
./mvnw compile
→ Compila sin errores
→ No hay warnings de configuración
```

---

## PASO 2 — Entidades JPA

**Dependencias previas:** Paso 1  
**Documentos de referencia:** `04-jpa-layer.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/entity/User.java
src/main/java/com/cyp/prompt/expert_backend/entity/Skill.java
src/main/java/com/cyp/prompt/expert_backend/entity/UserSkill.java
src/main/java/com/cyp/prompt/expert_backend/entity/Chat.java
src/main/java/com/cyp/prompt/expert_backend/entity/Message.java
```

### Orden de creación

1. `Skill` (sin dependencias)
2. `User` (sin dependencias de otras entidades)
3. `UserSkill` (depende de `User` y `Skill`)
4. `Chat` (depende de `User`)
5. `Message` (depende de `Chat`)

### Criterio de aceptación

```
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
→ La aplicación levanta
→ Las tablas se crean en PostgreSQL (visible con psql o DBeaver)
→ No hay errores de contexto JPA
```

---

## PASO 3 — Converter

**Dependencias previas:** Paso 2  
**Documentos de referencia:** `04-jpa-layer.md` sección `StringListConverter`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/converter/StringListConverter.java
```

### Criterio de aceptación

```
./mvnw compile
→ La entidad Message con @Convert(converter=StringListConverter.class) compila correctamente
→ El campo appliedInferences se mapea a la columna TEXT
```

---

## PASO 4 — Repositories

**Dependencias previas:** Paso 2, Paso 3  
**Documentos de referencia:** `05-repository-layer.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/repository/UserRepository.java
src/main/java/com/cyp/prompt/expert_backend/repository/SkillRepository.java
src/main/java/com/cyp/prompt/expert_backend/repository/UserSkillRepository.java
src/main/java/com/cyp/prompt/expert_backend/repository/ChatRepository.java
src/main/java/com/cyp/prompt/expert_backend/repository/MessageRepository.java
```

### Orden de creación

Cualquier orden. Todos extienden `JpaRepository<T, Long>` y no tienen dependencias entre sí.

### Criterio de aceptación

```
./mvnw compile
→ Todos los repositorios compilan
→ Spring Data detecta las interfaces y genera implementaciones (visible en logs al arrancar con profile dev)
```

---

## PASO 5 — Excepciones de dominio y GlobalExceptionHandler

**Dependencias previas:** Paso 1  
**Documentos de referencia:** `06-service-layer.md` sección "Excepciones de dominio"

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/exception/ResourceNotFoundException.java
src/main/java/com/cyp/prompt/expert_backend/exception/ConflictException.java
src/main/java/com/cyp/prompt/expert_backend/exception/ExternalServiceException.java
src/main/java/com/cyp/prompt/expert_backend/exception/GlobalExceptionHandler.java
```

### Diseño de `GlobalExceptionHandler`

```
@ControllerAdvice
class GlobalExceptionHandler:

  @ExceptionHandler(ResourceNotFoundException.class)
  → 404 Not Found + ErrorResponse

  @ExceptionHandler(ConflictException.class)
  → 409 Conflict + ErrorResponse

  @ExceptionHandler(ExternalServiceException.class)
  → 503 Service Unavailable + ErrorResponse

  @ExceptionHandler(MethodArgumentNotValidException.class)
  → 400 Bad Request + ErrorResponse (con lista de errores de validación)

  @ExceptionHandler(Exception.class)
  → 500 Internal Server Error + ErrorResponse (log del stack trace)
```

### Criterio de aceptación

```
./mvnw compile
→ Las excepciones compilan
→ El GlobalExceptionHandler compila

Prueba manual (opcional):
  GET /api/profile → si el mock devuelve ProfileResponse, responde 200
  Si el servicio lanza ResourceNotFoundException → responde 404 con ErrorResponse
```

---

## PASO 6 — ProfileService y SkillService

**Dependencias previas:** Pasos 2, 3, 4, 5  
**Documentos de referencia:** `06-service-layer.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/service/ProfileService.java
src/main/java/com/cyp/prompt/expert_backend/service/SkillService.java
```

### Criterio de aceptación

```
./mvnw compile
→ Los servicios compilan con @Service y @Transactional

Prueba funcional (con datos seed en DB):
  GET /api/profile → devuelve datos reales del usuario desde PostgreSQL (no mock)
  PUT /api/profile/skills/3 { "level": 7 } → actualiza el nivel en la base de datos
  GET /api/skills → devuelve catálogo real de skills
  GET /api/skills?category=backend → filtra correctamente
```

---

## PASO 7 — ChatService

**Dependencias previas:** Pasos 4, 5  
**Documentos de referencia:** `06-service-layer.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/service/ChatService.java
```

### Criterio de aceptación

```
Prueba funcional:
  POST /api/chats { "title": "Test" } → crea chat en DB, devuelve chatId real
  GET /api/chats → lista chats con messageCount=0
  GET /api/chats/{id} → devuelve chat con messages=[]
  PATCH /api/chats/{id} { "title": "Nuevo" } → actualiza en DB
  DELETE /api/chats/{id} → elimina de DB
```

---

## PASO 8 — Conectar controllers básicos a los servicios

**Dependencias previas:** Pasos 5, 6, 7  
**Documentos de referencia:** `CONTROLLER_LAYER.md`

### Archivos a modificar

```
src/main/java/com/cyp/prompt/expert_backend/controller/ProfileController.java
  → Eliminar mock
  → Inyectar ProfileService via constructor
  → Llamar profileService.getProfile(FIXED_USER_ID)
  → Llamar profileService.updateSkillLevel(FIXED_USER_ID, skillId, request.level())

src/main/java/com/cyp/prompt/expert_backend/controller/SkillController.java
  → Eliminar mock
  → Inyectar SkillService
  → Llamar skillService.getAllSkills(category)

src/main/java/com/cyp/prompt/expert_backend/controller/ChatController.java
  → Eliminar mocks
  → Inyectar ChatService
  → Conectar cada método al servicio correspondiente
```

**Nota sobre `FIXED_USER_ID`:** mientras no haya autenticación, definir una constante `private static final Long FIXED_USER_ID = 1L` en los controllers. Cuando se implemente JWT, este valor vendrá del `SecurityContext`.

### Criterio de aceptación

```
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
→ Todos los endpoints básicos devuelven datos reales desde PostgreSQL
→ El Swagger UI en http://localhost:8080/swagger-ui/index.html muestra todos los endpoints
→ Los mocks han sido eliminados de ProfileController, SkillController y ChatController
```

---

## PASO 9 — PrologClient: interfaz y DTOs

**Dependencias previas:** Paso 1  
**Documentos de referencia:** `07-prolog-integration.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/client/PrologClient.java
src/main/java/com/cyp/prompt/expert_backend/client/prolog/PrologRequest.java
src/main/java/com/cyp/prompt/expert_backend/client/prolog/PrologUserProfile.java
src/main/java/com/cyp/prompt/expert_backend/client/prolog/PrologSkillEntry.java
src/main/java/com/cyp/prompt/expert_backend/client/prolog/PrologResponse.java
src/main/java/com/cyp/prompt/expert_backend/client/MockPrologClient.java
src/main/java/com/cyp/prompt/expert_backend/client/PrologRestClient.java
src/main/java/com/cyp/prompt/expert_backend/config/PrologClientConfig.java
```

### Diseño de `PrologClientConfig`

```
@Configuration
class PrologClientConfig:

  @Bean
  @ConditionalOnProperty(name="prolog.mock", havingValue="true")
  PrologClient mockPrologClient() → new MockPrologClient()

  @Bean
  @ConditionalOnProperty(name="prolog.mock", havingValue="false", matchIfMissing=true)
  PrologClient prologRestClient(@Value("${prolog.service.base-url}") String baseUrl, ...) 
      → new PrologRestClient(RestClient.builder().baseUrl(baseUrl).build())
```

### Criterio de aceptación

```
./mvnw compile
→ Todos los DTOs y la interfaz compilan
→ Con prolog.mock=true, MockPrologClient se registra como bean activo
```

---

## PASO 10 — PromptBuilder

**Dependencias previas:** Paso 9  
**Documentos de referencia:** `06-service-layer.md`, `08-prompt-enrichment-flow.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/service/PromptBuilder.java
```

### Criterio de aceptación

```
Test unitario de PromptBuilderTest:
  buildPrologRequest → estructura correcta con todos los campos del perfil
  buildEnrichedPrompt → contiene el prompt original al final, inferencias y contexto
```

---

## PASO 11 — ExpertSystemService

**Dependencias previas:** Pasos 4, 5, 9, 10  
**Documentos de referencia:** `06-service-layer.md`, `08-prompt-enrichment-flow.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/service/ExpertSystemService.java
```

### Archivos a modificar

```
src/main/java/com/cyp/prompt/expert_backend/controller/ExpertSystemController.java
  → Eliminar mock
  → Inyectar ExpertSystemService via constructor
  → Llamar expertSystemService.enrichPrompt(FIXED_USER_ID, chatId, request)
```

### Criterio de aceptación

```
Prueba funcional (con perfil en DB y prolog.mock=true):
  POST /api/chats/{chatId}/messages/enrich { "prompt": "Explícame Docker" }
  → 201 Created
  → messageId real en la respuesta
  → Verificar en DB: messages table tiene el registro con appliedInferences y enrichedPrompt
  → Verificar en DB: chat.updated_at fue actualizado
  → aiResponse es null en DB
```

---

## PASO 12 — AIClient: interfaz y DTOs

**Dependencias previas:** Paso 1  
**Documentos de referencia:** `09-docker-compose-architecture.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/client/AIClient.java
src/main/java/com/cyp/prompt/expert_backend/client/MockAIClient.java
src/main/java/com/cyp/prompt/expert_backend/client/ExternalAIClient.java
src/main/java/com/cyp/prompt/expert_backend/config/AIClientConfig.java
```

### Diseño de la interfaz `AIClient`

```
interface AIClient:
  String generate(String enrichedPrompt);
```

### Diseño de `MockAIClient`

```
MockAIClient.generate(String enrichedPrompt):
  → Devuelve "[Mock AI Response] Respuesta generada para: " + enrichedPrompt.substring(0, 50) + "..."
```

### Diseño de `ExternalAIClient`

Implementación HTTP que llama a la API configurada (OpenAI u otro proveedor compatible).

```
ExternalAIClient.generate(String enrichedPrompt):
  1. Construir request body con el modelo configurado y el prompt como user message
  2. POST al endpoint de completions
  3. Extraer el texto de la respuesta
  4. Si falla: lanzar ExternalServiceException("Servicio de IA no disponible")
```

### Criterio de aceptación

```
./mvnw compile
→ Con ai.mock=true, MockAIClient se registra como bean activo
```

---

## PASO 13 — AIService

**Dependencias previas:** Pasos 4, 5, 12  
**Documentos de referencia:** `06-service-layer.md`

### Archivos a crear

```
src/main/java/com/cyp/prompt/expert_backend/service/AIService.java
```

### Archivos a modificar

```
src/main/java/com/cyp/prompt/expert_backend/controller/AIController.java
  → Eliminar mocks
  → Inyectar AIService
  → Conectar /send → aiService.sendMessage(FIXED_USER_ID, messageId)
  → Conectar /retry → aiService.retryMessage(FIXED_USER_ID, messageId)
```

### Criterio de aceptación

```
Prueba funcional (con mensaje enriquecido en DB y ai.mock=true):
  POST /api/messages/{messageId}/send
  → 200 OK con respuesta mock de la IA
  → Verificar en DB: messages.ai_response populizado

  POST /api/messages/{messageId}/send (segunda vez)
  → 409 Conflict

  POST /api/messages/{messageId}/retry
  → 200 OK con nueva respuesta (sobrescribe)
```

---

## PASO 14 — Verificación del pipeline completo

**Dependencias previas:** Pasos 8, 11, 13

### Prueba end-to-end manual (sin Docker)

```
1. POST /api/chats { "title": "Test Docker" }
   → Guardar chatId

2. GET /api/chats/{chatId}
   → Verificar chat vacío

3. POST /api/chats/{chatId}/messages/enrich { "prompt": "Explícame Docker" }
   → Guardar messageId
   → Verificar enrichedPrompt y appliedInferences en la respuesta

4. POST /api/messages/{messageId}/send
   → Verificar aiResponse en la respuesta

5. GET /api/chats/{chatId}
   → Verificar que el mensaje aparece con originalPrompt, enrichedPrompt y aiResponse

6. PATCH /api/chats/{chatId} { "title": "Docker renombrado" }
7. DELETE /api/chats/{chatId}
   → Verificar 204 y que el chat ya no existe
```

### Criterio de aceptación

Todos los pasos del pipeline completo funcionan sin errores. Los mocks han sido eliminados de todos los controllers.

---

## PASO 15 — Seed de datos

**Dependencias previas:** Paso 2

### Archivos a crear

```
src/main/resources/data.sql
```

### Contenido del seed

```sql
-- Solo se ejecuta con spring.jpa.hibernate.ddl-auto=create-drop (perfil dev)

-- Skills del catálogo
INSERT INTO skills (name, category) VALUES
  ('Java', 'backend'), ('Spring Boot', 'backend'), ('Python', 'backend'),
  ('PostgreSQL', 'backend'), ('React', 'frontend'), ('TypeScript', 'frontend'),
  ('Docker', 'devops'), ('Kubernetes', 'devops'), ('Git', 'tools')
ON CONFLICT (name) DO NOTHING;

-- Usuario de desarrollo
INSERT INTO users (name, email, education_level, study_year, works_in_it)
VALUES ('Lautaro', 'lautaro@example.com', 'UNIVERSITY_STUDENT', 3, true)
ON CONFLICT (email) DO NOTHING;

-- Skills del usuario
INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 8 FROM users u, skills s
  WHERE u.email='lautaro@example.com' AND s.name='Java'
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 2 FROM users u, skills s
  WHERE u.email='lautaro@example.com' AND s.name='Docker'
ON CONFLICT (user_id, skill_id) DO NOTHING;
```

### Criterio de aceptación

```
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
→ Las tablas tienen datos de seed
→ GET /api/profile devuelve los datos del usuario seed con sus skills
→ GET /api/skills devuelve las 9 skills del catálogo
```

---

## PASO 16 — Spring Boot Actuator

**Dependencias previas:** Paso 1

### Archivos a modificar

```
pom.xml → agregar spring-boot-starter-actuator

application.properties → agregar:
  management.endpoints.web.exposure.include=health,info
  management.endpoint.health.show-details=never
  management.info.env.enabled=true
  info.app.name / info.app.description / info.app.version
```

> **Decisión arquitectónica:** se exponen **únicamente** `/actuator/health` y
> `/actuator/info`. Ningún otro endpoint Actuator queda accesible.
> `health.show-details=never` evita filtrar detalles internos (BD, disco, etc.).

### Criterio de aceptación

```
GET /actuator/health → { "status": "UP" }   (sin detalles)
GET /actuator/info    → metadatos de la app (info.app.*)
GET /actuator/<otro>  → 404 (no expuesto)
→ /actuator/health es necesario para healthchecks en Docker Compose
```

---

## PASO 17 — Unit Tests de servicios

**Dependencias previas:** Pasos 6, 7, 10, 11, 13  
**Documentos de referencia:** `10-testing-strategy.md`

### Archivos a crear

```
src/test/java/com/cyp/prompt/expert_backend/unit/service/ProfileServiceTest.java
src/test/java/com/cyp/prompt/expert_backend/unit/service/SkillServiceTest.java
src/test/java/com/cyp/prompt/expert_backend/unit/service/ChatServiceTest.java
src/test/java/com/cyp/prompt/expert_backend/unit/service/ExpertSystemServiceTest.java
src/test/java/com/cyp/prompt/expert_backend/unit/service/AIServiceTest.java
src/test/java/com/cyp/prompt/expert_backend/unit/service/PromptBuilderTest.java
```

### Criterio de aceptación

```
./mvnw test -pl . -Dtest="*ServiceTest,PromptBuilderTest"
→ Todos los tests pasan
→ Los flujos de error (ResourceNotFoundException, ConflictException, ExternalServiceException) están cubiertos
```

---

## PASO 18 — Controller Tests con MockMvc

**Dependencias previas:** Paso 5  
**Documentos de referencia:** `10-testing-strategy.md`

### Archivos a crear

```
src/test/java/com/cyp/prompt/expert_backend/controller/ProfileControllerTest.java
src/test/java/com/cyp/prompt/expert_backend/controller/SkillControllerTest.java
src/test/java/com/cyp/prompt/expert_backend/controller/ChatControllerTest.java
src/test/java/com/cyp/prompt/expert_backend/controller/ExpertSystemControllerTest.java
src/test/java/com/cyp/prompt/expert_backend/controller/AIControllerTest.java
```

### Criterio de aceptación

```
./mvnw test -pl . -Dtest="*ControllerTest"
→ Todos los tests pasan
→ Validaciones Jakarta están cubiertas (400 para inputs inválidos)
→ Casos de error (404, 409, 503) están cubiertos
```

---

## PASO 19 — Repository Tests

**Dependencias previas:** Paso 4  
**Documentos de referencia:** `10-testing-strategy.md`

### Archivos a crear

```
src/test/java/com/cyp/prompt/expert_backend/repository/ChatRepositoryTest.java
src/test/java/com/cyp/prompt/expert_backend/repository/MessageRepositoryTest.java
src/test/java/com/cyp/prompt/expert_backend/repository/UserSkillRepositoryTest.java
```

### Criterio de aceptación

```
./mvnw test -pl . -Dtest="*RepositoryTest"
→ Todos los tests pasan
→ Verificado: ownership checks (findByIdAndUserId) funcionan correctamente
→ Verificado: messageCount se calcula correctamente en la query custom
```

---

## PASO 20 — Docker Compose

**Dependencias previas:** Todos los pasos anteriores  
**Documentos de referencia:** `09-docker-compose-architecture.md`

### Archivos a crear

```
docker-compose.yml
docker-compose.override.yml
.env.example
prompt.expert_backend/Dockerfile
prompt.expert_frontend/Dockerfile
prompt.expert_prolog/Dockerfile
prompt.expert_prolog/server.pl
```

### Criterio de aceptación

```
cp .env.example .env
# Completar .env con valores reales

docker compose up --build
→ Los 4 servicios levantan sin errores
→ PostgreSQL healthcheck pasa
→ Backend healthcheck pasa (GET /actuator/health → UP)
→ Prolog healthcheck pasa (GET /health → 200)
→ Frontend accesible en http://localhost:3000

Prueba end-to-end desde el browser:
→ El flujo completo (enrich → send) funciona contra servicios reales
```

---

## Resumen de archivos finales

```
src/main/java/com/cyp/prompt/expert_backend/
├── Application.java                          ← ya existe
├── config/
│   ├── SecurityConfig.java                   ← ya existe
│   ├── OpenApiConfig.java                    ← ya existe
│   ├── PrologClientConfig.java               ← Paso 9
│   └── AIClientConfig.java                   ← Paso 12
├── controller/                               ← ya existen (modificados en Pasos 8, 11, 13)
├── converter/
│   └── StringListConverter.java              ← Paso 3
├── client/
│   ├── PrologClient.java                     ← Paso 9
│   ├── PrologRestClient.java                 ← Paso 9
│   ├── MockPrologClient.java                 ← Paso 9
│   ├── AIClient.java                         ← Paso 12
│   ├── ExternalAIClient.java                 ← Paso 12
│   ├── MockAIClient.java                     ← Paso 12
│   └── prolog/
│       ├── PrologRequest.java                ← Paso 9
│       ├── PrologUserProfile.java            ← Paso 9
│       ├── PrologSkillEntry.java             ← Paso 9
│       └── PrologResponse.java               ← Paso 9
├── dto/                                      ← ya existen
├── entity/
│   ├── User.java                             ← Paso 2
│   ├── Skill.java                            ← Paso 2
│   ├── UserSkill.java                        ← Paso 2
│   ├── Chat.java                             ← Paso 2
│   └── Message.java                          ← Paso 2
├── enums/
│   └── EducationLevel.java                   ← ya existe
├── exception/
│   ├── ResourceNotFoundException.java        ← Paso 5
│   ├── ConflictException.java                ← Paso 5
│   ├── ExternalServiceException.java         ← Paso 5
│   └── GlobalExceptionHandler.java           ← Paso 5
├── repository/
│   ├── UserRepository.java                   ← Paso 4
│   ├── SkillRepository.java                  ← Paso 4
│   ├── UserSkillRepository.java              ← Paso 4
│   ├── ChatRepository.java                   ← Paso 4
│   └── MessageRepository.java                ← Paso 4
└── service/
    ├── ProfileService.java                   ← Paso 6
    ├── SkillService.java                     ← Paso 6
    ├── ChatService.java                      ← Paso 7
    ├── ExpertSystemService.java              ← Paso 11
    ├── AIService.java                        ← Paso 13
    └── PromptBuilder.java                    ← Paso 10
```

**Total de pasos:** 20  
**Total de archivos nuevos:** ~45  
**Total de archivos modificados:** 5 controllers

---

*Este documento es el roadmap definitivo. Seguir el orden garantiza que en cada paso el proyecto compila y tiene un criterio de aceptación verificable.*
