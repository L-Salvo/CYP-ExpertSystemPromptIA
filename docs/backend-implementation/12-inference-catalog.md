# Catálogo Oficial de Inferencias — Sistema Experto CYP

> **Estado:** Congelado para construcción de PromptBuilder (PASO 10)  
> **Fuente autoritativa:** `MockPrologClient.java` + DTOs de integración Prolog  
> **Fecha de congelamiento:** 2026-06-12  
> **NO modificar este documento sin actualizar simultáneamente `MockPrologClient` y el motor Prolog real.**

---

## Arquitectura del contrato

El flujo de inferencia es:

```
PrologRequest(prompt, PrologUserProfile)
        ↓
  PrologClient.infer()
        ↓
PrologResponse(inferences, recommendations, additionalContext)
        ↓
  Message.appliedInferences  ← persiste en BD como TEXT (JSON array)
  PromptBuilder              ← consume inferences + recommendations + additionalContext
```

Las **inferencias** son los identificadores string que el PromptBuilder debe leer para tomar decisiones. Las **recomendaciones** y el **additionalContext** son texto libre complementario.

### Umbrales globales

| Constante           | Valor | Descripción                                     |
|---------------------|-------|-------------------------------------------------|
| `BEGINNER_THRESHOLD`  | `3`   | Nivel ≤ 3 → inferencia `beginner_*`             |
| `ADVANCED_THRESHOLD`  | `7`   | Nivel ≥ 7 → inferencia `advanced_*`             |
| _(rango intermedio)_  | 4–6   | 4 ≤ nivel ≤ 6 → inferencia `intermediate_*`    |

El nivel de cada skill es un entero de **1 a 10**, declarado en `UpdateSkillLevelRequest`.

---

## Catálogo de inferencias

Las inferencias se agrupan en cuatro categorías según su origen.

---

### Categoría 1 — Perfil educativo

Generadas a partir del campo `educationLevel` de `PrologUserProfile`.  
El enum `EducationLevel` tiene cinco valores: `SECONDARY_STUDENT`, `TERTIARY_STUDENT`, `UNIVERSITY_STUDENT`, `GRADUATED`, `POSTGRADUATE`.

---

#### `student_profile`

- **Significado:** El usuario es un estudiante activo (secundario, terciario o universitario).
- **Condición de activación:** `educationLevel` ∈ `{UNIVERSITY_STUDENT, TERTIARY_STUDENT, SECONDARY_STUDENT}`
- **Mutuamente exclusivo con:** nada (puede coexistir con `university_student`)
- **Ejemplo de perfil que la produce:**
  ```json
  { "educationLevel": "TERTIARY_STUDENT", "worksInIT": false, "skills": [] }
  ```
- **Impacto esperado en PromptBuilder:**  
  Usar ejemplos prácticos y concretos orientados al aprendizaje. Evitar jerga profesional sin explicación.  
  _(Recomendación generada: "Usar ejemplos prácticos y concretos orientados al aprendizaje")_

---

#### `university_student`

- **Significado:** El usuario está cursando una carrera universitaria.
- **Condición de activación:** `educationLevel == UNIVERSITY_STUDENT`
- **Nota:** Siempre aparece acompañada de `student_profile`.
- **Ejemplo de perfil que la produce:**
  ```json
  { "educationLevel": "UNIVERSITY_STUDENT", "studyYear": 3, "worksInIT": true, "skills": [] }
  ```
- **Impacto esperado en PromptBuilder:**  
  Puede asumirse mayor rigor conceptual que en un estudiante secundario; referencias a materias o proyectos académicos son válidas.

---

### Categoría 2 — Situación laboral

---

#### `works_in_it`

- **Significado:** El usuario trabaja profesionalmente en el sector IT.
- **Condición de activación:** `worksInIT == true`
- **Ejemplo de perfil que la produce:**
  ```json
  { "educationLevel": "GRADUATED", "worksInIT": true, "skills": [] }
  ```
