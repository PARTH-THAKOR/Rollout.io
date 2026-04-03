FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S registry && adduser -S registry -G registry
USER registry:registry

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 4999

ENTRYPOINT ["java", "-jar", "app.jar"]
