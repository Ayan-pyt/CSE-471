# Feature #4: Skill Demand & Market Trend Analysis - Quick Reference

## What It Does

This feature analyzes synced third-party job postings and student data to show:

- Most requested technical skills
- Emerging skill trends
- Department-wise skill gaps
- Personal match score trends
- Applicant analytics for companies
- Placement and demand analytics for admins

---

## Main Code Paths

- [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)
- [backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js)
- [frontend/src/pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx)
- [frontend/src/pages/StudentInsights.jsx](frontend/src/pages/StudentInsights.jsx)
- [frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)

---

## Important Functions

| Function | Purpose |
|----------|---------|
| `buildSkillDemand()` | Counts how often each skill appears in internships |
| `getAdminDashboardAnalytics()` | Admin-wide placement and demand report |
| `getCompanyApplicantAnalytics()` | Company applicant analytics and demand by posting |
| `getStudentMatchTrends()` | Student application trend timeline |
| `getMarketSkillTrends()` | Market demand and department gap report |
| `getAdminSystemSnapshot()` | Admin system summary counts |

---

## API Endpoints

```
GET /api/analytics/admin/dashboard
GET /api/analytics/admin/snapshot
GET /api/analytics/company/applicants
GET /api/analytics/student/match-trends
GET /api/analytics/market-skill-trends
```

---

## Role Access

| Role | Access |
|------|--------|
| `system_admin` | Admin dashboard, snapshot, market trends |
| `university_admin` | Admin dashboard, snapshot, market trends |
| `student` | Match trends, market skill trends |
| `company` | Company applicant analytics |

---

## How Demand Is Calculated

1. Load synced external jobs first.
2. Read extracted `skills` from each job.
3. Normalize skill names to lowercase.
4. Count how many postings request each skill.
5. Sort descending by count.

Example:

```javascript
[
  { skill: 'react', count: 18 },
  { skill: 'node.js', count: 15 },
  { skill: 'mongodb', count: 11 }
]
```

---

## How Market Trend Gaps Are Calculated

1. Load all student profiles.
2. Group them by department.
3. Collect skills already present in each department.
4. Compare those skills to the top requested skills.
5. Return missing skills as the gap list.

---

## What Students See

On [frontend/src/pages/StudentInsights.jsx](frontend/src/pages/StudentInsights.jsx), students see:

- Top requested skills
- Emerging skills
- Department skill gaps
- Their own match history
- Verified skill badges

---

## What Admins See

On [frontend/src/pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx), admins see:

- Total internship postings
- Student placement ratio
- Department-wise placement performance
- Top in-demand skills
- Skill demand gaps
- Moderation and algorithm controls

---

## What Companies See

On [frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx), companies see:

- Total posts
- Total applicants
- Applicant counts by post
- Average match score by post
- Feedback and verification tools

---

## Example Output

```javascript
{
  totalInternshipPostings: 32,
  totalApplications: 185,
  selectedApplications: 41,
  studentPlacementRatio: 22.16,
  topInDemandSkills: [
    { skill: 'react', count: 18 },
    { skill: 'node.js', count: 15 }
  ],
  departmentSkillDemandGap: [
    {
      department: 'CSE',
      topMissingSkills: [
        { skill: 'react', count: 18 },
        { skill: 'typescript', count: 9 }
      ]
    }
  ]
}
```

---

## Why It Matters

This feature helps the platform answer questions like:

- What skills are employers asking for most?
- Which departments are behind market demand?
- How well is a student matching over time?
- Which postings attract the strongest applicants?

---

## One-line Summary

External job postings define demand, student profiles define supply, applications define match outcomes, and the analytics pages turn that data into trends.
