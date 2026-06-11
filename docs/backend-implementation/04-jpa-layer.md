# 04 — JPA Layer

**Fuente:** `02-domain-model.md`, `03-database-design.md`  
**Paquete base:** `com.cyp.prompt.expert_backend`

---

## Estructura de paquetes

```
entity/
├── User.java
├── Skill.java
├── UserSkill.java
├── Chat.java
└── Message.java

converter/
└── StringListConverter.java
```

---

## Entidad: `User`

**Tabla:** `users`  
**Paquete:** `entity`

### Anotaciones clave

| Anotación | Propósito |
|---|---|
| `@Entity` | Marca la clase como entidad JPA |
| `@Table(name = "users")` | Mapea a la tabla `users` |
| `@Id`, `@GeneratedValue(strategy = IDENTITY)` | PK autoincremental con `BIGSERIAL` |
| `@Column(unique = true, nullable = false)` | Constraint de unicidad en `email` |
| `@Enumerated(EnumType.STRING)` | Persiste el enum como texto, no como número ordinal |
| `@CreationTimestamp` | Asigna `createdAt` automáticamente al persistir (nunca actualiza) |
| `@OneToMany(mappedBy = "user", cascade = ALL, orphanRemoval = true, fetch = LAZY)` | Colecciones de chats y userSkills |
| `@lombok.Getter`, `@lombok.Setter`, `@lombok.Builder`, `@lombok.NoArgsConstructor`, `@lombok.AllArgsConstructor` | Reducir boilerplate |

### Campos

```
id            Long          @Id @GeneratedValue(IDENTITY)
name          String        @Column(nullable=false)
email         String        @Column(unique=true, nullable=false)
educationLevel EducationLevel @Enumerated(STRING) @Column(nullable=false)
studyYear     Integer       @Column (nullable)
worksInIT     Boolean       @Column(nullable=false)
createdAt     Instant       @CreationTimestamp @Column(updatable=false)
userSkills    List<UserSkill> @OneToMany(mappedBy="user", cascade=ALL, orphanRemoval=true, fetch=LAZY)
chats         List<Chat>    @OneToMany(mappedBy="user", cascade=ALL, orphanRemoval=true, fetch=LAZY)
```

### Consideraciones

- **No exponer `chats` ni `userSkills` directamente en los servicios.** Las colecciones lazy deben accederse dentro de transacciones activas.
- `@Builder` requiere `@NoArgsConstructor` y `@AllArgsConstructor` para coexistir con JPA (que necesita constructor sin argumentos).
- Evitar `@Data` de Lombok en entidades JPA: el `equals`/`hashCode` generado puede causar problemas con proxies de Hibernate.

---

## Entidad: `Skill`

**Tabla:** `skills`  
**Paquete:** `entity`

### Anotaciones clave

| Anotación | Propósito |
|---|---|
| `@Entity` | Entidad JPA |
| `@Table(name = "skills")` | Tabla `skills` |
| `@Id`, `@GeneratedValue(strategy = IDENTITY)` | PK autoincremental |
| `@Column(unique = true, nullable = false)` | Nombre único |
| `@Enumerated(EnumType.STRING)` | Persiste `category` como nombre del enum |

### Campos

```
id       Long             @Id @GeneratedValue(IDENTITY)
name     String           @Column(unique=true, nullable=false)
category SkillCategory    @Enumerated(EnumType.STRING) @Column(nullable=false)
```

### Consideraciones

- `category` es el enum `SkillCategory` (paquete `enums`), con valores `BACKEND, FRONTEND, DATABASE, DEVOPS, CLOUD, PROGRAMMING_LANGUAGE, OTHER`. Se persiste como STRING para que la columna sea legible y resistente a reordenamientos del enum (a diferencia de `EnumType.ORDINAL`).
- No necesita relación bidireccional con `UserSkill` para el alcance v1. La consulta de skills por usuario se hace desde `UserSkill`, no desde `Skill`.
- Catálogo administrado: no se expone endpoint de creación de skills para el usuario.

---

