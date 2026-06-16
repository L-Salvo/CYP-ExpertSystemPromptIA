# 13 — Arquitectura de Inferencias Sensibles al Prompt (Prompt-Aware)

> **Estado:** COMPLETO — **F1 ✅ · F2 ✅ · F3 ✅ · F4 ✅ · F5 ✅ · F6 ✅ · F7 ✅** implementadas.
> **Fuentes de verdad:** `prompt.expert_prolog/rules.pl`, `prompt.expert_prolog/facts.pl`, `prompt.expert_prolog/nlp.pl`, `12-inference-catalog.md`.
> **Alcance:** diseño, vocabulario y roadmap.
>
> **Estado por fase:**
> - **F1 ✅** Plumbing del prompt — `load_prompt_facts/1`, `prompt_tokens/1`, normalización (minúsculas + sin acentos + sin puntuación), tokenización, ciclo de vida `thread_local`.
> - **F2 ✅** Detección de tema — `nlp.pl` (`topic_keyword/2`), `topic/1`, inferencias `topic_*` (java, spring_boot, postgresql, docker, react, git; `topic_unknown` si ninguno).
> - **F3 ✅** Detección de intención — `intent_keyword/2`, `intent/1`, inferencias `intent_*` (learn, explain, define, compare, troubleshoot; `intent_explain` por defecto).
> - **F4 ✅** Inferencias compuestas (topic × intent) — regla genérica `composite_inference/1` + tabla `intent_verb/2`: `learning_{T}`, `troubleshooting_{T}`, `explaining_{T}` cuando hay `topic(T)` (T ≠ unknown) e `intent(learn|troubleshoot|explain)`. **No** incluye `mastery_*`/`gap_*`/`focus_*`/`compare_*` (replanificados a fases posteriores).
> - **F5 ✅** Gating de recomendaciones — `collect_recommendations/2` reescrito: si hay compuestas activas → recomendaciones específicas por (intención × tema); si no → fallback exacto al comportamiento por perfil. **Primer cambio de comportamiento visible.** Solo `rules.pl`.
> - **F6 ✅** `additionalContext` enriquecido — `build_context/2` reescrito: si hay tema reconocido (`topic≠unknown`) construye un contexto **prompt-aware** a partir de fragmentos controlados por reglas (nivel del usuario en el tema × guía por intención/nivel × puente con el ecosistema × orientación de perfil); si no, **fallback exacto** al contexto clásico por perfil. Solo `rules.pl`.
> - **F7 ✅** Prompt quality tuning — solo wording/prioridad/dedup en `rules.pl`: `additionalContext` pasa a ser **puramente descriptivo** y `recommendations` **puramente accionables** (cero frases repetidas entre `CONTEXTO DEL USUARIO` y `DIRECTRICES`); las directivas se ordenan por prioridad (profundidad por nivel → acción por intención → concreción por tema). **Sin** nuevas inferencias ni cambios de contrato. Inferencias y fallback "Hola" **idénticos**.
>
> **Nota:** F1–F4 no cambian recomendaciones ni `additionalContext`. **F5 cambia la SELECCIÓN de recomendaciones** (no las inferencias, que siguen completas para auditoría). **F6 cambia el `additionalContext`**. **F7 ajusta solo el wording/prioridad** de recomendaciones y contexto (sin tocar inferencias, `PromptBuilder`, backend ni DTOs). Temas pospuestos a fases posteriores: angular, vue, node, kubernetes, aws.

---

## 1. Objetivo

Hoy el motor genera inferencias y recomendaciones **únicamente a partir del perfil del usuario** (`educationLevel`, `studyYear`, `worksInIT`, `skills`). El **prompt del usuario no participa**.

**Problema observado:** para `"Quiero aprender Java"`, el sistema sigue recomendando cosas de Docker, porque la recomendación `needs_docker` se dispara por el perfil (Docker nivel 2), sin importar que la consulta sea sobre Java.

**Objetivo:** que las inferencias —y sobre todo las **recomendaciones**— combinen:

1. **Perfil** del usuario (quién es).
2. **Consulta** del usuario (qué pregunta y con qué intención).
3. **Reglas compuestas** que cruzan ambos (qué conviene hacer dado quién es + qué pregunta).

**Invariante de compatibilidad:** el `prompt` **ya viaja** en el body de `POST /infer` (`{"prompt": ..., "userProfile": ...}`). Esta fase **no requiere cambios en el backend** (`PrologRestClient`, `ExpertSystemService`, `PromptBuilder`): todo ocurre dentro del servicio Prolog.

---

## 2. Arquitectura

### 2.1 Principio rector

El sistema pasa de **un origen de hechos** (perfil) a **dos orígenes** (perfil + prompt), con una capa de inferencias compuestas encima y un mecanismo de **gating por relevancia** que filtra las recomendaciones según el tema de la consulta.

