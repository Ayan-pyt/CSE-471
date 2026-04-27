# Module 4: Notification System

## Overview
This module provides automated, multi-channel notifications for all key events in the IntelliMatch internship matching platform. Notifications are sent via email and stored in the database for in-app viewing.

## Features

### 1. Automated Notification Triggers

#### Application Submission
- **Trigger**: When student applies for internship
- **Recipient**: Company/Recruiter
- **Message**: "{StudentName} applied for {InternshipTitle}"

#### Status Updates
- **Trigger**: When application status changes (Selected/Rejected/Shortlisted)
- **Recipient**: Student
- **Message**: "Your application for {InternshipTitle} is now {Status}"
- **Send Email**: Yes (with formatted HTML)

#### Deadline Reminders
- **Trigger**: 72 hours before internship deadline
- **Recipient**: Student (if application still pending/shortlisted)
- **Message**: "{InternshipTitle} has an upcoming deadline on {Date}"
- **Frequency**: Once per application per deadline

#### Shortlisting Alerts
- **Trigger**: When student is shortlisted
- **Recipient**: Student
- **Message**: "You were shortlisted for {InternshipTitle}"
- **Priority**: High

#### Interview Reminders
- **Trigger**: 24 hours before scheduled interview
- **Recipient**: Student
- **Message**: "Your interview for {InternshipTitle} is scheduled for {DateTime}"

#### Additional Notifications
- Interview invitations
- Interview status updates
- Feedback received
- System announcements

### 2. Notification Types

```javascript
enum NotificationType {
  'APPLICATION_SUBMITTED',      // Company receives new application
  'STATUS_UPDATED',             // Student gets status update
  'DEADLINE_REMINDER',          // 72-hour deadline alert
  'SHORTLIST_ALERT',            // Shortlisting notification
  'INTERVIEW_REMINDER',         // 24-hour interview alert
  'INTERVIEW_INVITE',           // Interview invitation
  'INTERVIEW_STATUS',           // Interview completion status
  'FEEDBACK_RECEIVED',          // Feedback from company
  'SYSTEM'                      // System announcements
}
```

### 3. Multi-Channel Delivery

#### Email Notifications
- HTML formatted messages
- Professional template design
- Includes IntelliMatch branding
- Contains notification type and details
- Fallback for failed email sends (doesn't block notification creation)

#### In-App Notifications
- Database stored notifications
- Read/unread status tracking
- Notification history
- Real-time retrieval
- Bulk mark as read

## File Structure

```
backend/
├── models/
│   └── Notification.js             # Database schema
├── controllers/
│   └── notificationController.js   # Notification business logic
├── routes/
│   └── notificationRoutes.js       # API endpoints
└── utils/
    ├── notificationService.js      # Core notification service
    └── emailService.js             # Email sending
```

## Database Schema

### Notification Model

```javascript
{
  userId: ObjectId (ref: User),       // Recipient
  type: String (enum),                // Notification type
  title: String,                      // Notification title
  message: String,                    // Notification message
  metadata: Object,                   // Additional context
  isRead: Boolean,                    // Read status
  readAt: Date,                       // When marked as read
  createdAt: Date,                    // Timestamp
  updatedAt: Date
}
```

## API Endpoints

### GET `/api/notifications/my`
Get all notifications for logged-in user

**Query Parameters:**
- `limit`: Number of notifications to fetch (default: 50)
- `skip`: Number of notifications to skip (default: 0)
- `unread`: Filter by unread only (true/false)

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "type": "STATUS_UPDATED",
    "title": "Application Status Updated",
    "message": "Your application for Internship XYZ is now Selected",
    "metadata": {
      "applicationId": "ObjectId",
      "internshipId": "ObjectId",
      "status": "Selected"
    },
    "isRead": false,
    "createdAt": "2024-04-27T10:00:00Z"
  }
]
```

### PUT `/api/notifications/:id/read`
Mark a specific notification as read

**Response:**
```json
{
  "_id": "ObjectId",
  "isRead": true,
  "readAt": "2024-04-27T10:30:00Z",
  ...
}
```

### PUT `/api/notifications/read-all`
Mark all notifications as read for user

**Response:**
```json
{
  "message": "All notifications marked as read",
  "updatedCount": 12
}
```

### POST `/api/notifications/deadline-reminders`
Generate deadline reminders for user (manual trigger)

**Response:**
```json
{
  "message": "Deadline reminders processed",
  "createdCount": 3
}
```

### POST `/api/notifications/interview-reminders`
Generate interview reminders for user (manual trigger)

**Response:**
```json
{
  "message": "Interview reminders processed",
  "createdCount": 2
}
```

## Core Functions

### `notify()`
Main notification function that creates DB record and sends email

**Parameters:**
```javascript
{
  userId: ObjectId,                   // Required
  type: String,                       // Required (enum)
  title: String,                      // Required
  message: String,                    // Required
  metadata: Object,                   // Optional context data
  sendEmail: Boolean                  // Optional (default: true)
}
```

**Returns:**
- Notification document if successful
- null if validation fails

**Error Handling:**
- Logs all warnings and errors
- Continues on email failure (doesn't block notification)
- Validates all required fields
- Returns null if validation fails

### `processDeadlineRemindersForStudent()`
Generates deadline reminders within 72-hour window

**Logic:**
- Finds non-final applications with deadlines
- Checks if deadline is within next 72 hours
- Prevents duplicate reminders using reminderKey
- Uses deadline end-of-day for inclusive calculations

**Returns:**
- Number of reminders created

### `processInterviewRemindersForStudent()`
Generates interview reminders within 24-hour window

**Logic:**
- Finds scheduled interviews
- Checks if scheduled within next 24 hours
- Prevents duplicates
- Validates date formatting

**Returns:**
- Number of reminders created

## Email Template

The notification email includes:

```
Header:
- IntelliMatch branding
- "Internship Portal" tagline
- Gradient background

