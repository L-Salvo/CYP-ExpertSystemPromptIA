% =============================================================
% server.pl — Capa HTTP del servicio Prolog
% -------------------------------------------------------------
% Responsabilidad ÚNICA: transporte HTTP.
%   - parsea el JSON del request
%   - delega la lógica en rules:infer/2 (motor de inferencias)
%   - serializa la respuesta como JSON
%
% La base de conocimiento vive en módulos separados:
%   rules.pl  → reglas de inferencia / recomendación / contexto
%   facts.pl  → hechos temporales del usuario (thread_local)
%
% Contrato HTTP:
%   GET  /health -> { "status": "UP" }
%   POST /infer  -> PrologResponse { inferences, recommendations, additionalContext }
% =============================================================
:- set_prolog_flag(double_quotes, string).

:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(rules).

:- http_handler(root(health), health_handler, [method(get)]).
:- http_handler(root(infer),  infer_handler,  [method(post)]).

% ---- GET /health ----
health_handler(_Request) :-
    reply_json_dict(_{ status: "UP" }).

% ---- POST /infer ----
% Delega en el motor. Si el body es inválido o el motor falla,
% responde igualmente un PrologResponse válido (nunca tumba el worker).
infer_handler(Request) :-
    ( catch(http_read_json_dict(Request, Payload, []), _, fail) -> true ; Payload = _{} ),
    % Log de transporte (stderr → docker logs): evidencia de request recibido.
    format(user_error, "[prolog] POST /infer recibido~n", []),
    flush_output(user_error),
    (   catch(rules:infer(Payload, Response), Error,
              ( print_message(warning, Error), fail ))
    ->  reply_json_dict(Response)
    ;   reply_json_dict(_{
            inferences: [],
            recommendations: ["Adaptar la explicación al nivel del usuario"],
            additionalContext: ""
        })
    ).

% ---- Arranque ----
server_port(Port) :-
    (   getenv('PROLOG_PORT', Atom),
        atom_number(Atom, P)
    ->  Port = P
    ;   Port = 8081
    ).

main :-
    server_port(Port),
    http_server(http_dispatch, [port(Port)]),
    format("[prolog] servidor HTTP escuchando en puerto ~w~n", [Port]),
    flush_output,
    % Mantiene vivo el contenedor; el server atiende en hilos propios.
    thread_get_message(_).