```
                    POST /infer  { prompt, userProfile }
                                  │
            ┌─────────────────────┴─────────────────────┐
            ▼                                             ▼
   load_profile_facts (EXISTE)                  load_prompt_facts (NUEVO)
   education_level/1, study_year/1,             tokens → topic/1, intent/1
   works_in_it/1, skill/2
            │                                             │
            └─────────────────────┬───────────────────────┘
                                  ▼
                         CAPA DE INFERENCIAS
   ┌──────────────┬──────────────┬──────────────┬───────────────────┐
   │ Perfil       │ Tema         │ Intención    │ Compuestas        │
   │ (EXISTE)     │ (NUEVO)      │ (NUEVO)      │ (NUEVO)           │
   └──────────────┴──────────────┴──────────────┴───────────────────┘
                                  ▼
              RECOMENDACIONES (gating por relevancia de tema)
                                  ▼
              additionalContext (perfil + tema + intención)
                                  ▼
            PrologResponse { inferences, recommendations, additionalContext }
```

### 2.2 Capas de la base de conocimiento (módulos Prolog)

| Módulo | Hoy | Propuesta |
|---|---|---|
| `facts.pl` | hechos de perfil (`education_level/1`, `study_year/1`, `works_in_it/1`, `skill/2`) | + `load_prompt_facts/1` → `topic/1`, `intent/1` (también `thread_local`, incluidos en `clear_facts`) |
| `nlp.pl` (NUEVO) | — | tablas de datos: `topic_keyword/2`, `intent_keyword/2`, normalización y detección. **Solo datos + detección, sin reglas de negocio.** |
| `rules.pl` | inferencias de perfil + recomendaciones fijas | + inferencias de tema/intención/compuestas; recomendaciones con gating por tema |

**Separación clave:** la detección de tema/intención (NLP de palabras clave) vive en `nlp.pl` como **tablas de datos**; `rules.pl` solo contiene reglas **genéricas y parametrizadas**. Esto evita la explosión de reglas (ver §7).

### 2.3 Cómo se modela el prompt en Prolog

El prompt es texto libre. Se modela en tres pasos, todos `thread_local` (aislamiento por request, igual que los hechos de perfil):

1. **Normalización + tokenización.**
   `prompt → minúsculas → quitar acentos y puntuación → split por espacios → lista de tokens`.
   Se conservan también los **bigramas** (pares de tokens contiguos) para detectar temas/intenciones multi-palabra (`"docker compose"`, `"spring boot"`, `"quiero aprender"`).
   Hecho intermedio: `prompt_tokens/1` (lista) — opcionalmente `prompt_ngram/1`.

2. **Detección de tema** (`topic/1`): se cruzan los n-gramas contra una tabla de sinónimos `topic_keyword(Topic, [Frases...])`. Cada `Topic` canónico se **alinea con el nombre normalizado de skill** (`java`, `docker`, `spring_boot`, `postgresql`, `react`...) para poder unir tema↔skill en las reglas compuestas. Temas fuera del catálogo (ej. `angular`) existen como tema pero sin skill asociada.

3. **Detección de intención** (`intent/1`): se cruzan los n-gramas contra `intent_keyword(Intent, [Frases...])`. Si no se detecta ninguna, se asume `intent(explain)` (neutro). Pueden coexistir varias.

> **Importante:** el prompt **no** se interpreta semánticamente con IA; es **matching de palabras clave normalizado**, determinista y auditable. La "inteligencia" sigue siendo lógica, no estadística.

---

## 3. Vocabulario de inferencias

Convención de nombres (atomos en `snake_case`, serializados como strings JSON):

| Familia | Patrón | Ejemplos |
|---|---|---|
| Perfil — educativo/laboral | `student_profile`, `university_student`, `works_in_it` | *(sin cambios)* |
| Perfil — nivel por skill | `{beginner\|intermediate\|advanced}_{skill}` | `advanced_java`, `beginner_docker` |
| Perfil — derivadas | nombre semántico | `backend_developer`, `frontend_knowledge`, `needs_docker`, `use_java_examples` |
| **Tema** (NUEVO) | `topic_{tema}` | `topic_java`, `topic_docker_compose`, `topic_postgresql`, `topic_react`, `topic_angular`, `topic_unknown` |
| **Intención** (NUEVO) | `intent_{intencion}` | `intent_learn`, `intent_explain`, `intent_define`, `intent_compare`, `intent_troubleshoot`, `intent_optimize`, `intent_design` |
| **Compuestas** (NUEVO) | nombre semántico + tema | `mastery_{tema}`, `gap_{tema}`, `focus_{tema}`, `compare_{a}_{b}` |

### 3.1 Temas reconocidos (tabla inicial)

Alineados con el catálogo de skills (`data.sql`) + temas externos frecuentes:

`java, python, spring_boot, postgresql, react, typescript, javascript, docker, docker_compose, kubernetes, aws, git, angular, vue, node`

### 3.2 Intenciones reconocidas (tabla inicial)

