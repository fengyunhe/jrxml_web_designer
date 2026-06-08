# Build stage
FROM eclipse-temurin:8-jdk AS build
WORKDIR /app

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy pom.xml and download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:8-jre
WORKDIR /app

# Set environment variables
ENV SERVER_PORT=8084
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Copy the built jar from build stage
COPY --from=build /app/target/pdf-preview-server-1.0-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8084

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8084/api/export/formats || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
