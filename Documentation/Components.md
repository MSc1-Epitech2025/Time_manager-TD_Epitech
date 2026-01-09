# Application Components Documentation

## Overview
This document details the software components of the Time Manager application, divided into Backend and Frontend sections. It describes their responsibilities and interactions.

---

## 1. Backend Components (Spring Boot)

The backend follows a typical layered architecture.

### 1.1 Controllers (API Layer)
**Responsibility**: Handle incoming HTTP requests, validate input, and return HTTP responses.
- **AuthenticationController**: Handles login, registration, and token management.
- **UserController**: Manages user profiles, updates, and deletion.
- **WorkingTimeController**: Manages working time entries (start/end).
- **ClockController**: Handles clock-in/clock-out operations.

### 1.2 Services (Business Logic Layer)
**Responsibility**: Contain the core business rules and orchestrate specific domain logic.
- **Identity & Access**: Manages user accounts, teams, and secure authentication flows.
- **Time Tracking**: Handles clock-in/out logic, presence validation, and schedules.
- **Leave Management**: Manages absence requests, balances (ledger), and approval workflows.
- **Analytics Engine**: Computes KPIs (punctuality, attendance) and generates automated reports.
- **Infrastructure**: Handles notifications (Email) and security context loading.

### 1.3 Repositories (Data Access Layer)
**Responsibility**: Interface with the database using Spring Data JPA. Contains interfaces for each main entity (User, Team, Clock, WorkSchedule, Absence, LeaveAccount, etc.) to perform CRUD operations.

### 1.4 DTOs (Data Transfer Objects)
**Responsibility**: Data Transfer Objects isolate the internal database entities from the external API interface. They are grouped by functional domain:

- **User & Auth**: Handles login, registration payloads, and user profile data.
- **Time Management**: Structures for clocks (start/stop) and work schedules.
- **Organization**: Manages team structures and membership changes.
- **Absence & Leaves**: Handles leave requests, balances, and ledger updates.
- **Analytics**: Contains structures for KPI calculation (Attendance, Punctuality) and report generation.

---

## 2. Frontend Components (Angular)

The frontend is structured into modules, pages, and shared components.

### 2.1 Modules & Pages
- **Auth Module**:
  - `LoginPage`: User login form.
  - `RegisterPage`: New user registration.
- **Dashboard Module**:
  - `MainGraph`: Visualization of working times.
  - `UserProfile`: Display and edit user settings.
  - `TeamView`: Manager view for team oversight.

### 2.2 Shared Components
**Responsibility**: Reusable UI elements used across different pages.
- `ClockComponent`: Widget for clocking in/out.
- `ChartComponent`: Generic wrapper for displaying charts (Chart.js/D3.js).
- `Navbar`: Main navigation and user info display.

### 2.3 Services
**Responsibility**: Handle HTTP communication with the backend and state management.
- **AuthService**: Manages JWT storage and login/logout API calls.
- **HttpService**: Base wrapper for HTTP requests (GET, POST, PUT, DELETE).
- **Store/State**: (If applicable, e.g., NgRx or Signals) Manages application state.

---

## 3. Component Communication Flow

1. **User Action**: User clicks "Clock In" on the `ClockComponent`.
2. **Frontend Service**: `ClockComponent` calls `ClockService`.
3. **API Request**: `ClockService` sends a `POST /api/clocks` request.
4. **Backend Controller**: `ClockController` receives the request.
5. **Business Logic**: `ClockService` (Backend) validates the action.
6. **Data Persistence**: `ClockRepository` saves the entry to PostgreSQL.
7. **Response**: Success response triggers a UI update (e.g., button turns red for "Clock Out").
