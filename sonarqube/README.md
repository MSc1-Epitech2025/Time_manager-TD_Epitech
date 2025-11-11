# 🧠 SonarQube — Configuration & Analyse de Code (Backend + Frontend)

## 📋 Objectif

Ce guide explique **comment analyser automatiquement la qualité du code et le taux de couverture des tests** (coverage) pour le projet **Time Manager**.
Il s’applique à la fois au **backend (Spring Boot)** et au **frontend (Angular)**, avec **SonarQube en Docker**.

---

## ⚙️ Structure du projet

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

## 🚀 1. Lancer SonarQube localement

### ▶️ Démarrer le serveur SonarQube

```bash
npm run docker:build
```

🟢 L’interface sera disponible sur :
👉 [http://localhost:9000](http://localhost:9000)

### 👤 Connexion par défaut

* **Utilisateur :** `admin`
* **Mot de passe :** `admin` (à modifier au premier login)

---

## 🔑 2. Générer un Token SonarQube

1. Connecte-toi à ton **instance SonarQube locale**
2. Clique sur ton profil (coin supérieur droit) → **My Account**
3. Onglet **Security**
4. Crée un **nouveau token** → copie-le
5. Ajoute-le dans ton `.env` :

```env
SONAR_HOST_URL=http://localhost:9000
SONAR_TOKEN=sqp_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🧩 3. Analyse du **Backend (Spring Boot)**

### 🔹 Fichier : `sonarqube/backend/sonar-project.properties`

```properties
sonar.projectKey=time-manager-backend

sonar.language=java
sonar.sources=backend/src/main/java
sonar.tests=backend/src/test/java
sonar.java.binaries=backend/build/classes/java/main

sonar.coverage.jacoco.xmlReportPaths=backend/build/reports/jacoco/test/jacocoTestReport.xml

sonar.exclusions=**/config/**,**/dto/**,**/entity/**
```

### 🔹 Fichier : `sonarqube/backend/Dockerfile.sonar`

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

### 🔹 Lancer l’analyse du backend

```bash
npm run sonar:backend
```

*(ou directement)*

```bash
docker compose run --rm sonar-scan-backend
```

✅ Cela :

* compile ton code
* exécute les tests JUnit
* génère le rapport `jacocoTestReport.xml`
* envoie les résultats à SonarQube

---

## 🧩 4. Analyse du **Frontend (Angular)**

### 🔹 Fichier : `sonarqube/frontend/sonar-project.properties`

```properties
sonar.projectKey=time-manager-frontend

sonar.language=ts
sonar.sources=frontend/src
sonar.tests=frontend/src
sonar.test.inclusions=**/*.spec.ts

sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info

sonar.exclusions=**/node_modules/**,**/environments/**
```

### 🔹 Fichier : `sonarqube/frontend/Dockerfile.sonar`

```dockerfile
# Étape 1 : Build et tests Angular
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Installer Chromium pour les tests headless
RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend .
RUN npm run test -- --watch=false --browsers=ChromeHeadless --code-coverage

# Étape 2 : Scanner SonarQube
FROM sonarsource/sonar-scanner-cli:latest
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .
ENTRYPOINT ["sonar-scanner"]
```

### 🔹 Lancer l’analyse du frontend

```bash
npm run sonar:frontend
```

*(ou directement)*

```bash
docker compose run --rm sonar-scan-frontend
```

✅ Cela :

* exécute les tests Angular avec ChromeHeadless
* génère le `coverage/lcov.info`
* envoie les résultats à SonarQube

---

## ⚙️ 5. Commandes disponibles (`package.json`)

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

## 📊 6. Visualiser les résultats

1. Va sur [http://localhost:9000/projects](http://localhost:9000/projects)
2. Tu verras deux projets :

    * 🟩 `time-manager-backend`
    * 🟦 `time-manager-frontend`

Chaque projet affichera :

* **Taux de couverture des tests (Coverage)**
* **Code smells**
* **Bugs**
* **Vulnerabilities**
* **Duplications**

---

## 🧹 7. Nettoyer les containers

```bash
docker compose down -v
docker system prune -f
```
ou 
```bash
npm run docker:down
npm run docker:prune
```

---

## 🧠 Notes utiles

* Le coverage backend utilise **JaCoCo (Gradle + JUnit)**
* Le coverage frontend utilise **Karma + ChromeHeadless**
* Tu peux adapter le host / token dans ton `.env`

---

## 🧾 Exemple de workflow complet

```bash
# 1. Lancer SonarQube
docker compose up -d sonarqube

# 2. Analyser le backend
npm run sonar:backend

# 3. (Optionnel) Analyser le frontend
npm run sonar:frontend

# 4. Voir les résultats
http://localhost:9000/projects
```

---

## 🏁 Résultat final attendu

| Projet                | Type        | Couverture         | Statut    |
| --------------------- | ----------- | ------------------ | --------- |
| time-manager-backend  | Spring Boot | ✅ JaCoCo % visible | 🟢 Passed |
| time-manager-frontend | Angular     | ✅ LCOV % visible   | 🟢 Passed |
