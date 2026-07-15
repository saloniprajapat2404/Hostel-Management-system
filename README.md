# Hostel Management System

Modern, interactive login portal for students, wardens, and administrators.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Demo Login

- **Email / Student ID:** any valid email (e.g. `student@college.edu`) or student ID (e.g. `STU2024001`)
- **Password:** any password with 6+ characters (use `demo123` for admin demo role)
- **Guest mode:** click "Continue as Guest" to preview without signing in

To test failed login, use password `wrongpass`.

## Features

- Split-screen responsive layout (hero + login form)
- Floating labels, inline validation, password toggle
- Loading, shake, and success animations
- Dark mode (persisted) and English / Hindi language toggle
- Accessible focus states and reduced-motion support

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- React Hook Form
- React Router

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Start dev server     |
| `npm run build`| Production build     |
| `npm run preview` | Preview production build |
