% =============================================================
% nlp.pl — Detección de tema e intención a partir del prompt
% -------------------------------------------------------------
% SOLO datos (tablas de keywords) + detección pura (sin estado).
% No asienta hechos: devuelve listas. facts.pl es quien asienta.
%
% Matching: determinista, por tokens normalizados (minúsculas, sin
% acentos, sin puntuación). Un keyword multi-palabra se representa
% como lista de tokens y se busca como subsecuencia contigua.
%
% Fases del doc 13 cubiertas aquí: F2 (tema) y F3 (intención).
% =============================================================
:- module(nlp, [
       normalize_text/2,   % +Raw,  -NormString
       tokenize/2,         % +Norm, -Tokens (lista de atoms)
       detect_topics/2,    % +Tokens, -Topics  (lista de atoms; [] si ninguno)
       detect_intents/2    % +Tokens, -Intents (lista de atoms; [] si ninguna)
   ]).

:- set_prolog_flag(double_quotes, string).
:- use_module(library(apply)).

% =============================================================
% F2 — Tabla de temas (F2 NO incluye angular/vue/node/kubernetes/aws)
% topic_keyword(Topic, ListaDeKeywords) ; cada keyword = lista de tokens.
% =============================================================
topic_keyword(java,        [[java]]).
topic_keyword(spring_boot, [[spring, boot], [springboot], [spring]]).
topic_keyword(postgresql,  [[postgresql], [postgres], [psql]]).
topic_keyword(docker,      [[docker]]).
topic_keyword(react,       [[react]]).
topic_keyword(git,         [[git]]).

% =============================================================
% F3 — Tabla de intenciones
% =============================================================
intent_keyword(learn,        [[aprender], [quiero, aprender], [como, empezar], [tutorial], [ensename]]).
intent_keyword(explain,      [[explicame], [explica], [como, funciona]]).
intent_keyword(define,       [[que, es], [definicion], [para, que, sirve]]).
intent_keyword(compare,      [[compara], [comparar], [comparacion], [diferencia], [vs], [versus], [mejor]]).
intent_keyword(troubleshoot, [[error], [falla], [problema], [bug], [no, funciona], [excepcion]]).

% =============================================================
% Detección (preserva el orden de declaración de las tablas;
% once/1 evita duplicar un tema/intención que matchea varios keywords).
% =============================================================
detect_topics(Tokens, Topics) :-
    findall(Topic,
            ( topic_keyword(Topic, Keywords),
              once(( member(Kw, Keywords), phrase_in_tokens(Kw, Tokens) ))
            ),
            Topics).

detect_intents(Tokens, Intents) :-
    findall(Intent,
            ( intent_keyword(Intent, Keywords),
              once(( member(Kw, Keywords), phrase_in_tokens(Kw, Tokens) ))
            ),
            Intents).

% Phrase (lista de tokens) aparece como subsecuencia CONTIGUA de Tokens.
phrase_in_tokens(Phrase, Tokens) :-
    append(_, Suffix, Tokens),
    append(Phrase, _, Suffix),
    !.

% =============================================================
% Normalización: minúsculas + sin acentos + sin puntuación
% =============================================================
normalize_text(Raw, Norm) :-
    ( string(Raw) -> Lower0 = Raw ; term_string(Raw, Lower0) ),
    string_lower(Lower0, Lower),
    string_chars(Lower, Chars),
    maplist(normalize_char, Chars, Mapped),
    string_chars(Norm, Mapped).

% Cada carácter: se le quita el acento; si no es alfanumérico → espacio.
normalize_char(C, M) :-
    ( deaccent(C, D) -> true ; D = C ),
    ( char_type(D, alnum) -> M = D ; M = ' ' ).

deaccent('á', a). deaccent('é', e). deaccent('í', i). deaccent('ó', o). deaccent('ú', u).
deaccent('à', a). deaccent('è', e). deaccent('ì', i). deaccent('ò', o). deaccent('ù', u).
deaccent('ä', a). deaccent('ë', e). deaccent('ï', i). deaccent('ö', o). deaccent('ü', u).
deaccent('ñ', n).

% =============================================================
% Tokenización: separa por espacios, descarta vacíos, devuelve atoms.
% =============================================================
tokenize(Norm, Tokens) :-
    split_string(Norm, " ", "", Parts),
    exclude(==(""), Parts, NonEmpty),
    maplist(string_to_atom_token, NonEmpty, Tokens).

string_to_atom_token(S, A) :- atom_string(A, S).
