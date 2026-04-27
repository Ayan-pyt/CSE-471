# 📂 Complete File Structure & Location Guide

**Status**: ✅ All synced from GitHub  
**Location**: `e:\CSE-471\`  
**Last Updated**: April 28, 2026

---

## 🎯 Quick Navigation

### I Want To See...
- **Student Profile Features** → `frontend/src/pages/StudentDashboard.jsx` + `backend/controllers/studentController.js`
- **GitHub Import Feature** → `StudentDashboard.jsx` lines 175-195 (frontend)
- **AI Matching Algorithm** → `backend/utils/matchingEngine.js`
- **Admin Dashboard** → `frontend/src/pages/AdminDashboard.jsx`
- **Internship Search** → `frontend/src/pages/InternshipSearch.jsx`
- **Interview System** → `frontend/src/pages/InterviewCenter.jsx` + `backend/controllers/interviewController.js`
- **Notification System** → `backend/utils/notificationService.js` + `backend/controllers/notificationController.js`
- **Feedback System** → `frontend/src/pages/StudentFeedbackPortal.jsx` + `backend/controllers/feedbackController.js`

---

## 📁 Complete Directory Structure

```
e:\CSE-471\
│
├── 📄 README.md                          (Project overview)
├── 📄 START_HERE.md                      (Getting started guide)
├── 📄 TEAM_FEATURES_SUMMARY.md          (Feature list - YOU HAVE THIS!)
├── 📄 LATEST_MODIFICATIONS.md           (What's new - YOU HAVE THIS!)
├── 📄 SETUP_COMPLETE.md                 (Setup guide)
├── 📄 .gitignore
│
├── 📁 backend/
│   │
│   ├── 📄 server.js                     (Express server entry point)
│   ├── 📄 package.json                  (Dependencies)
│   │
│   ├── 📁 controllers/                  (Business logic - 11 files)
│   │   ├── adminController.js           ✅ Admin features
│   │   ├── analyticsController.js       ✅ Dashboard analytics
│   │   ├── applicationController.js     ✅ Application tracking
│   │   ├── authController.js            ✅ Login/Register
│   │   ├── cvController.js              ✅ CV upload
│   │   ├── feedbackController.js        ✅ Feedback system
│   │   ├── internshipController.js      ✅ Internship management
│   │   ├── interviewController.js       ✅ Interview scheduling
│   │   ├── notificationController.js    ✅ Notifications
│   │   ├── skillVerificationController.js ✅ Skill badges
│   │   └── studentController.js         ✅ Student profile
│   │
│   ├── 📁 models/                       (Database schemas - 10 files)
│   │   ├── User.js
│   │   ├── StudentProfile.js            (Has skills, CGPA, GitHub profile)
│   │   ├── Application.js
│   │   ├── Interview.js
│   │   ├── InternshipFeedback.js
│   │   ├── Notification.js
│   │   ├── SkillVerification.js
│   │   ├── ActivityLog.js
│   │   ├── ExternalJobPost.js
│   │   └── SystemSetting.js
│   │
│   ├── 📁 routes/                       (API endpoints)
│   │   ├── adminRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cvRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── internshipRoutes.js
│   │   ├── interviewRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── skillVerificationRoutes.js
│   │   └── studentRoutes.js
│   │
│   ├── 📁 middleware/
│   │   ├── auth.js                      (JWT authentication)
│   │   └── logging.js                   (Activity logging)
│   │
│   ├── 📁 utils/                        (Services - 10 files)
│   │   ├── matchingEngine.js            ✅ AI skill matching algorithm
│   │   ├── notificationService.js       ✅ Email & in-app notifications
│   │   ├── applicationTimeline.js       (Status tracking)
│   │   ├── interviewReportingService.js (Interview analytics)
│   │   ├── skillBadgeService.js         (Badge calculation)
│   │   ├── affindaNlpService.js         (Resume parsing - Affinda API)
│   │   ├── documentService.js           (File handling)
│   │   ├── jobMarketService.js          (Job data integration)
│   │   ├── activityLogger.js            (User activity logging)
│   │   └── settingsService.js           (System settings)
│   │
│   ├── 📁 uploads/
│   │   └── documents/                   (CV files stored here)
│   │
│   └── .env                             (Environment variables)
│
├── 📁 frontend/
│   │
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📄 index.html
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📄 App.jsx                   (Main app component)
│   │   ├── 📄 main.jsx                  (React entry point)
│   │   │
│   │   ├── 📁 pages/                    (Page components - 14 files)
│   │   │   ├── AdminDashboard.jsx       ✅ Admin analytics
│   │   │   ├── CompanyDashboard.jsx     ✅ Company features
│   │   │   ├── CompanyInsights.jsx      ✅ Company analytics
│   │   │   ├── InternshipSearch.jsx     ✅ Search internships
│   │   │   ├── InterviewCenter.jsx      ✅ Interview management
│   │   │   ├── InterviewReports.jsx     ✅ Interview feedback
│   │   │   ├── InterviewTimeline.jsx    ✅ Interview timeline
│   │   │   ├── LoginPage.jsx            ✅ User login
│   │   │   ├── RegisterPage.jsx         ✅ User registration
│   │   │   ├── MyApplications.jsx       ✅ View applications
│   │   │   ├── StudentDashboard.jsx     ✅ Student profile (GITHUB IMPORT HERE!)
│   │   │   ├── StudentFeedbackPortal.jsx ✅ Submit feedback
│   │   │   ├── StudentInsights.jsx      ✅ Student analytics
│   │   │   └── NotificationsPage.jsx    ✅ View notifications
│   │   │
│   │   ├── 📁 components/
│   │   │   └── Sidebar.jsx              (Navigation sidebar)
│   │   │
│   │   ├── 📁 context/
│   │   │   └── AuthContext.jsx          (Auth state management)
│   │   │
│   │   ├── 📁 styles/
│   │   │   ├── InterviewReports.css
│   │   │   ├── InterviewTimeline.css
│   │   │   └── StudentFeedbackPortal.css
│   │   │
│   │   ├── 📁 utils/
│   │   │   └── skillBadge.js            (Badge rendering)
│   │   │
│   │   └── 📁 assets/
│   │       └── (Images, logos, etc.)
│   │
│   └── 📁 public/

└── 📁 .git/                             (Git repository)

```

---

## 🔍 Finding Specific Features

### Feature: Student Profile with GitHub Import
📍 **Files**:
- Frontend: `frontend/src/pages/StudentDashboard.jsx` (lines 1-200)
- Backend: `backend/controllers/studentController.js`
- Service: `backend/utils/githubService.js`

### Feature: AI Skill Matching
📍 **Files**:
- Algorithm: `backend/utils/matchingEngine.js`
- Controller: `backend/controllers/applicationController.js`
- Used By: InternshipSearch.jsx, StudentInsights.jsx

### Feature: Interview Management
📍 **Files**:
- Frontend: `frontend/src/pages/InterviewCenter.jsx`, `InterviewTimeline.jsx`, `InterviewReports.jsx`
- Backend: `backend/controllers/interviewController.js`
- Service: `backend/utils/interviewReportingService.js`

### Feature: Notifications
📍 **Files**:
- Frontend: `frontend/src/pages/NotificationsPage.jsx`
- Backend: `backend/controllers/notificationController.js`
- Service: `backend/utils/notificationService.js`
- Model: `backend/models/Notification.js`

### Feature: Admin Dashboard
📍 **Files**:
- Frontend: `frontend/src/pages/AdminDashboard.jsx`
- Backend: `backend/controllers/adminController.js`, `analyticsController.js`
- Services: `backend/utils/matchingEngine.js`, `skillBadgeService.js`

### Feature: Feedback System
📍 **Files**:
- Frontend: `frontend/src/pages/StudentFeedbackPortal.jsx`
- Backend: `backend/controllers/feedbackController.js`
- Model: `backend/models/InternshipFeedback.js`

---

## 📊 File Statistics

| Section | Count | Purpose |
|---------|-------|---------|
| Controllers | 11 | Business logic for all features |
| Models | 10 | Database schema definitions |
| Routes | 11 | API endpoints |
| Frontend Pages | 14 | User interface screens |
| Utilities | 10 | Helper services |
| CSS Files | 3+ | Styling |
| **Total Backend Files** | **50+** | Complete backend system |
| **Total Frontend Files** | **50+** | Complete frontend system |

---

## 🚀 How To Use Files

### To See GitHub Import Feature
```bash
# Open the file and go to line 175
code e:\CSE-471\frontend\src\pages\StudentDashboard.jsx

# Look for: "Import Skills from GitHub"
# This section has the UI with:
# - GitHub username input
# - Import button
# - Auto-extraction logic
```

### To See AI Matching Algorithm
```bash
# This is where the smart matching happens
code e:\CSE-471\backend\utils\matchingEngine.js

# Functions:
# - calculateMatchInsights()
# - calculateMatchScore()
# - generateLearningPath()
```

### To See All Backend Features
```bash
# Go to controllers directory
cd e:\CSE-471\backend\controllers

# View all 11 feature controllers
ls
```

### To See All Frontend Pages
```bash
# Go to pages directory
cd e:\CSE-471\frontend\src\pages

# View all 14 page components
ls
```

---

## 🔗 Key File Relationships

```
StudentDashboard (Frontend)
  ↓ (Calls API)
studentController.js (Backend)
  ↓ (Uses Model)
StudentProfile.js (Database)
  ↓ (Calls Service)
githubService.js (Utility)
  ↓ (Returns Data)
StudentDashboard (Frontend - Updated)
```

---

## 📝 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `START_HERE.md` | Getting started guide |
| `TEAM_FEATURES_SUMMARY.md` | All features list (NEW!) |
| `LATEST_MODIFICATIONS.md` | Recent changes (NEW!) |
| `SETUP_COMPLETE.md` | Setup instructions |
| `AI_Skill_Matching_Engine_Guide.md` | Matching algorithm docs |
| `ARCHITECTURE_DIAGRAMS.md` | System architecture |
| `INTERVIEW_REPORTING_DOCUMENTATION.md` | Interview features |

---

## ✅ Everything You Need

✅ **All source code** - 100+ files  
✅ **All features** - 14 major features  
✅ **All documentation** - Multiple guides  
✅ **All recent updates** - From your team  
✅ **Git history** - All commits tracked  
✅ **Ready to run** - Just need to start servers  

---

## 🎯 Next Steps

1. **Review Features**
   ```bash
   # Read the feature summary
   code e:\CSE-471\TEAM_FEATURES_SUMMARY.md
   ```

2. **See Recent Changes**
   ```bash
   # Read what's new
   code e:\CSE-471\LATEST_MODIFICATIONS.md
   ```

3. **Explore Code**
   ```bash
   # Open in VS Code
   code e:\CSE-471
   ```

4. **Start Servers**
   ```bash
   # Terminal 1: Backend
   cd e:\CSE-471\backend && npm start
   
   # Terminal 2: Frontend
   cd e:\CSE-471\frontend && npm run dev
   ```

5. **Visit Application**
   ```
   http://localhost:5173/
   ```

---

## 💾 Your Files Are At

```
e:\CSE-471\
├── All backend features
├── All frontend pages
├── All documentation
└── Complete git history
```

**Everything is synced from GitHub!** 🎉

---

**Generated**: April 28, 2026  
**Repository**: https://github.com/Ayan-pyt/CSE-471  
**Local Path**: e:\CSE-471\
