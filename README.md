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
| **GraphQL Playground**    | [http://localhost:8080/graphiql](http://localhost:8080/graphiql) | Interactive GraphQL API documentation and playground.                                                                    |

| **Database (MariaDB)**    | `localhost:3307`                               | SQL access (user: `root`, password: `root`)                                                                              |
| **Reverse proxy (Nginx)** | [http://localhost:3030](http://localhost:3030) | Reserve proxy for secure api call make by client               |                                                           |
| **SonarQube**             | [http://localhost:9000](http://localhost:9000) | SonarQube for analyze all code in the project.<br/>More détails here [➡️ Documentation SonarQube](./sonarqube/README.md) |
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
│   └── Dependencies:
│       ├── @angular/material (v20.2.8) - UI component library
│       ├── @angular/cdk (v20.2.8) - Component Dev Kit
│       ├── PrimeNG (v20.2.0) - UI component library
│       ├── FullCalendar (v6.1.19) - Calendar integration
│       └── Chart.js (v4.5.1) - Data visualization
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
FRONTEND_URL=http://localhost:4200/
GRAPHQL_ENDPOINT=http://localhost:8030/graphql


# ⚙️ Backend
BACKEND_PORT=8085
BACKEND_CONTAINER_NAME=xxxxxxxxxxxxxxxxxxxx
BACKEND_CONTEXT=./xxxxxxxxxxxxxxxxxxxx
BACKEND_DOCKERFILE=xxxxxxxxxxxxxxxxxxxx
SPRING_PROFILES_ACTIVE=xxxxxxxxxxxxxxxxxxxx

SECURITY_JWT_SECRET=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_ISSUER=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_EXPMINUTES=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_REFRESH_SECRET=xxxxxxxxxxxxxxxxxxxx
SECURITY_JWT_REFRESH_DAYS=xxxxxxxxxxxxxxxxxxxx

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

#SonarQube
SONAR_HOST_URL=http://sonarqube:9000/
BACKEND_SONAR_TOKEN=sqp_2960016f5afbfdc7bdf3d03618ec93573c1797a7
FRONTEND_SONAR_TOKEN=sqp_2826e32b7be647f57f741e34ca7b0b17d5ea1ea1

#Azure
AZURE_CLIENT_SECRET=Yzxxxxxxxxxxxxxxxxxxxx
AZURE_TENANT_ID=90xxxxxxxxxxxxxxxxxxxx
AZURE_CLIENT_ID=axxxxxxxxxxxxxxxxxxxx
AZURE_URL=http://localhost:8080/

# 📧 SMTP Mail Configuration
SMTP_HOST=xxxxxxxxxxxxxxxxxxxx
SMTP_PORT=xxxxxxxxxxxxxxxxxxxx
SMTP_USERNAME=xxxxxxxxxxxxxxxxxxxx
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxx
SMTP_AUTH=xxxxxxxxxxxxxxxxxxxx
SMTP_STARTTLS=xxxxxxxxxxxxxxxxxxxx

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

# 🔐 API (JWT) & GraphQL Routes

## Overview
The backend uses **GraphQL** for all operations. Authentication is handled via **JWT tokens** stored in cookies after login.

### Auth flow (TL;DR)
1. **Register** a user via GraphQL mutation → password is hashed (BCrypt) with default role `ADMIN` (created by admin).
2. **Login** → JWT tokens are set in secure HTTP-only cookies.
3. Call **protected queries/mutations** with authentication (cookie-based or Bearer token).

> Available roles: `EMPLOYEE`, `MANAGER`, `ADMIN`

---

### GraphQL Endpoint
- **URL**: `http://localhost:8080/graphql`
- **Method**: `POST`
- **Content-Type**: `application/json`

---

## Query & Mutation Reference

All available GraphQL queries and mutations are documented in the [GraphQL Schema](backend/src/main/resources/graphql/).

### Quick Examples

**Login:**
```graphql
mutation {
  login(input: { email: "user@example.com", password: "password123" }) {
    ok
  }
}
```

**List Teams:**
```graphql
query {
  myTeams { id name description }
}
```

**Create a Clock Entry:**
```graphql
mutation {
  createClockForMe(input: { kind: IN, at: "2025-11-23T09:00:00Z" }) {
    id kind at
  }
}
```

---

## Complete GraphQL Routes

### 🔑 Authentication & Users

#### Mutations
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `login` | `{ email, password }` | ❌ | - | Authenticate and receive JWT cookies |
| `refresh` | `{ token? }` | ❌ | - | Refresh access token using refresh token |
| `logout` | - | ✅ | any | Clear authentication cookies |
| `register` | `{ firstName, lastName, email, phone?, role?, poste?, password, avatarUrl? }` | ✅ | `ADMIN` | Create a new user |
| `updateUser` | `{ id, firstName?, lastName?, email?, phone?, role?, poste?, avatarUrl?, password? }` | ✅ | `ADMIN` | Update user information |
| `deleteUser` | `{ id }` | ✅ | `ADMIN` | Delete a user |

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `users` | - | ✅ | `ADMIN` | List all users |
| `userByEmail` | `email: String!` | ✅ | any | Get user by email |

---

### 👫 Teams

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `teams` | - | ✅ | any | List all teams |
| `team` | `id: ID!` | ✅ | any | Get team by ID |
| `teamMembers` | `teamId: ID!` | ✅ | any | List members of a team |
| `allTeams` | - | ✅ | `ADMIN` | List all teams (admin) |
| `myTeams` | - | ✅ | any | Teams where current user is a member |
| `myManagedTeams` | - | ✅ | any | Teams managed by current user |
| `myTeamMembers` | - | ✅ | any | Members of all user's teams grouped by team |
| `teamManagers` | `teamId: ID!` | ✅ | any | Managers in a specific team |

#### Mutations
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `createTeam` | `{ name, description? }` | ✅ | `ADMIN` | Create a new team |
| `updateTeam` | `{ id, name?, description? }` | ✅ | `ADMIN` | Update team information |
| `deleteTeam` | `id: ID!` | ✅ | `ADMIN` | Delete a team |
| `addTeamMember` | `teamId: ID!, { userId }` | ✅ | `ADMIN` or `MANAGER` (if member) | Add user to team |
| `removeTeamMember` | `teamId: ID!, { userId }` | ✅ | `ADMIN` or `MANAGER` (if member) | Remove user from team |

---

### ⏱️ Clocks

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `myClocks` | `from?: String, to?: String` | ✅ | any | Current user's clock entries with optional date range |
| `clocksForUser` | `userId: ID!, from?: String, to?: String` | ✅ | `MANAGER` or `ADMIN` | Clock entries for specific user |

#### Mutations
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `createClockForMe` | `{ kind: IN\|OUT, at?: String }` | ✅ | any | Create clock entry for current user |
| `createClockForUser` | `userId: ID!, { kind: IN\|OUT, at?: String }` | ✅ | `MANAGER` or `ADMIN` | Create clock entry for specific user |

---

### 📋 Work Schedules

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `myWorkSchedules` | - | ✅ | any | Current user's weekly work schedule |
| `workSchedulesByUser` | `userId: ID!` | ✅ | `MANAGER` or `ADMIN` | Work schedule for specific user |

#### Mutations
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `upsertMyWorkSchedule` | `{ dayOfWeek: MON\|TUE\|..., period: AM\|PM, startTime, endTime }` | ✅ | any | Create/update own schedule slot |
| `upsertWorkSchedule` | `userId: ID!, { dayOfWeek, period, startTime, endTime }` | ✅ | `MANAGER` or `ADMIN` | Create/update schedule slot for user |
| `upsertWorkScheduleBatch` | `userId: ID!, { replaceAll?, entries: [...] }` | ✅ | `MANAGER` or `ADMIN` | Batch upsert schedule slots |
| `deleteMyWorkScheduleSlot` | `day: WorkDay!, period: WorkPeriod!` | ✅ | any | Delete own schedule slot |
| `deleteWorkScheduleSlot` | `userId: ID!, day: WorkDay!, period: WorkPeriod!` | ✅ | `MANAGER` or `ADMIN` | Delete schedule slot for user |

---

### 📝 Absences

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `myAbsences` | - | ✅ | any | Current user's absences |
| `absence` | `id: ID!` | ✅ | any | Get specific absence (if authorized) |
| `absencesByUser` | `userId: ID!` | ✅ | `MANAGER` or `ADMIN` | Absences for specific user |
| `allAbsences` | - | ✅ | `ADMIN` | All absences (admin only) |
| `myTeamAbsences` | `teamId?: ID` | ✅ | any | Absences for team members |
| `teamAbsences` | `teamId: ID!` | ✅ | `ADMIN` | All absences for a team |

#### Mutations
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `createAbsence` | `{ startDate, endDate, type, reason?, supportingDocumentUrl?, periodByDate?: [...] }` | ✅ | any | Create absence request |
| `updateAbsence` | `id: ID!, { startDate?, endDate?, type?, reason?, supportingDocumentUrl?, periodByDate?: [...] }` | ✅ | owner (if PENDING) or `ADMIN` | Update absence |
| `setAbsenceStatus` | `id: ID!, { status: APPROVED\|REJECTED }` | ✅ | `MANAGER` or `ADMIN` | Approve/reject absence |
| `deleteAbsence` | `id: ID!` | ✅ | owner (if PENDING) or `ADMIN` | Delete absence |

**Absence Types:** `SICK`, `VACATION`, `PERSONAL`, `FORMATION`, `RTT`, `OTHER`  
**Absence Periods:** `AM`, `PM`, `FULL_DAY`  
**Absence Status:** `PENDING`, `APPROVED`, `REJECTED`

---

### 📊 Reports

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `reports` | - | ✅ | `ADMIN` | All reports (admin only) |
| `myReports` | - | ✅ | any | Reports authored by current user |
| `reportsForMe` | - | ✅ | any | Reports addressed to current user |
| `report` | `id: ID!` | ✅ | any | Get specific report (if authorized) |

#### Mutations
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `createReport` | `{ targetUserId, title, body? }` | ✅ | any | Create a new report |
| `updateReport` | `id: ID!, { title?, body?, targetUserId? }` | ✅ | author or `ADMIN` | Update a report |
| `deleteReport` | `id: ID!` | ✅ | author or `ADMIN` | Delete a report |

---

### 💼 Leave Management

#### Leave Types

**Queries:**
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `leaveTypes` | - | ✅ | any | List all leave types |
| `leaveType` | `code: String!` | ✅ | any | Get specific leave type |

**Mutations:**
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `createLeaveType` | `{ code, label }` | ✅ | `ADMIN` | Create leave type |
| `updateLeaveType` | `{ code, label? }` | ✅ | `ADMIN` | Update leave type |
| `deleteLeaveType` | `code: String!` | ✅ | `ADMIN` | Delete leave type |

#### Leave Accounts

**Queries:**
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `leaveAccount` | `id: ID!` | ✅ | any | Get specific leave account |
| `leaveAccountsByUser` | `userId: ID!` | ✅ | any | Leave accounts for a user |

**Mutations:**
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `createLeaveAccount` | `{ userId, leaveTypeCode, openingBalance?, accrualPerMonth?, maxCarryover?, carryoverExpireOn? }` | ✅ | `ADMIN` | Create leave account |
| `updateLeaveAccount` | `{ id, openingBalance?, accrualPerMonth?, maxCarryover?, carryoverExpireOn? }` | ✅ | `ADMIN` | Update leave account |
| `deleteLeaveAccount` | `id: ID!` | ✅ | `ADMIN` | Delete leave account |

#### Leave Ledger

**Queries:**
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `leaveLedgerByAccount` | `accountId: ID!, from?: String, to?: String` | ✅ | any | Ledger entries for an account |

**Mutations:**
| Mutation | Input | Auth | Role | Description |
|----------|-------|------|------|-------------|
| `addLeaveLedgerEntry` | `{ accountId, entryDate?, kind, amount, referenceAbsenceId?, note? }` | ✅ | `ADMIN` | Add ledger entry |
| `updateLeaveLedgerEntry` | `{ id, entryDate?, amount?, note? }` | ✅ | `ADMIN` | Update ledger entry |
| `deleteLeaveLedgerEntry` | `id: ID!` | ✅ | `ADMIN` | Delete ledger entry |

**Ledger Kinds:** `ACCRUAL`, `DEBIT`, `ADJUSTMENT`, `CARRYOVER_EXPIRE`

---

### 📈 KPIs & Analytics

#### Queries
| Query | Parameters | Auth | Role | Description |
|-------|------------|------|------|-------------|
| `globalKpi` | `startDate: String!, endDate: String!` | ✅ | `ADMIN` | Global company KPIs |
| `teamKpi` | `teamId: ID!, startDate: String!, endDate: String!` | ✅ | `MANAGER` or `ADMIN` | Team performance KPIs |
| `userKpi` | `userId: ID!, startDate: String!, endDate: String!` | ✅ | any | Individual user KPIs |

**KPI Metrics include:**
- Headcount & role distribution
- Presence rate & average hours per day
- Absence rate & breakdown by type
- Overtime hours & punctuality stats
- Leave balances
- Report counts

---

## GraphQL Schema Reference

For complete type definitions and detailed field documentation, refer to the GraphQL schema files:
- **Users & Auth:** `backend/src/main/resources/graphql/user.graphqls`
- **Teams:** `backend/src/main/resources/graphql/teams.graphqls`
- **Clocks:** `backend/src/main/resources/graphql/clock.graphqls`
- **Work Schedules:** `backend/src/main/resources/graphql/work_shedule.graphqls`
- **Absences:** `backend/src/main/resources/graphql/absence.graphqls`
- **Reports:** `backend/src/main/resources/graphql/report.graphqls`
- **Leave Types:** `backend/src/main/resources/graphql/leave_type.graphqls`
- **Leave Accounts:** `backend/src/main/resources/graphql/leave_account.graphqls`
- **Leave Ledger:** `backend/src/main/resources/graphql/leave_ledger.graphqls`
- **KPIs:** `backend/src/main/resources/graphql/kpi.graphqls`

---

## Security & Authentication
- **Auth Method**: JWT stored in HTTP-only cookies (`access_token`, `refresh_token`)
- **RBAC**: Protected via `@PreAuthorize` annotations in Spring Security
- **Roles**: `EMPLOYEE`, `MANAGER`, `ADMIN`
- **Token Expiry**: 
  - Access token: 15 minutes
  - Refresh token: 7 days

## Using GraphQL

### With cURL
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<token>" \
  -d '{"query":"query { myTeams { id name } }"}'
```

### With GraphQL IDE
Visit `http://localhost:8080/graphiql` for an interactive GraphQL playground (if enabled) or use tools like:
- **Apollo Studio**: https://studio.apollographql.com/
- **Insomnia**: https://insomnia.rest/
- **Postman**: https://www.postman.com/ (with GraphQL support)

### With VS Code Extension
Install the **GraphQL** extension by GraphQL Foundation for inline query validation and autocomplete.
