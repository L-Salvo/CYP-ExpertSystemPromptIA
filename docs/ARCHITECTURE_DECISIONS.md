# Architecture Decision Records (ADR)

**Proyecto:** Sistema Experto para Personalización Inteligente de Prompts  
**Stack:** React · Spring Boot · PostgreSQL · SWI-Prolog · Docker Compose  
**Objetivo principal:** Enriquecer prompts utilizando información del perfil del usuario y reglas de inferencia implementadas en Prolog.

> Este documento registra decisiones arquitectónicas tomadas durante el desarrollo, posteriores a la redacción del documento principal del proyecto. Su propósito es preservar el razonamiento detrás de cada decisión y servir como referencia durante la implementación.

---

## Índice

- [ADR-001 — El perfil del usuario es la única fuente de verdad para la personalización](#adr-001)
- [ADR-002 — El sistema experto y la IA estarán desacoplados](#adr-002)
- [ADR-003 — El usuario puede revisar el prompt enriquecido antes de enviarlo a la IA](#adr-003)
- [ADR-004 — Persistencia de conversaciones](#adr-004)
- [ADR-005 — Separación de endpoints](#adr-005)
- [ADR-006 — Prolog no accede directamente a la base de datos](#adr-006)
- [ADR-007 — Comunicación Spring Boot ↔ Prolog vía HTTP REST](#adr-007)
- [ADR-008 — El sistema mostrará el proceso de enriquecimiento al usuario](#adr-008)
- [Trabajo Futuro](#trabajo-futuro)

---

## ADR-001

### El perfil del usuario es la única fuente de verdad para la personalización

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

La primera versión del sistema utilizará exclusivamente la información almacenada en el perfil persistente del usuario para enriquecer prompts. No se implementará detección de preferencias expresadas en lenguaje natural dentro del prompt.

#### Ejemplo

Dado el prompt:
```
"Explícame Docker"
```

El sistema consultará el perfil del usuario para determinar:

- Nivel de conocimiento técnico
- Intereses declarados
- Tecnologías conocidas
- Preferencias de aprendizaje

El enriquecimiento se construirá exclusivamente a partir de esos datos, sin analizar la semántica del prompt.

#### Justificación

- Reduce la complejidad de implementación.
- Evita incorporar procesamiento de lenguaje natural (NLP).
- Mantiene el foco en los sistemas expertos, que es el núcleo académico del proyecto.
- Reduce riesgos de implementación en el alcance del trabajo final.

#### Trabajo futuro

Permitir que instrucciones explícitas dentro del prompt puedan sobrescribir temporalmente la información del perfil del usuario.

---

## ADR-002

### El sistema experto y la IA estarán desacoplados

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

El objetivo principal del proyecto es la generación de prompts enriquecidos mediante un sistema experto. La consulta a un modelo de IA es una funcionalidad adicional y opcional. El sistema debe operar correctamente incluso si ninguna API de IA externa está disponible.

#### Justificación

- El valor académico del proyecto reside en el sistema experto, no en el modelo de IA.
- Permite demostrar el funcionamiento completo del sistema en condiciones de defensa sin depender de servicios externos.
- Facilita pruebas unitarias e integración continua.

---

## ADR-003

### El usuario puede revisar el prompt enriquecido antes de enviarlo a la IA

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

El flujo de enriquecimiento incluye un paso explícito de revisión por parte del usuario antes de consultar al modelo de IA.

#### Flujo

```
1. Usuario escribe el prompt original.
2. Spring Boot obtiene el perfil del usuario desde PostgreSQL.
3. Spring Boot envía el perfil y el prompt a Prolog para inferencia.
4. Spring Boot construye el prompt enriquecido con el resultado.
5. El prompt enriquecido se muestra al usuario en la interfaz.
6. El usuario puede:
   a. Editarlo manualmente.
   b. Aceptarlo tal como está.
   c. Enviarlo al modelo de IA.
7. Solo tras la confirmación del usuario se consulta la IA.
```

#### Justificación

- Incrementa la transparencia del proceso de enriquecimiento.
- Mejora la explicabilidad del sistema experto (requisito académico clave).
- Permite validar visualmente el trabajo de inferencia de Prolog.

---

## ADR-004

### Persistencia de conversaciones

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

El modelo de datos para conversaciones seguirá la siguiente jerarquía:

```
User
 └── Chat
      └── Message
```

Un usuario puede tener múltiples chats, y cada chat puede contener múltiples mensajes.

#### Estructura de un mensaje

| Campo | Tipo | Descripción |
|---|---|---|
| `originalPrompt` | `String` | Prompt tal como lo escribió el usuario |
| `enrichedPrompt` | `String` | Prompt enriquecido por el sistema experto |
| `appliedInferences` | `JSON` (nullable) | Lista de inferencias aplicadas por Prolog |
| `aiResponse` | `String` (nullable) | Respuesta del modelo de IA (opcional) |
| `createdAt` | `Timestamp` | Fecha y hora de creación |

#### Ejemplo de `appliedInferences`

```json
["backend_developer", "needs_docker", "use_java_examples"]
```

Este campo permite reconstruir el razonamiento completo del sistema experto para cualquier mensaje:

```
Prompt original
      ↓
Inferencias aplicadas
      ↓
Prompt enriquecido
      ↓
Respuesta IA
```

#### Justificación

Permite mantener el historial completo del proceso de enriquecimiento. Almacenar `appliedInferences` agrega trazabilidad sobre *por qué* se construyó cada prompt enriquecido, lo que incrementa la explicabilidad del sistema y facilita auditoría, análisis y demostración en defensa académica.

---

## ADR-005

### Separación de endpoints

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

La generación del prompt enriquecido y el envío al modelo de IA serán operaciones expuestas como endpoints independientes.

#### Endpoints conceptuales

```
POST /api/chats/{chatId}/messages/enrich
```
Recibe el prompt original, ejecuta el flujo de enriquecimiento mediante Prolog y devuelve el prompt enriquecido. No consulta ningún modelo de IA.

```
POST /api/messages/{messageId}/send
```
Toma un mensaje ya enriquecido y lo envía al modelo de IA configurado. Almacena la respuesta en el mensaje correspondiente.

#### Justificación

- Bajo acoplamiento entre la lógica del sistema experto y la integración con IA.
- Mayor trazabilidad de cada etapa del proceso.
- Mejor experiencia de usuario (el usuario controla cada paso).
- Permite probar el sistema experto de forma completamente aislada.

---

## ADR-006

### Prolog no accede directamente a la base de datos

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

El servicio Prolog nunca consultará PostgreSQL directamente. Spring Boot es el único componente autorizado para el acceso a datos persistentes.

#### Flujo de datos

```
PostgreSQL
    ↓
Spring Boot  ←→  Prolog (solo inferencia sobre datos recibidos)
```

Spring Boot es responsable de recuperar el perfil del usuario y preparar el payload que se enviará a Prolog. Prolog opera exclusivamente sobre los datos que Spring Boot le proporciona en cada solicitud.

#### Justificación

- Mantiene responsabilidades claramente separadas entre componentes.
- Simplifica el servicio Prolog, que se enfoca exclusivamente en la lógica de inferencia.
- Facilita las pruebas unitarias de cada capa de forma independiente.

---

## ADR-007

### Comunicación Spring Boot ↔ Prolog vía HTTP REST

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

La integración entre Spring Boot y SWI-Prolog se realizará mediante HTTP REST. Spring Boot enviará los datos necesarios a un endpoint expuesto por el servicio Prolog y recibirá el resultado de la inferencia.

#### Contrato de ejemplo

**Request:**
```
POST /infer
Content-Type: application/json

{
  "prompt": "Explícame Docker",
  "userProfile": {
    "knowledgeLevel": "beginner",
    "interests": ["backend", "devops"],
    "knownTechnologies": ["Java", "Maven"],
    "learningPreferences": ["analogies", "examples"]
  }
}
```

**Response:**
```json
{
  "inferences": ["El usuario no conoce contenedores", "Prefiere ejemplos concretos"],
  "recommendations": ["Usar analogía con máquinas virtuales", "Incluir ejemplo con docker run"],
  "additionalContext": "Nivel principiante confirmado"
}
```

#### Justificación

- Protocolo simple, estándar y bien soportado en ambos entornos.
- Compatible de forma nativa con Docker Compose (comunicación entre contenedores por nombre de servicio).
- Mantiene el desacoplamiento entre el paradigma orientado a objetos (Spring) y el paradigma lógico (Prolog).

---

## ADR-008

### El sistema mostrará el proceso de enriquecimiento al usuario

| Campo | Detalle |
|---|---|
| **Estado** | Confirmado |
| **Fecha** | 2026-06-10 |

#### Decisión

La interfaz mostrará el progreso del pipeline de enriquecimiento en tiempo real, de forma que el usuario pueda observar en qué etapa se encuentra el sistema en cada momento.

#### Pipeline visible

```
Usuario envía prompt
        ↓
Obteniendo perfil
        ↓
Ejecutando inferencias
        ↓
Construyendo prompt enriquecido
        ↓
Prompt enriquecido listo
        ↓
(Opcional) Enviar a IA
        ↓
Respuesta
```

#### Justificación

- **Explicabilidad:** el usuario comprende qué hace el sistema en cada paso, no percibe la respuesta como una caja negra.
- **Transparencia:** hace visible el trabajo del sistema experto, que de otro modo sería invisible para el usuario final.
- **Valor académico:** demuestra concretamente que el sistema tiene múltiples etapas diferenciadas y no es una simple llamada a una API de IA.
- **Visualización del sistema experto:** permite apreciar en tiempo real que Prolog participa activamente en la construcción del resultado.

---

## Trabajo Futuro

Las siguientes mejoras quedan fuera del alcance de la primera versión pero se documentan como posibles líneas de extensión:

| Mejora | Descripción |
|---|---|
| Detección de preferencias en el prompt | Analizar instrucciones explícitas dentro del prompt para enriquecer o sobrescribir el perfil temporalmente |
| Resolución de prioridades | Definir reglas para resolver conflictos entre el perfil persistente e instrucciones explícitas del usuario |
| Soporte para múltiples modelos de IA | Integrar más de un proveedor de IA y permitir la selección por parte del usuario |
| Recomendaciones de aprendizaje | Que el sistema sugiera recursos o temas basados en el perfil y el historial de conversaciones |
| Evaluaciones automáticas de habilidades | Inferir el nivel de conocimiento del usuario a partir de sus interacciones |
| Actualización automática de skills | Actualizar el perfil del usuario automáticamente en función del contenido de sus conversaciones |

---

*Documento generado el 2026-06-10. Las decisiones aquí registradas complementan el documento principal del proyecto y no lo reemplazan.*