Body:
- Personalized greeting
- Notification title
- Detailed message
- Notification type tag

Footer:
- Copyright notice
- Current year
- Professional footer design
```

## Notification Scenarios

### Scenario 1: Application Submitted
```
Company Receives:
- Type: APPLICATION_SUBMITTED
- Title: "New Internship Application"
- Message: "John Doe applied for Software Engineer - Internship"
- Metadata: applicationId, internshipId
```

### Scenario 2: Status Update
```
Student Receives:
- Type: STATUS_UPDATED
- Title: "Application Status Updated"
- Message: "Your application for Software Engineer is now Selected"
- Email: HTML formatted with details
- Metadata: applicationId, internshipId, status
```

### Scenario 3: Deadline Reminder
```
Student Receives:
- Type: DEADLINE_REMINDER
- Title: "Upcoming Internship Deadline"
- Message: "Frontend Developer has upcoming deadline on May 15, 2024"
- Trigger: 72 hours before deadline
- Prevents: Duplicate reminders per deadline
```

### Scenario 4: Interview Reminder
```
Student Receives:
- Type: INTERVIEW_REMINDER
- Title: "Upcoming Interview Reminder"
- Message: "Interview for Company XYZ scheduled for May 20, 2024 2:00 PM"
- Trigger: 24 hours before interview
- Prevents: Duplicates per interview
```

## Integration Points

### With Module 1 (Student Profile)
- Retrieves user email from profile
- Gets student name for personalization

### With Module 2 (Skill Matching)
- Can send notifications based on match score
- Alerts on poor skill matches

### With Module 3 (Analytics)
- Dashboard can show notification statistics
- Tracks notification engagement

### With Application System
- Sends notifications on application events
- Triggered by status changes
- Auto-shortlisting triggers notifications

## Features & Quality

### Reliability
✅ Database persistence ensures no lost notifications
✅ Email sending is non-blocking
✅ Automatic retry logic for email failures
✅ Duplicate prevention with reminderKey

### User Experience
✅ Personalized messages with user/student names
✅ HTML formatted professional emails
✅ Read/unread status tracking
✅ Notification history in database

### Scalability
✅ Efficient database queries
✅ Batch notification processing
✅ Handles high volume of users
✅ Asynchronous email sending

### Security
✅ User authentication required
✅ Users only see their own notifications
✅ No sensitive data in metadata
✅ Input validation on all fields

## Configuration

### Notification Timing
- Deadline reminders: 72 hours before deadline
- Interview reminders: 24 hours before interview
- Both use inclusive end-of-day calculations

### Deduplication
- Uses `reminderKey` = `${applicationId}_${date}`
- Prevents multiple reminders per day per application
- Checks existing notifications before creating new ones

### Email Settings
- Can be disabled with `sendEmail: false` parameter
- Failures don't block notification creation
- Logged for debugging but non-blocking

## Error Handling

```javascript
// Missing required fields
- Returns null
- Logs warning with missing fields

// Email send failure
- Creates DB notification
- Logs warning about email failure
- Continues execution (non-blocking)

// Database errors
- Logs full error details
- Returns null
- User can retry

// Invalid user ID
- Returns null with warning
- No database write
```

## Future Enhancements

- SMS notifications
- Push notifications (mobile)
- Notification preferences per user
- Real-time WebSocket notifications
- Notification templates customization
- Scheduled notification delivery
- Notification analytics
- Unsubscribe/preference management