| Intención | Significado | Disparadores (ejemplos, normalizados) |
|---|---|---|
| `learn` | quiere aprender desde su nivel | "aprender", "quiero aprender", "como empezar", "tutorial", "enseñame" |
| `explain` | quiere entender cómo funciona (default) | "explicame", "como funciona", "explica" |
| `define` | quiere una definición conceptual | "que es", "definicion", "para que sirve" |
| `compare` | quiere contrastar opciones | "compara", "diferencia", "vs", "versus", "cual es mejor" |
| `troubleshoot` | tiene un problema/error | "error", "no funciona", "falla", "problema", "bug", "excepcion" |
| `optimize` | quiere mejorar algo existente | "optimizar", "mejorar rendimiento", "performance", "mas rapido" |
| `design` | quiere diseñar/estructurar | "diseñar", "arquitectura", "como estructurar", "buenas practicas" |

---

## 4. Clasificación de inferencias

### 4.1 Inferencias de PERFIL (dependen solo del perfil) — *sin cambios*

`student_profile`, `university_student`, `works_in_it`, `{beginner|intermediate|advanced}_{skill}`, `backend_developer`, `frontend_knowledge`, `needs_docker`, `use_java_examples`.

> Se mantienen **idénticas** (mismas reglas, mismo orden) para preservar el rastro de auditoría (`Message.appliedInferences`) y la lógica existente.

### 4.2 Inferencias de TEMA (dependen solo del prompt)

`topic_{T}` para cada tema detectado. Si no se detecta tema → `topic_unknown`.
Regla genérica (diseño):

```prolog
% DISEÑO — no implementado
topic_inference(Inf) :- topic(T), atom_concat(topic_, T, Inf).
```

### 4.3 Inferencias de INTENCIÓN (dependen solo del prompt)

`intent_{I}` para cada intención detectada.

```prolog
% DISEÑO — no implementado
intent_inference(Inf) :- intent(I), atom_concat(intent_, I, Inf).
```

### 4.4 Inferencias COMPUESTAS (dependen de perfil + prompt)

Son el corazón de la fase. Se definen **parametrizadas por tema** (una regla cubre todos los temas):

| Compuesta | Condición | Significado |
|---|---|---|
| `mastery_{T}` | `topic(T)` ∧ `advanced_{T}` | el usuario pregunta por algo que **ya domina** → profundizar, saltar fundamentos |
| `gap_{T}` | `topic(T)` ∧ (`beginner_{T}` ∨ sin skill `T`) | pregunta por algo que **no domina/desconoce** → introducir desde la base |
| `focus_{T}` | `topic(T)` | marca el/los tema(s) **relevante(s)** para el gating de recomendaciones |
| `compare_{A}_{B}` | `intent(compare)` ∧ `topic(A)` ∧ `topic(B)` | comparación entre dos temas |

```prolog
% DISEÑO — no implementado (reglas genéricas, NO una por tema)
composite_inference(Inf) :- topic(T), skill(T, L), L >= 7, atom_concat(mastery_, T, Inf).
composite_inference(Inf) :- topic(T), \+ has_skill_min(T, 4), atom_concat(gap_, T, Inf).
composite_inference(Inf) :- topic(T), atom_concat(focus_, T, Inf).
```

---

## 5. Flujo de ejecución

```
Prompt + Perfil (JSON)
        │
        ▼   load_facts/1
  ┌─ load_profile_facts ─→ education_level/1, study_year/1, works_in_it/1, skill/2
  └─ load_prompt_facts  ─→ prompt_tokens/1 → topic/1, intent/1
        │
        ▼   collect_inferences/1   (orden estable: prefijo de perfil intacto)
   Perfil ++ Nivel-skill ++ Derivadas ++ Tema ++ Intención ++ Compuestas
        │
        ▼   collect_recommendations/2   (CON GATING POR TEMA)
   • Recs de perfil topic-agnósticas  → siempre (student_profile, works_in_it)
   • Recs de tema/intención           → SOLO si el tema está activo (focus_{T})
   • Si no hay tema (topic_unknown)   → fallback al comportamiento actual (perfil)
        │
        ▼   build_context/2   (perfil + "Consulta sobre {tema} (intención: {intent})")
        │
        ▼
   PrologResponse { inferences, recommendations, additionalContext }
```

### 5.1 El gating por relevancia (la clave del fix)

Hoy: `recommendation(I, "…Docker…") :- memberchk(needs_docker, I).` → se dispara por perfil.

Diseño: las recomendaciones ligadas a un tema se condicionan a que **ese tema esté activo**:

```prolog
% DISEÑO — no implementado
recommendation(I, Rec) :- memberchk(gap_docker, I), docker_intro_rec(Rec).   % gap_docker ⇒ topic_docker activo
recommendation(I, "Usar ejemplos prácticos…") :- memberchk(student_profile, I). % perfil: topic-agnóstico, siempre
```

Como `gap_docker` **requiere** `topic(docker)`, las recomendaciones de Docker quedan **inherentemente filtradas** por el tema. Para `"Quiero aprender Java"` no hay `topic(docker)` → no hay `gap_docker` → **no hay recomendaciones de Docker**. Problema resuelto, sin perder la inferencia de perfil `needs_docker` en el rastro de auditoría.

