# IntelliMatch - CSE 471 Project

## Project Overview

IntelliMatch is an AI-powered internship matching platform that connects students with internship opportunities based on intelligent skill-based matching, comprehensive analytics, and automated notifications.

## Repository Structure

This repository is organized into separate branches for each module, making it easy for teams to work independently while maintaining a unified codebase.

### Branch Structure

```
main                                          # Merged code from all modules
├── module/1-student-profile-skill-management # Student Profile & Skill Management
├── module/2-ai-skill-matching-engine         # AI-Based Skill Matching
├── module/3-dashboard-analytics-system       # Dashboard & Analytics
└── module/4-notification-system              # Notification System
```

## Modules Overview

### Module 1: Student Profile & Skill Management
**Branch**: `module/1-student-profile-skill-management`

Students can:
- Create and update academic profiles (CGPA, department, graduation year)
- Add certifications, projects, and technical skills
- Upload CV files for skill extraction
- Import skills automatically from GitHub profiles
- Track verified skills with badge levels

**Key Files**:
- `backend/models/StudentProfile.js` - Data schema
- `backend/controllers/StudentController.js` - Business logic
- `backend/utils/githubService.js` - GitHub integration

**Key Endpoints**:
- `POST /api/student/profile` - Create profile
- `PUT /api/student/profile` - Update profile
- `GET /api/student/profile/me` - Get own profile
- `POST /api/student/github-skills/:username` - Import from GitHub

---

### Module 2: AI-Based Skill Matching Engine
**Branch**: `module/2-ai-skill-matching-engine`

Intelligent matching algorithm that:
- Compares student skills with internship requirements
- Uses weighted skill matching algorithm
- Calculates CGPA-based scoring
- Applies verified skill bonuses (gold/silver/bronze)
- Provides skill gap analysis with learning recommendations
- Ranks candidates with recommendation scores

**Match Score Formula**:
```
Match Score = (Matched Skill Weights / Total Required Skill Weights) × 100
Recommendation Score = (Match Score × 0.75) + (CGPA Score × 0.25) + Verified Bonus
```

**Key Files**:
- `backend/utils/matchingEngine.js` - Core algorithm
- `backend/utils/skillBadgeService.js` - Badge weights
- `backend/models/Application.js` - Application schema

**Key Features**:
- O(n×m) complexity for efficiency
- Case-insensitive skill matching
- Learning path recommendations
- Dynamic weight calculations

---

### Module 3: Dashboard & Analytics System
**Branch**: `module/3-dashboard-analytics-system`

Comprehensive analytics for three user types:

**For University Admins**:
- Total internship postings
- Student placement ratio (%)
- Department-wise performance
- Top in-demand skills
- Department skill gaps

**For Companies**:
- Applicant pool analytics
- Status breakdown (Pending/Shortlisted/Selected/Rejected)
- Per-posting metrics
- Average match scores
- Top requested skills

**For Students**:
- Personal match trends
- Application history
- Average match scores
- Status summary
- Timeline view

**Key Files**:
- `backend/controllers/AnalyticsController.js` - Analytics logic
- `backend/routes/analyticsRoutes.js` - API endpoints

**Key Endpoints**:
- `GET /api/analytics/admin/dashboard` - Admin analytics
- `GET /api/analytics/company/applicants` - Company analytics
- `GET /api/analytics/student/match-trends` - Student trends

---

### Module 4: Notification System
**Branch**: `module/4-notification-system`

Automated multi-channel notifications for:

**Trigger Events**:
- ✅ Application submission (to company)
- ✅ Status updates (Selected/Rejected/Shortlisted)
- ✅ Deadline reminders (72 hours before)
- ✅ Shortlisting alerts
- ✅ Interview reminders (24 hours before)
- ✅ Interview invitations & status
- ✅ Feedback received
- ✅ System announcements

**Delivery Channels**:
- Email notifications (HTML formatted)
- In-app notifications (database stored)
- Read/unread status tracking
- Notification history

**Key Files**:
- `backend/models/Notification.js` - Schema
- `backend/utils/notificationService.js` - Core service
- `backend/controllers/notificationController.js` - Business logic

**Key Endpoints**:
- `GET /api/notifications/my` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/deadline-reminders` - Generate reminders
- `POST /api/notifications/interview-reminders` - Interview alerts

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Email**: Email Service (configurable)

### Frontend
- **Framework**: React.js
- **Build Tool**: Vite
- **HTTP Client**: Axios

### DevOps
- **Version Control**: Git/GitHub
- **Branch Strategy**: Module-based branching

## Project Structure

```
backend/
├── models/
│   ├── StudentProfile.js
│   ├── Application.js
│   ├── Internship.js
│   └── Notification.js
├── controllers/
│   ├── StudentController.js
│   ├── ApplicationController.js
│   ├── AnalyticsController.js
│   └── NotificationController.js
├── routes/
│   ├── studentRoutes.js
│   ├── applicationRoutes.js
│   ├── analyticsRoutes.js
│   └── notificationRoutes.js
├── utils/
│   ├── matchingEngine.js
│   ├── notificationService.js
│   ├── githubService.js
│   ├── emailService.js
│   └── skillBadgeService.js
└── middleware/
    ├── auth.js
    └── logging.js

frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── context/
│   └── styles/
└── public/
```

## Key Features Summary

| Feature | Module | Status |
|---------|--------|--------|
| Student Profile Management | 1 | ✅ Complete |
| CV Upload & Skill Extraction | 1 | ✅ Complete |
| GitHub Skills Import | 1 | ✅ Complete |
| AI Skill Matching | 2 | ✅ Complete |
| Skill Gap Analysis | 2 | ✅ Complete |
| Learning Recommendations | 2 | ✅ Complete |
| Admin Dashboard | 3 | ✅ Complete |
| Company Analytics | 3 | ✅ Complete |
| Student Insights | 3 | ✅ Complete |
| Email Notifications | 4 | ✅ Complete |
| In-App Notifications | 4 | ✅ Complete |
| Deadline Reminders | 4 | ✅ Complete |
| Interview Reminders | 4 | ✅ Complete |

## How to Use This Repository

### For Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ayan-pyt/CSE-471.git
   cd CSE-471
   ```

2. **Work on specific module**:
   ```bash
   # Checkout the module branch you want to work on
   git checkout module/1-student-profile-skill-management
   
   # Or view all modules from main
   git checkout main
   ```

3. **Install dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Configure environment**:
   ```bash
   # Create .env file in backend/
   DATABASE_URL=mongodb://...
   JWT_SECRET=your-secret
   EMAIL_SERVICE=...
   ```

5. **Run the application**:
   ```bash
   # Backend (from backend/)
   npm start
   
   # Frontend (from frontend/)
   npm run dev
   ```

### For Code Review

1. **Visit GitHub**: https://github.com/Ayan-pyt/CSE-471
2. **Check Branches tab** to see all module branches
3. **Click each branch** to review code and commits
4. **Review Module READMEs**: MODULE_1_README.md, MODULE_2_README.md, etc.

### For Faculty Review

**Faculty can:**
1. Clone repository
2. Switch to any module branch to see individual module implementation
3. Review commit history per module
4. Read MODULE_*_README.md files for detailed documentation
5. Test API endpoints with provided schemas
6. Check feature completion against requirements

---

## Module Documentation

Each module has detailed documentation:

- **[Module 1: Student Profile & Skill Management](./MODULE_1_README.md)**
- **[Module 2: AI-Based Skill Matching](./MODULE_2_README.md)**
- **[Module 3: Dashboard & Analytics](./MODULE_3_README.md)**
- **[Module 4: Notification System](./MODULE_4_README.md)**

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All endpoints (except login/register) require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Main Endpoint Categories

1. **Student Endpoints** (`/student`)
   - Profile CRUD operations
   - GitHub skills import
   - CV management

2. **Application Endpoints** (`/application`)
   - Submit applications
   - View applications
   - Track status

3. **Analytics Endpoints** (`/analytics`)
   - Admin dashboard
   - Company insights
   - Student trends

4. **Notification Endpoints** (`/notifications`)
   - Get notifications
   - Mark as read
   - Generate reminders

---

## Database Models

### StudentProfile
```javascript
{
  userId, name, cgpa, department, graduationYear,
  certifications, projects, skills, githubProfile,
  verifiedSkills, cvUrl, timestamps
}
```

### Application
```javascript
{
  studentId, internshipId, matchScore, recommendationScore,
  cgpaAtApply, skillGapReport, status, timeline,
  interviewStatus, appliedAt, timestamps
}
```

### Notification
```javascript
{
  userId, type, title, message, metadata,
  isRead, readAt, timestamps
}
```

---

## Quality Metrics

✅ **Code Organization**: Modular branch-based structure
✅ **Documentation**: Comprehensive READMEs per module
✅ **Scalability**: Efficient algorithms and database queries
✅ **Security**: JWT authentication, role-based access
✅ **Reliability**: Error handling, validation, logging
✅ **User Experience**: Multi-channel notifications, dashboards

---

## Contributing Guidelines

1. **Work on your module branch**
2. **Make meaningful commits** with clear messages
3. **Test your code** before pushing
4. **Update documentation** if adding features
5. **Follow existing code style**

---

## Team Information

- **Repository**: https://github.com/Ayan-pyt/CSE-471
- **Branches**: Module-based (1 per module)
- **Main Branch**: Contains merged code from all modules

---

## Support & Documentation

- See **MODULE_*_README.md** files for module-specific details
- Check **individual branch commits** for development history
- Review API endpoints in controller files
- Check database schemas in models folder

---

**This is a comprehensive academic project demonstrating modern full-stack development practices with focus on AI-based skill matching for internship placements.**
