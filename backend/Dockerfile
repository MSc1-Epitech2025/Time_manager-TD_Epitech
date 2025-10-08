FROM gradle:8.10-jdk21

WORKDIR /app

COPY build.gradle settings.gradle gradlew gradlew.bat ./
COPY gradle gradle

RUN gradle dependencies --no-daemon || true

EXPOSE 8080

CMD bash -c "gradle build --continuous --no-daemon & gradle bootRun --no-daemon"


# DockerFile for production build
#FROM gradle:8.10-jdk21 AS builder
#WORKDIR /app
#COPY . .
#RUN gradle clean bootJar --no-daemon
#FROM eclipse-temurin:21-jdk
#WORKDIR /app
#COPY --from=builder /app/build/libs/*.jar app.jar
#EXPOSE 8080
#ENTRYPOINT ["java", "-jar", "app.jar"]