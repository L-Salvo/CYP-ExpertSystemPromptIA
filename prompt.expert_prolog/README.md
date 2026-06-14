# prompt.expert_prolog

Servicio de inferencia del sistema experto, en **SWI-Prolog**. Expone una API HTTP
consumida por el backend Spring Boot (`PrologRestClient`).

## Estado actual

Motor de inferencias **real** funcionando. `/infer` deriva inferencias, recomendaciones
y `additionalContext` desde reglas Prolog, con **paridad exacta** frente a
`MockPrologClient.java` (fuente autoritativa según `docs/backend-implementation/12-inference-catalog.md`).

Pendiente (fuera de esta fase): integrar el servicio en `docker-compose.yml` y poner
`PROLOG_MOCK=false` en el backend.

## Estructura (separación HTTP / conocimiento)

| Archivo | Responsabilidad |
|---|---|
| `server.pl` | **Solo HTTP**: handlers `/health` y `/infer`, parse/serialize JSON, delega en `rules:infer/2` |
| `rules.pl` | Módulo `rules`: reglas de inferencia, recomendación y `additionalContext` + orquestación |
| `facts.pl` | Módulo `facts`: hechos `thread_local` del usuario (`education_level/1`, `study_year/1`, `works_in_it/1`, `skill/2`) + `load_facts/1` y `clear_facts/0` |

Los hechos del usuario son `thread_local` (aislados por request en el server multihilo) y
se retractan al terminar cada `/infer` (estado limpio entre requests).

## API

### `GET /health`
```json
{ "status": "UP" }
```

### `POST /infer`
Request (contrato `PrologRequest` del backend):
```json
{
  "prompt": "Explícame Docker",
  "userProfile": {
    "educationLevel": "UNIVERSITY_STUDENT",
    "studyYear": 3,
    "worksInIT": true,
    "skills": [ { "name": "Java", "level": 8 }, { "name": "Docker", "level": 2 } ]
  }
}
```
Response (contrato `PrologResponse` del backend) — ejemplo real para el perfil seed:
```json
{
  "inferences": ["student_profile", "university_student", "works_in_it",
                 "advanced_java", "beginner_docker", "backend_developer",
                 "needs_docker", "use_java_examples"],
  "recommendations": ["Usar ejemplos prácticos y concretos orientados al aprendizaje",
                      "Introducir Docker desde cero con analogías familiares", "..."],
  "additionalContext": "Perfil: estudiante universitario, año 3, trabaja en IT. ..."
}
```

## Ejecutar con Docker

```bash
docker build -t cyp-prolog .
docker run --rm -p 8081:8081 cyp-prolog

curl http://localhost:8081/health
curl -X POST http://localhost:8081/infer -H "Content-Type: application/json" \
  -d '{"prompt":"Explícame Docker","userProfile":{"educationLevel":"UNIVERSITY_STUDENT","studyYear":3,"worksInIT":true,"skills":[{"name":"Java","level":8}]}}'
```

Puerto configurable con la variable de entorno `PROLOG_PORT` (default `8081`).

## Archivos

- `server.pl` — servidor HTTP (handlers `/health` y `/infer`).
- `Dockerfile` — imagen basada en `swipl:9`.
