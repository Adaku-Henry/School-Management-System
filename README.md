# Greenfield SMS — School Management System

A complete, full-stack School Management System built with **Next.js 14** (App Router) for both
frontend and backend, **Prisma + SQLite** for the database, and a custom JWT-based authentication
system with full role-based access control (RBAC) for all **10 user roles**.

Color palette: **white, navy, blue-navy, yellow, green** — used consistently across every screen.

---

## What's included

**10 user roles**, each with their own dashboard and permissions:
Super Administrator, School Administrator, Teacher, Student, Parent, Accountant, Librarian,
Hostel Warden, Nurse, Security.

**24 connected modules**, all reading and writing to the same database, so data flows between
them (e.g. a student registered in Student Management immediately appears in Attendance,
Exams, Fees, Report Cards, Library, Hostel, Transport, etc.):

Dashboard · Students · Teachers · Parents · Classes & Streams · Subjects · Attendance ·
Examinations · Report Cards · Fees · Payroll · Library · Hostel · Transport · Inventory ·
Discipline · Assignments · Learning Resources · Events · Certificates · Announcements ·
Users & Roles · Reports · Settings · My Profile

---

## Requirements

- **Node.js 18.18+** (Node 20 LTS recommended) — [nodejs.org](https://nodejs.org)
- npm (comes with Node.js)

No external database server is required — it uses a local SQLite file.

---

## Setup (run these commands in order)

```bash
# 1. Install dependencies
npm install

# 2. Create the database, apply the schema, and load demo data
npm run setup

# 3. Start the app
npm run dev
```

Then open **http://localhost:3000** in your browser.

If port 3000 is already in use, Next.js will automatically pick the next free port — check the
terminal output for the exact URL.

---

## Demo logins

Every account uses the password: **`password123`**

| Role | Email |
|---|---|
| Super Administrator | superadmin@school.com |
| School Administrator | admin@school.com |
| Teacher | teacher@school.com |
| Student | student@school.com |
| Parent | parent@school.com |
| Accountant | accountant@school.com |
| Librarian | librarian@school.com |
| Hostel Warden | warden@school.com |
| Nurse | nurse@school.com |
| Security | security@school.com |

The login page also has a "View demo accounts" button that fills these in for you with one click.

---

## Running it as a desktop app

The web app can also run as a native desktop app (its own window, its own icon, no browser tab)
using Electron. Two modes:

### 1. Desktop mode for development — quick and reliable

```bash
npm run electron:dev
```

This starts the same `next dev` server in the background and opens it inside a native app window
instead of a browser tab. Good for trying it out or day-to-day local use. Close the window to stop
it, same as closing any desktop app.

### 2. A real installer (.exe / .dmg / .AppImage) — for giving the app to someone else

This packages everything — server, database engine, and a seeded starter database — into a
double-click installer that **does not require Node.js or the command line** to run. Only needed
if you want to hand the app to someone else, or install it like a normal program.

```bash
# 1. Make sure you've run this at least once, so a seeded database exists to bundle:
npm run setup

# 2. Build the installer for your current platform:
npm run electron:build

# Or target a specific platform:
npm run electron:build:mac     # .dmg  (must be run on a Mac)
npm run electron:build:win     # .exe  (best run on Windows)
npm run electron:build:linux   # .AppImage
```

The finished installer appears in `release/`. Each install gets its **own private database**,
stored in the OS's standard app-data folder (not inside the installed app itself), seeded from
whatever was in `prisma/dev.db` when you built it — so re-running `npm run setup` before building
changes what a *fresh* install starts with, without touching anyone who already installed it.

**Notes on this part:**
- The first time you run `npm run electron:build`, `electron-builder` needs to download
  platform-specific binaries — this requires an internet connection.
- Building a Windows `.exe` works most reliably when run on Windows (same for macOS `.dmg` on a
  Mac). Building a Windows installer from macOS/Linux, or vice versa, sometimes needs extra native
  tooling (e.g. Wine) — if `electron:build:win` fails on a non-Windows machine, that's why.
- I wrote and reviewed the Electron code carefully, but couldn't actually run `electron-builder`
  in the environment I built this in (no internet access there). Try `npm run electron:dev` first
  since it's the simpler path and confirms the app itself is working — if `npm run electron:build`
  then throws an error, send it my way and I'll fix it.

---

## Useful commands

```bash
npm run dev      # start the development server
npm run build    # build for production
npm run start    # run the production build (after npm run build)
npm run db:push  # re-apply the Prisma schema to the database
npm run db:seed  # reset demo data (safe to re-run any time)
```

If you ever want a completely fresh database, just delete `prisma/dev.db` and run
`npm run setup` again.

---

## Project structure

```
app/
  (app)/            All signed-in pages (dashboard, students, fees, library, ...)
  api/               All backend API routes (one folder per module)
  login/             Public login page
components/          Shared UI: Sidebar, Topbar, CrudPage (generic table+form), etc.
lib/                 auth.ts (JWT sessions), prisma.ts (DB client), rbac.ts (nav + roles), crud.ts
electron/
  main.js            Electron entry point — opens a native window; in dev it points at
                      `next dev`, in a packaged build it runs the Next.js server in-process
                      against a private per-user SQLite database
prisma/
  schema.prisma      Full database schema (33 models)
  seed.ts            Demo data for every module
```

### How pages are wired together

Most list/CRUD pages (Students, Fees, Library, Hostel, etc.) are built on a single reusable
`CrudPage` component that talks to a matching REST API route
(e.g. `/students` page ⇄ `/api/students` route). This keeps every module consistent — same table
style, same modal forms, same search — and means adding a new field is a one-line change in both
places.

Authentication uses a signed JWT stored in an HTTP-only cookie (see `lib/auth.ts` and
`middleware.ts`). Every page under `app/(app)/` is protected — visiting any of them while signed
out redirects to `/login`. Role-based menu visibility comes from `lib/rbac.ts`, and sensitive API
routes (e.g. `/api/users`) additionally check the role server-side, not just in the UI.

---

## Notes

- This is a self-contained local system intended for development, evaluation, and learning — it
  is **not hardened for production deployment** as-is (see `.env` for the JWT secret, which you
  should change before deploying anywhere public).
- The database is a single SQLite file (`prisma/dev.db`), which is created the first time you run
  `npm run setup`. It's excluded from version control via `.gitignore`.
