# InternFlow Progress

**Last updated:** 2026-11-04
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

## Doing now
- [ ] Admin dashboard: users, approvals and platform overview (branch `feature/admin`)

## Next (in this order)
1. Tasks, mentor feedback and evaluation.
2. Completion and certificates.
3. Theory round (written answers graded by the company).

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