# Module 1: Student Profile & Skill Management

## Overview
This module handles student profile creation, management, and skill data organization for the IntelliMatch internship matching platform.

## Features

### 1. Student Profile Management
- **Create Profile**: Students can create their academic profiles with:
  - Personal information (Name, CGPA, Department, Graduation Year)
  - Certifications and Projects
  - Technical Skills with proficiency levels

- **Update Profile**: Modify existing profile information
  - Update CGPA, certifications, projects
  - Add/remove skills with different proficiency levels
  - Secure updates (no direct access to other users' profiles)

- **Retrieve Profile**: Get profile data
  - Personal profile retrieval (`/api/student/profile/me`)
  - Other student profiles with permission checks

### 2. Skill Management
- **Skill Structure**:
  ```javascript
  {
    name: String,              // Skill name (required)
    proficiency: String,       // Beginner, Intermediate, Advanced, Expert
    endorsements: Number,      // Count of endorsements
    addedAt: Date             // When skill was added
  }
  ```

- **GitHub Skills Import**:
  - Automatically extract skills from GitHub profile
  - Analyze programming languages used
  - Extract topics from repositories
  - Merge with existing skills (avoid duplicates)
  - Track GitHub profile info

### 3. Verified Skills System
- Store verified skills with:
  - Badge levels (gold, silver, bronze)
  - Verification source (certification, project_review, internship_performance, manual)
  - Verified by (admin/verifier reference)
  - Notes and verification date

## File Structure

```
backend/
├── models/
│   └── StudentProfile.js       # Schema for student profiles
├── controllers/
│   └── StudentController.js    # Business logic for student operations
├── routes/
│   └── studentRoutes.js        # API endpoints
└── utils/
    └── githubService.js        # GitHub integration
```

## API Endpoints

### POST `/api/student/profile`
Create a new student profile

**Request Body:**
```json
{
  "name": "John Doe",
  "cgpa": 3.8,
  "department": "Computer Science",
  "graduationYear": 2024,
  "certifications": ["AWS Certified", "Google Cloud"],
  "projects": ["E-commerce Platform", "AI Chatbot"],
  "skills": ["React", "Node.js", "MongoDB", "Python"]
}
```

### PUT `/api/student/profile`
Update student profile

**Request Body:** (Same as POST, any field is optional)

### GET `/api/student/profile/me`
Get own student profile

### GET `/api/student/profile/:id`
Get a specific student profile by user ID

### POST `/api/student/github-skills/:githubUsername`
Import skills from GitHub profile

**Response:**
```json
{
  "message": "Skills imported from GitHub successfully",
  "importedCount": 5,
  "totalSkills": 12,
  "profile": { ... },
  "fetchedSkills": [ ... ]
}
```

## Database Schema Details

### StudentProfile Schema

| Field | Type | Description |
|-------|------|-------------|
| userId | ObjectId (ref: User) | Reference to user account |
| name | String | Student name |
| cgpa | Number (0-4) | Cumulative GPA |
| department | String | Academic department |
| graduationYear | Number | Expected graduation year |
| certifications | [String] | List of certifications |
| projects | [String] | List of projects |
| skills | [Object] | Technical skills with proficiency |
| githubProfile | Object | GitHub profile info |
| verifiedSkills | [Object] | Skills verified by admin |
| cvUrl | String | URL to uploaded CV file |
| timestamps | Date | Created/Updated dates |

## Key Features Implemented

✅ **Create & Update**: Full CRUD operations for student profiles
✅ **Skill Management**: Add, update, and manage technical skills
✅ **GitHub Integration**: Automatic skill extraction from GitHub
✅ **Skill Verification**: Verified skills with badge system
✅ **Data Validation**: Input validation and error handling
✅ **Security**: User authentication and authorization checks

## Integration with Other Modules

- **Module 2**: Skills are used in AI-Based Skill Matching Engine
- **Module 3**: Profile data displayed in Dashboard & Analytics
- **Notifications**: Profile updates can trigger notifications

## Development Notes

- All endpoints require authentication (JWT token)
- Student can only modify their own profile
- Admin can view/modify any student profile
- GitHub import is optional and incremental (doesn't overwrite existing skills)

## Error Handling

- Returns 400 for invalid input
- Returns 401 for unauthorized access
- Returns 404 for not found resources
- Returns 500 for server errors
- All errors include descriptive messages
