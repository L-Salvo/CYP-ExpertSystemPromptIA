# =============================================================
# Dockerfile — Backend Spring Boot (prompt.expert_backend)
# Build multi-stage: compila con Maven y corre sobre un JRE liviano.
# =============================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cachea las dependencias: solo se reejecuta si cambia el pom.xml.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Copia el código y empaqueta el jar (los tests corren en CI, no en la imagen).
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# curl es necesario para el healthcheck de Docker Compose (/actuator/health).
RUN apk add --no-cache curl

# Copia únicamente el jar resultante del stage de build.
COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