## Entidad: `UserSkill`

**Tabla:** `user_skills`  
**Paquete:** `entity`

### Anotaciones clave

| Anotación | Propósito |
|---|---|
| `@Entity` | Entidad JPA explícita (no `@ManyToMany` simple) |
| `@Table(name = "user_skills", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","skill_id"}))` | Tabla y constraint compuesta |
| `@ManyToOne(fetch = EAGER)` en `user` y `skill` | Se cargan junto con `UserSkill` |
| `@JoinColumn(name = "user_id", nullable = false)` | FK hacia `users` |
| `@JoinColumn(name = "skill_id", nullable = false)` | FK hacia `skills` |
| `@Column(nullable = false)` en `level` | Campo requerido |

### Campos

```
id     Long   @Id @GeneratedValue(IDENTITY)
user   User   @ManyToOne(fetch=EAGER) @JoinColumn(name="user_id", nullable=false)
skill  Skill  @ManyToOne(fetch=EAGER) @JoinColumn(name="skill_id", nullable=false)
level  Integer @Column(nullable=false)
```

### Por qué entidad explícita y no `@ManyToMany`

`@ManyToMany` no permite agregar atributos a la tabla de unión. Al necesitar `level`, se requiere una entidad intermedia. La relación desde `User` es `@OneToMany(UserSkill)`, y desde `UserSkill` a `User` y `Skill` es `@ManyToOne`.

### Consideraciones

- `fetch = EAGER` en `user` y `skill` porque `UserSkill` nunca se carga sola: siempre se necesitan los datos de la skill.
- Al actualizar el nivel de una skill (`PUT /api/profile/skills/{skillId}`), el servicio busca la `UserSkill` por `(userId, skillId)` y actualiza `level`. Si no existe, la crea.

---

## Entidad: `Chat`

**Tabla:** `chats`  
**Paquete:** `entity`

### Anotaciones clave

| Anotación | Propósito |
|---|---|
| `@Entity` | Entidad JPA |
| `@Table(name = "chats")` | Tabla `chats` |
| `@Id`, `@GeneratedValue(strategy = IDENTITY)` | PK |
| `@ManyToOne(fetch = LAZY)` en `user` | FK hacia usuario dueño |
| `@JoinColumn(name = "user_id", nullable = false)` | Columna FK |
| `@OneToMany(mappedBy = "chat", cascade = ALL, orphanRemoval = true, fetch = LAZY)` | Colección de mensajes |
| `@CreationTimestamp` | `createdAt` automático |
| `@UpdateTimestamp` | `updatedAt` automático en cualquier `UPDATE` de la entidad |

### Campos

```
id        Long          @Id @GeneratedValue(IDENTITY)
user      User          @ManyToOne(fetch=LAZY) @JoinColumn(name="user_id", nullable=false)
title     String        @Column(nullable=false)
createdAt Instant       @CreationTimestamp @Column(updatable=false)
updatedAt Instant       @UpdateTimestamp
messages  List<Message> @OneToMany(mappedBy="chat", cascade=ALL, orphanRemoval=true, fetch=LAZY)
```

### Consideraciones

- `@UpdateTimestamp` actualiza `updatedAt` automáticamente cuando Hibernate detecta cambios en la entidad. Para que se propague cuando se agrega un mensaje, el `ExpertSystemService` debe hacer un `touch` del chat (o actualizar `updatedAt` manualmente).
- `fetch = LAZY` en `messages` es crítico: cargar todos los mensajes al listar chats sería un problema de rendimiento (N+1). Usar proyecciones o queries específicas para el conteo.
- `messageCount` se calcula con una query JPQL: `SELECT c, COUNT(m) FROM Chat c LEFT JOIN c.messages m WHERE c.user = :user GROUP BY c ORDER BY c.updatedAt DESC`.

---

## Entidad: `Message`

**Tabla:** `messages`  
**Paquete:** `entity`

### Anotaciones clave

