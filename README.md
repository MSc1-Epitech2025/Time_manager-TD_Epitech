# 🕒 Time Manager – TD Epitech

## 🚀 Introduction

**Time Manager** is a full-stack web application composed of:

* a **frontend built with Angular** (TypeScript + SCSS + live reload)
* a **backend built with Spring Boot** (Gradle, Java 21)
* a **database powered by MariaDB**

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

---

## 🌐 Service Access

| Service                               | URL                                            | Description                                 |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| **Frontend (Angular)**                | [http://localhost:4200](http://localhost:4200) | Angular web app (dev mode with live reload) |
| **Backend (Spring Boot)**             | [http://localhost:8080](http://localhost:8080) | REST API server                             |
| **Database (MariaDB)**                | `localhost:3307`                               | SQL access (user: `root`, password: `root`) |
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
├── docker-compose.yml      # Docker orchestration
├── .env                    # Environment variables
└── README.md               # Project documentation
```

---

## ⚡ Environment Variables (`.env`)

All configuration is centralized in the `.env` file:

```bash
# 🌐 Frontend
FRONTEND_PORT=4200
FRONTEND_CONTAINER_NAME=frontend
FRONTEND_CONTEXT=./frontend
FRONTEND_DOCKERFILE=Dockerfile

# ⚙️ Backend
BACKEND_PORT=8080
BACKEND_CONTAINER_NAME=backend
BACKEND_CONTEXT=./backend
BACKEND_DOCKERFILE=Dockerfile
SPRING_PROFILES_ACTIVE=dev

# 🐬 MariaDB
DB_CONTAINER_NAME=mariadb
DB_IMAGE=mariadb:11
DB_PORT_HOST=3307
DB_PORT_CONTAINER=3306
DB_ROOT_PASSWORD=root
DB_NAME=time_manager

# 🔥 Angular hot reload
CHOKIDAR_USEPOLLING=true
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

## ✨ Possible Improvements

* Add **Adminer** or **phpMyAdmin** to visualize and manage the database
* Implement **unit tests** (Angular & JUnit)
* Set up **CI/CD with GitHub Actions** for automatic build and deployment
* Add **production build optimizations** (minified assets, cache headers, etc.)

---

## 🔐 Authentication & JWT usage
### The backend implements a JWT-based authentication system to secure all API routes.
1. Login
Send a POST request to /api/auth/login with your credentials:
  ```bash
  POST http://localhost:8080/api/auth/login
Content-Type: application/json
```
```Json
{
  "email": "email.Type@epitech.eu",
  "password": "Mdp"
}
  ```
✅ If the credentials are valid, you’ll receive a JSON Web Token (JWT):

```Json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
  ```
2. Use the token for protected routes
Include it in the Authorization header for all subsequent requests:

```bash
GET http://localhost:8080/api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
If the token is valid → access granted (HTTP 200).
If invalid or expired → access denied (HTTP 401 Unauthorized).

3. ogout (client-side only)
To log out, simply remove the token from your browser’s storage:

```js
localStorage.removeItem('jwt');
```

### 🛡️ Routes Overview
| Endpoint                     | Method | Auth required | Description                    |
| ---------------------------- | ------ | ------------- | ------------------------------ |
| `/api/auth/login`            | POST   | ❌ No          | Login with email & password    |
| `/api/auth/register` *(opt)* | POST   | ❌ No          | Create a new user *(optional)* |
| `/api/users`                 | GET    | ✅ Yes         | List all users                 |
| `/api/users/{id}`            | GET    | ✅ Yes         | Get specific user info         |

### 🧠 Technical Notes
- Passwords are stored securely using bcrypt hashing.
- The token is signed using your secret key (jwt.secret in application.properties).
- Default token validity: 24 hours (jwt.expiration=86400000 ms).
- All requests except /api/auth/** are automatically protected by Spring Security.

### 🧰 Frontend Integration

In the Angular app, the token is stored in localStorage and automatically added to HTTP requests using an interceptor.

Example:
```ts
const token = localStorage.getItem('jwt');
this.http.get('/api/users', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---
