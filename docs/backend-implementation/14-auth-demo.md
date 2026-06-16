# 14 — Autenticación demo + eliminación de `FIXED_USER_ID`

> **Estado:** ✅ implementado.
> **Alcance:** registro, login y resolución del usuario actor para una **demo académica**.
> **Fuentes de verdad:** `UserService`, `UserController`, `ExpertSystemService`, controllers (`Chat`/`Profile`/`AI`), `GlobalExceptionHandler`.

---

## ⚠️ Limitaciones de seguridad (leer primero)

Esta es una **autenticación de demostración**, deliberadamente simplificada. **No usar en producción.**

- **Password en TEXTO PLANO** en la columna `users.password` — sin hashing (bcrypt/argon2), sin salt.
- **Sin Spring Security, sin JWT, sin sesiones, sin cookies.**
- La identidad del usuario viaja en un **header de texto** `X-User-Id`, sin firmar ni verificar: cualquiera puede declararse cualquier usuario. Es una conveniencia de demo, no un control de acceso.
- No hay logout, expiración, rate-limiting ni protección CSRF.

El objetivo es habilitar un flujo realista (registro → login → onboarding → chats con perfil propio) para la demo, **no** proveer seguridad.

---

## 1. Flujo de la demo

```
register → login → (onboarding si falta) → crear chat → enrich (usa SU perfil)
```

1. **Registro** — `POST /api/users/register` `{ name, email, password }` → `201 { userId, onboardingComplete:false }`.
2. **Login** — `POST /api/users/login` `{ email, password }` → `200 { userId, name, email, onboardingComplete }`.
   El frontend **almacena el `userId`** (p. ej. `localStorage`). No hay token.
3. **Onboarding** (si `onboardingComplete=false`) — `PUT /api/users/{id}/onboarding`.
4. **Chats** — el frontend envía el header `X-User-Id: <userId>` en cada request con dueño.
5. **Enrich** — el sistema experto usa el perfil del **dueño del chat**.

---

## 2. Identidad del usuario: header `X-User-Id`

En lugar de un `SecurityContext`, los controllers que actúan en nombre de un usuario leen el header **`X-User-Id`**:

```java
@PostMapping
public ResponseEntity<ChatResponse> createChat(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateChatRequest request) { ... }
```

- **Requieren `X-User-Id`:** `ProfileController`, `ChatController`, `AIController`. Si falta → `400 Bad Request` (manejado en `GlobalExceptionHandler` para `MissingRequestHeaderException`).
- **Frontend:** un interceptor de Axios añade `X-User-Id` desde `localStorage` (`'1'` por defecto, usuario seed, hasta que haya login). Así el frontend existente sigue funcionando sin cambios funcionales.

### Excepción: `enrich` deriva el usuario del chat

`POST /api/chats/{chatId}/messages/enrich` **no** usa `X-User-Id`. `ExpertSystemService` obtiene el chat y usa su **dueño** (`chat.getUser()`):

```java
Chat chat = chatRepository.findById(chatId)
        .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));
User user = chat.getUser();                       // perfil REAL del dueño del chat
List<UserSkill> userSkills = userSkillRepository.findByUserId(user.getId());
```

Esto garantiza que el sistema experto siempre use el perfil real del propietario y que **dos usuarios distintos generen prompts enriquecidos distintos** para la misma consulta.

---

## 3. Eliminación de `FIXED_USER_ID`

Antes, cuatro controllers usaban `private static final Long FIXED_USER_ID = 1L`. Se eliminaron todos:

| Controller | Antes | Ahora |
|---|---|---|
| `ProfileController` | `FIXED_USER_ID` | header `X-User-Id` |
| `ChatController` | `FIXED_USER_ID` | header `X-User-Id` |
| `AIController` | `FIXED_USER_ID` | header `X-User-Id` |
| `ExpertSystemController` | `FIXED_USER_ID` → `enrichPrompt(userId, chatId, req)` | `enrichPrompt(chatId, req)` (usuario = dueño del chat) |

`grep -rn FIXED_USER_ID src/main/java src/test/java` → **sin resultados**.

> La relación `Chat → User` ya existía en JPA (`Chat.user`, `@ManyToOne`, `user_id NOT NULL`); se **reutilizó**, sin tablas nuevas.

---

## 4. Convención de errores del login

| Caso | HTTP | Excepción |
|---|---|---|
| Email inexistente | `404` | `ResourceNotFoundException` (coherente con el resto del sistema) |
| Password incorrecta | `401` | `UnauthorizedException` (nueva, mapeada en `GlobalExceptionHandler`) |
| Email duplicado en registro | `409` | `ConflictException` |
| Falta header `X-User-Id` | `400` | `MissingRequestHeaderException` |

---

## 5. Persistencia

- Se agregó `User.password` (`@Column`, **nullable** y en texto plano). Es nullable porque los usuarios creados por la vía legacy `POST /api/users` (sin password) no la tienen.
- El seed `data.sql` asigna `password='1234'` a Lautaro (`lautaro@example.com`) para poder loguearlo.
- **No se agregaron tablas nuevas.**

---

## 6. Compatibilidad

- `onboarding`, `perfil`, Prolog, recomendaciones e inferencias **siguen igual** (la lógica de enriquecimiento no cambió; solo el origen del usuario).
- El contrato del `enrich` **no cambió** para el cliente (mismo body, misma URL); internamente dejó de requerir un `userId` externo.
- El frontend existente sigue operando como usuario seed (`X-User-Id: 1`) hasta integrar la pantalla de login.

---

*Documento de la fase de autenticación demo. Reemplazar por auth real (JWT/OAuth2 + hashing) antes de cualquier uso productivo.*