---

## 6. Ejemplos completos

Perfil de referencia (seed "Lautaro"): `UNIVERSITY_STUDENT`, año 3, `worksInIT=true`, skills: Java 8, Spring Boot 7, PostgreSQL 5, Docker 2, React 3.

### 6.1 "Quiero aprender Java"
- **Prompt facts:** `intent(learn)`, `topic(java)`
- **Inferencias:** perfil completo (incluye `advanced_java`, `needs_docker`, …) **+** `topic_java`, `intent_learn`, `focus_java`, `mastery_java`
- **Recomendaciones (gated a java):**
  - "El usuario ya tiene nivel avanzado en Java (8/10): enfocar en temas avanzados, no en fundamentos." *(mastery_java + intent_learn)*
  - "Usar ejemplos prácticos y concretos orientados al aprendizaje." *(student_profile)*
  - ❌ **NO** se emiten recomendaciones de Docker.
- **additionalContext:** `Perfil: … Consulta sobre Java (intención: aprender).`

### 6.2 "Explicame Docker Compose"
- **Prompt facts:** `intent(explain)`, `topic(docker_compose)`, `topic(docker)`
- **Inferencias:** perfil **+** `topic_docker_compose`, `topic_docker`, `intent_explain`, `focus_docker`, `gap_docker`
- **Recomendaciones (gated a docker):**
  - "Introducir Docker/Compose desde cero con analogías familiares." *(gap_docker)*
  - "Usar Java y Maven como punto de referencia para analogías." *(bridge: mastery Java)*
- Aquí las recomendaciones de Docker **sí** son correctas porque el tema coincide.

### 6.3 "Cómo funciona Spring Boot"
- **Prompt facts:** `intent(explain)`, `topic(spring_boot)`
- **Inferencias:** perfil **+** `topic_spring_boot`, `intent_explain`, `focus_spring_boot`, `mastery_spring_boot` *(nivel 7)*
- **Recomendaciones:** "Ya tiene nivel avanzado en Spring Boot: profundizar en internals/autoconfiguración, no en setup básico."

### 6.4 "Qué es PostgreSQL"
- **Prompt facts:** `intent(define)`, `topic(postgresql)`
- **Inferencias:** perfil **+** `topic_postgresql`, `intent_define`, `focus_postgresql` *(nivel 5 → ni mastery ni gap)*
- **Recomendaciones:** "Dar una definición conceptual; el usuario tiene nivel intermedio, se pueden referenciar conceptos intermedios."

### 6.5 "Compará React y Angular"
- **Prompt facts:** `intent(compare)`, `topic(react)`, `topic(angular)`
- **Inferencias:** perfil **+** `topic_react`, `topic_angular`, `intent_compare`, `focus_react`, `focus_angular`, `compare_react_angular`, `gap_angular` *(sin skill)*
- **Recomendaciones:** "Estructurar como comparación; el usuario conoce React (nivel inicial) pero no Angular: usar React como punto de partida."

### 6.6 "Tengo un error en Docker"
- **Prompt facts:** `intent(troubleshoot)`, `topic(docker)`
- **Inferencias:** perfil **+** `topic_docker`, `intent_troubleshoot`, `focus_docker`, `gap_docker`
- **Recomendaciones:** "Modo resolución de problemas paso a paso; el usuario tiene nivel inicial en Docker (2/10): no asumir conocimiento de redes/volúmenes avanzados."

---

## 7. Cómo evitar la explosión de reglas

| Estrategia | Detalle |
|---|---|
| **Reglas parametrizadas, no enumeradas** | Una regla `composite_inference(mastery_T) :- topic(T), skill(T,L), L>=7` cubre **todos** los temas. Nada de una regla por tema. |
| **Datos vs lógica** | Temas e intenciones viven en **tablas** (`topic_keyword/2`, `intent_keyword/2`) en `nlp.pl`. Agregar un tema = agregar una fila, no una regla. |
| **Gating reduce el set activo** | Solo los temas presentes en el prompt activan reglas; por request el conjunto activo es mínimo. |
| **Plantillas de recomendación** | Recomendaciones por `(intent × clase-de-tema)` con interpolación del tema vía `format/3`, en vez de strings hardcodeados por tema. |
| **Tope de temas** | Detectar los temas realmente mencionados, no generar compuestas para todo el set de skills del usuario. |

Complejidad: con `T` temas e `I` intenciones, las reglas son **O(1) en cantidad** (genéricas); el costo por request es `O(tokens × |tablas|)`, lineal y acotado.

---

## 8. Compatibilidad con el sistema actual

