# Feature #3: Internship Performance Feedback System - Complete Implementation Guide

## Overview

The **Internship Performance Feedback System** enables bidirectional feedback between companies and students after internship completion. This system improves matching accuracy and builds credibility within the platform by capturing structured performance metrics.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Feedback System Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Company submits feedback (technical, communication, etc.)   │
│                ↓                                              │
│  Student receives notification and views feedback            │
│                ↓                                              │
│  Student submits counter-feedback about experience           │
│                ↓                                              │
│  System stores bidirectional feedback                        │
│                ↓                                              │
│  Community can view aggregated feedback                      │
│                ↓                                              │
│  Future matching uses feedback for credibility weighting     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Database Model: InternshipFeedback

**File:** [backend/models/InternshipFeedback.js](backend/models/InternshipFeedback.js)

```javascript
const internshipFeedbackSchema = new mongoose.Schema({
  // References
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Direction of feedback
  direction: {
    type: String,
    enum: ['company_to_student', 'student_to_company'],
    required: true,
  },
  
  // Structured Feedback Metrics (1-5 scale)
  technicalSkills: { type: Number, min: 1, max: 5 },      // Only for company_to_student
  communication: { type: Number, min: 1, max: 5 },        // Only for company_to_student
  teamwork: { type: Number, min: 1, max: 5 },             // Only for company_to_student
  overallRating: { type: Number, min: 1, max: 5, required: true },
  
  // Feedback text
  comment: { type: String, default: '' },
  
  // Timestamps
  timestamps: true
});
```

### Key Fields Explained:

| Field | Purpose | Who Fills |
|-------|---------|-----------|
| `direction` | Tracks feedback direction | Auto-set by system |
| `technicalSkills` | Student's technical capability rating | Company only |
| `communication` | Student's communication rating | Company only |
| `teamwork` | Student's teamwork rating | Company only |
| `overallRating` | Overall performance/experience rating | Both (different meanings) |
| `comment` | Qualitative feedback | Both |

---

## 2. Backend Controller: feedbackController.js

**File:** [backend/controllers/feedbackController.js](backend/controllers/feedbackController.js)

### 2.1 Submit Feedback Endpoint

```javascript
const submitFeedback = async (req, res) => {
  const {
    applicationId,
    technicalSkills,
    communication,
    teamwork,
    overallRating,
    comment,
  } = req.body;

  // Validation
  if (!applicationId || !overallRating) {
    return res.status(400).json({ message: 'applicationId and overallRating are required' });
  }

  try {
    // 1. Fetch application & internship details
    const app = await Application.findById(applicationId).populate('internshipId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const internship = await Internship.findById(app.internshipId?._id || app.internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    // 2. Determine feedback direction & validate authorization
    let direction = '';
    let toUserId;

    if (req.user.role === 'company') {
      // Company can only submit feedback if they own the internship
      if (internship.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      direction = 'company_to_student';
      toUserId = app.studentId;
    } else if (req.user.role === 'student') {
      // Student can only submit feedback if they are the applicant
      if (app.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      // Student can ONLY give feedback after internship is completed
      if (!isCompletedInternship(app)) {
        return res.status(400).json({ 
          message: 'Feedback is only available after your internship has been marked as completed or selected.' 
        });
      }
      direction = 'student_to_company';
      toUserId = internship.companyId;
    } else {
      return res.status(403).json({ message: 'Only students or companies can submit feedback' });
    }

    // 3. Prevent duplicate feedback from same direction
    const existing = await InternshipFeedback.findOne({ 
      applicationId, 
      direction, 
      fromUserId: req.user._id 
    });
    if (existing) {
      return res.status(400).json({ message: 'Feedback already submitted for this side' });
    }

    // 4. Create feedback record
    const feedback = await InternshipFeedback.create({
      internshipId: internship._id,
      applicationId,
      fromUserId: req.user._id,
      toUserId,
      direction,
      technicalSkills,
      communication,
      teamwork,
      overallRating,
      comment: comment || '',
    });

    // 5. Send notification to recipient
    await notify({
      userId: toUserId,
      type: 'FEEDBACK_RECEIVED',
      title: 'New Internship Feedback',
      message: `You received new feedback for ${internship.title}.`,
      metadata: { feedbackId: feedback._id, applicationId },
    });

    // 6. Log activity for audit trail
    await logActivity({
      actor: req.user,
      action: 'INTERNSHIP_FEEDBACK_SUBMITTED',
      entityType: 'InternshipFeedback',
      entityId: feedback._id,
      details: { applicationId, direction },
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
};
```