| Anotación | Propósito |
|---|---|
| `@Entity` | Entidad JPA |
| `@Table(name = "messages")` | Tabla `messages` |
| `@Id`, `@GeneratedValue(strategy = IDENTITY)` | PK |
| `@ManyToOne(fetch = LAZY)` en `chat` | FK hacia chat padre |
| `@JoinColumn(name = "chat_id", nullable = false)` | Columna FK |
| `@Column(columnDefinition = "TEXT", nullable = false)` | `originalPrompt` y `enrichedPrompt` como TEXT |
| `@Convert(converter = StringListConverter.class)` | Convierte `List<String>` ↔ JSON string |
| `@Column(columnDefinition = "TEXT")` en `aiResponse` | Nullable TEXT |
| `@CreationTimestamp` | `createdAt` automático |

### Campos

```
id                 Long         @Id @GeneratedValue(IDENTITY)
chat               Chat         @ManyToOne(fetch=LAZY) @JoinColumn(name="chat_id", nullable=false)
originalPrompt     String       @Column(columnDefinition="TEXT", nullable=false)
enrichedPrompt     String       @Column(columnDefinition="TEXT", nullable=false)
appliedInferences  List<String> @Convert(converter=StringListConverter.class) @Column(columnDefinition="TEXT", nullable=false)
aiResponse         String       @Column(columnDefinition="TEXT")
createdAt          Instant      @CreationTimestamp @Column(updatable=false)
```

### Consideraciones

- `appliedInferences` usa un `AttributeConverter` personalizado (`StringListConverter`) que serializa `List<String>` a JSON string usando Jackson (`ObjectMapper`).
- `aiResponse` es nullable por diseño: comienza como `null` y se completa al llamar a `POST /send`.
- `originalPrompt` y `enrichedPrompt` son inmutables después de la persistencia. El servicio nunca debe intentar actualizarlos.

---

## Converter: `StringListConverter`

**Paquete:** `converter`

Convierte `List<String>` ↔ `String` (JSON array).

### Comportamiento esperado

| Operación | Entrada | Salida |
|---|---|---|
| `convertToDatabaseColumn` | `["backend_developer","needs_docker"]` | `"[\"backend_developer\",\"needs_docker\"]"` |
| `convertToEntityAttribute` | `"[\"backend_developer\",\"needs_docker\"]"` | `List.of("backend_developer","needs_docker")` |
| `convertToDatabaseColumn` con null | `null` | `"[]"` |
| `convertToEntityAttribute` con null/vacío | `null` o `""` | `List.of()` |

### Implementación conceptual

```
@Converter
class StringListConverter implements AttributeConverter<List<String>, String>:
  - Inyecta o instancia un ObjectMapper
  - convertToDatabaseColumn: objectMapper.writeValueAsString(list)
  - convertToEntityAttribute: objectMapper.readValue(json, List<String>.class)
  - Manejo de excepciones: lanzar RuntimeException con contexto
```

---

## Resumen de relaciones JPA

```mermaid
graph LR
    U[User] -->|@OneToMany cascade=ALL| US[UserSkill]
    U -->|@OneToMany cascade=ALL| C[Chat]
    US -->|@ManyToOne fetch=EAGER| SK[Skill]
    US -->|@ManyToOne fetch=EAGER| U
    C -->|@OneToMany cascade=ALL| M[Message]
    M -->|@ManyToOne fetch=LAZY| C
    C -->|@ManyToOne fetch=LAZY| U
```

---

## Convenciones generales para entidades

1. Usar `@Getter` y `@Setter` de Lombok individualmente en lugar de `@Data`.
2. Siempre definir `equals` y `hashCode` basados únicamente en `id` (o no generarlos con Lombok en entidades JPA).
3. Nunca serializar entidades JPA directamente como JSON. Siempre mapear a DTOs en la capa de servicio.
4. Prefijo de columnas FK: siempre `{entidad}_id` (ej: `user_id`, `chat_id`, `skill_id`).
5. Timestamps: usar `Instant` (UTC) en Java y `TIMESTAMPTZ` en PostgreSQL.

---

*Siguiente documento: `05-repository-layer.md`*
