# Feature #3: Internship Performance Feedback System - Code Examples & Testing Guide

## Table of Contents
1. Backend Controller Implementation
2. API Request/Response Examples
3. Frontend Implementation Examples
4. Complete End-to-End Workflow
5. Testing Scenarios & Test Cases
6. Troubleshooting Guide

---

## 1. Backend Controller Implementation

### Complete feedbackController.js (Production Code)

```javascript
// backend/controllers/feedbackController.js

const InternshipFeedback = require('../models/InternshipFeedback');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');

/**
 * Determines if an internship/application is considered completed
 * @param {Object} app - Application document
 * @returns {boolean}
 */
const isCompletedInternship = (app) => (
  app?.status === 'Selected' ||
  app?.interviewStatus === 'Completed' ||
  app?.interviewStatus === 'Selected'
);

/**
 * POST /api/feedback
 * Submit feedback (Company to Student or Student to Company)
 * 
 * Company submits feedback on student performance:
 *   - Technical skills rating
 *   - Communication rating
 *   - Teamwork rating
 *   - Overall performance rating
 *   - Detailed comment
 * 
 * Student submits feedback on internship experience:
 *   - Overall experience rating
 *   - Experience comment
 */
const submitFeedback = async (req, res) => {
  const {
    applicationId,
    technicalSkills,
    communication,
    teamwork,
    overallRating,
    comment,
  } = req.body;

  // Validate required fields
  if (!applicationId || !overallRating) {
    return res.status(400).json({ 
      message: 'applicationId and overallRating are required' 
    });
  }

  try {
    // Step 1: Fetch and validate application
    const app = await Application.findById(applicationId).populate('internshipId');
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Step 2: Fetch and validate internship
    const internship = await Internship.findById(
      app.internshipId?._id || app.internshipId
    );
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Step 3: Determine feedback direction & validate authorization
    let direction = '';
    let toUserId;

    if (req.user.role === 'company') {
      // COMPANY FEEDBACK RULES:
      // - Must own the internship
      // - Can submit any time (no completion check)
      // - Can rate technical, communication, teamwork, overall
      
      if (internship.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'You do not own this internship. Authorization denied.' 
        });
      }
      
      direction = 'company_to_student';
      toUserId = app.studentId;
      
    } else if (req.user.role === 'student') {
      // STUDENT FEEDBACK RULES:
      // - Must be the applicant
      // - Can ONLY submit after internship completed/selected
      // - Can only rate overall & comment (not technical/communication/teamwork)
      
      if (app.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'You are not the applicant for this application.' 
        });
      }
      
      if (!isCompletedInternship(app)) {
        return res.status(400).json({ 
          message: 'Feedback is only available after your internship has been marked as completed or selected.' 
        });
      }
      
      direction = 'student_to_company';
      toUserId = internship.companyId;
      
    } else {
      return res.status(403).json({ 
        message: 'Only students or companies can submit feedback.' 
      });
    }

    // Step 4: Prevent duplicate feedback from same direction
    const existing = await InternshipFeedback.findOne({ 
      applicationId, 
      direction, 
      fromUserId: req.user._id 
    });
    
    if (existing) {
      return res.status(400).json({ 
        message: 'You have already submitted feedback for this application.' 
      });
    }

    // Step 5: Create feedback record
    const feedback = await InternshipFeedback.create({
      internshipId: internship._id,
      applicationId,
      fromUserId: req.user._id,
      toUserId,
      direction,
      technicalSkills,
      communication,
      teamwork,
      overallRating: Number(overallRating),
      comment: comment || '',
    });

    // Step 6: Send notification to recipient
    await notify({
      userId: toUserId,
      type: 'FEEDBACK_RECEIVED',
      title: 'New Internship Feedback',
      message: `You received new feedback for ${internship.title}.`,
      metadata: { feedbackId: feedback._id, applicationId },
    });

    // Step 7: Log activity for audit trail
    await logActivity({
      actor: req.user,
      action: 'INTERNSHIP_FEEDBACK_SUBMITTED',
      entityType: 'InternshipFeedback',
      entityId: feedback._id,
      details: { applicationId, direction },
    });

    res.status(201).json(feedback);
    
  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ 
      message: 'Failed to submit feedback', 
      error: err.message 
    });
  }
};

/**
 * GET /api/feedback/application/:applicationId
 * Fetch all feedback for a specific application (both directions)
 * Access: Student, Company owner, Admins
 */
const getFeedbackForApplication = async (req, res) => {
  try {
    // Fetch and validate application
    const app = await Application.findById(req.params.applicationId)
      .populate('internshipId');
    
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Fetch internship
    const internship = await Internship.findById(
      app.internshipId?._id || app.internshipId
    );
    
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Authorization check
    const allowed =
      app.studentId.toString() === req.user._id.toString() ||
      internship.companyId.toString() === req.user._id.toString() ||
      ['system_admin', 'university_admin'].includes(req.user.role);

    if (!allowed) {
      return res.status(403).json({ 
        message: 'You do not have permission to view this feedback.' 
      });
    }

    // Fetch feedback
    const feedback = await InternshipFeedback.find({ 
      applicationId: req.params.applicationId 
    })
      .populate('fromUserId', 'name role')
      .sort({ createdAt: -1 });

    res.json(feedback);
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch feedback', 
      error: err.message 
    });
  }
};

/**
 * GET /api/feedback/my
 * Fetch all feedback received by the current user
 * Access: Authenticated users (student or company)
 */
const getMyFeedback = async (req, res) => {
  try {
    const feedback = await InternshipFeedback.find({ toUserId: req.user._id })
      .populate('internshipId', 'title companyName')
      .populate('fromUserId', 'name role')
      .sort({ createdAt: -1 });

    res.json(feedback);
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch feedback', 
      error: err.message 
    });
  }
};

/**
 * GET /api/feedback/student/eligible
 * Get internship applications eligible for feedback (Student only)
 * Returns applications where:
 *   - Student is the applicant
 *   - Status is 'Selected' OR interviewStatus is 'Completed'/'Selected'
 *   - Student hasn't already submitted feedback
 */
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

    // Find which applications student already gave feedback on
    const submittedFeedback = await InternshipFeedback.find({
      fromUserId: req.user._id,
      direction: 'student_to_company',
    }).select('applicationId');

    const submittedIds = new Set(
      submittedFeedback.map((item) => item.applicationId.toString())
    );
    
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
    res.status(500).json({ 
      message: 'Failed to fetch eligible feedback applications', 
      error: err.message 
    });
  }
};

/**
 * GET /api/feedback/student/community
 * Get community feedback (all students' experience feedback)
 * Access: Authenticated students
 * 
 * Returns student_to_company feedback to help other students research companies
 */
const getStudentCommunityFeedback = async (req, res) => {
  try {
    const feedback = await InternshipFeedback.find({ 
      direction: 'student_to_company' 
    })
      .populate('internshipId', 'title companyName')
      .populate('fromUserId', 'name role')
      .populate('applicationId', 'status interviewStatus appliedAt')
      .sort({ createdAt: -1 });

    res.json(feedback);
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch community feedback', 
      error: err.message 
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackForApplication,
  getMyFeedback,
  getEligibleStudentApplications,
  getStudentCommunityFeedback,
};
```