- **Impacto esperado en PromptBuilder:**  
  Asumir contexto profesional. Omitir explicaciones excesivamente básicas sobre conceptos de la industria.  
  _(Recomendación generada: "Asumir contexto profesional; evitar explicaciones demasiado básicas")_

---

### Categoría 3 — Nivel por skill (dinámicas)

Estas inferencias se generan **una por cada skill del perfil del usuario**. El nombre se construye así:

```
{nivel_string}_{skill_name_normalizado}
```

Donde:
- `nivel_string` ∈ `{beginner, intermediate, advanced}`
- `skill_name_normalizado` = `skill.name.toLowerCase().replace(" ", "_")`

#### Reglas de nivel

| nivel_string    | Condición de nivel |
|-----------------|--------------------|
| `beginner`      | `level <= 3`       |
| `intermediate`  | `4 <= level <= 6`  |
| `advanced`      | `level >= 7`       |

#### Skills del catálogo actual (`data.sql`)

Las skills registradas en el sistema y sus inferencias posibles:

| Skill (name en BD) | Normalizado          | Inferencias posibles                                                   |
|--------------------|----------------------|------------------------------------------------------------------------|
| Java               | `java`               | `beginner_java`, `intermediate_java`, `advanced_java`                  |
| Spring Boot        | `spring_boot`        | `beginner_spring_boot`, `intermediate_spring_boot`, `advanced_spring_boot` |
| PostgreSQL         | `postgresql`         | `beginner_postgresql`, `intermediate_postgresql`, `advanced_postgresql` |
| React              | `react`              | `beginner_react`, `intermediate_react`, `advanced_react`               |
| TypeScript         | `typescript`         | `beginner_typescript`, `intermediate_typescript`, `advanced_typescript` |
| Python             | `python`             | `beginner_python`, `intermediate_python`, `advanced_python`            |
| Docker             | `docker`             | `beginner_docker`, `intermediate_docker`, `advanced_docker`            |
| Kubernetes         | `kubernetes`         | `beginner_kubernetes`, `intermediate_kubernetes`, `advanced_kubernetes` |
| AWS                | `aws`                | `beginner_aws`, `intermediate_aws`, `advanced_aws`                     |
| Git                | `git`                | `beginner_git`, `intermediate_git`, `advanced_git`                     |

> **Importante:** Si en el futuro se agregan skills al catálogo, sus inferencias se generan automáticamente por esta regla, sin modificar `MockPrologClient`. El PromptBuilder debe manejar el patrón genérico, no una lista cerrada.

#### Ejemplos representativos

**`advanced_java`**
- **Significado:** El usuario tiene nivel avanzado en Java.
- **Condición:** Skill "Java" con nivel ≥ 7.
- **Ejemplo de perfil:**
  ```json
  { "educationLevel": "UNIVERSITY_STUDENT", "worksInIT": true,
    "skills": [{ "name": "Java", "level": 8 }] }
  ```
- **Impacto en PromptBuilder:** Usar Java y Maven como referencia para analogías. Código de ejemplo puede omitir explicaciones de sintaxis básica.

**`intermediate_spring_boot`**
- **Significado:** El usuario tiene conocimiento intermedio de Spring Boot.
- **Condición:** Skill "Spring Boot" con nivel 4–6.
- **Ejemplo de perfil:**
  ```json
  { "skills": [{ "name": "Spring Boot", "level": 5 }] }
  ```
- **Impacto en PromptBuilder:** Explicar conceptos avanzados de Spring Boot, pero incluir breves recordatorios de conceptos intermedios cuando sean necesarios.

**`beginner_docker`**
- **Significado:** El usuario es principiante en Docker.
- **Condición:** Skill "Docker" con nivel ≤ 3.
- **Ejemplo de perfil:**
  ```json
  { "skills": [{ "name": "Docker", "level": 2 }] }
  ```
- **Impacto en PromptBuilder:** Introducir Docker desde cero con analogías familiares. Incluir comandos básicos (`docker run`, `docker build`, `docker ps`). Evitar jerga avanzada (multi-stage builds, overlay networks) sin explicación previa.