| Aspecto | Estrategia |
|---|---|
| **Backend** | Sin cambios: el `prompt` ya llega en el request; `PromptBuilder` consume `recommendations`/`additionalContext` sin depender de nombres de inferencia. |
| **Inferencias de perfil** | Se mantienen idénticas y **al inicio** de la lista (`append([Perfil, …])`) → prefijo estable, auditoría intacta. |
| **Orden determinista** | Se conserva el patrón `findall` (ver auditoría de determinismo previa): orden = perfil ++ tema ++ intención ++ compuestas. |
| **Ciclo de vida thread_local** | Los nuevos hechos (`topic/1`, `intent/1`, `prompt_tokens/1`) se agregan a `clear_facts` → sin fuga entre requests. |
| **Fallback sin tema** | Si `topic_unknown` (prompt sin tema reconocible), las recomendaciones caen al **comportamiento actual basado en perfil** → no se rompe ningún caso existente. |
| **Paridad con `MockPrologClient`** | **Se rompe deliberadamente** en las recomendaciones (ese es el objetivo). Decisión propuesta: el **motor Prolog real pasa a ser la fuente de verdad** para el comportamiento prompt-aware; `MockPrologClient` queda como fallback offline *solo-perfil* (documentado). Actualizar el estado de `12-inference-catalog.md` al cerrar la Fase 5. |

---

## 8.bis Estrategia de gating de recomendaciones (F5 — implementada)

A diferencia de F1–F4 (que solo agregan inferencias), **F5 cambia la selección de recomendaciones**. Toda la lógica vive en `rules.pl` (`collect_recommendations/2`); no se tocó `facts.pl`, `nlp.pl`, `PromptBuilder`, el backend ni `additionalContext`.

### Estrategia
El gating se decide con los mismos hechos que generan las compuestas (`topic/1`, `intent/1`):

```prolog
collect_recommendations(Inferences, Recommendations) :-
    findall(R, composite_recommendation(R), CompRecs),
    ( CompRecs \== []
    -> Recommendations = CompRecs                                  % (1) específicas
    ;  fallback_perfil(Inferences, Recommendations) ).             % (2) perfil
```

Una recomendación específica se arma por **(intención × tema)** combinando plantillas genéricas por intención (`verb_rec/3`, que interpolan el tema) con recs puntuales por tema (`verb_topic_rec/3`). Diseño parametrizado → sin explosión de reglas.

### Prioridad
1. **Recomendaciones específicas por inferencia compuesta** (`learning_T` / `troubleshooting_T` / `explaining_T`). Cuando hay alguna compuesta activa, **reemplazan** por completo a las de perfil.
2. **Fallback por perfil**: las reglas de perfil originales (renombradas a `profile_recommendation/2`, **idénticas** en texto y orden) + el default `"Adaptar la explicación al nivel del usuario"`.

### Fallback de compatibilidad
Si el prompt no produce ninguna compuesta (p. ej. `topic_unknown`, o intención `define`/`compare` que aún no generan compuesta), el sistema usa **exactamente** el comportamiento anterior basado solo en perfil. Las inferencias (`needs_docker`, `advanced_java`, etc.) **siguen presentes** en `inferences` para auditoría; lo único que cambia es qué recomendaciones se seleccionan.

| Prompt | Compuesta | Recomendaciones |
|---|---|---|
| "Quiero aprender Java" | `learning_java` | Específicas Java (sin Docker) |
| "Quiero aprender Docker" | `learning_docker` | Específicas Docker (intro + comandos) |
| "Tengo un error en Docker" | `troubleshooting_docker` | Debugging (errores, causas, diagnóstico) |
| "Hola" | — | Fallback perfil (comportamiento anterior) |

---

## 8.ter Estrategia de `additionalContext` dinámico (F6 — implementada)

F6 reemplaza el `additionalContext` casi-estático (que dependía solo del perfil) por uno **sensible al prompt**. Toda la lógica vive en `rules.pl` (`build_context/2` y sus auxiliares); **no** se tocó `facts.pl`, `nlp.pl`, `PromptBuilder`, el backend, los DTOs ni las recomendaciones. El `PromptBuilder` sigue consumiendo el string tal cual y lo coloca bajo `CONTEXTO DEL USUARIO`.

### Estrategia de generación

`build_context/2` ramifica según haya o no tema reconocido:

```prolog
build_context(Inferences, Context) :-
    ( topic(T), T \== unknown
    -> build_topic_context(Inferences, Context)      % prompt-aware
    ;  build_profile_context(Inferences, Context) ).  % fallback clásico
```

El contexto prompt-aware se arma como una lista **ordenada y determinista** de frases cortas, unidas con `". "` y cerradas con `"."` (`join_sentences/2`, que descarta fragmentos vacíos). Las frases salen de reglas parametrizadas (sin texto libre, sin explosión de reglas):

| Fragmento | Predicado | Depende de | Ejemplo |
|---|---|---|---|
| Nivel del usuario en el tema | `level_statement/3` (banda de `skill(Tema,L)`; `none` si no hay skill) | perfil × tema | "El usuario posee conocimientos avanzados de Java" |
| Guía por intención/nivel | `guidance_fragments/2` | intención × nivel | "Evitar explicaciones excesivamente básicas" / "Priorizar el diagnóstico" |
| Puente con el ecosistema | `topic_bridge/2` (0 ó 1 por tema) | tema | "Relacionar Docker con proyectos Java/Spring" |
| Orientación de perfil | `profile_suffix/2` (si `backend_developer`) | perfil | "Perfil orientado a backend" |

