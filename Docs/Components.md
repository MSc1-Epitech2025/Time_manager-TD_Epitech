# Application Components Documentation

## Overview
This document details the software components of the Time Manager application, divided into Backend and Frontend sections. It describes their responsibilities and interactions.

---

## 1. Backend Components (Spring Boot)

The backend follows a typical layered architecture.

### 1.1 Controllers (API Layer)
**Responsibility**: Handle incoming GraphQL queries/mutations, validate input, and return responses.
- **GraphQL Resolvers**: Handle all GraphQL operations (queries and mutations)

---

## 1.2 Services (Business Logic Layer)
**Responsibility**: Contain the core business rules and orchestrate specific domain logic.

#### 1.2.1 Identity & Access Management
| Service | Responsibility |
|---------|-----------------|
| `UserService` | User account management, profile updates, role assignment |
| `AuthenticationService` | Login, JWT token generation, refresh token handling |
| `TokenService` | JWT creation, validation, and expiration management |
| `SecurityContextService` | Load current user from context, permission checking |

#### 1.2.2 Team Management
| Service | Responsibility |
|---------|-----------------|
| `TeamService` | Create, update, delete teams |
| `TeamMemberService` | Add/remove team members, manage membership |
| `TeamManagerService` | Assign/remove team managers |

#### 1.2.3 Time Tracking
| Service | Responsibility |
|---------|-----------------|
| `ClockService` | Clock-in/out operations, entry validation |
| `WorkScheduleService` | Create and manage work schedule slots |
| `PresenceService` | Calculate presence rate, attendance metrics |
| `PunctualityService` | Track punctuality, tardiness analysis |

#### 1.2.4 Leave Management
| Service | Responsibility |
|---------|-----------------|
| `AbsenceService` | Create, update, approve/reject absence requests |
| `LeaveTypeService` | Manage leave type catalog (SICK, VACATION, etc.) |
| `LeaveAccountService` | Manage leave balances per user and type |
| `LeaveLedgerService` | Track leave debit/credit transactions |
| `LeaveCalculationService` | Compute available leave based on accrual rules |

#### 1.2.5 Analytics & Reports
| Service | Responsibility |
|---------|-----------------|
| `KpiService` | Calculate global, team, and user KPIs |
| `ReportService` | Create, update, delete user reports |
| `AnalyticsEngine` | Aggregate metrics for dashboards |
| `ExportService` | Generate exports (CSV, PDF) |

#### 1.2.6 Infrastructure & Utilities
| Service | Responsibility |
|---------|-----------------|
| `EmailService` | Send email notifications |
| `FileService` | Upload/download supporting documents |
| `DateUtilService` | Date calculations, ISO 8601 parsing |
| `ValidationService` | Business rule validation |

---

## 1.3 Repositories (Data Access Layer)
**Responsibility**: Interface with MariaDB using Spring Data JPA. One repository per entity.

| Repository | Entity | Operations |
|------------|--------|-----------|
| `UserRepository` | User | CRUD, find by email, find by role |
| `TeamRepository` | Team | CRUD, find by name |
| `TeamMemberRepository` | TeamMember | Add/remove members, find by team |
| `ClockRepository` | Clock | Create, query by date range, find by user |
| `WorkScheduleRepository` | WorkSchedule | CRUD by day/period, batch operations |
| `AbsenceRepository` | Absence | CRUD, find by status, find by date range |
| `LeaveTypeRepository` | LeaveType | CRUD, find by code |
| `LeaveAccountRepository` | LeaveAccount | CRUD, find by user and type |
| `LeaveLedgerRepository` | LeaveLedger | CRUD, find by account and date range |
| `ReportRepository` | Report | CRUD, find by author/target |

---

## 1.4 DTOs (Data Transfer Objects)
**Responsibility**: Isolate internal entities from the external API. Grouped by functional domain.

#### 1.4.1 Authentication & Users DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `LoginInputDTO` | `email`, `password` | Login mutation input |
| `LoginOutputDTO` | `ok`, `user` | Login response |
| `RegisterInputDTO` | `firstName`, `lastName`, `email`, `phone`, `role`, `poste`, `password`, `avatarUrl` | User registration |
| `UserDTO` | `id`, `firstName`, `lastName`, `email`, `phone`, `role`, `poste`, `avatarUrl`, `createdAt` | User profile response |
| `UpdateUserInputDTO` | `id`, `firstName?`, `lastName?`, `email?`, `phone?`, `role?`, `poste?`, `avatarUrl?`, `password?` | User update input |
| `RefreshTokenInputDTO` | `token?` | Token refresh request |

#### 1.4.2 Team Management DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `TeamDTO` | `id`, `name`, `description`, `members`, `managers`, `createdAt` | Team response |
| `CreateTeamInputDTO` | `name`, `description?` | Team creation input |
| `UpdateTeamInputDTO` | `id`, `name?`, `description?` | Team update input |
| `TeamMemberDTO` | `id`, `userId`, `teamId`, `role`, `joinedAt` | Team member info |
| `AddTeamMemberInputDTO` | `teamId`, `userId` | Add member input |