---

## 2. API Request/Response Examples

### Example 1: Company Submits Performance Feedback

#### Request
```bash
POST /api/feedback
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "applicationId": "507f1f77bcf86cd799439011",
  "technicalSkills": 4,
  "communication": 5,
  "teamwork": 4,
  "overallRating": 4,
  "comment": "Strong technical foundation. Excellent problem-solving skills. Showed great initiative in the backend optimization project. Ready for more complex tasks."
}
```

#### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "internshipId": "507f1f77bcf86cd799439000",
  "applicationId": "507f1f77bcf86cd799439011",
  "fromUserId": "507f1f77bcf86cd799438888",
  "toUserId": "507f1f77bcf86cd799438999",
  "direction": "company_to_student",
  "technicalSkills": 4,
  "communication": 5,
  "teamwork": 4,
  "overallRating": 4,
  "comment": "Strong technical foundation. Excellent problem-solving skills...",
  "createdAt": "2024-04-22T10:30:00.000Z",
  "updatedAt": "2024-04-22T10:30:00.000Z",
  "__v": 0
}
```

---

### Example 2: Student Submits Experience Feedback

#### Request
```bash
POST /api/feedback
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "applicationId": "507f1f77bcf86cd799439011",
  "overallRating": 5,
  "comment": "Excellent mentorship from the team. Great learning opportunity with cutting-edge technologies. Company culture is very supportive and collaborative."
}
```

#### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "internshipId": "507f1f77bcf86cd799439000",
  "applicationId": "507f1f77bcf86cd799439011",
  "fromUserId": "507f1f77bcf86cd799438999",
  "toUserId": "507f1f77bcf86cd799438888",
  "direction": "student_to_company",
  "technicalSkills": null,
  "communication": null,
  "teamwork": null,
  "overallRating": 5,
  "comment": "Excellent mentorship from the team...",
  "createdAt": "2024-04-22T11:45:00.000Z",
  "updatedAt": "2024-04-22T11:45:00.000Z",
  "__v": 0
}
```

