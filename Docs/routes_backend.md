# 📡 Backend Routes – GraphQL API Reference

## Overview
All backend routes are **GraphQL queries and mutations** accessible at `http://localhost:8080/graphql`.

- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: JWT via HTTP-only cookies (`access_token`, `refresh_token`)

---

## 🔑 Authentication & Users

### Mutations

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `login` | `email: String!`, `password: String!` | ❌ | - | Authenticate user and receive JWT cookies |
| `refresh` | `token?: String` | ❌ | - | Refresh access token using refresh token |
| `logout` | - | ✅ | any | Clear authentication cookies |
| `register` | `firstName: String!`, `lastName: String!`, `email: String!`, `phone?: String`, `role?: Role`, `poste?: String`, `password: String!`, `avatarUrl?: String` | ✅ | `ADMIN` | Create a new user |
| `updateUser` | `id: ID!`, `firstName?: String`, `lastName?: String`, `email?: String`, `phone?: String`, `role?: Role`, `poste?: String`, `avatarUrl?: String`, `password?: String` | ✅ | `ADMIN` | Update user information |
| `deleteUser` | `id: ID!` | ✅ | `ADMIN` | Delete a user account |

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `users` | - | ✅ | `ADMIN` | List all users |
| `userByEmail` | `email: String!` | ✅ | any | Get user by email address |

---

## 👫 Teams

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `teams` | - | ✅ | any | List all teams |
| `team` | `id: ID!` | ✅ | any | Get team by ID |
| `teamMembers` | `teamId: ID!` | ✅ | any | List all members of a team |
| `allTeams` | - | ✅ | `ADMIN` | List all teams (admin only) |
| `myTeams` | - | ✅ | any | Teams where current user is a member |
| `myManagedTeams` | - | ✅ | any | Teams managed by current user |
| `myTeamMembers` | - | ✅ | any | Members grouped by all user's teams |
| `teamManagers` | `teamId: ID!` | ✅ | any | List managers in a specific team |

### Mutations

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `createTeam` | `name: String!`, `description?: String` | ✅ | `ADMIN` | Create a new team |
| `updateTeam` | `id: ID!`, `name?: String`, `description?: String` | ✅ | `ADMIN` | Update team information |
| `deleteTeam` | `id: ID!` | ✅ | `ADMIN` | Delete a team |
| `addTeamMember` | `teamId: ID!`, `userId: ID!` | ✅ | `ADMIN`, `MANAGER` (if member) | Add user to team |
| `removeTeamMember` | `teamId: ID!`, `userId: ID!` | ✅ | `ADMIN`, `MANAGER` (if member) | Remove user from team |

---

## ⏱️ Clocks

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `myClocks` | `from?: String`, `to?: String` | ✅ | any | Current user's clock entries (ISO 8601 date range) |
| `clocksForUser` | `userId: ID!`, `from?: String`, `to?: String` | ✅ | `MANAGER`, `ADMIN` | Clock entries for a specific user |

### Mutations

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `createClockForMe` | `kind: ClockKind!` (IN \| OUT), `at?: String` (ISO 8601) | ✅ | any | Create clock entry for current user |
| `createClockForUser` | `userId: ID!`, `kind: ClockKind!`, `at?: String` | ✅ | `MANAGER`, `ADMIN` | Create clock entry for specific user |

---

## 📋 Work Schedules

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `myWorkSchedules` | - | ✅ | any | Current user's weekly work schedule |
| `workSchedulesByUser` | `userId: ID!` | ✅ | `MANAGER`, `ADMIN` | Work schedule for specific user |

