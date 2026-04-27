# IntelliMatch Feature Codebase Mapping

## Overview
This document maps all backend, frontend, and configuration files related to the 4 core features of the IntelliMatch system.

---

## 📋 Feature 1: Internship Search & Application System

**Purpose**: Enable students to search and browse internship postings from companies, submit applications, track application status, and manage timeline events.

### Backend Files

#### Controllers
- **[backend/controllers/applicationController.js](backend/controllers/applicationController.js)**
  - `submitApplication()` - POST /api/application
  - `getStudentApplications()` - GET /api/application/student/:id
  - `getMyApplications()` - GET /api/application/my
  - `getApplicationsByInternship()` - GET /api/application/internship/:id
  - Application timeline management
  - Match score calculation and storage

- **[backend/controllers/internshipController.js](backend/controllers/internshipController.js)**
  - `createInternship()` - POST /api/internship
  - `getInternships()` - GET /api/internship (search, filter, pagination)
  - `updateInternship()` - PUT /api/internship/:id
  - `deleteInternship()` - DELETE /api/internship/:id
  - Template management for reusable postings

#### Models
- **[backend/models/Internship.js](backend/models/Internship.js)**
  - Schema: companyId, title, description, deadline, minCGPA, department, requiredSkills[]

- **[backend/models/Application.js](backend/models/Application.js)**
  - Schema: studentId, internshipId, status (Pending, Shortlisted, Selected, Rejected)
  - Timeline events, match scores, skill gap reports
  - Timestamps for application tracking

- **[backend/models/InternshipTemplate.js](backend/models/InternshipTemplate.js)**
  - Reusable internship templates for companies
  - Saves common skill requirements and descriptions

#### Routes
- **[backend/routes/applicationRoutes.js](backend/routes/applicationRoutes.js)**
  - POST /api/application - Submit application
  - GET /api/application/my - Get my applications
  - GET /api/application/student/:id - Get student's applications
  - GET /api/application/internship/:id - Get applications for posting

- **[backend/routes/internshipRoutes.js](backend/routes/internshipRoutes.js)**
  - POST /api/internship - Create internship posting
  - GET /api/internship/search - Search internships
  - GET /api/internship/:id - Get internship details
  - PUT /api/internship/:id - Update internship
  - DELETE /api/internship/:id - Delete internship
  - POST /api/internship/template - Create template
  - GET /api/internship/template/company - Get templates

#### Utilities
- **[backend/utils/applicationTimeline.js](backend/utils/applicationTimeline.js)**
  - `appendTimelineEvent()` - Track application status changes
  - `mapStatusToStage()` - Map application status to timeline stages

### Frontend Files

#### Pages
- **[frontend/src/pages/InternshipSearch.jsx](frontend/src/pages/InternshipSearch.jsx)**
  - Browse all internships
  - Filter by: company name, skills, department, deadline
  - Apply to internships (POST /api/application)
  - Display match score and skill gaps
  - Navigation: For students

- **[frontend/src/pages/MyApplications.jsx](frontend/src/pages/MyApplications.jsx)**
  - View all submitted applications
  - Display application status: Pending, Shortlisted, Selected, Rejected
  - Show match score, recommendation score, endorsement badge
  - Track skill gaps (missing competencies)
  - Application timeline visualization
  - Navigation: For students

- **[frontend/src/pages/CompanyDashboard.jsx](frontend/src/pages/CompanyDashboard.jsx)**
  - **Posting Section**:
    - Create new internship postings
    - Edit existing postings
    - Delete postings
    - Save postings as templates
    - Weighted skill requirements
  - **Application Review Section**:
    - View applicants for each posting
    - Rank candidates by match and recommendation score
    - Quick stats: total applicants, status breakdown
    - Export data
  - Navigation: For companies

#### Components
- **[frontend/src/components/Sidebar.jsx](frontend/src/components/Sidebar.jsx)**
  - Navigation sidebar (reusable across pages)
  - Role-based links for students, companies, admins

#### Utilities
- **[frontend/src/utils/skillBadge.js](frontend/src/utils/skillBadge.js)**
  - Badge level calculations (Gold, Silver, Bronze)
  - Visual metadata for badges

---

## 🎯 Feature 2: Candidate Ranking & Shortlisting