---

### Example 3: Get All Feedback for Application

#### Request
```bash
GET /api/feedback/application/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "direction": "company_to_student",
    "fromUserId": {
      "_id": "507f1f77bcf86cd799438888",
      "name": "TechCorp Inc",
      "role": "company"
    },
    "technicalSkills": 4,
    "communication": 5,
    "teamwork": 4,
    "overallRating": 4,
    "comment": "Strong technical foundation...",
    "createdAt": "2024-04-22T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "direction": "student_to_company",
    "fromUserId": {
      "_id": "507f1f77bcf86cd799438999",
      "name": "John Doe",
      "role": "student"
    },
    "overallRating": 5,
    "comment": "Excellent mentorship...",
    "createdAt": "2024-04-22T11:45:00.000Z"
  }
]
```

---

### Example 4: Get Community Feedback

#### Request
```bash
GET /api/feedback/student/community
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "direction": "student_to_company",
    "internshipId": {
      "_id": "507f1f77bcf86cd799439000",
      "title": "Full Stack Developer Intern",
      "companyName": "TechCorp Inc"
    },
    "fromUserId": {
      "_id": "507f1f77bcf86cd799438999",
      "name": "John Doe",
      "role": "student"
    },
    "overallRating": 5,
    "comment": "Excellent mentorship. Great learning opportunity.",
    "applicationId": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "Selected",
      "interviewStatus": "Selected",
      "appliedAt": "2024-03-15T08:00:00.000Z"
    },
    "createdAt": "2024-04-22T11:45:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "direction": "student_to_company",
    "internshipId": {
      "_id": "507f1f77bcf86cd799439001",
      "title": "Data Analyst Intern",
      "companyName": "DataCorp Ltd"
    },
    "fromUserId": {
      "_id": "507f1f77bcf86cd799439100",
      "name": "Jane Smith",
      "role": "student"
    },
    "overallRating": 3,
    "comment": "Good experience but heavy workload. Limited mentoring.",
    "applicationId": {
      "_id": "507f1f77bcf86cd799439012",
      "status": "Selected",
      "interviewStatus": "Completed",
      "appliedAt": "2024-02-20T09:00:00.000Z"
    },
    "createdAt": "2024-04-21T14:20:00.000Z"
  }
]
```

---

## 3. Frontend Implementation Examples

### Example 1: Company Submitting Feedback

```javascript
// CompanyInsights.jsx
import React, { useState } from 'react';
import axios from 'axios';

function CompanyFeedbackForm() {
  const [feedbackForm, setFeedbackForm] = useState({
    applicationId: '',
    technicalSkills: 4,
    communication: 4,
    teamwork: 4,
    overallRating: 4,
    comment: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setFeedbackForm((prev) => ({
      ...prev,
      [field]: field.includes('Rating') || field.includes('Skills') 
        ? Number(value) 
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!feedbackForm.applicationId) {
      setError('Please select an application');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/feedback', feedbackForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Feedback submitted successfully!');
      setFeedbackForm({
        applicationId: '',
        technicalSkills: 4,
        communication: 4,
        teamwork: 4,
        overallRating: 4,
        comment: '',
      });

      // Refresh data or redirect
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit feedback'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <h2>Internship Performance Feedback</h2>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="form-group">
        <label>Select Student Application *</label>
        <select
          value={feedbackForm.applicationId}
          onChange={(e) => handleChange('applicationId', e.target.value)}
          required
        >
          <option value="">Choose an application...</option>
          {/* Options populated from applications list */}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Technical Skills (1-5) *</label>
          <input
            type="number"
            min="1"
            max="5"
            value={feedbackForm.technicalSkills}
            onChange={(e) => handleChange('technicalSkills', e.target.value)}
          />
          <span className="rating-label">
            {feedbackForm.technicalSkills === 5
              ? 'Excellent'
              : feedbackForm.technicalSkills >= 4
              ? 'Good'
              : 'Needs improvement'}
          </span>
        </div>

        <div className="form-group">
          <label>Communication (1-5) *</label>
          <input
            type="number"
            min="1"
            max="5"
            value={feedbackForm.communication}
            onChange={(e) => handleChange('communication', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Teamwork (1-5) *</label>
          <input
            type="number"
            min="1"
            max="5"
            value={feedbackForm.teamwork}
            onChange={(e) => handleChange('teamwork', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Overall Rating (1-5) *</label>
        <input
          type="number"
          min="1"
          max="5"
          value={feedbackForm.overallRating}
          onChange={(e) => handleChange('overallRating', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Additional Comments</label>
        <textarea
          rows="4"
          value={feedbackForm.comment}
          onChange={(e) => handleChange('comment', e.target.value)}
          placeholder="Provide constructive feedback..."
        />
      </div>

      <button type="submit" className="btn-primary">
        Submit Feedback
      </button>
    </form>
  );
}

export default CompanyFeedbackForm;
```