### Mutations

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `upsertMyWorkSchedule` | `dayOfWeek: WorkDay!`, `period: WorkPeriod!` (AM \| PM), `startTime: String!`, `endTime: String!` | ✅ | any | Create/update own schedule slot |
| `upsertWorkSchedule` | `userId: ID!`, `dayOfWeek: WorkDay!`, `period: WorkPeriod!`, `startTime: String!`, `endTime: String!` | ✅ | `MANAGER`, `ADMIN` | Create/update schedule slot for user |
| `upsertWorkScheduleBatch` | `userId: ID!`, `replaceAll?: Boolean`, `entries: [ScheduleEntry!]!` | ✅ | `MANAGER`, `ADMIN` | Batch upsert schedule slots |
| `deleteMyWorkScheduleSlot` | `day: WorkDay!`, `period: WorkPeriod!` | ✅ | any | Delete own schedule slot |
| `deleteWorkScheduleSlot` | `userId: ID!`, `day: WorkDay!`, `period: WorkPeriod!` | ✅ | `MANAGER`, `ADMIN` | Delete schedule slot for user |

**WorkDay Values:** MON, TUE, WED, THU, FRI, SAT, SUN

---

## 📝 Absences

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `myAbsences` | - | ✅ | any | Current user's absence requests |
| `absence` | `id: ID!` | ✅ | any | Get specific absence (if authorized) |
| `absencesByUser` | `userId: ID!` | ✅ | `MANAGER`, `ADMIN` | Absences for specific user |
| `allAbsences` | - | ✅ | `ADMIN` | All absences in system |
| `myTeamAbsences` | `teamId?: ID` | ✅ | any | Absences for team members |
| `teamAbsences` | `teamId: ID!` | ✅ | `ADMIN` | All absences in a team |

### Mutations

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `createAbsence` | `startDate: String!`, `endDate: String!`, `type: AbsenceType!`, `reason?: String`, `supportingDocumentUrl?: String`, `periodByDate?: [PeriodByDate!]` | ✅ | any | Create absence request |
| `updateAbsence` | `id: ID!`, `startDate?: String`, `endDate?: String`, `type?: AbsenceType`, `reason?: String`, `supportingDocumentUrl?: String`, `periodByDate?: [PeriodByDate!]` | ✅ | owner (PENDING) or `ADMIN` | Update absence request |
| `setAbsenceStatus` | `id: ID!`, `status: AbsenceStatus!` (APPROVED \| REJECTED) | ✅ | `MANAGER`, `ADMIN` | Approve/reject absence |
| `deleteAbsence` | `id: ID!` | ✅ | owner (PENDING) or `ADMIN` | Delete absence request |

**Absence Types:** SICK, VACATION, PERSONAL, FORMATION, RTT, OTHER  
**Absence Periods:** AM, PM, FULL_DAY  
**Absence Status:** PENDING, APPROVED, REJECTED

---

## 📊 Reports

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `reports` | - | ✅ | `ADMIN` | All reports in system |
| `myReports` | - | ✅ | any | Reports created by current user |
| `reportsForMe` | - | ✅ | any | Reports addressed to current user |
| `report` | `id: ID!` | ✅ | any | Get specific report (if authorized) |

### Mutations

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `createReport` | `targetUserId: ID!`, `title: String!`, `body?: String` | ✅ | any | Create a new report |
| `updateReport` | `id: ID!`, `title?: String`, `body?: String`, `targetUserId?: ID` | ✅ | author or `ADMIN` | Update a report |
| `deleteReport` | `id: ID!` | ✅ | author or `ADMIN` | Delete a report |

---

## 💼 Leave Management

### Leave Types

**Queries:**

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `leaveTypes` | - | ✅ | any | List all leave types |
| `leaveType` | `code: String!` | ✅ | any | Get specific leave type |

**Mutations:**

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `createLeaveType` | `code: String!`, `label: String!` | ✅ | `ADMIN` | Create new leave type |
| `updateLeaveType` | `code: String!`, `label?: String` | ✅ | `ADMIN` | Update leave type |
| `deleteLeaveType` | `code: String!` | ✅ | `ADMIN` | Delete leave type |

### Leave Accounts

**Queries:**

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `leaveAccount` | `id: ID!` | ✅ | any | Get specific leave account |
| `leaveAccountsByUser` | `userId: ID!` | ✅ | any | All leave accounts for a user |

