# ===================================================================
# Dockerfile for Config Server
# 
# Build the image: 
#   docker build -t config-server:0.0.1 .
#
# Run the container:
#   docker run -d --name config-server -p 4998:4998 config-server:0.0.1
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
RUN addgroup -S configserver && adduser -S configserver -G configserver
USER configserver:configserver

# Copy only the compiled JAR from the builder stage, discarding all source code and build tools
COPY --from=builder /app/target/*.jar app.jar

# Expose the application port
EXPOSE 4998

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
