# ===================================================================
# Dockerfile for Registry Server
# ===================================================================
# Stage 1: Build the application using Maven
# We use an Alpine-based Maven image for a fast and lightweight build environment
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy only the pom.xml first to cache the dependency downloads
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the remaining source code and build the application
# -DskipTests ensures tests are not run during the image build, saving time
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the final minimal runtime image
# We use the JRE (Java Runtime Environment) instead of JDK, and Alpine Linux to minimize image size
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root user and group for security best practices
RUN addgroup -S registry && adduser -S registry -G registry
USER registry:registry

# Copy only the compiled JAR from the builder stage, discarding all source code and build tools
COPY --from=builder /app/target/*.jar app.jar

# Expose the application port
EXPOSE 4999

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
