% =============================================================
% rules.pl — Motor de inferencias del sistema experto
% -------------------------------------------------------------
% Reglas de inferencia, recomendaciones y additionalContext.
% Consume los hechos thread_local definidos en facts.pl y
% produce un dict compatible con PrologResponse:
%   { inferences:[...], recommendations:[...], additionalContext:"..." }
%
% Paridad: la salida replica EXACTAMENTE a MockPrologClient.java
% (mismos identificadores, mismos textos, mismo orden), que el
% catálogo 12-inference-catalog.md declara como fuente autoritativa.
% =============================================================
:- module(rules, [ infer/2 ]).   % infer(+RequestDict, -ResponseDict)

% Las comillas dobles son strings → se serializan como strings JSON.
:- set_prolog_flag(double_quotes, string).

:- use_module(facts).
:- use_module(library(apply)).      % forall/2 ya es builtin; aggregate_all en library(aggregate)
:- use_module(library(aggregate)).

% =============================================================
% Orquestación con ciclo de vida de hechos
% =============================================================
% clear_facts inicial: defensa ante un hilo del pool con estado
% residual. setup_call_cleanup garantiza la limpieza final aunque
% compute_response falle o lance excepción.
infer(RequestDict, Response) :-
    clear_facts,
    setup_call_cleanup(
        load_facts(RequestDict),
        compute_response(Response),
        clear_facts
    ).

compute_response(
    _{ inferences: Inferences,
       recommendations: Recommendations,
       additionalContext: Context }
) :-
    collect_inferences(Inferences),
    collect_recommendations(Inferences, Recommendations),
    build_context(Inferences, Context).

% =============================================================
% INFERENCIAS  (orden: perfil ++ nivel-por-skill ++ derivadas)
% =============================================================
collect_inferences(Inferences) :-
    findall(I, profile_inference(I), Profile),
    findall(I, skill_level_inference(I), SkillLevels),
    findall(I, derived_inference(I), Derived),
    findall(I, topic_inference(I), Topics),         % F2
    findall(I, intent_inference(I), Intents),       % F3
    findall(I, composite_inference(I), Composites), % F4
    append([Profile, SkillLevels, Derived, Topics, Intents, Composites], Inferences).

% ---- F2: inferencias de tema (solo prompt) ----
% topic(unknown) → topic_unknown
topic_inference(Inf) :- topic(T), atom_concat(topic_, T, Inf).

% ---- F3: inferencias de intención (solo prompt) ----
% intent(explain) por defecto si no se detectó intención
intent_inference(Inf) :- intent(I), atom_concat(intent_, I, Inf).

% ---- F4: inferencias compuestas (perfil-agnósticas: topic × intent) ----
% Regla ÚNICA y genérica (parametrizada por tema e intención) para evitar la
% explosión de reglas: combina cada tema concreto con la intención mediante una
% tabla verbo. Se excluye topic(unknown) (no genera composites).
% Solo cubre las intenciones de esta fase (learn/troubleshoot/explain); define y
% compare no producen composites todavía.
%   intent(learn)        + topic(T) → learning_T
%   intent(troubleshoot) + topic(T) → troubleshooting_T
%   intent(explain)      + topic(T) → explaining_T
composite_inference(Inf) :-
    topic(T), T \== unknown,
    intent(I),
    intent_verb(I, Verb),
    atomic_list_concat([Verb, T], '_', Inf).

intent_verb(learn,        learning).
intent_verb(troubleshoot, troubleshooting).
intent_verb(explain,      explaining).

% ---- Categoría 1/2: perfil educativo y laboral ----
profile_inference(student_profile)    :- education_level(E), student_edu(E).
profile_inference(university_student) :- education_level('UNIVERSITY_STUDENT').
profile_inference(works_in_it)        :- works_in_it(true).

student_edu('UNIVERSITY_STUDENT').
student_edu('TERTIARY_STUDENT').
student_edu('SECONDARY_STUDENT').

% ---- Categoría 3: nivel por skill (una inferencia por skill) ----
skill_level_inference(Inf) :-
    skill(Name, Level),
    level_band(Level, Band),
    atomic_list_concat([Band, Name], '_', Inf).

level_band(Level, beginner)     :- Level =< 3.
level_band(Level, intermediate) :- Level >= 4, Level =< 6.
level_band(Level, advanced)     :- Level >= 7.

