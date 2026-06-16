# =============================================================
# Dockerfile — Frontend (prompt.expert_frontend)
# Build multi-stage: compila el SPA con Vite y lo sirve con nginx,
# que además hace reverse-proxy de /api hacia el backend (mismo
# origen → sin CORS, sin tocar el código del backend).
# =============================================================

# ---------- Stage 1: build del SPA ----------
FROM node:22-alpine AS build
WORKDIR /app

# Instala dependencias de forma determinista desde el lockfile.
# Se copian primero package*.json para cachear esta capa si no cambian.
COPY package.json package-lock.json ./
RUN npm ci

# Copia el resto del código y compila (script build = tsc -b && vite build → /app/dist).
COPY . .

# VITE_USE_MOCKS se hornea en tiempo de build (Vite lo inyecta en el bundle).
# Por defecto false: la imagen productiva consume la API REAL del backend.
ARG VITE_USE_MOCKS=false
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS
RUN npm run build

# ---------- Stage 2: runtime (nginx) ----------
FROM nginx:alpine AS runtime

# Config propia: fallback SPA (react-router) + reverse-proxy /api → backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Estáticos compilados.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# nginx:alpine ya define CMD ["nginx", "-g", "daemon off;"].