#### 1.4.3 Time Tracking DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `ClockDTO` | `id`, `userId`, `kind` (IN\|OUT), `at`, `createdAt` | Clock entry response |
| `CreateClockInputDTO` | `kind` (IN\|OUT), `at?` (ISO 8601) | Create clock entry input |
| `WorkScheduleDTO` | `id`, `userId`, `dayOfWeek`, `period` (AM\|PM), `startTime`, `endTime` | Schedule slot response |
| `UpsertWorkScheduleInputDTO` | `userId?`, `dayOfWeek`, `period`, `startTime`, `endTime` | Schedule slot input |
| `WorkScheduleBatchInputDTO` | `userId`, `replaceAll?`, `entries: [UpsertWorkScheduleInputDTO]` | Batch schedule input |

#### 1.4.4 Absence & Leave DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `AbsenceDTO` | `id`, `userId`, `startDate`, `endDate`, `type`, `status`, `reason?`, `supportingDocumentUrl?`, `createdAt` | Absence response |
| `CreateAbsenceInputDTO` | `startDate`, `endDate`, `type`, `reason?`, `supportingDocumentUrl?`, `periodByDate?` | Create absence input |
| `UpdateAbsenceInputDTO` | `id`, `startDate?`, `endDate?`, `type?`, `reason?`, `supportingDocumentUrl?`, `periodByDate?` | Update absence input |
| `SetAbsenceStatusInputDTO` | `id`, `status` (APPROVED\|REJECTED) | Approval input |
| `LeaveTypeDTO` | `code`, `label`, `createdAt` | Leave type response |
| `CreateLeaveTypeInputDTO` | `code`, `label` | Leave type creation |
| `LeaveAccountDTO` | `id`, `userId`, `leaveTypeCode`, `openingBalance`, `accrualPerMonth`, `maxCarryover`, `carryoverExpireOn`, `currentBalance` | Leave account response |
| `CreateLeaveAccountInputDTO` | `userId`, `leaveTypeCode`, `openingBalance?`, `accrualPerMonth?`, `maxCarryover?`, `carryoverExpireOn?` | Leave account creation |
| `LeaveLedgerDTO` | `id`, `accountId`, `entryDate`, `kind` (ACCRUAL\|DEBIT\|ADJUSTMENT\|CARRYOVER_EXPIRE), `amount`, `note?`, `referenceAbsenceId?` | Ledger entry response |
| `AddLeaveLedgerInputDTO` | `accountId`, `entryDate?`, `kind`, `amount`, `referenceAbsenceId?`, `note?` | Add ledger entry input |

#### 1.4.5 Reports DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `ReportDTO` | `id`, `authorId`, `targetUserId`, `title`, `body?`, `createdAt`, `updatedAt` | Report response |
| `CreateReportInputDTO` | `targetUserId`, `title`, `body?` | Report creation input |
| `UpdateReportInputDTO` | `id`, `title?`, `body?`, `targetUserId?` | Report update input |

#### 1.4.6 Analytics & KPI DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `GlobalKpiDTO` | `headcount`, `averageHoursPerDay`, `presenceRate`, `absenceRateByType`, `overtimeHours`, `leaveBalances`, `reportCount` | Global company KPIs |
| `TeamKpiDTO` | `teamId`, `memberCount`, `averagePresenceRate`, `teamAbsenceBreakdown`, `punctualityScore`, `leaveUtilization` | Team performance KPIs |
| `UserKpiDTO` | `userId`, `presenceRate`, `punctualityScore`, `leaveBalance`, `reportCount`, `averageWorkHours` | Individual user KPIs |
| `DashboardChartDTO` | `labels`, `datasets`, `type` (line\|bar\|pie) | Chart data for frontend |

---

## 2. Frontend Components (Angular)

The frontend is structured into modules, pages, and shared components.

### 2.1 Modules & Pages
- **Auth Module**:
  - `LoginPage`: User login form.
  - `RegisterPage`: New user registration.
  - `ForgotPasswordPage`: Password reset flow.

- **Dashboard Module**:
  - `DashboardPage`: Main user dashboard with widgets.
  - `MyClockPage`: Clock in/out interface.
  - `MySchedulePage`: Personal work schedule management.
  - `MyAbsencesPage`: Personal absence request management.

- **Team Management Module** (Manager/Admin):
  - `TeamListPage`: List all teams.
  - `TeamDetailsPage`: View team members and manage.
  - `TeamMembersPage`: Add/remove team members.

- **Admin Module**:
  - `UsersPage`: Manage all users.
  - `LeaveTypesPage`: Manage leave types.
  - `LeaveAccountsPage`: Manage employee leave balances.
  - `ReportsPage`: View all reports.
  - `AnalyticsPage`: View global KPIs and charts.

### 2.2 Shared Components
**Responsibility**: Reusable UI elements used across different pages.

