# InternFlow Progress

**Last updated:** 2026-11-06
**Repository:** https://github.com/Anandgarg695/InternFlow (public)
**How to run, setup, rules and fixes:** see [SETUP.md](SETUP.md)

## Done
- [x] Project setup: React frontend, Spring Boot backend, PostgreSQL in Docker, GitHub
- [x] Database migrations with Flyway
- [x] Register, login, JWT, roles (STUDENT, COMPANY, MENTOR, ADMIN)
- [x] Login and register pages, one dashboard per role
- [x] Student profile
- [x] Company profile
- [x] Internships: companies create, publish and close postings; students browse and search (branch `feature/internships`)
- [x] Applications: students apply and track status; companies shortlist or reject (branch `feature/applications`)
- [x] Screening tests: company builds a timed multiple-choice test, shortlisted students take it, scores shown to the company (branch `feature/screening`)
- [x] Interviews: company schedules interviews for shortlisted students (branch `feature interviews`)
- [x] Multiple hiring rounds: ordered test rounds per internship, company moves shortlisted students round by round (branch `feature/rounds`)
- [x] Interviews: company schedules interviews for shortlisted students; students confirm or ask to reschedule (branch `feature/interviews`)
- [x] Final selection and offers: company selects candidates, students accept or decline (branch `feature/offers`)
- [x] Onboarding and mentor assignment (branch `feature/onboarding`)
- [x] Tasks and mentor evaluation (branch `feature/tasks`)
- [x] Final evaluation, internship completion and certificates (branch `feature/completion`)
- [x] Admin dashboard: users, approvals and platform overview (branch `feature/admin`)
- [x] In-app notifications (branch `feature/notifications`)
- [x] Skill-gap engine and demo data (branch `feature/skillgap`)
- [x] Theory round: written answers graded by the company (branch `feature/theory-round`)

## Doing now
- [ ] Video interview integration.

## Next (in this order)
1. Advanced analytics & reporting for companies.
2. AI-assisted candidate shortlisting.

## Notes for teammate
- Add anything useful here: decisions, problems you hit, things to watch out for.
- Internship deadlines are dates in Indian time. A company needs a company name in its profile before it can publish.
- Application statuses: APPLIED, SHORTLISTED, REJECTED, WITHDRAWN. A withdrawn application is final (no re-apply). Students need a complete profile to apply.
- Screening tests: one per internship, multiple choice (4 options), timed. The server owns the clock (deadline saved at start, 15 seconds of grace on submit). Correct answers are never sent to students. A test is locked once any student has started it.
- Hiring rounds: each internship has ordered rounds (1 to 10) with one timed MCQ test each. Rounds must be created in order; only the last round can be deleted; a round locks once a student starts it. A shortlisted application has current_round (starts at 1). The company moves students forward manually, only after they submitted or timed out. Rounds without a test are allowed (used for interviews next).
- Interviews: one active interview per application (enforced by a partial unique index). The server refuses overlapping times for the same student across companies. Online interviews need an https link; times are stored in UTC and shown in the browser's time zone. Outcome and feedback are private to the company. Video is link-based for now (Meet/Zoom); embedded video calling comes later.
- Offers: application statuses now include OFFERED and SELECTED. Offers need a shortlisted applicant with no active interview, and are capped by the internship's openings (accepted plus pending). Accepting the last opening closes the internship automatically. Offers expire at the end of expires_on (Indian time); a once-a-minute job and every offer endpoint turn expired offers back into SHORTLISTED applications. Accepted offers cannot be withdrawn yet. Declining sets the application to WITHDRAWN.
- Placements: created automatically when a student accepts an offer (start = offer start date, end = start + internship duration in weeks). Placement status is ACTIVE for now; the phase (starts soon, ongoing, ended) is worked out from the dates in Indian time.
- Mentors: a company invites a mentor by email, and the mentor must accept (table mentor_links). Only accepted mentors can be assigned to interns. A mentor with active interns cannot be removed. Mentors see only an intern's name, email, internship and dates, never profile, scores or feedback. Known limitation: the invite endpoint reveals whether an email belongs to a mentor account (to harden later).
- Tasks: only the intern's currently assigned mentor can create, edit, delete or review tasks (a reassigned mentor gets 404). Due dates must fall inside the internship dates. Interns can submit only while the internship is running (late submissions are allowed and marked late). Review is approve (rating 1-5) or request changes (comments required); a resubmission clears the previous rating and comments. Tasks can be edited or deleted only before any submission.
- Completion: the assigned mentor writes the final evaluation after the end date (editable until completed). The company completes an internship only when it has ended, a mentor is assigned and has evaluated, and no submitted task awaits review. Completing issues a certificate (random code IF-XXXX-XXXX-XXXX, stored snapshot of names and dates) and locks the evaluation. Public page /verify/:code (endpoint /api/public/certificates/{code}) shows only code, student name, internship, company, dates and issue date. Not built yet: certificate revocation and rate limiting on verification.
- Admin: the first admin is created at startup from app.admin.email and app.admin.password in application-local.properties (only when no admin exists). New company accounts start unapproved and cannot publish internships until an admin approves them. A disabled account's token stops working at once (the JWT decoder checks the account on every request). An admin cannot disable themselves or the last active admin.
- One-week plan is in InternFlow_Remaining_Work.xlsx (sheet "One-week plan").
- Notifications: table notifications, API /api/notifications (list, unread-count, read, read-all) for any logged-in user. Other services create them with notifications.send(userId, title, message, "/internal/path") (injected with @Autowired). The bell polls every 30 seconds and after each page change (no WebSockets). Only internal paths are stored as links.
- Skill-gap & demo data: `SkillGapService` analyzes candidate skills against required skills, computing match percentages, matched skills, and learning recommendations. Endpoints `/api/student/skillgap/internship/{id}` and `/api/student/skillgap/scores` feed match badges and gap analysis directly into the student UI. `DemoDataSeeder` seeds comprehensive test data (students, companies, internships, screening tests, applications, and mentor link) on startup or via `POST /api/admin/seed-demo`.
- Theory rounds: `screening_tests.round_type` supports `MCQ` and `THEORY`. Theory rounds store open-ended questions (`theory_questions`) with customizable max scores. Candidates submit written responses (`theory_answers`) within the timed deadline; attempts remain in `SUBMITTED` state with `score = null` until the company grades each answer and awards points/feedback via `/company/internships/:id/rounds/:round/grade/:applicationId`. Candidates cannot be advanced to the next round until written answers are graded.