El **nivel** reutiliza `level_band/2` (las mismas bandas que las inferencias `{beginner\|intermediate\|advanced}_{skill}`), y el **tema principal** (`primary_topic/1`) es el primero detectado (orden de `topic_keyword/2`), de modo que el resultado es estable: *mismo request → mismo `additionalContext`*.

### Prioridad de fragmentos

Orden fijo de salida (de más específico del usuario a más general):

1. **Nivel del usuario en el tema** (perfil × tema) — ancla la respuesta en lo que el usuario ya sabe.
2. **Guía**: la intención `troubleshoot` **manda** (diagnóstico, pedir errores concretos, orientar a troubleshooting); si no, la guía se decide por **nivel** (avanzado → evitar básico + ejemplos avanzados; intermedio → asumir base; principiante/none → explicar desde cero).
3. **Puente con el ecosistema** del proyecto (Java↔Spring Boot, Docker↔proyectos Java/Spring, PostgreSQL↔backend, …).
4. **Orientación de perfil** (`Perfil orientado a backend`), solo si la inferencia de perfil está activa.

### Fallback de compatibilidad

Si el prompt no produce tema (`topic_unknown` — p. ej. "Hola"), `build_context/2` cae a `build_profile_context/2`, que es **idéntico** (texto y formato) al `build_context/2` anterior a F6: `"Perfil: … Skills: N avanzadas, M iniciales. …"`. No se rompe ningún caso existente; las inferencias completas (`needs_docker`, `advanced_java`, etc.) siguen en `inferences` para auditoría.

| Prompt | Tema | `CONTEXTO DEL USUARIO` |
|---|---|---|
| "Quiero aprender Java" | java (avanzado) | conocimientos avanzados + evitar básico + ejemplos avanzados + puente Spring Boot |
| "Quiero aprender Docker" | docker (inicial) | conocimientos iniciales + explicar desde cero + puente Java/Spring |
| "Tengo un error en Docker" | docker (inicial, troubleshoot) | diagnóstico + pedir errores concretos + troubleshooting + puente Java/Spring |
| "Explicame PostgreSQL" | postgresql (intermedio) | experiencia intermedia + asumir base + puente backend |
| "Hola" | — | contexto clásico de perfil (fallback) |

---

## 8.quater Prompt quality tuning (F7 — implementada)

F7 **no agrega capacidades**: solo afina la **calidad del lenguaje** del prompt enriquecido. Todo vive en `rules.pl` (recomendaciones + `additionalContext`); **no** se tocó `facts.pl`, `nlp.pl`, las inferencias, `PromptBuilder`, el backend, los DTOs ni los contratos HTTP. `appliedInferences` y el fallback de "Hola" quedan **byte-idénticos** a F6.

### Ajustes realizados

1. **Separación de responsabilidades CONTEXTO vs DIRECTRICES (dedup principal).** Antes, frases imperativas se repetían en ambos bloques (p. ej. *"Relacionar con Spring Boot"*, *"explicar desde cero"*, *"Perfil orientado a backend"* / *"perspectiva backend"*, *"pedir los mensajes de error"*). Ahora:
   - **`additionalContext` (CONTEXTO DEL USUARIO) = solo descriptivo**: nivel del usuario en el tema + qué pide (`situation_clause/1`) + orientación de perfil. Sin imperativos.
   - **`recommendations` (DIRECTRICES) = solo accionable**: todas las directivas imperativas, incluida la del puente con el ecosistema (movida desde el contexto).
2. **Prioridad explícita de las recomendaciones.** `composite_rec/3` ordena: (1) **profundidad por nivel** (`verb_band_rec/4` — encuadra el "cómo" según lo que el usuario ya sabe), (2) **acción por intención** (`verb_rec/3`), (3) **concreción por tema** (`verb_topic_rec/3`). La directiva más decisiva va primera.
3. **Recomendaciones más accionables.** Wording más concreto y verificable: *"Mostrar comandos de diagnóstico"* → *"Pedir el mensaje de error completo y el stack trace"* / *"Proponer comandos de diagnóstico paso a paso"*; *"Incluir docker run, docker build y docker ps"* + *"Explicar imágenes y contenedores"* → una sola directiva *"Cubrir imágenes y contenedores con docker run, docker build y docker ps"*.
4. **Eliminación de redundancias dentro de DIRECTRICES.** Se fusionan near-duplicates (*"Utilizar ejemplos prácticos en X"* + *"Mostrar fragmentos de código de X"* → *"Incluir ejemplos de código comentados de X"*), reduciendo el tamaño del prompt.
5. **Consistencia de lenguaje.** CONTEXTO siempre en 3.ª persona descriptiva ("El usuario tiene un nivel… / Busca… / Pide…"); DIRECTRICES siempre en infinitivo imperativo.

