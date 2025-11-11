# 🕒 Time Manager – TD Epitech

## 🚀 Introduction

**Time Manager** is a full-stack web application composed of:

* a **frontend built with Angular** (TypeScript + SCSS + live reload)
* a **backend built with Spring Boot** (Gradle, Java 21)
* a **database powered by MariaDB**
* a **Reverse Proxy** (Nginx)

Everything runs inside **Docker containers** to ensure a consistent and reproducible development environment.

---

## ⚙️ Prerequisites

Before running the project, make sure you have installed:

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* *(Optional)* [Node.js ≥ 20](https://nodejs.org/en) and [npm ≥ 10](https://www.npmjs.com/)

---

## 🐳 Docker — Quick Start

### ▶️ Start the project

```bash
docker compose up --build
```

or via npm:

```bash
npm run docker:build
```

### ⏹️ Stop and remove containers

```bash
docker compose down
```

or:

```bash
npm run docker:down
```

### 🧹 Remove volumes (⚠️ deletes the database)

```bash
docker compose down -v
```

### Backend Build (in folder `backend/`)

```bash
.\gradlew.bat build
```

### 📡 Sonarqube
### Start SonarQube backend analysis

```bash
npm run sonar:backend
```
### Start SonarQube frontend analysis

```bash
npm run sonar:frontend
```
### Start SonarQube all analysis

```bash
npm run sonar:all
```
---

## 🌐 Service Access

| Service                   | URL                                            | Description                                                                                                              |
|---------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| **Frontend (Angular)**    | [http://localhost:4200](http://localhost:4200) | Angular web app (dev mode with live reload)                                                                              |
| **Backend (Spring Boot)** | [http://localhost:8080](http://localhost:8080) | REST or GRAPHQL API server                                                                                               |
| **Database (MariaDB)**    | `localhost:3307`                               | SQL access (user: `root`, password: `root`)                                                                              |
| **Reverse proxy (Nginx)** | [http://localhost:3030](http://localhost:3030) | Reserve proxy for secure api call make by client                                                                         |
| **SonarQube**             | [http://localhost:9000](http://localhost:3030) | SonarQube for analyze all code in the project.<br/>More détails here [➡️ Documentation SonarQube](./sonarqube/README.md) |
---

## 🧱 Project Structure

```
Time_manager-TD_Epitech/
│
├── backend/                # Spring Boot app (Gradle, Java 21)
│   ├── Dockerfile
│   ├── build.gradle
│   └── src/
│
├── frontend/               # Angular app (TypeScript, SCSS)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── reverse-proxy/               # Reverse proxy (nginx)
│   └── nginx.conf
│
├── sonarqube/
│   ├── backend/
│   │   ├── Dockerfile.sonar
│   │   └── sonar-project.properties
│   ├── frontend/
│   │   ├── Dockerfile.sonar
│   │   └── sonar-project.properties
│   ├── README.md
│
├── sonar-project.properties # SonarQube configuration
├── docker-compose.yml      # Docker orchestration
├── .env                    # Environment variables
└── README.md               # Project documentation
```

---

## ⚡ Environment Variables (`.env`)

All configuration is centralized in the `.env` file:

```bash
# 🌐 Frontend
FRONTEND_PORT=xxxxxxxxxxxxxxxxxxxx
FRONTEND_CONTAINER_NAME=xxxxxxxxxxxxxxxxxxxx
FRONTEND_CONTEXT=./xxxxxxxxxxxxxxxxxxxx
FRONTEND_DOCKERFILE=xxxxxxxxxxxxxxxxxxxx

# ⚙️ Backend
BACKEND_PORT=8085
BACKEND_CONTAINER_NAME=xxxxxxxxxxxxxxxxxxxx
BACKEND_CONTEXT=./xxxxxxxxxxxxxxxxxxxx
BACKEND_DOCKERFILE=xxxxxxxxxxxxxxxxxxxx
SPRING_PROFILES_ACTIVE=xxxxxxxxxxxxxxxxxxxx

# JWT
SECURITY_JWT_SECRET=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_ISSUER=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_EXPMINUTES=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_REFRESH_SECRET=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_REFRESH_DAYS=xxxxxxxxxxxxxxxxxxxx

# 🐬 MariaDB
DB_IMAGE=mariadb:xxxxxxxxxxxxxxxxxxxx
DB_PORT_HOST=xxxxxxxxxxxxxxxxxxxx
DB_PORT_CONTAINER=xxxxxxxxxxxxxxxxxxxx
DB_ROOT_PASSWORD=xxxxxxxxxxxxxxxxxxxx
DB_NAME=xxxxxxxxxxxxxxxxxxxx
DB_CONTAINER_NAME=xxxxxxxxxxxxxxxxxxxx

# 🔥 Hot reload Angular
CHOKIDAR_USEPOLLING=xxxxxxxxxxxxxxxxxxxx

# SonarQube
SONAR_HOST_URL=http://sonarqube:9000
SONAR_TOKEN=xxxxxxxxxxxxxxxxxxxx

#Azure
AZURE_CLIENT_SECRET=Yzxxxxxxxxxxxxxxxxxxxx
AZURE_TENANT_ID=90xxxxxxxxxxxxxxxxxxxx
AZURE_CLIENT_ID=axxxxxxxxxxxxxxxxxxxx
```

---

## 🧠 Useful Commands

### 🧩 Backend (Spring Boot)

Continuous build + auto reload (already handled by Dockerfile):

```bash
gradle build --continuous
```

Manual run (outside Docker):

```bash
gradle bootRun
```

---

### 🎨 Frontend (Angular)

Start locally (outside Docker):

```bash
npm start
```

Build for production:

```bash
npm run build
```

---

## 🏗️ Production Setup (future use)

A production configuration is already prepared (commented out in `docker-compose.yml`):

* Angular will be **built and served by NGINX**
* Spring Boot will run as a **standalone JAR**
* MariaDB will use a **dedicated app user** (`app_user` / `app_pass`)

You can enable it later by uncommenting the *production build* section and creating a `.env.prod` file.

---

## 💡 Tips

* 🔄 **Angular live reload** is enabled via `CHOKIDAR_USEPOLLING=true`
* 🐘 **Gradle** automatically rebuilds the backend with `--continuous`
* 🧰 **MariaDB** persists data inside the `mariadb_data` volume
* 🛠️ Connect to the database manually:

  ```bash
  mysql -h 127.0.0.1 -P 3307 -u root -p
  ```

---

# 🔐 API (JWT) & Routes

## Auth flow (TL;DR)
1. **Register** a user → password is hashed (BCrypt) and default role is `["employee"]`.
2. **Login** → receive a **JWT** (Bearer) to put in the `Authorization` header.
3. Call **protected routes** with `Authorization: Bearer <token>`.

> Available roles: `employee`, `manager`, `admin` (mapped to `ROLE_EMPLOYEE`, `ROLE_MANAGER`, `ROLE_ADMIN`).

---

## Endpoints

### Auth
| Method | Path                 | Body (JSON)   | Auth | Role | Description |
|:------:|----------------------|-----------------------------------------|:----:|:----:|-------------|
| POST   | `/api/auth/register` | `{ firstName, lastName, email, password }` | ❌   | –    | Create a user (default role `["employee"]`) |
| POST   | `/api/auth/login`    | `{ email, password }`                   | ❌   | –    | Returns `{ "accessToken": "…", "reverseToken": "…" }` |

**Example**
```bash
curl -X POST http://localhost:8080/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"john@acme.io","password":"Str0ngP@ss"}'
```

### Users
| Method | Path                      | Body (JSON)                        | Auth | Role                         | Description |
|:------:|---------------------------|------------------------------------|:----:|:-----------------------------|-------------|
| GET    | `/api/users/me`           | –                                  | ✅   | any                          | Current user profile |
| GET    | `/api/users`              | –                                  | ✅   | `manager` or `admin`         | List users |
| GET    | `/api/users/{id}`         | –                                  | ✅   | `manager`/`admin` or **self**| Get a user |
| POST   | `/api/users`              | `UserCreateRequest`                | ✅   | `admin`                      | Create a user |
| PUT    | `/api/users/{id}`         | `UserUpdateRequest`                | ✅   | `manager`/`admin` or **self**| Update a user (role editable by manager/admin) |
| PATCH  | `/api/users/me/password`  | `{ currentPassword, newPassword }` | ✅   | any                          | Change own password |
| DELETE | `/api/users/{id}`         | –                                  | ✅   | `admin`                      | Delete a user |

### Teams
| Method | Path                            | Body (JSON)             | Auth | Role                | Description |
|:------:|---------------------------------|-------------------------|:----:|:--------------------|-------------|
| GET    | `/api/teams`                    | –                       | ✅   | any                 | List teams |
| GET    | `/api/teams/{id}`               | –                       | ✅   | any                 | Team details |
| GET    | `/api/teams/{id}/members`       | –                       | ✅   | any                 | Team members |
| POST   | `/api/teams`                    | `{ name, description }` | ✅   | `manager`/`admin`   | Create a team |
| PUT    | `/api/teams/{id}`               | `{ name?, description? }` | ✅ | `manager`/`admin`   | Update a team |
| DELETE | `/api/teams/{id}`               | –                       | ✅   | `manager`/`admin`   | Delete a team |
| POST   | `/api/teams/{id}/members`       | `{ userId }`            | ✅   | `manager`/`admin`   | Add a member |
| DELETE | `/api/teams/{id}/members/{uid}` | –                       | ✅   | `manager`/`admin`   | Remove a member |

**Example**
```bash
TOKEN="<JWT>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/teams
```
### Clocks
| Method | Path                            | Body (JSON)              | Auth | Role                | Description |
|:------:|---------------------------------|--------------------------|:----:|:--------------------|-------------|
| POST   | `/api/clocks`                   |`{ kind: "IN" | "OUT", at?}`| ✅   | any                 | Create a clock entry for the current user |
| GET    | `/api/clocks/me`                | –                        | ✅   | any                 | List clock entries for the current user|
| GET    | `/api/clocks/users/{userId}`    | –                        | ✅   | `manager`/`admin`   | List clock entries for a specific user |
| POST   | `/api/clocks/users/{userId}`    | `{ kind: "IN" | "OUT", at? }`  | ✅   | `manager`/`admin`   | Create a clock entry for a specific user |

### Report

| Method | Path                       | Body (JSON)                                   | Auth | Role                   | Description |
|:-----:|----------------------------|-----------------------------------------------|:---:|:-----------------------|-------------|
| GET   | `/api/reports`             | –                                             | ✅  | `admin`       | List all reports. |
| GET   | `/api/reports/me/authored` | –                                             | ✅  | any           | List reports authored by me. |
| GET   | `/api/reports/me/received` | –                                             | ✅  | any           | List reports addressed to me. |
| GET   | `/api/reports/{id}`        | –                                             | ✅  | any           | Get a report if I’m admin or the author or the target. |
| POST  | `/api/reports`             | `{ targetUserId: string, title: string, body?: string }` | ✅ | any   | Create a report as current user (employee→manager or manager→employee). |
| PUT   | `/api/reports/{id}`        | `{ title?: string, body?: string, targetUserId?: string }` | ✅ | author or `admin` | Update a report (author or admin). |
| DELETE| `/api/reports/{id}`        | –                                             | ✅  | author or `admin`      | Delete a report (author or admin). |

### Work_Shedule

| Method | Path                                           | Body (JSON)                                                                                  | Auth | Role                | Description |
|:-----:|------------------------------------------------|----------------------------------------------------------------------------------------------|:---:|:--------------------|-------------|
| GET   | `/api/work-schedules/me`                       | –                                                                                            | ✅  | any                 | Get **my** weekly schedule (AM/PM slots). |
| GET   | `/api/work-schedules/users/{userId}`           | –                                                                                            | ✅  | `manager` / `admin` | Get a user's weekly schedule. |
| POST  | `/api/work-schedules/users/{userId}`           | `{ dayOfWeek: "MON"|"TUE"|...|"SUN", period: "AM"|"PM", startTime: "HH:mm[:ss]", endTime: "HH:mm[:ss]" }` | ✅  | `manager` / `admin` | **Upsert** a single slot (unique on `user + dayOfWeek + period`). |
| PUT   | `/api/work-schedules/users/{userId}/batch`     | `{ replaceAll?: true, entries: [ { dayOfWeek, period, startTime, endTime }, ... ] }`        | ✅  | `manager` / `admin` | Replace all slots (if `replaceAll=true`) or upsert multiple entries. |
| DELETE| `/api/work-schedules/users/{userId}`           | – (query: `day=MON..SUN`, `period=AM|PM`)                                                    | ✅  | `manager` / `admin` | Delete a single slot for a user. |

### abscences

| Method | Path      | Body (JSON)|Auth | Role                         | Description |
|:-----:|------------|------------|:---:|:-----------------------------|-------------|
| POST  | `/api/absences`                       | `{ startDate, endDate, type, reason?, supportingDocumentUrl?, periodByDate?: { "YYYY-MM-DD": "AM|PM|FULL_DAY" } }` | ✅  | any | Create an absence for the authenticated user Generates `absence_days`. |
| GET   | `/api/absences/me`| – | ✅  | any| List **my** absences (with generated days). |
| GET   | `/api/absences/users/{userId}`        | –| ✅  | `manager` / `admin`          | List absences for a specific user. |
| GET   | `/api/absences`                       | –| ✅  | `admin`                      | List **all** absences. |
| GET   | `/api/absences/{id}`                  | –| ✅  | visible to owner/manager/admin | Get one absence if requester is **owner**, **manager**, or **admin**. |
| PUT   | `/api/absences/{id}`                  | `{ startDate?, endDate?, type?, reason?, supportingDocumentUrl?, periodByDate? }`                        | ✅  | owner (if `PENDING`) or admin | Update an absence. If `periodByDate` is provided, `absence_days` are regenerated. |
| PATCH | `/api/absences/{id}/status`           | `{ status: "APPROVED" | "REJECTED" }`               | ✅  | `manager` / `admin`          | Approve or reject an absence (records `approvedBy`, `approvedAt`). |
| DELETE| `/api/absences/{id}`                  | –| ✅  | owner (if `PENDING`) or admin | Delete an absence and its generated days. |


---

## Security & Roles
- Auth: JWT Bearer (`Authorization: Bearer <token>`).
- RBAC: write operations on Teams/Users are protected via `@PreAuthorize`.
- Default role at register: `["employee"]` (promote via Users endpoints).

## Postman tips
- Variables: `base_url = http://localhost:8080/api`, `token = <JWT>`
- Example: `GET {{base_url}}/teams` with `Authorization: Bearer {{token}}`.