---

### Example 2: Student Viewing & Submitting Feedback

```javascript
// StudentFeedbackPortal.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StudentFeedbackPortal() {
  const [eligibleApps, setEligibleApps] = useState([]);
  const [communityFeedback, setCommunityFeedback] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [form, setForm] = useState({
    applicationId: '',
    overallRating: 4,
    comment: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortal();
  }, []);

  const loadPortal = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [eligibleRes, communityRes] = await Promise.all([
        axios.get('/api/feedback/student/eligible', { headers }),
        axios.get('/api/feedback/student/community', { headers }),
      ]);

      setEligibleApps(eligibleRes.data || []);
      setCommunityFeedback(communityRes.data || []);
    } catch (err) {
      setError('Failed to load feedback portal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!form.applicationId) {
      setError('Please select an application');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/feedback', form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reset form
      setForm({ applicationId: '', overallRating: 4, comment: '' });
      
      // Reload data
      loadPortal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="feedback-portal">
      <h1>Internship Feedback Portal</h1>

      {error && <div className="alert error">{error}</div>}

      {/* Eligible Applications Section */}
      <section className="eligible-section">
        <h2>Submit Your Feedback</h2>
        <p className="subtitle">
          Share your experience about completed internships
        </p>

        {eligibleApps.length === 0 ? (
          <p className="no-data">
            No eligible applications. You'll be able to provide feedback after
            completing an internship.
          </p>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="feedback-form">
            <div className="form-group">
              <label>Select Internship *</label>
              <select
                value={form.applicationId}
                onChange={(e) =>
                  setForm({ ...form, applicationId: e.target.value })
                }
                required
              >
                <option value="">Choose an internship...</option>
                {eligibleApps.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.internshipId?.title} - {app.internshipId?.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>How would you rate your experience? (1-5) *</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`star ${
                      form.overallRating >= num ? 'active' : ''
                    }`}
                    onClick={() =>
                      setForm({ ...form, overallRating: num })
                    }
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Tell us about your experience</label>
              <textarea
                rows="4"
                value={form.comment}
                onChange={(e) =>
                  setForm({ ...form, comment: e.target.value })
                }
                placeholder="Share what you learned, team dynamics, mentorship quality..."
              />
            </div>

            <button type="submit" className="btn-primary">
              Submit Feedback
            </button>
          </form>
        )}
      </section>

      {/* Community Feedback Section */}
      <section className="community-section">
        <h2>Community Feedback</h2>
        <p className="subtitle">
          See what other students experienced at these companies
        </p>

        {communityFeedback.length === 0 ? (
          <p className="no-data">No feedback yet</p>
        ) : (
          <div className="feedback-list">
            {communityFeedback.map((feedback) => (
              <div key={feedback._id} className="feedback-card">
                <div className="feedback-header">
                  <h3>{feedback.internshipId?.title}</h3>
                  <span className="company">
                    {feedback.internshipId?.companyName}
                  </span>
                </div>
                <div className="feedback-rating">
                  {'★'.repeat(feedback.overallRating)}
                  {'☆'.repeat(5 - feedback.overallRating)} (
                  {feedback.overallRating}/5)
                </div>
                <p className="feedback-comment">{feedback.comment}</p>
                <span className="feedback-date">
                  by {feedback.fromUserId?.name} •{' '}
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default StudentFeedbackPortal;
```

---

## 4. Complete End-to-End Workflow

### Full Workflow with Timestamps