% ---- Categoría 4: inferencias derivadas (combinaciones) ----
% once/1 deja una sola solución por cláusula (evita duplicados cuando
% varias skills satisfacen la condición) SIN podar las demás cláusulas
% del predicado: por eso NO se usa un ! de cuerpo, que cortaría también
% las alternativas de derived_inference/1 y findall perdería inferencias.
derived_inference(backend_developer)  :- once(( skill(N, L), backend_skill(N), L >= 7 )).
derived_inference(frontend_knowledge) :- once(( skill(N, _), frontend_skill(N) )).
derived_inference(needs_docker)       :- once(( skill(docker, L), L =< 3 )).
derived_inference(use_java_examples)  :- once(( skill(java, L), L >= 7 )).

backend_skill(java).
backend_skill(spring_boot).
backend_skill(python).

frontend_skill(react).
frontend_skill(typescript).
frontend_skill(javascript).

% =============================================================
% RECOMENDACIONES — F5: GATING por tema/intención
% -------------------------------------------------------------
% Prioridad:
%   1) Si hay inferencias compuestas activas (topic≠unknown × intent
%      learn/troubleshoot/explain) → recomendaciones ESPECÍFICAS del
%      tema/intención (gating activo). Reemplazan a las de perfil.
%   2) Si NO hay ninguna compuesta → FALLBACK EXACTO al comportamiento
%      anterior basado solo en perfil (compatibilidad total).
%
% Las inferencias (incluidas needs_docker, etc.) NO se tocan: siguen
% existiendo para auditoría. Lo único que cambia es la SELECCIÓN.
% El gating se decide con los mismos hechos (topic/1, intent/1) que
% generan las compuestas en collect_inferences/1.
% =============================================================
collect_recommendations(Inferences, Recommendations) :-
    findall(R, composite_recommendation(R), CompRecs),
    (   CompRecs \== []
    ->  Recommendations = CompRecs                              % (1) gating activo
    ;   findall(R, profile_recommendation(Inferences, R), ProfRecs),   % (2) fallback perfil
        (   ProfRecs == []
        ->  Recommendations = ["Adaptar la explicación al nivel del usuario"]
        ;   Recommendations = ProfRecs
        )
    ).

% ---- (1) Recomendaciones por inferencia compuesta (gating) ----
% Una compuesta activa = topic(T)≠unknown + intent(I) con verbo conocido.
composite_recommendation(Rec) :-
    topic(Topic), Topic \== unknown,
    intent(I), intent_verb(I, Verb),
    composite_rec(Verb, Topic, Rec).

% F7 — Orden de prioridad de las directivas (de más a menos importante):
%   1) directiva de PROFUNDIDAD por nivel (verb_band_rec) — encuadra el "cómo"
%      según lo que el usuario ya sabe; va primera porque condiciona al resto.
%   2) directiva de ACCIÓN genérica por intención (verb_rec) — el "qué hacer".
%   3) directiva ESPECÍFICA del tema (verb_topic_rec) — concreciones accionables.
% Todas son imperativas y accionables; la descripción del usuario vive en el
% additionalContext (sin solaparse), evitando frases repetidas entre secciones.
composite_rec(Verb, Topic, Rec) :-
    topic_label(Topic, Label),
    topic_band(Topic, Band),
    (   verb_band_rec(Verb, Band, Label, Rec)  % (1) profundidad por nivel
    ;   verb_rec(Verb, Label, Rec)             % (2) acción por intención
    ;   verb_topic_rec(Verb, Topic, Rec)       % (3) específica por tema
    ).

% Etiqueta legible del tema (para interpolar).
topic_label(java,        "Java").
topic_label(spring_boot, "Spring Boot").
topic_label(postgresql,  "PostgreSQL").
topic_label(docker,      "Docker").
topic_label(react,       "React").
topic_label(git,         "Git").

% (1) Directiva de PROFUNDIDAD según el nivel del usuario en el tema.
% Encuadra la respuesta en lo que ya sabe (ni redundante ni demasiado básica).
% troubleshooting NO define banda: en un error, el diagnóstico manda sobre el nivel.
verb_band_rec(learning, advanced, L, Rec) :-
    format(string(Rec), "Enfocar el contenido en aspectos avanzados de ~w y omitir los fundamentos", [L]).
verb_band_rec(learning, intermediate, L, Rec) :-
    format(string(Rec), "Partir de los fundamentos de ~w que el usuario ya domina y avanzar a temas intermedios", [L]).