**`beginner_kubernetes`**
- **Significado:** El usuario es principiante en Kubernetes.
- **Condición:** Skill "Kubernetes" con nivel ≤ 3.
- **Impacto en PromptBuilder:** No asumir conocimiento de clusters, pods, o manifiestos YAML. Partir desde conceptos de contenedores si Docker también es beginner.

---

### Categoría 4 — Inferencias derivadas (combinaciones)

Estas inferencias se generan por **reglas que cruzan múltiples skills o condiciones del perfil**. No corresponden a un único campo, sino a combinaciones evaluadas después de procesar los skills individuales.

---

#### `backend_developer`

- **Significado:** El usuario tiene perfil orientado a desarrollo backend.
- **Condición:** Al menos una skill backend (Java, Spring Boot o Python) con nivel ≥ 7.
- **Skills backend reconocidas:** `Java`, `Spring Boot`, `Python`
- **Ejemplo de perfil que la produce:**
  ```json
  { "worksInIT": true,
    "skills": [
      { "name": "Java", "level": 8 },
      { "name": "Spring Boot", "level": 7 }
    ] }
  ```
- **Impacto en PromptBuilder:** Orientar la explicación desde una perspectiva de backend. Usar terminología de servidores, APIs y servicios. Puede omitir detalles de UI/UX salvo que sean explícitamente pedidos.  
  _(Recomendación generada: "Orientar la explicación desde una perspectiva de backend")_  
  _(additionalContext incluye: "Perfil orientado a backend.")_

---

#### `frontend_knowledge`

- **Significado:** El usuario conoce tecnologías frontend (independientemente del nivel).
- **Condición:** El usuario tiene **alguna** skill frontend en su perfil. El nivel no importa.
- **Skills frontend reconocidas:** `React`, `TypeScript`, `JavaScript`
- **Ejemplo de perfil que la produce:**
  ```json
  { "skills": [{ "name": "React", "level": 3 }] }
  ```
- **Nota:** Se activa incluso con nivel 1. Es una inferencia de presencia, no de dominio.
- **Impacto en PromptBuilder:** Mencionar diferencias entre entornos frontend y backend cuando aplique. Puede usarse para enriquecer ejemplos con contexto full-stack.  
  _(Recomendación generada: "Mencionar diferencias entre entornos frontend y backend cuando aplique")_

---

#### `needs_docker`

- **Significado:** El usuario tiene Docker en su perfil pero con nivel principiante; necesita introducción a la tecnología.
- **Condición:** Skill "Docker" presente con nivel ≤ 3.
- **Relación con `beginner_docker`:** Ambas se generan simultáneamente bajo la misma condición. `beginner_docker` es la etiqueta de nivel genérica; `needs_docker` es la señal semántica específica para Docker.
- **Ejemplo de perfil que la produce:**
  ```json
  { "skills": [{ "name": "Docker", "level": 2 }] }
  ```
- **Impacto en PromptBuilder:** Idéntico a `beginner_docker`. Al existir las dos, el PromptBuilder puede usar cualquiera de ellas; se recomienda usar `needs_docker` como señal prioritaria para activar el modo "introducción a Docker".  
  _(Recomendaciones generadas: "Introducir Docker desde cero con analogías familiares", "Incluir comandos básicos: docker run, docker build, docker ps")_

---

#### `use_java_examples`

- **Significado:** El usuario domina Java; los ejemplos de código pueden y deben usar Java.
- **Condición:** Skill "Java" con nivel ≥ 7.
- **Relación con `advanced_java`:** Ambas se generan simultáneamente bajo la misma condición. `advanced_java` es la etiqueta de nivel genérica; `use_java_examples` es la señal semántica de acción para el PromptBuilder.
- **Ejemplo de perfil que la produce:**
  ```json
  { "skills": [{ "name": "Java", "level": 9 }] }
  ```
- **Impacto en PromptBuilder:** Usar Java y Maven como punto de referencia para analogías. Los snippets de código pueden estar en Java sin necesidad de aclaración del lenguaje.  
  _(Recomendación generada: "Usar Java y Maven como punto de referencia para analogías")_