| Component | Purpose |
|-----------|---------|
| `ClockComponent` | Widget for clock in/out with status display |
| `ChartComponent` | Wrapper for Chart.js/FullCalendar visualization |
| `Navbar` | Main navigation and user profile dropdown |
| `Sidebar` | Menu navigation (role-based) |
| `ConfirmDialogComponent` | Confirmation modal for destructive actions |
| `LoadingSpinnerComponent` | Loading indicator |
| `AlertComponent` | Toast/alert notifications |
| `PaginationComponent` | Table pagination |
| `FilterComponent` | Date range and filter controls |

### 2.3 Services
**Responsibility**: Handle HTTP communication with the backend and state management.

#### 2.3.1 HTTP & API Services

| Service | Responsibility |
|---------|-----------------|
| `HttpService` | Base HTTP wrapper (GET, POST, PUT, DELETE with auth) |
| `AuthService` | Login, logout, token storage, user context |
| `UserService` | User CRUD operations, profile updates |
| `TeamService` | Team CRUD, member management |
| `ClockService` | Clock in/out API calls |
| `WorkScheduleService` | Schedule management API calls |
| `AbsenceService` | Absence request API calls |
| `LeaveService` | Leave account and ledger API calls |
| `ReportService` | Report CRUD API calls |
| `AnalyticsService` | KPI and chart data fetching |

#### 2.3.2 State Management Services

| Service | Responsibility |
|---------|-----------------|
| `AuthStore` | Manage authentication state (current user, token) |
| `UserStore` | Cache user data and manage user state |
| `ClockStore` | Cache clock entries, manage clock state |
| `NotificationStore` | Manage toast/alert notifications |

#### 2.3.3 Utility Services

| Service | Responsibility |
|---------|-----------------|
| `DateService` | Date formatting, ISO 8601 parsing, timezone handling |
| `ValidationService` | Form validation rules |
| `LocalStorageService` | Persistent client-side storage |
| `ToastService` | Show success/error messages |

---

## 3. Component Communication Flow

### 3.1 Clock In Example
1. **User Action**: User clicks "Clock In" on `ClockComponent`.
2. **Frontend Service**: `ClockComponent` calls `ClockService.createClockForMe()`.
3. **GraphQL Request**: `ClockService` sends a `POST /graphql` mutation with:
   ```graphql
   mutation { createClockForMe(input: { kind: IN, at: "2025-11-23T09:00:00Z" }) { id kind at } }
   ```
4. **Backend Resolver**: GraphQL resolver receives the mutation.
5. **Business Logic**: `ClockService` (Backend) validates:
   - User exists
   - No duplicate clock entry
   - Business hours validation
6. **Data Persistence**: `ClockRepository` saves the entry to MariaDB.
7. **Response**: Backend returns clock DTO with `{ id, kind: "IN", at }`.
8. **Frontend Update**: `ClockComponent` updates UI (button changes to "Clock Out", shows time).
9. **State Update**: `ClockStore` updates the cached clock list.
10. **Notification**: `ToastService` shows success message.

### 3.2 Absence Request Flow
1. **User Action**: User fills absence form on `MyAbsencesPage`.
2. **Validation**: `ValidationService` validates dates and type.
3. **API Call**: `AbsenceService` sends GraphQL mutation.
4. **Backend Processing**: `AbsenceService` (Backend):
   - Validates date range
   - Checks leave balance via `LeaveCalculationService`
   - Creates absence record
   - Sets status to PENDING
5. **Notification**: Email sent via `EmailService`.
6. **Frontend Response**: Absence appears in list, state updated in `AbsenceStore`.

---

## 4. Data Flow Diagram

```
┌─────────────────┐
│  Angular UI     │
│  Components     │
└────────┬────────┘
         │ (HTTP/GraphQL)
         ↓
┌─────────────────┐
│ Angular         │
│ Services        │
└────────┬────────┘
         │ (JSON)
         ↓
┌─────────────────────────────┐
│ Spring Boot GraphQL         │
│ Resolvers / Controllers     │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Business Logic Layer        │
│ Services                    │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Data Access Layer           │
│ Repositories / JPA          │
└────────┬────────────────────┘
         │ (SQL)
         ↓
┌─────────────────────────────┐
│ MariaDB Database            │
└─────────────────────────────┘
```

---

## 5. Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend UI** | Angular 20, TypeScript, SCSS, PrimeNG, Chart.js, FullCalendar |
| **Frontend State** | Services/Stores (RxJS) |
| **Backend API** | Spring Boot 3, GraphQL, Java 21 |
| **Business Logic** | Spring Services, Custom DTOs |
| **Database Access** | Spring Data JPA |
| **Database** | MariaDB |
| **Authentication** | JWT (HTTP-only cookies) |
| **Authorization** | Spring Security `@PreAuthorize` |
| **Build Tools** | Gradle (Backend), npm (Frontend) |
| **Containerization** | Docker, Docker Compose |
