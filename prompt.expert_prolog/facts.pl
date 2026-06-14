% =============================================================
% facts.pl — Hechos temporales del usuario + ciclo de vida
% -------------------------------------------------------------
% Carga los datos del JSON recibido en /infer como hechos
% Prolog, y los elimina al terminar.
%
% Los hechos son THREAD_LOCAL: el HTTP server de SWI-Prolog es
% multihilo, así que cada request (un hilo) tiene su propia
% copia aislada. Aun así se retractan explícitamente porque los
% hilos del pool se reutilizan entre requests.
% =============================================================
:- module(facts, [
       load_facts/1,     % +RequestDict
       clear_facts/0,
       education_level/1, % accesores (exportados para rules.pl)
       study_year/1,
       works_in_it/1,
       skill/2
   ]).

% Hechos temporales del perfil del usuario (uno por request/hilo).
:- thread_local education_level/1.   % education_level(Atom)
:- thread_local study_year/1.        % study_year(Int)   (puede no existir: nullable)
:- thread_local works_in_it/1.       % works_in_it(true|false)
:- thread_local skill/2.             % skill(NormName, Level)

% ---- Carga ----
% Extrae userProfile y asienta los hechos. Tolerante a campos
% ausentes para que el servidor nunca falle por un payload parcial.
load_facts(Dict) :-
    ( get_dict(userProfile, Dict, Profile) -> true ; Profile = _{} ),
    load_education(Profile),
    load_study_year(Profile),
    load_works_in_it(Profile),
    load_skills(Profile).

load_education(Profile) :-
    (   get_dict(educationLevel, Profile, E0), E0 \== null
    ->  atom_string(E, E0)
    ;   E = 'UNKNOWN'
    ),
    assertz(education_level(E)).

load_study_year(Profile) :-
    (   get_dict(studyYear, Profile, Y), integer(Y)
    ->  assertz(study_year(Y))
    ;   true
    ).

load_works_in_it(Profile) :-
    (   get_dict(worksInIT, Profile, W), truthy(W)
    ->  assertz(works_in_it(true))
    ;   assertz(works_in_it(false))
    ).

% Acepta el booleano JSON tal como lo entrega json_read_dict.
truthy(true).
truthy(@(true)).

load_skills(Profile) :-
    ( get_dict(skills, Profile, Skills), is_list(Skills) -> true ; Skills = [] ),
    % member preserva el orden del array → assertz mantiene ese orden.
    forall(member(S, Skills), assert_skill(S)).

assert_skill(S) :-
    get_dict(name, S, NameStr),
    get_dict(level, S, Level0),
    to_int(Level0, Level),
    normalize_skill(NameStr, Norm),
    assertz(skill(Norm, Level)).

to_int(N, N)   :- integer(N), !.
to_int(N, I)   :- atom_number(N, I), !.   % por si llega como atom/string
to_int(_, 0).

% Normaliza el nombre igual que MockPrologClient:
% name.toLowerCase().replace(" ", "_")  →  "Spring Boot" = spring_boot
normalize_skill(NameStr, Norm) :-
    string_lower(NameStr, Lower),
    split_string(Lower, " ", "", Parts),
    atomic_list_concat(Parts, '_', Norm).

% ---- Limpieza ----
clear_facts :-
    retractall(education_level(_)),
    retractall(study_year(_)),
    retractall(works_in_it(_)),
    retractall(skill(_, _)).