### Impacto esperado en la calidad del prompt
- **Menos ruido para el LLM:** sin instrucciones duplicadas entre secciones → menor riesgo de sobre-énfasis y prompt más corto.
- **Mejor encuadre:** la primera directiva fija el nivel de profundidad, evitando respuestas demasiado básicas (avanzado) o demasiado densas (inicial).
- **Más accionable:** las directivas piden insumos concretos (stack trace, comandos) en vez de generalidades.
- **Determinismo y compatibilidad intactos:** mismo request → mismo output; inferencias y caso "Hola" sin cambios.

### Ejemplos antes/después (perfil seed "Lautaro")

**"Quiero aprender Java"** (java, avanzado, learn)

| | Antes (F6) | Después (F7) |
|---|---|---|
| CONTEXTO | El usuario posee conocimientos avanzados de Java. **Evitar explicaciones excesivamente básicas. Utilizar ejemplos intermedios o avanzados. Relacionar los conceptos con Spring Boot.** Perfil orientado a backend. | El usuario tiene un nivel avanzado en Java. Busca ampliar sus conocimientos sobre el tema. Perfil orientado a backend. |
| DIRECTRICES | Utilizar ejemplos prácticos en Java · Mostrar fragmentos de código de Java · **Relacionar conceptos con Spring Boot** · Explicar desde una perspectiva backend | **Enfocar el contenido en aspectos avanzados de Java y omitir los fundamentos** · Incluir ejemplos de código comentados de Java · Relacionar los conceptos con Spring Boot cuando aporte valor |

> El puente con Spring Boot y la orientación a backend ya **no se repiten** en CONTEXTO y DIRECTRICES; la profundidad ("aspectos avanzados, omitir fundamentos") encabeza las directivas.

**"Tengo un error en Docker"** (docker, inicial, troubleshoot)

| | Antes (F6) | Después (F7) |
|---|---|---|
| CONTEXTO | El usuario tiene conocimientos iniciales de Docker. **Priorizar el diagnóstico. Pedir los mensajes de error concretos. Orientar la respuesta a la resolución de problemas. Relacionar Docker con proyectos Java/Spring.** Perfil orientado a backend. | El usuario tiene un nivel inicial en Docker. Presenta un error que necesita diagnosticar. Perfil orientado a backend. |
| DIRECTRICES | Analizar los mensajes de error de Docker · Explicar las causas frecuentes de fallos en Docker · Mostrar comandos de diagnóstico de Docker · Revisar los logs con docker logs | **Pedir el mensaje de error completo y el stack trace** · Enumerar las causas más probables del fallo en Docker y cómo descartarlas · Proponer comandos de diagnóstico de Docker paso a paso · Inspeccionar contenedor y logs con docker ps y docker logs |

> El diagnóstico deja de duplicarse como descripción + directiva; las directivas piden un insumo concreto (stack trace) y un procedimiento paso a paso.

**"Hola"** (sin tema) → CONTEXTO y DIRECTRICES **idénticos** a F6 (fallback por perfil intacto).

---

## 9. Roadmap de implementación incremental

Cada fase **compila, es verificable de forma aislada y preserva** el comportamiento de las fases previas (estilo `11-implementation-order.md`).

| Fase | Estado | Entregable | Cambio observable | Criterio de aceptación |
|---|---|---|---|---|
| **F1 — Plumbing del prompt** | ✅ | `load_prompt_facts/1` lee `Dict.prompt`, tokeniza, asienta `prompt_tokens/1`; `clear_facts` extendido | Ninguno en la salida | Los hechos del prompt se cargan y se limpian; salida idéntica a hoy |
| **F2 — Detección de tema** | ✅ | `nlp.pl` con `topic_keyword/2` + `topic/1`; inferencias `topic_{T}` añadidas al final | Aparecen `topic_*` en `inferences` | "Quiero aprender Java" produce `topic_java`; recomendaciones sin cambiar |
| **F3 — Detección de intención** | ✅ | `intent_keyword/2` + `intent/1`; inferencias `intent_{I}` | Aparecen `intent_*` | Las consultas detectan la intención correcta |
| **F4 — Inferencias compuestas** | ✅ | `composite_inference/1` + `intent_verb/2`: `learning_{T}`, `troubleshooting_{T}`, `explaining_{T}` (topic × intent). *(`mastery_*`/`gap_*`/`focus_*`/`compare_*` replanificados a fases posteriores.)* | Aparecen compuestas | "Quiero aprender Java" → `learning_java`; "Tengo un error en Docker" → `troubleshooting_docker`; "Explicame PostgreSQL" → `explaining_postgresql` |
| **F5 — Recomendaciones con gating** | ✅ | `collect_recommendations/2` con prioridad compuesta→perfil; `composite_recommendation/1` + `verb_rec/3` + `verb_topic_rec/3` + `topic_label/2`; `recommendation/2` renombrada a `profile_recommendation/2` (fallback intacto) | **Cambio de comportamiento** (fix del problema) | "Quiero aprender Java" ya **no** recomienda Docker; "Quiero aprender Docker"/"Tengo un error en Docker" **sí** (aprendizaje vs debugging); "Hola" → fallback perfil |
| **F6 — additionalContext enriquecido** | ✅ | `build_context/2` con rama prompt-aware (`build_topic_context/2`) + fallback (`build_profile_context/2`); fragmentos por reglas: `level_statement/3`, `guidance_fragments/2`, `topic_bridge/2`, `profile_suffix/2`, `join_sentences/2` | **Cambio de comportamiento** (el `CONTEXTO DEL USUARIO` cambia por consulta) | "Quiero aprender Java" → contexto avanzado Java + Spring Boot; "Quiero aprender Docker" → inicial + desde cero; "Tengo un error en Docker" → diagnóstico; "Explicame PostgreSQL" → intermedio; "Hola" → contexto clásico de perfil |
| **F7 — Prompt quality tuning** | ✅ | Solo wording/prioridad/dedup en `rules.pl`: `verb_band_rec/4` (directiva de profundidad por nivel, prioridad 1), `verb_rec/3`/`verb_topic_rec/3` reescritas y deduplicadas, `additionalContext` descriptivo (`level_statement/3` + `situation_clause/1`, sin imperativos) | **Mejora de calidad** del prompt (sin nuevas capacidades) | `CONTEXTO`/`DIRECTRICES` sin frases repetidas; recomendaciones más accionables y priorizadas; inferencias y "Hola" idénticos; determinismo intacto |