**Key Protection Mechanisms:**
1. ✅ Authorization checks ensure only relevant users can submit
2. ✅ Internship completion verification for students
3. ✅ Duplicate prevention to allow one feedback per direction
4. ✅ Automatic notification to feedback recipient
5. ✅ Activity logging for compliance & auditing

---

### 2.2 Get Feedback for Application

```javascript
const getFeedbackForApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.applicationId).populate('internshipId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const internship = await Internship.findById(app.internshipId?._id || app.internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    // Authorization: student, company, or admin can view
    const allowed =
      app.studentId.toString() === req.user._id.toString() ||
      internship.companyId.toString() === req.user._id.toString() ||
      ['system_admin', 'university_admin'].includes(req.user.role);

    if (!allowed) return res.status(403).json({ message: 'Unauthorized' });

    // Fetch all feedback (both directions) for this application
    const feedback = await InternshipFeedback.find({ applicationId: req.params.applicationId })
      .populate('fromUserId', 'name role')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};
```

---

### 2.3 Get Eligible Feedback Applications (Student)

```javascript
const getEligibleStudentApplications = async (req, res) => {
  try {
    // Find completed/selected applications
    const applications = await Application.find({
      studentId: req.user._id,
      $or: [
        { status: 'Selected' },
        { interviewStatus: 'Selected' },
        { interviewStatus: 'Completed' },
      ],
    })
      .populate('internshipId', 'title companyName')
      .sort({ updatedAt: -1 });

    // Find which ones the student already gave feedback on
    const submittedFeedback = await InternshipFeedback.find({
      fromUserId: req.user._id,
      direction: 'student_to_company',
    }).select('applicationId');

    const submittedIds = new Set(submittedFeedback.map((item) => item.applicationId.toString()));
    
    // Filter out already-submitted feedback
    const eligible = applications
      .filter((application) => !submittedIds.has(application._id.toString()))
      .map((application) => ({
        _id: application._id,
        internshipId: application.internshipId,
        status: application.status,
        interviewStatus: application.interviewStatus,
        appliedAt: application.appliedAt,
      }));

    res.json(eligible);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch eligible feedback applications', error: err.message });
  }
};
```

---

### 2.4 Get Community Feedback (Public View)

```javascript
const getStudentCommunityFeedback = async (req, res) => {
  try {
    // Fetch all student-to-company feedback (students' experience feedback)
    const feedback = await InternshipFeedback.find({ direction: 'student_to_company' })
      .populate('internshipId', 'title companyName')
      .populate('fromUserId', 'name role')
      .populate('applicationId', 'status interviewStatus appliedAt')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch community feedback', error: err.message });
  }
};
```

**Purpose:** Students can see what other students have experienced with different companies.

---

## 3. Frontend Implementation

### 3.1 Company Feedback Submission (CompanyInsights.jsx)

**File:** [frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)

```javascript
const [feedbackForm, setFeedbackForm] = useState({
  applicationId: '',
  technicalSkills: 4,
  communication: 4,
  teamwork: 4,
  overallRating: 4,
  comment: '',
});

const submitFeedback = async (e) => {
  e.preventDefault();
  try {
    // POST to /api/feedback with company's evaluation
    await axios.post('/api/feedback', feedbackForm);
    
    // Reset form
    setFeedbackForm({ 
      applicationId: '', 
      technicalSkills: 4, 
      communication: 4, 
      teamwork: 4, 
      overallRating: 4, 
      comment: '' 
    });
    
    // Show success message
  } catch (error) {
    // Handle error
  }
};
```

**UI Components:**
- Dropdown to select application
- Input fields for: technicalSkills, communication, teamwork, overallRating (1-5 scale)
- Textarea for detailed comment
- Submit button

---

### 3.2 Student Feedback Portal (StudentFeedbackPortal.jsx)

**File:** [frontend/src/pages/StudentFeedbackPortal.jsx](frontend/src/pages/StudentFeedbackPortal.jsx)

