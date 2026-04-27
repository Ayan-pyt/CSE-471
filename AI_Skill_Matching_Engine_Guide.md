# AI-Based Skill Matching Engine Guide

## Short Answer: Is It Fully Implemented?

Yes, the core feature is implemented end-to-end in the current codebase:

- Student skills are compared against internship requirements using weighted skills.
- Match percentage is calculated using the required formula.
- Candidates are ranked for company review using a smart recommendation score.
- The recommendation score now includes an Affinda-backed NLP signal from uploaded CV analysis.
- Skill gap detection and learning recommendations are returned.
- The frontend shows match score, gap info, ranking, and template-based posting flows.

It is not a research-grade recommender system, though. The matching is exact-string based after normalization, and the learning recommendations are heuristic/static. There is no background job or ML model. The system is still correct for the module requirement.

## Formula Used

The engine uses this formula:

$$
Match\ Score = \left(\frac{\sum Matched\ Skill\ Weights}{Total\ Required\ Skill\ Weights}\right) \times 100
$$

Where:
- `Matched Skill Weights` = weights of required skills that the student already has.
- `Total Required Skill Weights` = sum of all weights in the internship posting.

A second value is also calculated:
- `recommendationScore` = a blended score using match score and CGPA, used for ranking.

The current implementation also adds an NLP boost derived from Affinda CV extraction stored on the student profile.

## High-Level Flow

1. Company creates an internship posting with weighted required skills.
2. Student profile stores their skills and CGPA.
3. When a student searches internships, the backend compares profile skills with each posting.
4. The backend returns match score and skill gap report.
5. When the student applies, the application stores a snapshot of the score and gap report.
6. Company views applications for a posting and candidates are ranked.
7. Company can auto-shortlist top candidates.
8. Company can save a posting as a reusable template and recreate new posts from it.

## Where The Logic Is Implemented

### 1. Matching engine

File: [backend/utils/matchingEngine.js](backend/utils/matchingEngine.js)

This is the main logic for the feature.

What it does:
- Normalizes skills by trimming and lowercasing.
- Removes duplicates from student skills.
- Compares required skills with student skills.
- Sums matched weights.
- Computes match score.
- Builds a skill gap report.
- Attaches learning recommendations for missing skills.
- Calculates a recommendation score for ranking.
- Adds a semantic bonus from cached Affinda CV skills when available.

Important functions:
- `calculateMatchInsights(...)`
- `recommendationForSkill(...)`

The static learning paths are stored in the `LEARNING_PATHS` object at the top of this file.

### 2. Internship search and scoring

File: [backend/controllers/internshipController.js](backend/controllers/internshipController.js)

The search endpoint is upgraded here.

Important parts:
- `searchInternships` fetches internships by filters.
- If the requester is a student, it loads the student profile.
- For each internship, it calls `calculateMatchInsights(...)`.
- Results are sorted by `recommendationScore`.

This is where the student sees the AI-based ranking in the internship list.

### 3. Application submit and ranking data

File: [backend/controllers/applicationController.js](backend/controllers/applicationController.js)

Important parts:
- `submitApplication` computes match info at the time of apply.
- It stores:
  - `matchScore`
  - `recommendationScore`
  - `cgpaAtApply`
  - `skillGapReport`

Why this matters:
- The application keeps a snapshot of the computed score.
- Even if the student later edits their profile, old application data still has the original values.

### 4. Candidate ranking for companies

File: [backend/controllers/applicationController.js](backend/controllers/applicationController.js)

The candidate ranking logic is in:
- `getApplicationsByInternship`

What happens there:
- It loads the internship.
- It loads all applications for that internship.
- It fetches student profiles for all applicants.
- It recalculates match and recommendation scores.
- It includes cached CV skills parsed by Affinda when available.
- It sorts candidates by:
  1. `recommendationScore`
  2. `matchScore`
  3. `cgpaAtApply`
- It adds a `rank` value to each applicant.

This is the ranking logic the company sees.

