# ===================================================================
# Dockerfile for Control Plane Service
# ===================================================================
# Stage 1: Build the application using Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy only the pom.xml first to cache the dependency downloads
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the remaining source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the final minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root user and group for security
RUN addgroup -S rollout && adduser -S controlplane -G rollout
USER controlplane:rollout

# Copy only the compiled JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the application port
EXPOSE 5002

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
