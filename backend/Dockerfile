FROM gradle:8.10-jdk21

WORKDIR /app

COPY settings.gradle ./
COPY backend/build.gradle ./
COPY gradle gradle
COPY gradlew gradlew.bat ./

COPY backend/src ./src

RUN gradle dependencies --no-daemon || true

EXPOSE 8080

CMD ["gradle", "bootRun", "--no-daemon"]