### 5. Auto-shortlisting

File: [backend/controllers/applicationController.js](backend/controllers/applicationController.js)

The shortcut action is:
- `autoShortlistCandidates`

What it does:
- Takes a top N limit.
- Takes a minimum recommendation score.
- Finds the best applicants.
- Uses the same Affinda-backed NLP boost as the ranking view.
- Updates their application status to `Shortlisted`.

### 6. Template system

File: [backend/controllers/internshipController.js](backend/controllers/internshipController.js)

Template-related functions:
- `createTemplate`
- `getMyTemplates`
- `saveInternshipAsTemplate`
- `createPostFromTemplate`
- `duplicateInternship`

What this gives companies:
- Save reusable requirement structures.
- Reuse old internship patterns.
- Create new posts from templates.
- Duplicate a previous internship quickly.

### 7. Backend routes

File: [backend/routes/internshipRoutes.js](backend/routes/internshipRoutes.js)
File: [backend/routes/applicationRoutes.js](backend/routes/applicationRoutes.js)

These files connect the controllers to endpoints.

Internship routes include:
- `/search`
- `/template/company`
- `/template`
- `/template/:id/create-post`
- `/:id/save-template`
- `/:id/duplicate`

Application routes include:
- `/my`
- `/internship/:id`
- `/internship/:id/auto-shortlist`
- `/:id/status`

### 8. Schema fields used for this feature

File: [backend/models/Application.js](backend/models/Application.js)
File: [backend/models/InternshipTemplate.js](backend/models/InternshipTemplate.js)

Application model stores:
- `matchScore`
- `recommendationScore`
- `cgpaAtApply`
- `skillGapReport`

Template model stores:
- `templateName`
- `title`
- `description`
- `minCGPA`
- `department`
- `requiredSkills`
- `sourceInternshipId`

## Frontend Where You Can See It

### 1. Internship search page

File: [frontend/src/pages/InternshipSearch.jsx](frontend/src/pages/InternshipSearch.jsx)

What the student sees:
- internship cards
- skill tags
- AI match score
- smart recommendation score
- missing skills and learning suggestions
- apply button

This page consumes the backend `matchInsights` returned by `searchInternships`.

### 2. My applications page

File: [frontend/src/pages/MyApplications.jsx](frontend/src/pages/MyApplications.jsx)

What the student sees:
- stored match score
- recommendation score
- missing competencies
- status bar

This page uses the application snapshot saved in the backend.

### 3. Company dashboard

File: [frontend/src/pages/CompanyDashboard.jsx](frontend/src/pages/CompanyDashboard.jsx)

What the company sees:
- posting form with weighted skill inputs
- template saving and reuse
- candidate ranking panel
- smart score display
- skill-gap diagnostics
- auto-shortlist controls
- status updates

### 4. Styling

File: [frontend/src/index.css](frontend/src/index.css)

Custom UI pieces added for this feature:
- `match-panel`
- `score-bar-track`
- `score-bar-fill`
- `rank-pill`
- `ranking-card`
- `metric-label`
- `metric-note`

## Data Flow Explained

### Student search flow

1. Frontend calls `/api/internship/search`.
2. Backend loads internships.
3. Backend loads student profile using `StudentProfile`.
4. Backend compares student skills with required skills.
5. Backend returns match score + skill gap report.
6. Frontend displays sorted cards.

### Apply flow

1. Student clicks Apply.
2. Frontend sends `POST /api/application`.
3. Backend loads internship and student profile.
4. Backend calculates match score again.
5. Backend stores the snapshot in the application document.

### Company ranking flow

1. Company opens candidate panel.
2. Frontend calls `/api/application/internship/:id`.
3. Backend loads all applications and student profiles.
4. Backend recalculates scores and sorts candidates.
5. Frontend displays ranked cards with scores and gap report.

### Template flow

1. Company saves a post as a template.
2. Template is stored in `InternshipTemplate`.
3. Company can later load templates and create new postings from them.

