# InternFlow Progress Tracker

**Last updated:** 2026-10-21
**Current phase:** Phase 3, Profiles (Milestone 1)
**Repository:** https://github.com/Anandgarg695/InternFlow (public)

## 1. Status at a glance
- Sprint 1 (foundation) is finished.
- Phase 2 (database, auth, roles, dashboards) is finished.
- Student profile and company profile are built.
- Next: internship posting.

## 2. Milestones
- [ ] Milestone 1: Basic platform (auth, RBAC, profiles, internship CRUD) - in progress
- [ ] Milestone 2: Recruitment (apply, screening, test, interview, selection)
- [ ] Milestone 3: Internship (offer, onboarding, mentor, tasks, evaluation)
- [ ] Milestone 4: Advanced (video, chat, notifications, coding judge, skill gap, analytics, certificates)
- [ ] Milestone 5: Production (security, testing, Docker, deployment)

## 3. Done
**Sprint 1: Foundation**
- [x] Git repository, pushed to GitHub (branch `main`)
- [x] React + Vite frontend (Tailwind, Axios, Redux Toolkit, React Router)
- [x] Spring Boot 4.1.1 backend (Java 21, Maven)
- [x] PostgreSQL 16 in Docker, backend connected
- [x] `GET /api/health` (also checks the database)
**Phase 3: Profiles**
- [x] Student profile (V2): `GET/PUT /api/student/profile`, page `/student/profile`
- [x] Company profile (V3): `GET/PUT /api/company/profile`, page `/company/profile`

**Phase 2: Database and authentication**
- [x] Flyway migrations (V1: roles and users)
- [x] Register, login, JWT (BCrypt password hashing)
- [x] Role-protected API routes (STUDENT, COMPANY, MENTOR, ADMIN)
- [x] Login and Register pages, protected routes, one dashboard per role

## 4. In progress
- Nothing in progress. Pick the next item from section 5.

## 5. Up next (in order)
1. Internship posting by companies (create, edit, close) and browsing by students.
2. Resume upload (needs file storage).
3. Mentor profile (optional for now).
4. Applications, then screening, tests and interviews (Milestone 2).

## 6. What exists right now

**Database tables**

| Migration | Tables |
|---|---|
| V1 | `roles` (STUDENT, COMPANY, MENTOR, ADMIN), `users` |
| V2 |student_profiles |
| V3 | company_profiles |
| V4 | reserved for internships

**API endpoints**

| Method | URL | Who can call it |
|---|---|---|
| GET | `/api/health` | anyone |
| POST | `/api/auth/register` | anyone (STUDENT, COMPANY, MENTOR only) |
| POST | `/api/auth/login` | anyone |
| GET | `/api/auth/me` | any logged-in user |
| GET, PUT | `/api/student/profile` | STUDENT |
| GET, PUT | /api/company/profile | COMPANY |
| GET | `/api/student/ping`, `/api/company/ping`, `/api/mentor/ping`, `/api/admin/ping` | the matching role (test endpoints) |

**Frontend routes**

| Route | Page | Access |
|---|---|---|
| `/` | Home | anyone |
| `/login`, `/register` | auth pages | anyone |
| `/student/dashboard`, `/company/dashboard`, `/mentor/dashboard`, `/admin/dashboard` | dashboards | the matching role |
| `/student/profile` | student profile form | STUDENT (in progress) |

## 7. How to run the project (every time)
1. Open **Docker Desktop** and wait for "Engine running".
2. Database (project root): `docker compose -f docker/docker-compose.yml up -d`
3. Backend: `cd backend`, then `.\mvnw.cmd spring-boot:run`
   - After many Java changes or branch switches use `.\mvnw.cmd clean spring-boot:run`.
4. Frontend: `cd frontend`, `npm install` (first time only), then `npm run dev`
5. Open http://localhost:5173. The home page should show "Backend: UP | Database: UP".

## 8. First-time setup for a new teammate
1. Install Git, Node.js (LTS), JDK 21 or newer, Docker Desktop and VS Code.
2. Set the Git identity: `git config --global user.name "Name"` and `git config --global user.email "email"`.
3. Clone: `git clone https://github.com/Anandgarg695/InternFlow.git`
4. Create the JWT secret file (required, the backend will not start without it):
   - Copy `backend/src/main/resources/application-local.properties.example` to `application-local.properties` in the same folder.
   - Replace the placeholder after `app.jwt.secret=` with a random string. Generate one in PowerShell:
```
     $bytes = New-Object byte[] 48
     [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
     [Convert]::ToBase64String($bytes)
```
   - This file is git-ignored. Never commit it.
5. Follow section 7 to run everything.

## 9. Ports and local settings
- Frontend: 5173
- Backend: 8081 (port 8080 is used by a Windows service on Anand's machine)
- PostgreSQL: 5433 on your computer (maps to 5432 inside Docker, to avoid clashing with a locally installed PostgreSQL)
- Database name and user: `internflow`. Local password: `internflow_dev` (development only, never use in production).

## 10. Team workflow
1. Never commit directly to `main`.
2. Start a feature: `git checkout main`, `git pull`, `git checkout -b feature/name`.
3. Commit small and often. Push the branch: `git push -u origin feature/name`.
4. Open a Pull Request on GitHub, ask the other person to look, merge, delete the branch.
5. Sync: `git checkout main` and `git pull`.
6. Run git commands from the project root (`InternFlow`), not from inside `frontend` or `backend`.
7. Split work so you are not editing the same files at the same time (for example one person on the company profile, the other on internships).

## 11. Rules for this project
- **Secrets:** the repository is public. Never commit real secrets. Use `application-local.properties` (ignored) locally and environment variables (`JWT_SECRET`, `DB_PASSWORD`) in production.
- **Database changes:** only through Flyway files in `backend/src/main/resources/db/migration` (`V1__`, `V2__`, ...). Never edit a migration that has been pushed; add a new one. Migration numbers must be unique: tell each other which number you are taking before creating the file.
- **Hibernate** is set to `ddl-auto=validate`, so it never creates or changes tables by itself.
- **Security:** the backend enforces access. Frontend route guards are only for user experience. The user id always comes from the token, never from the request.
- **Public registration** allows STUDENT, COMPANY and MENTOR only. Admin accounts are never self-registered.
- **Time zone:** the backend forces UTC in `BackendApplication.java`, because the Indian system name "Asia/Calcutta" is rejected by PostgreSQL 16.

## 12. Known issues and fixes
- **"Port already in use" on 8080:** that is why the backend uses 8081.
- **"password authentication failed" for the database:** another PostgreSQL on Windows owns port 5432. Our container uses 5433.
- **"Invalid method Code length 0" or other strange class errors:** stale compiled files. Stop the backend, then run `.\mvnw.cmd clean spring-boot:run`.
- **"No migrations found":** the SQL file must be in `backend/src/main/resources/db/migration` and named like `V2__description.sql` (capital V, two underscores).
- **"JWT secret is missing or too short":** create `application-local.properties` (see section 8).
- **Backend cannot reach the database:** Docker Desktop must be running and `internflow-db` must be up (`docker ps`).