**Purpose**: Intelligently rank candidates based on skill match, CGPA, and verified credentials. Enable companies to auto-shortlist top candidates.

### Backend Files

#### Controllers
- **[backend/controllers/applicationController.js](backend/controllers/applicationController.js)** (Extended)
  - `getApplicationsByInternship()` - Returns ranked candidates
  - `autoShortlistCandidates()` - POST /api/application/internship/:id/auto-shortlist
  - Ranking logic: by recommendation score, then match score, then CGPA
  - Adds rank field to each application

#### Utilities
- **[backend/utils/matchingEngine.js](backend/utils/matchingEngine.js)** ⭐ CORE LOGIC
  - `calculateMatchInsights()` - Main ranking algorithm
  - **Match Score Formula**:
    $$Match\ Score = \left(\frac{\sum Matched\ Skill\ Weights}{Total\ Required\ Skill\ Weights}\right) \times 100$$
  - **Recommendation Score**: Blended score using:
    - Match Score (75% weight by default)
    - CGPA (25% weight by default)
    - NLP CV insights (Affinda boost)
    - Verified skill badges (additional weight)
  - Skill normalization (lowercase, trim)
  - Learning path recommendations for missing skills
  - Handles:
    - Self-reported skills (student input)
    - Verified skills (admin/company verified, badge-weighted)
    - NLP extracted skills (from CV via Affinda)
    - Required skills from internship posting

- **[backend/utils/settingsService.js](backend/utils/settingsService.js)**
  - `getRecommendationWeights()` - Retrieve skill/CGPA weights
  - `normalizeWeights()` - Admin config for tuning ranking

- **[backend/utils/skillBadgeService.js](backend/utils/skillBadgeService.js)**
  - `getEndorsementBadgeLevel()` - Determine badge (Gold/Silver/Bronze)
  - `getBadgeWeight()` - Weight boost from verified badges
  - Badge criteria based on CGPA and skill match

#### Models
- **[backend/models/Application.js](backend/models/Application.js)** (Extended)
  - `matchScore` - Calculated skill match percentage
  - `recommendationScore` - Blended ranking score
  - `cgpaAtApply` - CGPA snapshot at application time
  - `skillGapReport` - Details of missing/matched skills
  - `rank` - Auto-calculated ranking position

- **[backend/models/StudentProfile.js](backend/models/StudentProfile.js)**
  - `skills[]` - Self-reported technical skills
  - `verifiedSkills[]` - Badge-weighted verified skills
  - `cvInsights.extractedSkills[]` - NLP-extracted skills from CV
  - `cgpa` - Academic performance metric

- **[backend/models/SkillVerification.js](backend/models/SkillVerification.js)**
  - Tracks skill verification source (manual, cv-extraction, affinda)
  - Badge levels assigned by admins/companies

#### Routes
- **[backend/routes/applicationRoutes.js](backend/routes/applicationRoutes.js)** (Extended)
  - POST /api/application/internship/:id/auto-shortlist
    - Query params: `topN` (default 5), `minimumRecommendationScore` (default 60)
    - Returns: Top N candidates ranked

### Frontend Files

#### Pages
- **[frontend/src/pages/CompanyDashboard.jsx](frontend/src/pages/CompanyDashboard.jsx)** (Extended)
  - **Candidate Review Section**:
    - Display candidates in ranked order
    - Show: match score, recommendation score, CGPA, endorsement badge
    - Color-coded skill matches (matched/missing)
    - One-click auto-shortlist with configurable thresholds

- **[frontend/src/pages/MyApplications.jsx](frontend/src/pages/MyApplications.jsx)** (Extended)
  - Show endorsement badge (student view)
  - Display match score breakdown
  - Learning recommendations for skill gaps

---

## 💬 Feature 3: Internship Performance Feedback System

**Purpose**: Capture structured bidirectional feedback between companies and students after internship completion. Build credibility and improve future matching accuracy.

### Backend Files

#### Controllers
- **[backend/controllers/feedbackController.js](backend/controllers/feedbackController.js)** ⭐ CORE
  - `submitFeedback()` - POST /api/feedback
    - Company → Student feedback (technical skills 1-5, communication, teamwork, overall rating)
    - Student → Company feedback (overall experience rating)
    - Direction tracking
    - Duplicate prevention (one per direction per application)
  - `getFeedbackForApplication()` - GET /api/feedback/application/:applicationId
  - `getMyReceivedFeedback()` - GET /api/feedback/my
  - `getStudentEligibleForFeedback()` - GET /api/feedback/student/eligible
    - Returns applications eligible for student feedback (after internship completed)
  - `getCommunityFeedback()` - GET /api/feedback/student/community
    - Aggregated company feedback visible to students researching companies