## What Is Exact And What Is Heuristic

Exact and implemented:
- Match score formula.
- Weighted skill sum.
- Candidate sorting.
- Skill gap detection.
- Template storage/reuse.

Heuristic or simple logic:
- Learning recommendations are based on a static map.
- Ranking blends CGPA with skill fit using fixed weights.
- Skill matching is exact normalized string matching, not semantic matching.

## Viva Prep: Questions You Can Be Asked

### Core concept questions

1. What is the purpose of the AI-based skill matching engine?
2. How is the match score calculated?
3. Why are skill weights used instead of simple skill counts?
4. What is the difference between `matchScore` and `recommendationScore`?
5. Why do we need a skill gap report?

### Logic questions

6. Where is the matching formula implemented?
7. Why do you normalize skill strings before comparison?
8. What happens if a student has duplicate skills in their profile?
9. Why is CGPA included in ranking?
10. Why is ranking sorted by recommendation score first and CGPA later?

### Backend architecture questions

11. Which file contains the shared matching algorithm?
12. Which controller calculates scores on application submit?
13. Which controller returns ranked candidates to the company?
14. Where is application status updated?
15. Where are template endpoints defined?

### Data model questions

16. Why did you add `matchScore` to the Application model?
17. Why did you store `skillGapReport` in the application document?
18. What is stored in the InternshipTemplate model?
19. Why do required skills use objects instead of plain strings?
20. How is `weight` validated in the schema?

### Frontend questions

21. Which page shows internship match percentage to students?
22. Which page shows ranked applicants to companies?
23. Where is the progress bar for match score rendered?
24. How does the company save a posting as a template from the UI?
25. Where is the reusable template used to create a new post?

### Limitations and improvement questions

26. Is this a real ML model?
27. Does the system understand synonyms semantically?
28. How would you improve matching quality?
29. How would you make learning recommendations smarter?
30. How would you support ranking by multiple departments or more criteria?

## Best Viva Answers In Simple Words

### If asked: Why is this called AI-based?

Because the system automatically evaluates student fit against internship requirements, computes a score, detects gaps, and ranks candidates without manual intervention. It is rule-based rather than ML-based, but it still performs intelligent automated matching.

### If asked: Why are weights important?

Because not all skills matter equally. For example, React may be more important than Git for a frontend internship, so the system gives React a higher weight.

### If asked: Why store gap reports in applications?

So the company and student can later see why the candidate matched or missed, even after the profile changes.

### If asked: How do templates help?

They reduce repetitive posting work. A company can reuse an old internship structure and quickly create a new vacancy with the same pattern.

## Important Code Locations To Remember

- Matching algorithm: [backend/utils/matchingEngine.js](backend/utils/matchingEngine.js)
- Internship search scoring: [backend/controllers/internshipController.js](backend/controllers/internshipController.js)
- Application scoring and ranking: [backend/controllers/applicationController.js](backend/controllers/applicationController.js)
- Template routes: [backend/routes/internshipRoutes.js](backend/routes/internshipRoutes.js)
- Ranking routes: [backend/routes/applicationRoutes.js](backend/routes/applicationRoutes.js)
- Student match UI: [frontend/src/pages/InternshipSearch.jsx](frontend/src/pages/InternshipSearch.jsx)
- Application history UI: [frontend/src/pages/MyApplications.jsx](frontend/src/pages/MyApplications.jsx)
- Company ranking/template UI: [frontend/src/pages/CompanyDashboard.jsx](frontend/src/pages/CompanyDashboard.jsx)

## Final Assessment

For Module 2, this feature is implemented well enough to demonstrate in a viva. The algorithm, ranking, gap report, and template workflow are all present in the codebase and visible in the UI.

If you want to present it strongly in viva, emphasize these three points:

1. Weighted matching gives more realistic scoring than plain skill checks.
2. Skill gap detection makes the system actionable, not just descriptive.
3. Candidate ranking and templates make the system useful for real company workflows.
