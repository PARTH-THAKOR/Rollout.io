# ===================================================================
# Dockerfile for Api Gateway
# ===================================================================

# Stage 1: Build the application using Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the final minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S rollout && adduser -S rollout -G rollout
USER rollout:rollout

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 5000

ENTRYPOINT ["java", "-jar", "app.jar"]
