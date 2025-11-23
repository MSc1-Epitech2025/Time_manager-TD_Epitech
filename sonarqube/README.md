# 🧠 SonarQube — Code Quality & Test Coverage (Backend + Frontend)

## 📋 Purpose

This guide explains **how to automatically analyze code quality and test coverage** for the **Time Manager** project.
It applies to both the **backend (Spring Boot)** and the **frontend (Angular)**, using **SonarQube running in Docker**.

---

## ⚙️ Project Structure

```
📦 Time_manager-TD_Epitech/
│
├── backend/
│   ├── src/main/java/...
│   ├── src/test/java/...
│   ├── build.gradle
│
├── frontend/
│   ├── src/app/...
│   ├── karma.conf.js
│   ├── package.json
│
├── sonarqube/
│   ├── backend/
│   │   ├── Dockerfile.sonar
│   │   └── sonar-project.properties
│   ├── frontend/
│   │   ├── Dockerfile.sonar
│   │   └── sonar-project.properties
│
├── docker-compose.yml
└── README_SONARQUBE.md
```

---

## 🚀 1. Start SonarQube Locally

### ▶️ Run the SonarQube Server

```bash
npm run docker:build
```

🟢 The interface will be available at:
👉 [http://localhost:9000](http://localhost:9000)

### 👤 Default Login

* **Username:** `admin`
* **Password:** `admin` (you will be asked to change it on the first login)

---

## 🔑 2. Generate a SonarQube Token

1. Log in to your **local SonarQube instance** (default credentials: admin/admin).
2. Create a new project and reuse the project key already present in your `sonar-project.properties` file, or update it if needed.
3. Create a **new token** → copy it.
4. Add it to your `.env` file:

```env
SONAR_HOST_URL=http://localhost:9000
SONAR_TOKEN=sqp_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🧩 3. Backend Analysis (Spring Boot)

### 🔹 File: `sonarqube/backend/sonar-project.properties`

```properties
sonar.projectKey=time-manager-backend

sonar.language=java
sonar.sources=backend/src/main/java
sonar.tests=backend/src/test/java
sonar.java.binaries=backend/build/classes/java/main

sonar.coverage.jacoco.xmlReportPaths=backend/build/reports/jacoco/test/jacocoTestReport.xml

sonar.exclusions=**/config/**,**/dto/**,**/entity/**
```

### 🔹 File: `sonarqube/backend/Dockerfile.sonar`

```dockerfile
FROM gradle:8.10.2-jdk21 AS builder
WORKDIR /usr/src/app
COPY . .
WORKDIR /usr/src/app/backend
RUN gradle clean test jacocoTestReport

FROM sonarsource/sonar-scanner-cli:latest
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .
ENTRYPOINT ["sonar-scanner"]
```

### 🔹 Run the backend analysis

```bash
npm run sonar:backend
```

—or directly:

```bash
docker compose run --rm sonar-scan-backend
```

This will:

✔️ compile the code
✔️ run JUnit tests
✔️ generate the `jacocoTestReport.xml` coverage file
✔️ push results to SonarQube

---

## 🧩 4. Frontend Analysis (Angular)

### 🔹 File: `sonarqube/frontend/sonar-project.properties`

```properties
sonar.projectKey=time-manager-frontend

sonar.language=ts
sonar.sources=frontend/src
sonar.tests=frontend/src
sonar.test.inclusions=**/*.spec.ts

sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info

sonar.exclusions=**/node_modules/**,**/environments/**
```

### 🔹 File: `sonarqube/frontend/Dockerfile.sonar`

```dockerfile
# Step 1: Angular build + tests
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install Chromium for headless tests
RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend ./
RUN npm run test -- --watch=false --browsers=ChromeHeadless --code-coverage

# Step 2: SonarQube scanner
FROM sonarsource/sonar-scanner-cli:latest
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .
ENTRYPOINT ["sonar-scanner"]
```

### 🔹 Run the frontend analysis

```bash
npm run sonar:frontend
```

—or directly:

```bash
docker compose run --rm sonar-scan-frontend
```

This will:

✔️ run Angular tests in ChromeHeadless
✔️ generate `coverage/lcov.info`
✔️ push results to SonarQube

---

## ⚙️ 5. Available Commands (`package.json`)

```json
{
  "scripts": {
    "docker:build": "docker compose up --build",
    "docker:down": "docker compose down -v",
    "sonar:backend": "docker compose run --rm sonar-scan-backend",
    "sonar:frontend": "docker compose run --rm sonar-scan-frontend",
    "sonar:all": "npm run sonar:backend && npm run sonar:frontend"
  }
}
```

---

## 📊 6. View the Results

1. Go to [http://localhost:9000/projects](http://localhost:9000/projects)
2. You should see two projects:

* 🟩 `time-manager-backend`
* 🟦 `time-manager-frontend`

Each project displays:

* **Test coverage**
* **Code smells**
* **Bugs**
* **Vulnerabilities**
* **Duplications**

---

## 🧹 7. Clean up Docker resources

```bash
docker compose down -v
docker system prune -f
```

or:

```bash
npm run docker:down
npm run docker:prune
```

---

## 🧠 Useful Notes

* Backend coverage uses **JaCoCo (Gradle + JUnit)**
* Frontend coverage uses **Karma + ChromeHeadless**
* You can override the host/token in your `.env` file

---

## 🧾 Example End-to-End Workflow

```bash
# 1. Start SonarQube
docker compose up -d sonarqube

# 2. Analyze the backend
npm run sonar:backend

# 3. (Optional) Analyze the frontend
npm run sonar:frontend

# 4. View results
http://localhost:9000/projects
```

---

## 🏁 Expected Final Result

| Project               | Type        | Coverage           | Status    |
| --------------------- | ----------- | ------------------ | --------- |
| time-manager-backend  | Spring Boot | ✅ JaCoCo % visible | 🟢 Passed |
| time-manager-frontend | Angular     | ✅ LCOV % visible   | 🟢 Passed |