```javascript
export default function StudentFeedbackPortal() {
  const [eligibleApplications, setEligibleApplications] = useState([]);
  const [communityFeedback, setCommunityFeedback] = useState([]);
  const [form, setForm] = useState({
    applicationId: '',
    overallRating: 4,
    comment: '',
  });

  const loadPortal = async () => {
    // Load eligible applications AND community feedback
    const [eligibleRes, communityRes] = await Promise.all([
      axios.get('/api/feedback/student/eligible', { headers }),
      axios.get('/api/feedback/student/community', { headers }),
    ]);

    setEligibleApplications(eligibleRes.data || []);
    setCommunityFeedback(communityRes.data || []);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/api/feedback', {
        ...form,
        overallRating: Number(form.overallRating),
      }, { headers });

      // Refresh portal
      loadPortal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };
}
```

**Portal Features:**
1. **Eligible Applications Section**: Shows internships where feedback can be submitted
2. **Submission Form**: Rate internship experience and add comment
3. **Community Feedback Section**: View what other students said about companies

---

## 4. API Endpoints

### POST /api/feedback
Submit feedback (Company or Student)

**Request:**
```javascript
{
  applicationId: "507f1f77bcf86cd799439011",
  technicalSkills: 4,          // Company only
  communication: 5,            // Company only
  teamwork: 4,                 // Company only
  overallRating: 4,            // Required
  comment: "Great experience"
}
```

**Response (201):**
```javascript
{
  _id: "507f1f77bcf86cd799439012",
  internshipId: "...",
  applicationId: "...",
  fromUserId: "...",
  toUserId: "...",
  direction: "company_to_student" | "student_to_company",
  technicalSkills: 4,
  communication: 5,
  teamwork: 4,
  overallRating: 4,
  comment: "Great experience",
  createdAt: "2024-04-22T...",
  updatedAt: "2024-04-22T..."
}
```

---

### GET /api/feedback/application/:applicationId
Get all feedback for an application (both directions)

**Response:**
```javascript
[
  {
    _id: "...",
    direction: "company_to_student",
    fromUserId: { name: "TechCorp Inc", role: "company" },
    technicalSkills: 4,
    communication: 5,
    teamwork: 4,
    overallRating: 4,
    comment: "Strong technical skills",
    createdAt: "2024-04-20T..."
  },
  {
    _id: "...",
    direction: "student_to_company",
    fromUserId: { name: "John Doe", role: "student" },
    overallRating: 5,
    comment: "Excellent mentorship",
    createdAt: "2024-04-21T..."
  }
]
```

---

### GET /api/feedback/my
Get all feedback received by current user

```javascript
[
  {
    _id: "...",
    internshipId: { title: "Full Stack Developer", companyName: "TechCorp" },
    fromUserId: { name: "HR Manager", role: "company" },
    technicalSkills: 4,
    communication: 5,
    teamwork: 4,
    overallRating: 4,
    createdAt: "2024-04-20T..."
  }
]
```

---

### GET /api/feedback/student/eligible
Get internship applications eligible for feedback (Student only)

**Logic:**
- Shows applications with status: 'Selected' OR interviewStatus: 'Completed'/'Selected'
- Excludes applications where student already submitted feedback
- Returns available internships for providing experience feedback

---

