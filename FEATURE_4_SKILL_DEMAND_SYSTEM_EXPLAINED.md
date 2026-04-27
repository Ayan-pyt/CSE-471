# Feature #4: Skill Demand & Market Trend Analysis - Complete Implementation Guide

## Overview

The **Skill Demand & Market Trend Analysis** feature helps university admins and students understand which skills are currently in demand in the market, which departments are most affected by skill gaps, and how student application trends compare over time. The data now comes from a third-party job market API first, then falls back to internship postings if the external feed is unavailable, while student profiles and applications still power the gap and trend analysis.

---

## How the Feature Works in Code

At the center of this feature is the analytics controller:

- [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)
- [backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js)
- [frontend/src/pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx)
- [frontend/src/pages/StudentInsights.jsx](frontend/src/pages/StudentInsights.jsx)
- [frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)

The feature works in three main layers:

1. Internship postings are scanned for required skills.
2. Student profiles are compared against those skills to find gaps.
3. Dashboard pages render the analytics for admins, students, and companies.

---

## 1. Core Skill Demand Engine

### File: [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)

The shared helper is `buildSkillDemand()`:

```javascript
const buildSkillDemand = (internships = []) => {
  const freq = new Map();
  for (const post of internships) {
    for (const req of post.requiredSkills || []) {
      const key = (req.skill || '').trim().toLowerCase();
      if (!key) continue;
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
};
```

### What it does

- Reads every internship posting from MongoDB.
- Looks at `requiredSkills` on each posting.
- Normalizes each skill to lowercase.
- Counts how many postings request each skill.
- Sorts the result by frequency, highest first.

### Why it matters

This is the data source for the market trend report. If 40 internships ask for React and 30 ask for Node.js, React becomes a higher-demand skill in the analytics.

---

## 2. Admin Dashboard Analytics

### Endpoint

```javascript
GET /api/analytics/admin/dashboard
```

### Route protection

```javascript
router.get('/admin/dashboard', protect, authorizeRoles('university_admin', 'system_admin'), getAdminDashboardAnalytics);
```

### What the controller returns

`getAdminDashboardAnalytics()` combines placement analytics and skill demand analysis:

- `totalInternshipPostings`
- `totalApplications`
- `selectedApplications`
- `studentPlacementRatio`
- `departmentPlacement`
- `topInDemandSkills`
- `emergingSkillTrends`
- `departmentSkillDemandGap`

### How it builds the report

1. Loads all internships, applications, and student profiles.
2. Counts selected applications.
3. Calculates placement ratio.
4. Groups students by department.
5. Compares student skills against current market demand.
6. Produces department-level missing skill reports.

### Important logic

```javascript
const skillDemand = buildSkillDemand(internships);
```

This gives the ranked list of the most frequently requested skills.

```javascript
const deptSkillGap = departmentPlacement.map((dept) => {
  const deptProfiles = profiles.filter((p) => (p.department || 'Unknown') === dept.department);
  const studentSkills = new Set(deptProfiles.flatMap((p) => p.skills || []).map((s) => s.toLowerCase()));
  const demandedSkills = skillDemand.slice(0, 20).filter((s) => !studentSkills.has(s.skill));
  return {
    department: dept.department,
    topMissingSkills: demandedSkills.slice(0, 5),
  };
});
```

This is the department-wise skill gap report used by admins.

---

## 3. Company Applicant Analytics

### Endpoint

```javascript
GET /api/analytics/company/applicants
```

### Route protection

```javascript
router.get('/company/applicants', protect, authorizeRoles('company'), getCompanyApplicantAnalytics);
```

### What it returns

- `totalPosts`
- `totalApplicants`
- `statusSummary`
- `byPost`
- `topRequestedSkills`

### Why companies use it

Companies can see which of their postings attract the most applicants and which skills are common across their own postings. That helps them understand whether their job requirements match the market.

### Key part

```javascript
const topSkills = buildSkillDemand(posts).slice(0, 10);
```

This gives the company the top skills across only their own internships.

---

## 4. Student Match Trends

### Endpoint

```javascript
GET /api/analytics/student/match-trends
```

### Route protection

```javascript
router.get('/student/match-trends', protect, authorizeRoles('student'), getStudentMatchTrends);
```

### What it returns

- `totalApplications`
- `avgMatchScore`
- `statusSummary`
- `trend`

### How it works

This endpoint reads the student’s own applications and returns a timeline-like trend:

```javascript
const trend = apps.map((a) => ({
  applicationId: a._id,
  title: a.internshipId?.title || 'Internship',
  appliedAt: a.appliedAt,
  matchScore: Number(a.matchScore || 0),
  recommendationScore: Number(a.recommendationScore || 0),
  status: a.status,
}));
```

That is what the student dashboard uses to show whether their matching performance is improving or declining over time.

---

## 5. Market Skill Trends

### Endpoint

```javascript
GET /api/analytics/market-skill-trends
```

### Route protection

```javascript
router.get('/market-skill-trends', protect, authorizeRoles('student', 'university_admin', 'system_admin'), getMarketSkillTrends);
```

### What it returns

- `mostRequestedTechnicalSkills`
- `emergingSkillTrends`
- `departmentWiseSkillDemandGap`

### How it works

The controller pulls external job market data first, then uses internship postings as a fallback:

```javascript
const externalJobs = await ExternalJobPost.find().lean();
const internships = await Internship.find().lean();
const profiles = await StudentProfile.find().lean();
```

Then it:

1. Builds the skill demand list from synced external jobs when available.
2. Falls back to internship postings when no external jobs have been synced yet.
3. Finds all departments represented by student profiles.
4. For each department, identifies which top-demand skills are missing.

### Gap analysis logic

```javascript
return {
  department,
  topMissingSkills: requested
    .slice(0, 20)
    .filter((skill) => !studentSkills.has(skill.skill))
    .slice(0, 5),
};
```

This is what powers the department-wise missing skill panels in the UI.

---

## 6. Frontend Rendering

### Student Insights Page

**File:** [frontend/src/pages/StudentInsights.jsx](frontend/src/pages/StudentInsights.jsx)

The student page loads four data sources:

```javascript
const [t, m, v, f] = await Promise.all([
  axios.get('/api/analytics/student/match-trends'),
  axios.get('/api/analytics/market-skill-trends'),
  axios.get('/api/skill-verification/my'),
  axios.get('/api/feedback/my'),
]);
```

The important trend sections are:

- Most requested technical skills
- Emerging skill trends
- Department-wise skill demand gap
- Personal application match trend

The UI then turns those datasets into bars, tags, and cards.

### Admin Dashboard

**File:** [frontend/src/pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx)

Admins see:

- Total internship postings
- Student placement ratio
- Department-wise placement performance
- Top in-demand skills
- Skill demand gaps
- Moderation tools and algorithm controls

That page is the main university-level view of market demand.

### Company Insights

**File:** [frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)

Companies see:

- Applicant analytics per posting
- Average match score per internship
- Their own applicant pool and performance trends

This helps them compare applicant quality against market demand.

---

## 7. Data Sources Used by the Feature

### Internship data

- Source: `Internship` collection
- Used for: required skills, titles, company IDs, department context

### Student profile data

- Source: `StudentProfile` collection
- Used for: department, skills, verified skills, CGPA

### Application data

- Source: `Application` collection
- Used for: match score, recommendation score, application status, timeline

---

## 8. Example Output Shape

### Admin market analytics

```javascript
{
  totalInternshipPostings: 32,
  totalApplications: 185,
  selectedApplications: 41,
  studentPlacementRatio: 22.16,
  departmentPlacement: [
    { department: 'CSE', total: 78, selected: 22, ratio: 28.21 }
  ],
  topInDemandSkills: [
    { skill: 'react', count: 18 },
    { skill: 'node.js', count: 15 }
  ],
  emergingSkillTrends: [ ... ],
  departmentSkillDemandGap: [ ... ]
}
```

### Student market analytics

```javascript
{
  mostRequestedTechnicalSkills: [ ... ],
  emergingSkillTrends: [ ... ],
  departmentWiseSkillDemandGap: [ ... ]
}
```

---

## 9. How the Feature Supports Academic Planning

This feature is not just reporting. It can be used to:

- Identify the most in-demand industry skills.
- Show which departments have the biggest skill gaps.
- Help university admins adjust curriculum priorities.
- Help students plan what to learn next.
- Help companies understand whether they are asking for skills that are too narrow or too broad.

---

## 10. Summary

The Skill Demand & Market Trend Analysis feature is implemented through the analytics controller and exposed through role-based API endpoints. It turns internship posting data into demand analytics, compares that demand with student skills, and renders the results in the admin and student dashboards.

In short:

- Internship postings define market demand.
- Student profiles define supply.
- Applications define match outcomes.
- Dashboards turn those inputs into actionable analytics.