#### Models
- **[backend/models/InternshipFeedback.js](backend/models/InternshipFeedback.js)**
  - Schema fields:
    - `internshipId`, `applicationId`, `fromUserId`, `toUserId`
    - `direction` enum: 'company_to_student' | 'student_to_company'
    - `technicalSkills` (1-5, company only)
    - `communication` (1-5, company only)
    - `teamwork` (1-5, company only)
    - `overallRating` (1-5, both)
    - `comment` (qualitative feedback)
    - `timestamps`
  - Indexes on application, direction to prevent duplicates

#### Routes
- **[backend/routes/feedbackRoutes.js](backend/routes/feedbackRoutes.js)**
  - POST /api/feedback - Submit feedback
  - GET /api/feedback/application/:applicationId - View feedback for application
  - GET /api/feedback/my - View feedback received
  - GET /api/feedback/student/eligible - Eligible applications for feedback
  - GET /api/feedback/student/community - Aggregated company feedback

#### Utilities
- **[backend/utils/notificationService.js](backend/utils/notificationService.js)** (Extended)
  - `notify()` - Send notification when feedback received
  - Event: FEEDBACK_RECEIVED

- **[backend/utils/activityLogger.js](backend/utils/activityLogger.js)** (Extended)
  - `logActivity()` - Audit trail for all feedback submissions
  - Action: FEEDBACK_SUBMITTED

### Frontend Files

#### Pages
- **[frontend/src/pages/StudentFeedbackPortal.jsx](frontend/src/pages/StudentFeedbackPortal.jsx)** ⭐ CORE
  - **Feedback Submission**:
    - List eligible internships (completed status)
    - Form: Overall experience rating (1-5) + comment
    - View received company feedback
  - **Community Research**:
    - Browse aggregated feedback about companies
    - View company ratings and common feedback themes
  - **Timeline**:
    - Historical feedback received

- **[frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)** (Extended)
  - **Company Feedback Form**:
    - Select student/application
    - Rate: Technical Skills (1-5), Communication (1-5), Teamwork (1-5), Overall (1-5)
    - Qualitative comment
    - Submit feedback
  - **Feedback History**:
    - View feedback given to students
    - View feedback received from students

---

## 📊 Feature 4: Skill Demand & Market Trend Analysis

**Purpose**: Analyze job market trends from external sources and internal postings. Identify skill gaps by department and help students/companies align with market demand.

### Backend Files

#### Controllers
- **[backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)** ⭐ CORE
  - `getAdminDashboardAnalytics()` - GET /api/analytics/admin/dashboard
    - Total postings, applications, selected count
    - Placement ratio by department
    - Top in-demand skills
    - Emerging skill trends
    - Department skill gaps vs. market demand
    - Role: system_admin, university_admin
  - `getAdminSystemSnapshot()` - GET /api/analytics/admin/snapshot
    - Summary stats for admin dashboard
  - `getCompanyApplicantAnalytics()` - GET /api/analytics/company/applicants
    - Total posts, applicants, status summary
    - Analytics by posting
    - Top requested skills across postings
    - Role: company
  - `getStudentMatchTrends()` - GET /api/analytics/student/match-trends
    - Student's application history timeline
    - Match score trends
    - Role: student
  - `getMarketSkillTrends()` - GET /api/analytics/market-skill-trends
    - Most requested technical skills (ranked by frequency)
    - Emerging skill trends
    - Department-wise skill demand gaps
    - Data source: External jobs (Adzuna) → Internal postings (fallback)
    - Role: student, company, admin
  - Helper: `buildSkillDemand(internships)` - Count skill frequency

#### Models
- **[backend/models/ExternalJobPost.js](backend/models/ExternalJobPost.js)**
  - Synced job postings from market APIs
  - `skills[]` - Extracted required skills
  - Used for market trend analysis if available
  - Falls back to internal Internship postings if no external data