---

## Tabla resumen

| Inferencia              | Tipo      | Condición de activación                                             |
|-------------------------|-----------|---------------------------------------------------------------------|
| `student_profile`       | Perfil    | educationLevel ∈ {UNIVERSITY_STUDENT, TERTIARY_STUDENT, SECONDARY_STUDENT} |
| `university_student`    | Perfil    | educationLevel == UNIVERSITY_STUDENT                                |
| `works_in_it`           | Laboral   | worksInIT == true                                                   |
| `beginner_{skill}`      | Skill     | skill.level ≤ 3                                                     |
| `intermediate_{skill}`  | Skill     | 4 ≤ skill.level ≤ 6                                                 |
| `advanced_{skill}`      | Skill     | skill.level ≥ 7                                                     |
| `backend_developer`     | Derivada  | any(Java/Spring Boot/Python).level ≥ 7                              |
| `frontend_knowledge`    | Derivada  | any(React/TypeScript/JavaScript) presente en el perfil              |
| `needs_docker`          | Derivada  | Docker.level ≤ 3                                                    |
| `use_java_examples`     | Derivada  | Java.level ≥ 7                                                      |

---

## Perfil de referencia del seed de desarrollo

El `data.sql` define el usuario de desarrollo con el siguiente perfil:

```
educationLevel: UNIVERSITY_STUDENT
studyYear: 3
worksInIT: true
skills:
  Java        → level 8
  Spring Boot → level 7
  PostgreSQL  → level 5
  Docker      → level 2
  React       → level 3
```

Inferencias que este perfil produce:

| Inferencia             | Motivo                                      |
|------------------------|---------------------------------------------|
| `student_profile`      | UNIVERSITY_STUDENT                          |
| `university_student`   | UNIVERSITY_STUDENT                          |
| `works_in_it`          | worksInIT = true                            |
| `advanced_java`        | Java level 8 ≥ 7                            |
| `advanced_spring_boot` | Spring Boot level 7 ≥ 7                     |
| `intermediate_postgresql` | PostgreSQL level 5 (4–6)               |
| `beginner_docker`      | Docker level 2 ≤ 3                          |
| `beginner_react`       | React level 3 ≤ 3                           |
| `backend_developer`    | Java ≥ 7 (regla derivada)                   |
| `frontend_knowledge`   | React presente (regla derivada)             |
| `needs_docker`         | Docker level 2 ≤ 3 (regla derivada)        |
| `use_java_examples`    | Java level 8 ≥ 7 (regla derivada)          |

---

## Notas de implementación para PromptBuilder

1. **El PromptBuilder consume tres campos de `PrologResponse`:**
   - `inferences` — lista de strings; cada uno es un identificador de este catálogo.
   - `recommendations` — lista de strings en lenguaje natural; se insertan como directivas al prompt.
   - `additionalContext` — string descriptivo del perfil; se antepone al prompt enriquecido.

2. **Coexistencia de inferencias redundantes:** `beginner_docker` y `needs_docker` siempre aparecen juntas. Lo mismo para `advanced_java` y `use_java_examples`. El PromptBuilder no debe tratar estas como mutuamente excluyentes ni duplicar efectos.

3. **Inferencias de nivel son mutuamente excluyentes por skill:** Para una skill dada, solo puede activarse `beginner_`, `intermediate_` o `advanced_`, nunca dos al mismo tiempo.

4. **Extensibilidad:** Agregar una nueva skill al catálogo (`data.sql`) no requiere cambios en `MockPrologClient` ni en este contrato. Las inferencias `beginner_*`, `intermediate_*`, `advanced_*` se generan automáticamente. Las reglas derivadas (`backend_developer`, `frontend_knowledge`, `needs_docker`, `use_java_examples`) sí requieren modificación explícita del código para incorporar nuevas skills.

5. **Persistencia:** Las inferencias se guardan en `messages.applied_inferences` como JSON array en columna TEXT, via `StringListConverter`.
