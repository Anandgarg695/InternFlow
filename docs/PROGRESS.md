# InternFlow Progress Tracker

**Last updated:** 2026-10-17
**Current phase:** Sprint 1, Foundation (nearly done)

## How we work
Phase → Build → Test → Checkpoint → Commit → Push → Next phase.
Never start a later phase before the earlier one works.

## Milestones
- [ ] Milestone 1: Basic platform (auth, RBAC, profiles, internship CRUD)
- [ ] Milestone 2: Recruitment (apply, screening, test, interview, selection)
- [ ] Milestone 3: Internship (offer, onboarding, mentor, tasks, evaluation)
- [ ] Milestone 4: Advanced (video, chat, notifications, coding judge, skill gap, analytics, certificates)
- [ ] Milestone 5: Production (security, testing, Docker, deployment)

## Sprint 1: Foundation
- [x] Project folder + Git initialized
- [x] React + Vite frontend created (Tailwind, Axios, Redux Toolkit, React Router installed)
- [x] Spring Boot backend created (Spring Boot 4.1.1, Java 21, Maven)
- [x] PostgreSQL running in Docker
- [x] Backend connected to database
- [x] `/api/health` endpoint working (checks the database too)
- [x] Frontend calls backend successfully
- [x] Push project to GitHub
- [x] Flyway migrations set up
- [x] User + Role entities
- [x] Registration, Login, JWT (backend)
- [x] Role-protected API endpoints (RBAC): /api/student, /api/company, /api/mentor, /api/admin
- [ ] Login/Register pages and role-based dashboards (frontend)

## Next step
1. Create the GitHub repository and push this project.
2. Then: add Flyway and create the User and Role tables.
3. Build the login and register pages and role-based dashboards in React.

## How to run the project (every time)
1. Open **Docker Desktop** and wait for "Engine running".
2. Database: `docker compose -f docker/docker-compose.yml up -d` (from the project root).
3. Backend: `cd backend`, then `.\mvnw.cmd spring-boot:run` (runs on port 8081).
4. Frontend: `cd frontend`, `npm install` (first time only), then `npm run dev` (runs on port 5173).
5. Open http://localhost:5173. You should see "Backend: UP | Database: UP".

## Ports
- Frontend: 5173
- Backend: 8081 (8080 is used by a Windows service on Anand's machine)
- PostgreSQL: 5433 on the host (maps to 5432 inside Docker, to avoid clashing with a locally installed PostgreSQL)

## Notes for teammate
- Backend runs on port 8081 (port 8080 is taken by a Windows service on My machine). Frontend is on 5173.
- Database name/user: `internflow`. Local dev password: `internflow_dev` (development only, never use in production).
- The backend forces the UTC timezone in `BackendApplication.java`, because the Indian system timezone name "Asia/Calcutta" is rejected by PostgreSQL 16.
- Hibernate is set to `ddl-auto=validate`: tables are never created automatically. We will create them with Flyway migrations.
- Always run git commands from the project root (`InternFlow`), not from inside `frontend` or `backend`.
- Add updates about the project below this line.
- Repository: https://github.com/Anandgarg695/InternFlow (public). Never commit secrets; use environment variables.
- Daily routine: git pull before starting, git add . / git commit / git pull / git push when done.
- Database changes only through Flyway files in backend/src/main/resources/db/migration (V1__, V2__, ...). Never edit a migration that has been pushed; add a new one instead.
- JWT secret setup (required before the backend starts): copy backend/src/main/resources/application-local.properties.example to application-local.properties in the same folder and replace the value with a random string. Generate one in PowerShell:
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
That file is git-ignored. NEVER commit a real secret (the repo is public). In production use the JWT_SECRET environment variable.
- Public registration allows STUDENT, COMPANY, MENTOR only. Admin accounts are never self-registered.