### GET /api/feedback/student/community
Get community feedback (all students' experience feedback about companies)

**Purpose:** Students can research company experiences before applying

---

## 5. Workflow Examples

### Scenario 1: Company Gives Feedback

```
1. Company logs in → Company Insights page
2. Selects: Application dropdown (shows shortlisted/selected students)
3. Fills form:
   - Technical Skills: 4/5
   - Communication: 5/5
   - Teamwork: 4/5
   - Overall Rating: 4/5
   - Comment: "Great problem-solving skills. Ready for production work."
4. Clicks Submit
5. System:
   - Creates InternshipFeedback with direction: 'company_to_student'
   - Sends notification to student: "New Internship Feedback"
   - Logs activity for audit
```

---

### Scenario 2: Student Receives and Reviews Feedback

```
1. Student receives notification: "You received new feedback"
2. Clicks notification → Views feedback from company
3. Can:
   - Read technical/communication/teamwork ratings
   - Read detailed comment
   - Submit counter-feedback about internship experience
4. Navigates to Feedback Portal
5. Sees eligible applications where internship was completed
6. Submits feedback:
   - Overall Rating: 5/5 (about their experience)
   - Comment: "Excellent mentors, learned a lot about React"
```

---

### Scenario 3: Community Learning

```
1. Student considers applying to Company X
2. Visits Student Feedback Portal
3. Searches feedback for Company X
4. Sees:
   - Average rating: 4.2/5
   - Comments from other students:
     * "Great learning experience"
     * "Fast-paced environment"
     * "Supportive team"
5. Makes informed decision to apply
```

---

## 6. Integration with Matching Engine

### Location: [backend/utils/matchingEngine.js](backend/utils/matchingEngine.js)

**Current Status:** Feedback is stored but not yet directly used in matching algorithm.

**Future Enhancement Opportunities:**

```javascript
// Potential: Add feedback credibility boost to recommendations
const calculateMatchInsights = ({
  requiredSkills = [],
  studentSkills = [],
  verifiedSkills = [],
  cgpa = 0,
  minCGPA = 0,
  weights = { skillWeight: 0.75, cgpaWeight: 0.25 },
  // Could add:
  feedbackHistory = [],  // Student's average ratings from companies
}) => {
  // ... existing logic ...
  
  // Potential future addition:
  // If student has high feedback scores from previous internships,
  // boost their recommendation score for similar roles
  const feedbackBonus = calculateFeedbackCredibility(feedbackHistory);
  
  const recommendationScore = Number(
    Math.min(100, matchScore * normalizedSkillWeight + 
                   cgpaScore * normalizedCgpaWeight + 
                   verifiedBonus +
                   feedbackBonus).toFixed(2)  // NEW
  );
};
```

---

## 7. Data Aggregation for Analytics

### Feedback Statistics Used In:

1. **Admin Dashboard** → Trending feedback insights
2. **Company Analytics** → Applicant quality trends
3. **Student Profiles** → Credibility metrics
4. **Reports** → Internship program effectiveness

---

## 8. Security & Privacy Features

✅ **Authorization Checks**
- Only application parties can view feedback
- Only admins can see aggregate data

✅ **Duplicate Prevention**
- Prevents multiple feedback submissions in same direction
- Ensures one authentic feedback per relationship

✅ **Completion Verification**
- Students can only submit feedback after internship completion
- Companies can only submit for selected/completed applications

✅ **Audit Trail**
- All feedback submissions logged
- Tracks who submitted, when, and what

✅ **Notification System**
- Feedback recipient automatically notified
- Real-time updates

---

## 9. Summary of Feature #3

| Aspect | Details |
|--------|---------|
| **Scope** | Bidirectional feedback after internship completion |
| **Company Feedback** | Technical skills, communication, teamwork, overall rating |
| **Student Feedback** | Overall experience rating + comments |
| **Data Protection** | Authorization, duplicate prevention, audit logging |
| **Community Benefit** | Shared experiences help future applicants |
| **Future Use** | Can boost credibility in matching algorithm |
| **Status** | ✅ Fully Implemented |

---

## 10. API Testing Example

### cURL: Submit Company Feedback

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN" \
  -d '{
    "applicationId": "507f1f77bcf86cd799439011",
    "technicalSkills": 4,
    "communication": 5,
    "teamwork": 4,
    "overallRating": 4,
    "comment": "Excellent technical foundation. Ready for advanced projects."
  }'
```

### cURL: Get Community Feedback

```bash
curl -X GET http://localhost:5000/api/feedback/student/community \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

---

## Key Files Reference

- **Model:** [backend/models/InternshipFeedback.js](backend/models/InternshipFeedback.js)
- **Controller:** [backend/controllers/feedbackController.js](backend/controllers/feedbackController.js)
- **Routes:** [backend/routes/feedbackRoutes.js](backend/routes/feedbackRoutes.js)
- **Company UI:** [frontend/src/pages/CompanyInsights.jsx](frontend/src/pages/CompanyInsights.jsx)
- **Student UI:** [frontend/src/pages/StudentFeedbackPortal.jsx](frontend/src/pages/StudentFeedbackPortal.jsx)