verb_band_rec(learning, beginner, L, Rec) :-
    format(string(Rec), "Introducir ~w desde cero con ejemplos guiados", [L]).
verb_band_rec(learning, none, L, Rec) :-
    format(string(Rec), "Introducir ~w desde cero con ejemplos guiados", [L]).
verb_band_rec(explaining, advanced, L, Rec) :-
    format(string(Rec), "Profundizar en el funcionamiento interno de ~w, no en la introducción", [L]).
verb_band_rec(explaining, intermediate, L, Rec) :-
    format(string(Rec), "Apoyar la explicación en los conceptos intermedios de ~w ya conocidos", [L]).
verb_band_rec(explaining, beginner, L, Rec) :-
    format(string(Rec), "Explicar ~w partiendo de los conceptos base", [L]).
verb_band_rec(explaining, none, L, Rec) :-
    format(string(Rec), "Explicar ~w partiendo de los conceptos base", [L]).

% (2) Directiva de ACCIÓN genérica por intención (parametrizada por el tema).
verb_rec(learning, L, Rec) :-
    format(string(Rec), "Incluir ejemplos de código comentados de ~w", [L]).
verb_rec(troubleshooting, _L, "Pedir el mensaje de error completo y el stack trace").
verb_rec(troubleshooting, L, Rec) :-
    member(Tpl, ["Enumerar las causas más probables del fallo en ~w y cómo descartarlas",
                 "Proponer comandos de diagnóstico de ~w paso a paso"]),
    format(string(Rec), Tpl, [L]).
verb_rec(explaining, L, Rec) :-
    format(string(Rec), "Estructurar una explicación conceptual de ~w con un ejemplo concreto", [L]).

% (3) Directivas ESPECÍFICAS por (intención, tema) — concreciones accionables.
% Incluyen el puente con el ecosistema (antes en additionalContext) ya como acción.
verb_topic_rec(learning, docker, "Cubrir imágenes y contenedores con docker run, docker build y docker ps").
verb_topic_rec(learning, docker, "Relacionar Docker con el flujo de un proyecto Java/Spring").
verb_topic_rec(learning, java,   "Relacionar los conceptos con Spring Boot cuando aporte valor").
verb_topic_rec(explaining, postgresql, "Cubrir el modelo relacional: tablas, claves e índices").
verb_topic_rec(troubleshooting, docker, "Inspeccionar contenedor y logs con docker ps y docker logs").

% ---- (2) Recomendaciones por perfil (FALLBACK — comportamiento anterior, intacto) ----
% El orden de las cláusulas define el orden de salida (igual que antes).
profile_recommendation(I, "Usar ejemplos prácticos y concretos orientados al aprendizaje") :-
    memberchk(student_profile, I).
profile_recommendation(I, "Asumir contexto profesional; evitar explicaciones demasiado básicas") :-
    memberchk(works_in_it, I).
profile_recommendation(I, "Introducir Docker desde cero con analogías familiares") :-
    memberchk(needs_docker, I).
profile_recommendation(I, "Incluir comandos básicos: docker run, docker build, docker ps") :-
    memberchk(needs_docker, I).
profile_recommendation(I, "Usar Java y Maven como punto de referencia para analogías") :-
    memberchk(use_java_examples, I).
profile_recommendation(I, "Orientar la explicación desde una perspectiva de backend") :-
    memberchk(backend_developer, I).
profile_recommendation(I, "Mencionar diferencias entre entornos frontend y backend cuando aplique") :-
    memberchk(frontend_knowledge, I).

% =============================================================
% ADDITIONAL CONTEXT — F6 (enriquecido) + F7 (tuning de calidad)
% -------------------------------------------------------------
% F7: el additionalContext es ahora puramente DESCRIPTIVO (quién es
% el usuario y qué pide). Las directivas accionables ("explicar desde
% cero", "relacionar con Spring Boot", "pedir el error"…) viven SOLO
% en recommendations → cero frases repetidas entre CONTEXTO y
% DIRECTRICES, y un encuadre más claro para el LLM.
%
% Estrategia: si el prompt tiene un tema reconocido (topic≠unknown) se
% construye un contexto PROMPT-AWARE descriptivo; si no (topic_unknown)
% → FALLBACK EXACTO al contexto clásico por perfil (compatibilidad).
%
% Orden fijo (determinista) de frases descriptivas:
%   1) nivel del usuario en el tema   (perfil × tema)
%   2) qué pide el usuario            (intención)
%   3) orientación de perfil          (perfil)
% Se unen con ". " y se cierra con ".".
% =============================================================
build_context(Inferences, Context) :-
    ( topic(T), T \== unknown
    ->  build_topic_context(Inferences, Context)        % F6/F7: prompt-aware
    ;   build_profile_context(Inferences, Context) ).   % fallback clásico

