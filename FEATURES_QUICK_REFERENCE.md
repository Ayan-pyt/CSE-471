# IntelliMatch Feature Files - Quick Summary

## Feature 1: Internship Search & Application System

### Backend
- **Controllers**: `applicationController.js`, `internshipController.js`
- **Models**: `Internship.js`, `Application.js`, `InternshipTemplate.js`
- **Routes**: `applicationRoutes.js`, `internshipRoutes.js`
- **Utils**: `applicationTimeline.js`

### Frontend
- **Pages**: `InternshipSearch.jsx`, `MyApplications.jsx`, `CompanyDashboard.jsx`
- **Components**: `Sidebar.jsx`

---

## Feature 2: Candidate Ranking & Shortlisting

### Backend
- **Controllers**: `applicationController.js` (autoShortlistCandidates)
- **Models**: `Application.js`, `StudentProfile.js`, `SkillVerification.js`
- **Routes**: `applicationRoutes.js`
- **Utils**: `matchingEngine.js` ⭐, `settingsService.js`, `skillBadgeService.js`

### Frontend
- **Pages**: `CompanyDashboard.jsx`, `MyApplications.jsx`
- **Utils**: `skillBadge.js`

---

## Feature 3: Internship Performance Feedback System

### Backend
- **Controllers**: `feedbackController.js` ⭐
- **Models**: `InternshipFeedback.js`
- **Routes**: `feedbackRoutes.js`
- **Utils**: `notificationService.js`, `activityLogger.js`

### Frontend
- **Pages**: `StudentFeedbackPortal.jsx`, `CompanyInsights.jsx`

---

## Feature 4: Skill Demand & Market Trend Analysis

### Backend
- **Controllers**: `analyticsController.js` ⭐
- **Models**: `ExternalJobPost.js`, `Internship.js`, `Application.js`, `StudentProfile.js`
- **Routes**: `analyticsRoutes.js`
- **Utils**: `jobMarketService.js`

### Frontend
- **Pages**: `AdminDashboard.jsx`, `StudentInsights.jsx`, `CompanyInsights.jsx`

---

## Shared Infrastructure

### Models
- `ActivityLog.js` - Audit trail
- `Notification.js` - System notifications
- `User.js` - User accounts
- `Interview.js` - Interview scheduling

### Controllers
- `adminController.js` - Admin operations
- `authController.js` - Authentication
- `studentController.js` - Student profile ops
- `skillVerificationController.js` - Skill verification
- `interviewController.js` - Interview management

### Utilities
- `notificationService.js` - Notifications
- `activityLogger.js` - Activity logging
- `affindaNlpService.js` - CV NLP analysis
- `documentService.js` - Document generation
- `interviewReportingService.js` - Interview reports

### Configuration
- `backend/server.js` - Express server
- `backend/middleware/auth.js` - JWT auth
- `frontend/src/App.jsx` - Router
- `frontend/src/context/AuthContext.jsx` - Auth state
- `frontend/vite.config.js` - Vite config

---

## File Count Summary

| Category | Count |
|----------|-------|
| Backend Models | 12 |
| Backend Controllers | 11 |
| Backend Routes | 11 |
| Backend Utilities | 10 |
| Frontend Pages | 14 |
| Frontend Components | 1 |
| **Total** | **59** |

---

## Entry Points by Feature

### Feature 1: Search & Apply
1. Student visits `/internships` (InternshipSearch.jsx)
2. Clicks apply → POST `/api/application`
3. Views `/my-applications` (MyApplications.jsx)
4. Company visits `/` CompanyDashboard → posts internship

### Feature 2: Ranking & Shortlist
1. Company views applications → GET `/api/application/internship/:id`
2. System ranks candidates via `matchingEngine.calculateMatchInsights()`
3. Company calls `/api/application/internship/:id/auto-shortlist`

### Feature 3: Feedback
1. Student visits `/student-feedback` (StudentFeedbackPortal.jsx)
2. Submits feedback → POST `/api/feedback`
3. Company views `/company-insights` → sees feedback

### Feature 4: Analytics
1. Admin visits `/admin-dashboard` → GET `/api/analytics/admin/dashboard`
2. Student visits `/student-insights` → GET `/api/analytics/market-skill-trends`
3. Company visits `/company-insights` → GET `/api/analytics/company/applicants`

---

## API Endpoints Summary

### Feature 1
- POST /api/internship - Create posting
- GET /api/internship/search - Search postings
- GET /api/internship/:id - Get details
- POST /api/application - Apply to internship
- GET /api/application/my - My applications
- GET /api/application/internship/:id - View applicants

### Feature 2
- GET /api/application/internship/:id - Ranked applicants
- POST /api/application/internship/:id/auto-shortlist - Shortlist

### Feature 3
- POST /api/feedback - Submit feedback
- GET /api/feedback/application/:id - View feedback
- GET /api/feedback/my - My received feedback
- GET /api/feedback/student/community - Company reviews

### Feature 4
- GET /api/analytics/admin/dashboard - Admin analytics
- GET /api/analytics/market-skill-trends - Market trends
- GET /api/analytics/company/applicants - Company analytics
- GET /api/analytics/student/match-trends - Student trends

---

See [FEATURE_CODEBASE_MAPPING.md](FEATURE_CODEBASE_MAPPING.md) for detailed file-by-file breakdown.