- **[backend/models/StudentProfile.js](backend/models/StudentProfile.js)** (Referenced)
  - `skills`, `department`, `cgpa` used for gap analysis

- **[backend/models/Internship.js](backend/models/Internship.js)** (Referenced)
  - `requiredSkills[]` used for demand counting

- **[backend/models/Application.js](backend/models/Application.js)** (Referenced)
  - `status` used for placement metrics

#### Routes
- **[backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js)**
  - GET /api/analytics/admin/dashboard
  - GET /api/analytics/admin/snapshot
  - GET /api/analytics/company/applicants
  - GET /api/analytics/student/match-trends
  - GET /api/analytics/market-skill-trends
  - POST /api/analytics/market/sync (manual sync trigger)

#### Utilities
- **[backend/utils/jobMarketService.js](backend/utils/jobMarketService.js)** (Optional)
  - Integration with external job market APIs (e.g., Adzuna)
  - Syncs external job postings for market trend data

### Frontend Files

#### Pages
- **[frontend/src/pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx)** (Extended)
  - **Dashboard Tab**:
    - KPI cards: Total postings, applications, placements, placement %
    - Department-wise placement breakdown
    - Top in-demand skills (bar chart)
    - Emerging skill trends (tags)
    - Department skill gaps table
  - Endpoint: GET /api/analytics/admin/dashboard

- **[frontend/src/pages/StudentInsights.jsx](frontend/src/pages/StudentInsights.jsx)** ⭐ CORE
  - **Market Overview**:
    - Top requested skills (ranked)
    - Emerging skill trends
    - Department-wise skill demand gaps
  - **Student Match Trends**:
    - Personal application timeline
    - Match score history
    - Skill trend progress
  - **Verified Skills**:
    - Display verified badges earned
  - **Community Feedback**:
    - Feedback received from companies
  - Endpoints:
    - GET /api/analytics/market-skill-trends
    - GET /api/analytics/student/match-trends
    - GET /api/feedback/my

- **[frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)** (Extended)
  - **Company Analytics**:
    - Total postings, applicants
    - Applicant status breakdown (Pending, Shortlisted, Selected, Rejected)
    - Analytics by posting
    - Top requested skills across postings
  - **Feedback Management**: (from Feature 3)
    - Submit feedback form
    - View feedback history
  - Endpoint: GET /api/analytics/company/applicants

#### Charts/Visualization
- Horizontal bar charts for skill demand
- Pie charts for placement breakdown
- Timeline charts for trends
- Uses standard canvas/SVG rendering

---

## 🛠️ Configuration & Shared Infrastructure Files

### Backend Configuration
- **[backend/package.json](backend/package.json)**
  - Dependencies: express, mongoose, jsonwebtoken, cors, dotenv, multer, etc.

- **[backend/server.js](backend/server.js)**
  - Main server entry point
  - Express setup, MongoDB connection, middleware

- **[backend/middleware/auth.js](backend/middleware/auth.js)**
  - JWT token validation
  - Role-based authorization
  - `protect` middleware, `authorizeRoles` middleware

### Frontend Configuration
- **[frontend/package.json](frontend/package.json)**
  - Dependencies: react, axios, vite, tailwindcss

- **[frontend/src/App.jsx](frontend/src/App.jsx)**
  - Main app router
  - Route definitions for all pages

- **[frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)**
  - Global authentication context
  - User role, token management

- **[frontend/vite.config.js](frontend/vite.config.js)**
  - Vite build configuration
  - API proxy setup

### Shared Utilities (Cross-Feature)
- **[backend/utils/notificationService.js](backend/utils/notificationService.js)**
  - Event notifications for all features
  - Notifies on: applications, feedback, interviews, etc.

- **[backend/utils/activityLogger.js](backend/utils/activityLogger.js)**
  - Audit trail for all operations
  - Actions: APPLICATION_SUBMITTED, FEEDBACK_SUBMITTED, etc.

- **[backend/models/ActivityLog.js](backend/models/ActivityLog.js)**
  - Schema: actor, action, entityType, entityId, timestamp

- **[backend/models/Notification.js](backend/models/Notification.js)**
  - Schema: userId, type, title, message, metadata, read status

---

## 🔗 Cross-Feature Dependencies

### Feature 1 → Feature 2
- Match score calculated and stored in Application during submission
- Application ranking uses matchingEngine from Feature 2