% ---- contexto prompt-aware (descriptivo) ------------------------
build_topic_context(Inferences, Context) :-
    primary_topic(Topic),
    topic_label(Topic, Label),
    topic_band(Topic, Band),
    level_statement(Band, Label, Stmt),
    situation_clause(Situation),
    profile_suffix(Inferences, Suffix),
    append([[Stmt, Situation], Suffix], Frags),
    join_sentences(Frags, Context).

% Tema principal: el primero detectado (orden de topic_keyword/2), ≠ unknown.
primary_topic(T) :- topic(T), T \== unknown, !.

% Nivel del usuario en el tema = banda de su skill homónima; sin skill → none.
topic_band(Topic, Band) :- skill(Topic, L), !, level_band(L, Band).
topic_band(_, none).

% (1) Frase de nivel (descriptiva, sin imperativos).
level_statement(advanced,     L, S) :-
    format(string(S), "El usuario tiene un nivel avanzado en ~w", [L]).
level_statement(intermediate, L, S) :-
    format(string(S), "El usuario tiene un nivel intermedio en ~w", [L]).
level_statement(beginner,     L, S) :-
    format(string(S), "El usuario tiene un nivel inicial en ~w", [L]).
level_statement(none,         L, S) :-
    format(string(S), "El usuario no tiene experiencia previa en ~w", [L]).

% (2) Qué pide el usuario (descriptivo). troubleshoot manda sobre learn/explain.
situation_clause("Presenta un error que necesita diagnosticar") :- intent(troubleshoot), !.
situation_clause("Busca ampliar sus conocimientos sobre el tema") :- intent(learn), !.
situation_clause("Pide una explicación conceptual del tema").

% (3) Orientación de perfil (solo si la inferencia de perfil está activa).
profile_suffix(Inferences, ["Perfil orientado a backend"]) :-
    memberchk(backend_developer, Inferences), !.
profile_suffix(_, []).

% Une las frases con ". " y cierra con ".", descartando fragmentos vacíos.
join_sentences(Frags0, Context) :-
    exclude(==(""), Frags0, Frags),
    atomic_list_concat(Frags, '. ', Joined),
    atom_concat(Joined, '.', Full),
    atom_string(Full, Context).

% ---- Fallback clásico: contexto por perfil (replica MockPrologClient) ----
build_profile_context(Inferences, Context) :-
    education_level(Edu),
    format_education(Edu, EduStr),
    ( study_year(Y) -> format(string(YearPart), ", año ~w", [Y]) ; YearPart = "" ),
    ( works_in_it(true) -> WorkPart = ", trabaja en IT" ; WorkPart = ", no trabaja en IT" ),
    aggregate_all(count, advanced_skill, Advanced),
    aggregate_all(count, beginner_skill, Beginner),
    ( memberchk(backend_developer, Inferences)
    -> BackendPart = "Perfil orientado a backend. "
    ;  BackendPart = ""
    ),
    format(string(Raw),
           "Perfil: ~w~w~w. Skills: ~w avanzadas, ~w iniciales. ~w",
           [EduStr, YearPart, WorkPart, Advanced, Beginner, BackendPart]),
    % .trim() final: quita espacios sobrantes al inicio/fin (sin tocar el interior).
    split_string(Raw, "", " ", [Context]).

advanced_skill :- skill(_, L), L >= 7.
beginner_skill :- skill(_, L), L =< 3.

format_education('UNIVERSITY_STUDENT', "estudiante universitario") :- !.
format_education('TERTIARY_STUDENT',   "estudiante terciario")     :- !.
format_education('SECONDARY_STUDENT',  "estudiante secundario")    :- !.
format_education('GRADUATED',          "graduado")                 :- !.
format_education('POSTGRADUATE',       "posgrado")                 :- !.
format_education(Other,                Str) :- atom_string(Other, Str).
