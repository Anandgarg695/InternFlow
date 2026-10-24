# InternFlow Progress

**Last updated:** 2026-10-24
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

## Doing now
- [ ] Final selection and offers: company selects candidates, students accept or decline (branch `feature/offers`)

## Next (in this order)
1. Final selection and offer letters,
2. Theory round (written answers graded by the company)
3. Onboarding, mentor, tasks, evaluation, then the existing items.

## Notes for teammate
- Add anything useful here: decisions, problems you hit, things to watch out for.
- Internship deadlines are dates in Indian time. A company needs a company name in its profile before it can publish.
- Application statuses: APPLIED, SHORTLISTED, REJECTED, WITHDRAWN. A withdrawn application is final (no re-apply). Students need a complete profile to apply.
- Screening tests: one per internship, multiple choice (4 options), timed. The server owns the clock (deadline saved at start, 15 seconds of grace on submit). Correct answers are never sent to students. A test is locked once any student has started it.
- Hiring rounds: each internship has ordered rounds (1 to 10) with one timed MCQ test each. Rounds must be created in order; only the last round can be deleted; a round locks once a student starts it. A shortlisted application has current_round (starts at 1). The company moves students forward manually, only after they submitted or timed out. Rounds without a test are allowed (used for interviews next).
- Interviews: one active interview per application (enforced by a partial unique index). The server refuses overlapping times for the same student across companies. Online interviews need an https link; times are stored in UTC and shown in the browser's time zone. Outcome and feedback are private to the company. Video is link-based for now (Meet/Zoom); embedded video calling comes later.