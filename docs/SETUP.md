# InternFlow Setup Guide

Changes rarely. Update it only when something about running or working on the project changes.

## Run the project (every time)
1. Open **Docker Desktop** and wait for "Engine running".
2. Database (from the project root): `docker compose -f docker/docker-compose.yml up -d`
3. Backend: `cd backend`, then `.\mvnw.cmd spring-boot:run`
   - After many Java changes or switching branches, use `.\mvnw.cmd clean spring-boot:run`.
4. Frontend: `cd frontend`, `npm install` (first time only), then `npm run dev`
5. Open http://localhost:5173. The home page should show "Backend: UP | Database: UP".

## First-time setup for a new teammate
1. Install Git, Node.js (LTS), JDK 21 or newer, Docker Desktop and VS Code.
2. Set the Git identity:
   `git config --global user.name "Name"` and `git config --global user.email "email"`
3. Clone: `git clone https://github.com/Anandgarg695/InternFlow.git`
4. Create the JWT secret file (the backend will not start without it):
   - Copy `backend/src/main/resources/application-local.properties.example` to `application-local.properties` in the same folder.
   - Replace the placeholder after `app.jwt.secret=` with a random string. Generate one in PowerShell:
```
     $bytes = New-Object byte[] 48
     [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
     [Convert]::ToBase64String($bytes)
```
   - This file is git-ignored. Never commit it.
5. Follow "Run the project" above.

## Ports and local settings
- Frontend: 5173
- Backend: 8081 (port 8080 is used by a Windows service on Anand's machine)
- PostgreSQL: 5433 on your computer (maps to 5432 inside Docker, to avoid clashing with a locally installed PostgreSQL)
- Database name and user: `internflow`. Local password: `internflow_dev` (development only, never use in production).

## Team workflow
1. Never commit directly to `main`.
2. Start a feature: `git checkout main`, `git pull`, `git checkout -b feature/name`.
3. Commit small and often. Push the branch: `git push -u origin feature/name`.
4. Open a Pull Request on GitHub, ask the other person to look, merge, delete the branch.
5. Sync: `git checkout main` and `git pull`.
6. Run git commands from the project root (`InternFlow`), not from inside `frontend` or `backend`.
7. Split work so you are not editing the same files at the same time.

## Rules
- **Secrets:** the repository is public. Never commit real secrets. Use `application-local.properties` (ignored) locally and environment variables (`JWT_SECRET`, `DB_PASSWORD`) in production.
- **Database changes:** only through Flyway files in `backend/src/main/resources/db/migration`, named `V1__`, `V2__`, and so on. Never edit a migration that has been pushed; add a new one. Look at the folder for the highest number and add 1. If you are both working at once, tell each other which number you are taking.
- **Hibernate** is set to `ddl-auto=validate`, so it never creates or changes tables by itself.
- **Security:** the backend enforces access. Frontend route guards are only for user experience. The user id always comes from the token, never from the request.
- **Public registration** allows STUDENT, COMPANY and MENTOR only. Admin accounts are never self-registered.
- **Time zone:** the backend forces UTC in `BackendApplication.java`, because the Indian system name "Asia/Calcutta" is rejected by PostgreSQL 16.

## Where to find things
- API endpoints: the `*Controller.java` files in `backend/src/main/java/com/internflow/`
- Database tables: the files in `backend/src/main/resources/db/migration/`
- Frontend pages and routes: `frontend/src/App.jsx` and `frontend/src/pages/`

## Known issues and fixes
- **"Port already in use" on 8080:** that is why the backend uses 8081.
- **"password authentication failed" for the database:** another PostgreSQL on Windows owns port 5432. Our container uses 5433.
- **"Invalid method Code length 0" or other strange class errors:** stale compiled files. Stop the backend, then run `.\mvnw.cmd clean spring-boot:run`.
- **"No migrations found":** the SQL file must be in `backend/src/main/resources/db/migration` and named like `V5__description.sql` (capital V, two underscores).
- **"JWT secret is missing or too short":** create `application-local.properties` (see first-time setup, step 4).
- **Backend cannot reach the database:** Docker Desktop must be running and `internflow-db` must be up (`docker ps`).
- **PowerShell test says `HTTP 0`:** the request was never sent. Usually the backend is not running, or a variable from an earlier terminal is missing.