```
TIME: 2024-04-15 09:00 AM
─────────────────────────
ACTION: Student completes internship
EVENT: Application.status = "Selected"

DATABASE STATE:
  Application {
    _id: "507f1f77bcf86cd799439011",
    studentId: "student_001",
    internshipId: "internship_001",
    status: "Selected",
    interviewStatus: "Completed"
  }


TIME: 2024-04-22 10:00 AM
──────────────────────────
ACTION: Company prepares feedback
STEP 1: Company logs in to CompanyInsights
STEP 2: Selects student application
STEP 3: Fills feedback form:
  - Technical Skills: 4/5
  - Communication: 5/5
  - Teamwork: 4/5
  - Overall Rating: 4/5
  - Comment: "Great problem solver, needs more documentation skills"

STEP 4: Clicks Submit Feedback


TIME: 2024-04-22 10:00:15 AM
──────────────────────────────
ACTION: Backend processes feedback submission
STEP 1: Verify authentication ✓
STEP 2: Parse request body ✓
STEP 3: Validate required fields ✓
STEP 4: Fetch application ✓
STEP 5: Fetch internship ✓
STEP 6: Check authorization (company owns internship) ✓
STEP 7: Determine direction = "company_to_student"
STEP 8: Check duplicate (not found) ✓
STEP 9: Create InternshipFeedback document
STEP 10: Send notification
STEP 11: Log activity
STEP 12: Return 201 Created

DATABASE STATE:
  InternshipFeedback {
    _id: "feedback_001",
    applicationId: "507f1f77bcf86cd799439011",
    internshipId: "internship_001",
    fromUserId: "company_001",
    toUserId: "student_001",
    direction: "company_to_student",
    technicalSkills: 4,
    communication: 5,
    teamwork: 4,
    overallRating: 4,
    comment: "Great problem solver...",
    createdAt: "2024-04-22T10:00:15.000Z"
  }

  Notification {
    type: "FEEDBACK_RECEIVED",
    userId: "student_001",
    message: "You received new feedback for Full Stack Developer"
  }

  ActivityLog {
    actor: "company_001",
    action: "INTERNSHIP_FEEDBACK_SUBMITTED",
    entityId: "feedback_001"
  }


TIME: 2024-04-22 10:15 AM
──────────────────────────
ACTION: Student receives notification
EVENT: Browser notification OR Email notification received
ACTION: Student clicks on notification
RESULT: Redirected to feedback detail view


TIME: 2024-04-22 10:30 AM
──────────────────────────
ACTION: Student reads feedback
DISPLAY:
  From: TechCorp Inc (Company)
  ├─ Technical Skills: ★★★★☆ (4/5)
  ├─ Communication: ★★★★★ (5/5)
  ├─ Teamwork: ★★★★☆ (4/5)
  ├─ Overall: ★★★★☆ (4/5)
  └─ Comment: "Great problem solver, needs more documentation skills"


TIME: 2024-04-22 11:00 AM
──────────────────────────
ACTION: Student decides to submit counter-feedback
STEP 1: Student navigates to Feedback Portal
STEP 2: Sees eligible applications (this one is eligible)
STEP 3: Fills feedback form:
  - Overall Rating: 5/5
  - Comment: "Excellent mentorship, learned React in depth"

STEP 4: Clicks Submit Feedback


TIME: 2024-04-22 11:00:30 AM
──────────────────────────────
ACTION: Backend processes student feedback
(Same validation process)

DATABASE STATE:
  InternshipFeedback {
    _id: "feedback_002",
    applicationId: "507f1f77bcf86cd799439011",
    internshipId: "internship_001",
    fromUserId: "student_001",
    toUserId: "company_001",
    direction: "student_to_company",
    overallRating: 5,
    comment: "Excellent mentorship...",
    createdAt: "2024-04-22T11:00:30.000Z"
  }


TIME: 2024-04-22 11:30 AM
──────────────────────────
ACTION: Future student researches companies
STEP 1: Future student visits Feedback Portal
STEP 2: Searches for "TechCorp"
STEP 3: Sees community feedback:
  └─ Student feedback: "Excellent mentorship, learned React in depth" (5/5)
STEP 4: Uses this info to make informed application decision
```

---

## 5. Testing Scenarios & Test Cases

### Test Case 1: Company Submits Valid Feedback

