# Feature #4: Skill Demand & Market Trend Analysis - Visual Architecture

## System Flow

```
┌──────────────────────────────────────────────────────────────┐
│             SKILL DEMAND & MARKET TREND ANALYSIS             │
└──────────────────────────────────────────────────────────────┘

   Internship postings        Student profiles          Applications
          │                         │                       │
          │                         │                       │
          ▼                         ▼                       ▼
   requiredSkills[]            department + skills     matchScore + status
          │                         │                       │
          └──────────────┬──────────┴──────────┬───────────┘
                         ▼                     ▼
              analyticsController         analyticsController
                         │                     │
                         ├─ buildSkillDemand() ┤
                         ├─ department gap     ┤
                         ├─ match trends       ┤
                         └─ role-based report  ┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
      Admin Dashboard        Student Insights       Company Insights
```

---

## Core Data Processing Pipeline

### 1. Skill demand extraction

```
Internship.find().lean()
        │
        ▼
Build frequency map from requiredSkills
        │
        ▼
Sort by count descending
        │
        ▼
Top in-demand skill list
```

### 2. Department gap analysis

```
StudentProfile.find().lean()
        │
        ▼
Group students by department
        │
        ▼
Compare department skills against top demanded skills
        │
        ▼
Department-wise missing skill report
```

### 3. Personal match trend analysis

```
Application.find({ studentId })
        │
        ▼
Collect matchScore + recommendationScore over time
        │
        ▼
Sort by appliedAt
        │
        ▼
Trend timeline for student dashboard
```

---

## API Architecture

### Admin routes

```
GET /api/analytics/admin/dashboard
GET /api/analytics/admin/snapshot
```

### Student routes

```
GET /api/analytics/student/match-trends
GET /api/analytics/market-skill-trends
```

### Company routes

```
GET /api/analytics/company/applicants
```

### Route protections

- Admin dashboard and snapshot: `university_admin`, `system_admin`
- Student match trends: `student`
- Market skill trends: `student`, `university_admin`, `system_admin`
- Company applicant analytics: `company`

---

## Dashboard Rendering Flow

### Admin Dashboard

```
[backend/controllers/analyticsController.js]
        │
        ▼
getAdminDashboardAnalytics()
        │
        ├─ totalInternshipPostings
        ├─ studentPlacementRatio
        ├─ departmentPlacement
        ├─ topInDemandSkills
        └─ departmentSkillDemandGap
        │
        ▼
[frontend/src/pages/AdminDashboard.jsx]
        │
        ├─ metric cards
        ├─ department-wise placement performance
        ├─ top in-demand skills
        ├─ moderation queue
        └─ algorithm weight controls
```

### Student Insights

```
[backend/controllers/analyticsController.js]
        │
        ├─ getStudentMatchTrends()
        └─ getMarketSkillTrends()
        │
        ▼
[frontend/src/pages/StudentInsights.jsx]
        │
        ├─ most requested technical skills
        ├─ emerging skill trends
        ├─ department-wise skill demand gap
        ├─ application match trend
        └─ verified skill badges
```

### Company Insights

```
[backend/controllers/analyticsController.js]
        │
        └─ getCompanyApplicantAnalytics()
        │
        ▼
[frontend/src/pages/CompanyInsights.jsx]
        │
        ├─ total postings
        ├─ total applicants
        ├─ applicants by posting
        ├─ average match score
        └─ company-side feedback tools
```

---

## Data Model Relationships

```
User (Student)
   │
   ├─ owns → StudentProfile
   │           ├─ department
   │           ├─ skills[]
   │           └─ verifiedSkills[]
   │
   └─ creates → Application
                 ├─ matchScore
                 ├─ recommendationScore
                 ├─ status
                 └─ appliedAt

User (Company)
   │
   └─ owns → Internship
              ├─ requiredSkills[]
              ├─ minCGPA
              ├─ department
              └─ title
```

The analytics feature reads from these collections but does not mutate them. It is a reporting layer built on top of core internship and application data.

---

## What Each Visualization Means

### Top In-demand Skills

This shows which skills appear most often across all internship postings. A higher count means more employers are asking for that skill.

### Emerging Skill Trends

This is the same demand data, usually shown as a broader list. It is useful for spotting newer or growing skills that may not be in the top 10 yet.

### Department-wise Skill Demand Gap

This compares student skills in each department against the market demand list. It highlights what departments are missing compared to current internship requirements.

### Match Trend

This shows a student's application history with match scores and recommendation scores so they can understand whether their profile is improving over time.

---

## Logic Snapshot

### Skill demand

```
count(skill) across internship.requiredSkills
```

### Department gap

```
skills requested by internships
minus
skills already present in student profiles for that department
```

### Student trend

```
application history ordered by appliedAt
with matchScore and recommendationScore
```

---

## Security and Access Control

The analytics data is separated by role:

- Admins can see system-wide placement and demand data.
- Students can see personal trend analytics and market demand.
- Companies can see applicant analytics for their own postings.

This ensures each role only sees the data it needs.

---

## Future Enhancement Points

Possible next steps:

- Add charts for skill demand over time.
- Break demand down by department and company type.
- Track trend changes month by month instead of snapshot only.
- Show department-specific curriculum suggestions.
- Use historical postings to detect rising and falling skills.
- Add export/download support for reports.

---

## Summary

The architecture is simple and efficient:

- Internship data supplies demand.
- Student data supplies supply.
- Applications supply match history.
- Controllers aggregate it.
- Frontend pages present it.

That is how the skill demand and market trend feature is working in code.
