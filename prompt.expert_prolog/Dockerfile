# =============================================================
# Dockerfile — Servicio Prolog (prompt.expert_prolog)
# Servidor HTTP SWI-Prolog que expone /health y /infer.
# =============================================================
# swipl:stable = última release estable de SWI-Prolog 9.x.
FROM swipl:stable

WORKDIR /app

# curl es útil para el healthcheck de Docker Compose (siguiente fase).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# server.pl (HTTP) + rules.pl y facts.pl (base de conocimiento).
COPY server.pl rules.pl facts.pl ./

# Puerto del servidor HTTP de Prolog (alineado con docker-compose).
ENV PROLOG_PORT=8081
EXPOSE 8081

# -g main: corre el predicado main (arranca el server y bloquea).
CMD ["swipl", "-g", "main", "server.pl"]