```javascript
// Test: Company submits valid feedback
describe('Company Feedback Submission', () => {
  test('Company can submit feedback on student', async () => {
    const payload = {
      applicationId: app._id,
      technicalSkills: 4,
      communication: 5,
      teamwork: 4,
      overallRating: 4,
      comment: 'Great work',
    };

    const response = await request(server)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${companyToken}`)
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.direction).toBe('company_to_student');
    expect(response.body.fromUserId.toString()).toBe(company._id.toString());
    expect(response.body.toUserId.toString()).toBe(student._id.toString());
  });
});
```

---

### Test Case 2: Student Cannot Submit Feedback Before Completion

```javascript
describe('Student Feedback Restrictions', () => {
  test('Student cannot submit feedback if internship not completed', async () => {
    // Create pending application
    const pendingApp = await Application.create({
      studentId: student._id,
      internshipId: internship._id,
      status: 'Pending',
    });

    const payload = {
      applicationId: pendingApp._id,
      overallRating: 5,
      comment: 'Test',
    };

    const response = await request(server)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(payload)
      .expect(400);

    expect(response.body.message).toContain('completed');
  });
});
```

---

### Test Case 3: Prevent Duplicate Feedback

```javascript
describe('Duplicate Prevention', () => {
  test('Cannot submit feedback twice from same direction', async () => {
    const payload = {
      applicationId: app._id,
      technicalSkills: 4,
      communication: 5,
      teamwork: 4,
      overallRating: 4,
      comment: 'First feedback',
    };

    // First submission
    await request(server)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${companyToken}`)
      .send(payload)
      .expect(201);

    // Second submission (same company, same application)
    const response = await request(server)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ ...payload, comment: 'Second feedback' })
      .expect(400);

    expect(response.body.message).toContain('already submitted');
  });
});
```

---

### Test Case 4: Authorization Check

```javascript
describe('Authorization', () => {
  test('Company cannot submit feedback for other company's internship', async () => {
    const otherCompany = await User.create({...});
    const otherInternship = await Internship.create({
      companyId: otherCompany._id,
      ...
    });

    const payload = {
      applicationId: app._id,
      technicalSkills: 4,
      communication: 5,
      teamwork: 4,
      overallRating: 4,
      comment: 'Test',
    };

    const response = await request(server)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${companyToken}`)
      .send(payload)
      .expect(403);

    expect(response.body.message).toContain('Unauthorized');
  });
});
```

---

## 6. Troubleshooting Guide

### Issue 1: "Feedback already submitted"

**Problem:** Getting 400 error when trying to submit feedback

**Causes:**
1. User already submitted feedback for this application
2. Database has duplicate record

**Solution:**
```javascript
// Check existing feedback
db.collection('internshipfeedbacks').findOne({
  applicationId: ObjectId("..."),
  direction: 'company_to_student',
  fromUserId: ObjectId("...")
});

// If duplicate exists, admin can delete:
db.collection('internshipfeedbacks').deleteOne({
  _id: ObjectId("...")
});
```

---

### Issue 2: "Feedback is only available after internship completed"

**Problem:** Student cannot submit feedback even though internship is done

**Causes:**
1. Application status is not 'Selected'
2. Interview status is not 'Completed' or 'Selected'

**Solution:**
```javascript
// Check application status
db.collection('applications').findOne({
  _id: ObjectId("...")
});

// Update status if needed (admin only)
db.collection('applications').updateOne(
  { _id: ObjectId("...") },
  { $set: { status: 'Selected' } }
);
```

---

### Issue 3: Notification Not Received

**Problem:** User didn't get notification after feedback submission

**Causes:**
1. Notification service not running
2. User's notification preferences disabled
3. Email service down

**Solution:**
```javascript
// Check notification creation
db.collection('notifications').find({
  type: 'FEEDBACK_RECEIVED'
}).sort({ createdAt: -1 }).limit(5);

// Check notification service logs
tail -f logs/notification-service.log
```

---

## Summary

The Internship Performance Feedback System provides:

✅ **Structured Feedback**: Technical skills, communication, teamwork, overall rating
✅ **Bidirectional Flow**: Company and student perspectives
✅ **Community Learning**: Students see aggregated experiences
✅ **Security**: Authorization, duplicate prevention, completion verification
✅ **Transparency**: Activity logging and audit trails
✅ **Notifications**: Real-time alerts for recipients

**Future Enhancements:**
- Integrate into matching algorithm for credibility boost
- Sentiment analysis on comments
- Appeal/response mechanism
- Automated quality flags