### Feature 2 → Feature 1
- Ranking helps companies shortlist from Feature 1 applications

### Feature 3 → Feature 1
- References Application and Internship models
- Feedback only allowed on applications with completed status

### Feature 4 → Features 1 & 2
- Analyzes Applications and Internships from Features 1 & 2
- Uses match scores from Feature 2

### Feature 3 ↔ Feature 4
- Feedback data can influence future demand analysis
- Student feedback views aggregated company data

---

## 📁 Complete File Inventory

### Backend Models (12 files)
```
✓ ActivityLog.js
✓ Application.js
✓ ExternalJobPost.js
✓ Internship.js
✓ InternshipFeedback.js
✓ InternshipTemplate.js
✓ Interview.js
✓ Notification.js
✓ SkillVerification.js
✓ StudentProfile.js
✓ SystemSetting.js
✓ User.js
```

### Backend Controllers (11 files)
```
✓ adminController.js
✓ analyticsController.js (Feature 4)
✓ applicationController.js (Features 1, 2)
✓ authController.js
✓ cvController.js
✓ feedbackController.js (Feature 3)
✓ internshipController.js (Features 1)
✓ interviewController.js
✓ notificationController.js
✓ skillVerificationController.js
✓ studentController.js
```

### Backend Routes (11 files)
```
✓ adminRoutes.js
✓ analyticsRoutes.js (Feature 4)
✓ applicationRoutes.js (Features 1, 2)
✓ authRoutes.js
✓ cvRoutes.js
✓ feedbackRoutes.js (Feature 3)
✓ internshipRoutes.js (Features 1)
✓ interviewRoutes.js
✓ notificationRoutes.js
✓ skillVerificationRoutes.js
✓ studentRoutes.js
```

### Backend Utilities (10 files)
```
✓ activityLogger.js (Shared)
✓ affindaNlpService.js
✓ applicationTimeline.js (Feature 1)
✓ documentService.js
✓ interviewReportingService.js
✓ jobMarketService.js (Feature 4)
✓ matchingEngine.js (Feature 2)
✓ notificationService.js (Shared)
✓ settingsService.js (Feature 2)
✓ skillBadgeService.js (Features 2, 3)
```

### Frontend Pages (14 files)
```
✓ AdminDashboard.jsx (Features 2, 4)
✓ CompanyDashboard.jsx (Features 1, 2, 3)
✓ CompanyInsights.jsx (Features 3, 4)
✓ InternshipSearch.jsx (Feature 1)
✓ InterviewCenter.jsx
✓ InterviewReports.jsx
✓ InterviewTimeline.jsx
✓ LoginPage.jsx
✓ MyApplications.jsx (Features 1, 2)
✓ NotificationsPage.jsx
✓ RegisterPage.jsx
✓ StudentDashboard.jsx (Feature 1)
✓ StudentFeedbackPortal.jsx (Feature 3)
✓ StudentInsights.jsx (Features 3, 4)
```

### Frontend Components (1 file)
```
✓ Sidebar.jsx
```

---

## 🎓 Learning Path

**Start with Feature 1** → Understand internship posting and application flow
**Then Feature 2** → Learn matching algorithm and ranking
**Then Feature 3** → Understand feedback system
**Finally Feature 4** → Analyze data aggregation and trends

Each feature builds on previous ones in complexity but uses shared infrastructure.

---

## 📝 Notes

1. **Models** are MongoDB schemas defining data structure
2. **Controllers** contain business logic and endpoint handlers
3. **Routes** map HTTP methods to controller functions
4. **Utilities** provide reusable services across controllers
5. **Frontend Pages** correspond to user-facing views
6. **Authentication** is handled via JWT in auth.js middleware
7. **Authorization** uses role-based access (student, company, admin)

---

## 📞 Quick Reference

| Feature | Primary Controller | Main Page(s) | Core Utility |
|---------|-------------------|-------------|--------------|
| **Feature 1** | applicationController | InternshipSearch, MyApplications | applicationTimeline |
| **Feature 2** | applicationController | CompanyDashboard | matchingEngine |
| **Feature 3** | feedbackController | StudentFeedbackPortal | activityLogger |
| **Feature 4** | analyticsController | AdminDashboard, StudentInsights | jobMarketService |

