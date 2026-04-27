# Module 3: Dashboard & Analytics System

## Overview
This module provides comprehensive analytics and dashboard features for university admins, companies, and students to monitor internship placements, track trends, and make data-driven decisions.

## Features

### 1. University Admin Dashboard
Admins can monitor:

#### Key Metrics
- **Total Internship Postings**: Count of all active/inactive internship listings
- **Student Placement Ratio**: (Selected Applications / Total Applications) × 100
- **Department-wise Placement Performance**: Breakdown by academic department
- **Top In-Demand Skills**: Skills most frequently required by companies
- **Emerging Skill Trends**: Trending skills analysis for curriculum planning

#### Detailed Analytics
```javascript
{
  totalInternshipPostings: Number,
  totalApplications: Number,
  selectedApplications: Number,
  studentPlacementRatio: Number,       // Percentage
  departmentPlacement: [
    {
      department: String,
      total: Number,                   // Total applications
      selected: Number,                // Selected applications
      ratio: Number                    // Placement ratio %
    }
  ],
  topInDemandSkills: [
    { skill: String, count: Number }
  ],
  emergingSkillTrends: [
    { skill: String, count: Number }
  ],
  departmentSkillDemandGap: [
    {
      department: String,
      topMissingSkills: [
        { skill: String, count: Number }
      ]
    }
  ]
}
```

### 2. Company Dashboard
Companies can view:

#### Application Analytics
- **Total Posted Internships**: Count of job postings
- **Total Applicants**: Overall application count
- **Status Summary**: Breakdown by status (Pending, Shortlisted, Selected, Rejected)
- **Per-Posting Analytics**:
  - Number of applicants
  - Shortlisted count
  - Selected count
  - Average match score

#### Performance Metrics
```javascript
{
  totalPosts: Number,
  totalApplicants: Number,
  statusSummary: [
    { status: String, count: Number }
  ],
  byPost: [
    {
      internshipId: ObjectId,
      title: String,
      applicants: Number,
      shortlisted: Number,
      selected: Number,
      avgMatch: Number
    }
  ],
  topRequestedSkills: [
    { skill: String, count: Number }
  ]
}
```

### 3. Student Dashboard
Students can track:

#### Personal Match Trends
- **Total Applications**: Count of internship applications
- **Average Match Score**: Mean of all match scores
- **Status Summary**: Breakdown by status
- **Application Timeline**: Detailed trend data with match scores

#### Trend Data
```javascript
{
  totalApplications: Number,
  avgMatchScore: Number,
  statusSummary: [
    { status: String, count: Number }
  ],
  trend: [
    {
      applicationId: ObjectId,
      title: String,
      appliedAt: Date,
      matchScore: Number,
      recommendationScore: Number,
      status: String
    }
  ]
}
```

## File Structure

```
backend/
├── controllers/
│   └── AnalyticsController.js        # Analytics business logic
├── routes/
│   └── analyticsRoutes.js            # Analytics endpoints
└── models/
    ├── StudentProfile.js
    ├── Internship.js
    └── Application.js
```

## API Endpoints

### Admin Endpoints

#### GET `/api/analytics/admin/dashboard`
Get complete admin dashboard analytics

**Headers:** Authentication required, Admin role

**Response:**
```json
{
  "totalInternshipPostings": 45,
  "totalApplications": 892,
  "selectedApplications": 128,
  "studentPlacementRatio": 14.35,
  "departmentPlacement": [...],
  "topInDemandSkills": [...],
  "emergingSkillTrends": [...],
  "departmentSkillDemandGap": [...]
}
```

### Company Endpoints

#### GET `/api/analytics/company/applicants`
Get applicant analytics for company's posted internships

**Headers:** Authentication required, Company role

**Response:**
```json
{
  "totalPosts": 8,
  "totalApplicants": 342,
  "statusSummary": [...],
  "byPost": [...],
  "topRequestedSkills": [...]
}
```

### Student Endpoints

#### GET `/api/analytics/student/match-trends`
Get personal match trends and application history

**Headers:** Authentication required, Student role

**Response:**
```json
{
  "totalApplications": 12,
  "avgMatchScore": 75.4,
  "statusSummary": [...],
  "trend": [...]
}
```

## Key Functionalities

### 1. Skill Demand Analysis
- Aggregates required skills from all internship postings
- Counts frequency of each skill
- Sorts by demand (most requested first)
- Identifies market trends

### 2. Placement Ratio Calculation
```
Placement Ratio = (Selected Applications / Total Applications) × 100
```

### 3. Department Performance Tracking
- Groups applications by department
- Calculates placement ratio per department
- Identifies top and bottom performing departments
- Enables curriculum planning

### 4. Skill Gap Analysis
- Compares market demanded skills vs. student skills
- Identifies missing competencies per department
- Provides data for academic planning
- Suggests curriculum improvements

### 5. Trend Visualization
- Stores historical match scores
- Tracks application status changes
- Enables timeline view of progress
- Supports trend analysis

## Data Aggregation

### Admin Dashboard Aggregation
1. Fetches all internship postings
2. Fetches all applications
3. Fetches all student profiles
4. Groups applications by department
5. Extracts and counts skills
6. Calculates ratios and percentages

### Company Analytics Aggregation
1. Filters internships by company
2. Fetches related applications
3. Calculates status breakdown
4. Computes average match scores
5. Extracts top skills

### Student Trends Aggregation
1. Filters applications by student
2. Fetches internship details
3. Calculates average scores
4. Compiles application history
5. Stores timeline data

## Performance Optimization

### Query Optimization
- Uses `.lean()` for read-only operations
- Implements `Promise.all()` for parallel queries
- Filters before calculations when possible
- Indexes on frequently queried fields

### Caching Strategies
- Admin dashboard calculated on-demand
- Company metrics cached per posting
- Student trends stored with applications
- Periodic refresh for trend data

## Data Insights

### For University Administration
- Identifies high-demand skills for curriculum
- Tracks department-wise performance
- Monitors overall placement rates
- Supports strategic planning

### For Companies
- Understands applicant pool quality
- Tracks hiring effectiveness
- Identifies skill gaps in candidates
- Optimizes job descriptions

### For Students
- Tracks application progress
- Identifies weak skill areas
- Compares match scores over time
- Plans skill development

## Integration Points

### With Module 1 (Student Profile)
- Uses student profile data (CGPA, department, skills)
- Retrieves certified skills information
- Accesses GitHub profile insights

### With Module 2 (Skill Matching)
- Uses match scores from matching engine
- Analyzes skill gap reports
- Incorporates recommendation scores

### With Module 4 (Notifications)
- Sends analytics insights to users
- Notifies about trending skills
- Alerts on placement milestones

## Error Handling

- Returns 500 if database queries fail
- Handles empty result sets gracefully
- Validates user permissions
- Provides descriptive error messages

## Security

- Requires authentication for all endpoints
- Role-based access control:
  - Admins: Full access to all analytics
  - Companies: Only their own data
  - Students: Only their own data
- No sensitive personal data in aggregations
- Anonymized statistics for trends

## Future Enhancements

- Real-time dashboard updates
- Custom date range filtering
- Export analytics to CSV/PDF
- Predictive analytics using ML
- Benchmarking against industry standards
- Custom metrics configuration
- Historical trend comparison
