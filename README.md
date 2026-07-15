# Takshak Hostel Management System

React frontend for the Takshak Hostel Management System, connected to the Java Spring Boot API.

## Prerequisites

- Node.js 18+
- Java 17+ and Maven (for the backend)
- Backend running at `http://localhost:8080`

## Run backend

On Windows PowerShell (Maven is bundled under `backend/.tools`):

```powershell
cd backend
.\.tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

Or if you have Maven installed:

```bash
cd backend
mvn spring-boot:run
```

## Run frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Vite proxies `/api` → `http://localhost:8080`, so the browser calls `/api/...` without CORS issues.

## Demo logins

Password for all demo users: **`demo123`**

| Role        | Identifier              |
|-------------|-------------------------|
| Super Admin | `superadmin@takshak.edu` |
| Admin       | `admin@takshak.edu`      |
| Warden      | `warden@takshak.edu`     |
| Student     | `student01@takshak.edu` or `STU2024001` |

## Roles overview

- **SUPER_ADMIN** — Admins, rooms, students, admissions, allocations, reports, notices, settings
- **ADMIN** — Wardens, rooms, students, admissions, allocations, occupancy, notices, complaints
- **WARDEN** — Rooms/occupancy, students (read-only), complaints, attendance, notices
- **STUDENT** — Dashboard, my room, complaints, notices, profile

## Features

- Real JWT auth (`POST /api/auth/login`) with Bearer tokens
- Role-based sidebar navigation and protected routes
- CRUD-style pages for users, rooms, admissions, allocations, complaints, notices, attendance, settings
- Dark mode (persisted) and existing teal Takshak login UI

## Tech stack

- React 19 + Vite
- Tailwind CSS v4
- React Hook Form
- React Router

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start Vite dev server    |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
