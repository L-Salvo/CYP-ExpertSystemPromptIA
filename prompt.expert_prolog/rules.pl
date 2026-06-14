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
    append([Profile, SkillLevels, Derived], Inferences).

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
% RECOMENDACIONES  (derivadas de las inferencias activas)
% =============================================================
collect_recommendations(Inferences, Recommendations) :-
    findall(R, recommendation(Inferences, R), Rs),
    ( Rs == []
    -> Recommendations = ["Adaptar la explicación al nivel del usuario"]
    ;  Recommendations = Rs
    ).

% El orden de las cláusulas define el orden de salida (igual que Java).
recommendation(I, "Usar ejemplos prácticos y concretos orientados al aprendizaje") :-
    memberchk(student_profile, I).
recommendation(I, "Asumir contexto profesional; evitar explicaciones demasiado básicas") :-
    memberchk(works_in_it, I).
recommendation(I, "Introducir Docker desde cero con analogías familiares") :-
    memberchk(needs_docker, I).
recommendation(I, "Incluir comandos básicos: docker run, docker build, docker ps") :-
    memberchk(needs_docker, I).
recommendation(I, "Usar Java y Maven como punto de referencia para analogías") :-
    memberchk(use_java_examples, I).
recommendation(I, "Orientar la explicación desde una perspectiva de backend") :-
    memberchk(backend_developer, I).
recommendation(I, "Mencionar diferencias entre entornos frontend y backend cuando aplique") :-
    memberchk(frontend_knowledge, I).

% =============================================================
% ADDITIONAL CONTEXT  (replica la plantilla de MockPrologClient)
% =============================================================
build_context(Inferences, Context) :-
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