**Mutations:**

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `createLeaveAccount` | `userId: ID!`, `leaveTypeCode: String!`, `openingBalance?: Float`, `accrualPerMonth?: Float`, `maxCarryover?: Float`, `carryoverExpireOn?: String` | ✅ | `ADMIN` | Create leave account |
| `updateLeaveAccount` | `id: ID!`, `openingBalance?: Float`, `accrualPerMonth?: Float`, `maxCarryover?: Float`, `carryoverExpireOn?: String` | ✅ | `ADMIN` | Update leave account |
| `deleteLeaveAccount` | `id: ID!` | ✅ | `ADMIN` | Delete leave account |

### Leave Ledger

**Queries:**

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `leaveLedgerByAccount` | `accountId: ID!`, `from?: String`, `to?: String` | ✅ | any | Ledger entries for an account (ISO 8601 date range) |

**Mutations:**

| Mutation | Arguments | Auth | Role | Description |
|----------|-----------|------|------|-------------|
| `addLeaveLedgerEntry` | `accountId: ID!`, `entryDate?: String`, `kind: LedgerKind!`, `amount: Float!`, `referenceAbsenceId?: ID`, `note?: String` | ✅ | `ADMIN` | Add ledger entry |
| `updateLeaveLedgerEntry` | `id: ID!`, `entryDate?: String`, `amount?: Float`, `note?: String` | ✅ | `ADMIN` | Update ledger entry |
| `deleteLeaveLedgerEntry` | `id: ID!` | ✅ | `ADMIN` | Delete ledger entry |

**Ledger Kinds:** ACCRUAL, DEBIT, ADJUSTMENT, CARRYOVER_EXPIRE

---

## 📈 KPIs & Analytics

### Queries

| Query | Arguments | Auth | Role | Description |
|-------|-----------|------|------|-------------|
| `globalKpi` | `startDate: String!`, `endDate: String!` | ✅ | `ADMIN` | Global company KPIs (ISO 8601) |
| `teamKpi` | `teamId: ID!`, `startDate: String!`, `endDate: String!` | ✅ | `MANAGER`, `ADMIN` | Team performance KPIs |
| `userKpi` | `userId: ID!`, `startDate: String!`, `endDate: String!` | ✅ | any | Individual user KPIs |

**KPI Metrics Include:**
- Headcount & role distribution
- Presence rate & average hours per day
- Absence rate & breakdown by type
- Overtime hours & punctuality stats
- Leave balances
- Report counts

---

## 📚 Schema Files

Complete type definitions available at:

```
backend/src/main/resources/graphql/
├── user.graphqls                 # Users & Authentication
├── teams.graphqls                # Teams management
├── clock.graphqls                # Clock entries
├── work_schedule.graphqls         # Work schedules
├── absence.graphqls              # Absence requests
├── report.graphqls               # Reports
├── leave_type.graphqls           # Leave types
├── leave_account.graphqls        # Leave accounts
├── leave_ledger.graphqls         # Leave ledger
└── kpi.graphqls                  # KPI definitions
```

---

## 🔐 Authentication Details

| Item | Value |
|------|-------|
| **Auth Method** | JWT in HTTP-only cookies |
| **Cookie Names** | `access_token`, `refresh_token` |
| **Access Token Expiry** | 15 minutes |
| **Refresh Token Expiry** | 7 days |
| **Authorization Method** | Spring Security `@PreAuthorize` |
| **Available Roles** | `EMPLOYEE`, `MANAGER`, `ADMIN` |

---

## 🛠️ Usage Examples

### Login with cURL
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"user@example.com\", password: \"password123\" }) { ok } }"
  }'
```

### Query with Cookie Authentication
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<your_token>" \
  -d '{
    "query": "query { myTeams { id name description } }"
  }'
```

### Using GraphQL IDE
- **GraphQL Playground**: http://localhost:8080/graphiql
- **Apollo Studio**: https://studio.apollographql.com/
- **Insomnia**: https://insomnia.rest/
- **Postman**: https://www.postman.com/

---

## Legend

- ✅ = Authentication required
- ❌ = Public endpoint (no auth needed)
- ISO 8601 = Date format: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2025-11-23T09:00:00Z`)