> **Implementación F1–F3 (actual):** `nlp.pl` (NUEVO — tablas `topic_keyword/2`, `intent_keyword/2` + detección), `facts.pl` (+`load_prompt_facts/1`, hechos `thread_local` `prompt_tokens/1`/`topic/1`/`intent/1`, `clear_facts` extendido), `rules.pl` (+`topic_inference/1`, `intent_inference/1` añadidas al final de `collect_inferences/1`). `recommendations`/`additionalContext` **sin tocar**. Temas F2: java, spring_boot, postgresql, docker, react, git (angular/vue/node/kubernetes/aws pospuestos).

> Recomendado: F1–F4 no cambian el comportamiento (solo agregan inferencias), así que son seguras de mergear gradualmente. F5 es el único cambio de comportamiento y debe coordinarse con la actualización de `12-inference-catalog.md` y la decisión sobre `MockPrologClient`.

---

## 10. Riesgos y consideraciones de mantenimiento

| Riesgo | Mitigación |
|---|---|
| **Fragilidad del matching** (sinónimos, acentos, typos, ES/EN) | Normalizar (minúsculas + quitar acentos); tablas de sinónimos mantenibles; bigramas para multi-palabra; intención default `explain` |
| **Prompt sin tema reconocible** | `topic_unknown` → fallback al comportamiento por perfil (no rompe nada) |
| **Prompts multi-tema** | Soportar múltiples `topic/1`; el gating funciona por tema |
| **Explosión de reglas** | Reglas genéricas + tablas de datos (§7) |
| **Ruptura de paridad con el mock** | Documentada; motor real = fuente de verdad prompt-aware; mock = fallback solo-perfil |
| **Orden/determinismo** | Mantener `findall` y orden de concatenación fijo (auditoría previa) |
| **Fuga de estado entre requests** | Incluir TODOS los hechos nuevos en `clear_facts`; `thread_local` |
| **Mantenimiento del catálogo** | Escalar = agregar filas a `topic_keyword/2` / `intent_keyword/2`; las reglas no cambian |
| **Falsos positivos de tema** | p. ej. "java" dentro de "javascript": usar matching por token/n-grama completo, no substring |

### Escalabilidad a futuro
- **Nuevo tema:** una fila en `topic_keyword/2` (y, si es skill del catálogo, queda auto-ligado a `skill/2`).
- **Nueva intención:** una fila en `intent_keyword/2` + opcionalmente una plantilla de recomendación.
- **Nueva regla compuesta:** una cláusula genérica parametrizada por tema.
- Las inferencias `topic_*`, `intent_*`, `mastery_*`, `gap_*`, `focus_*` se generan **automáticamente** por reglas genéricas — sin tocar el motor al crecer el catálogo.

---

## 11. Decisiones que requieren aprobación

1. **Romper la paridad con `MockPrologClient`** en las recomendaciones (necesario para el objetivo). ¿Se acepta que el motor Prolog real sea la fuente de verdad prompt-aware y el mock quede solo-perfil?
2. **Idioma/alcance de las tablas de sinónimos** (ES primario; ¿incluir EN?).
3. **Intención por defecto** = `explain` cuando no se detecta ninguna.
4. **`additionalContext`**: ¿se extiende con tema/intención (F6) o se deja el resumen de perfil actual?
5. **Alcance inicial de temas**: ¿solo el catálogo de skills + {angular, vue, node}, o una lista más amplia?

---

*Documento de diseño. No se implementó ninguna regla. Pendiente de revisión y aprobación antes de codificar la Fase 1.*
