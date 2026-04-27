# Module 2: AI-Based Skill Matching Engine

## Overview
This module implements the intelligent skill-based matching algorithm that compares student skills with internship requirements using a weighted matching system.

## Core Algorithm

### Match Score Calculation
```
Match Score = (Sum of Matched Skill Weights / Total Required Skill Weights) × 100
```

### Recommendation Score Formula
```
Recommendation Score = (Match Score × 0.75) + (CGPA Score × 0.25) + Verified Bonus
```

Where:
- **Match Score**: Percentage of required skills that student possesses
- **CGPA Score**: Student's CGPA compared to minimum CGPA requirement
- **Verified Bonus**: Up to +8 points for verified skills (gold/silver/bronze badges)

## Features

### 1. Weighted Skill Matching
- Each required skill has a weight/priority
- Students can have multiple proficiency levels (Beginner, Intermediate, Advanced, Expert)
- Matching is case-insensitive and handles skill name variations
- Deduplicates skills automatically

### 2. CGPA-Based Scoring
- Calculates CGPA score relative to minimum CGPA requirement
- Scales score from 0-100
- Defaults to 100 if no minimum CGPA specified

### 3. Verified Skill Bonus
- Gold badge: +8 points
- Silver badge: +4 points
- Bronze badge: +1 point
- Maximum bonus capped at +8

### 4. Skill Gap Analysis
- Identifies matched skills
- Identifies missing skills
- Provides learning path recommendations
- Suggests certifications and courses

### 5. Completion Ratio
- Tracks proportion of required skills matched
- Useful for ranking candidates

## File Structure

```
backend/
├── utils/
│   ├── matchingEngine.js       # Core matching algorithm
│   └── skillBadgeService.js    # Badge weight calculations
├── models/
│   └── Application.js          # Application schema with matching scores
└── controllers/
    └── applicationController.js # Handle application submissions & matching
```

## Key Functions

### `calculateMatchInsights()`
Main function that performs all matching calculations

**Parameters:**
```javascript
{
  requiredSkills: Array,      // Array of {skill, weight}
  studentSkills: Array,       // Array of student's skills
  verifiedSkills: Array,      // Array of verified skills with badge levels
  cgpa: Number,              // Student's CGPA
  minCGPA: Number,           // Minimum required CGPA
  weights: {                 // Custom weights
    skillWeight: Number,
    cgpaWeight: Number
  }
}
```

**Returns:**
```javascript
{
  matchScore: Number,              // 0-100
  recommendationScore: Number,     // 0-100
  skillGapReport: {
    matchedSkills: Array,
    missingSkills: Array,
    totalRequiredWeight: Number,
    matchedWeight: Number,
    completionRatio: Number,
    verifiedMatchedCount: Number,
    verifiedCredibilityBonus: Number
  }
}
```

### `recommendationForSkill()`
Provides learning resources for missing skills

**Returns:**
Array of recommended courses, certifications, and learning paths

## Learning Paths Database

The system includes curated learning paths for common skills:

- **JavaScript**: freeCodeCamp, Meta Front-End Developer Cert
- **React**: Complete Guide (Udemy), HackerRank
- **Node.js**: Express Bootcamp, Backend APIs (freeCodeCamp)
- **Python**: Python for Everybody, PCAP Certification
- **Java**: Java Masterclass, Oracle Certified Professional
- **Docker**: IBM Essentials, Docker & Kubernetes Complete Guide
- **AWS**: Cloud Practitioner, AWS Certified Developer
- **MongoDB**: University M001, Node.js Developer Path
- **SQL**: Data Science Coursera, Python SQL
- **And more...**

## Integration Points

### With Module 1 (Student Profile)
- Uses student's skills and verified skills
- Retrieves CGPA from student profile
- Considers GitHub profile skills

### With Module 3 (Analytics)
- Match scores used for ranking candidates
- Skill gap data fed to analytics dashboard
- Trending skills identified from match data

### With Application System
- Calculates scores on application submission
- Recalculates dynamically for company shortlisting
- Used for auto-shortlisting feature

## Algorithm Features

### 1. Skill Normalization
- Converts all skill names to lowercase
- Removes extra whitespace
- Handles special characters
- Eliminates empty/null skills

### 2. Deduplication
- Automatically removes duplicate skills
- Maintains order of appearance
- Prevents inflated match scores

### 3. Badge-Based Weighting
- Verified skills get weighted bonuses
- Gold badges have highest weight
- System uses highest badge level if multiple exist

### 4. Flexibility
- Weights are configurable per internship
- Supports both fixed and percentage-based weights
- Adapts to different matching strategies

## Example Usage

```javascript
const { calculateMatchInsights } = require('./matchingEngine');

const result = calculateMatchInsights({
  requiredSkills: [
    { skill: 'React', weight: 2 },
    { skill: 'Node.js', weight: 2 },
    { skill: 'MongoDB', weight: 1.5 },
    { skill: 'AWS', weight: 1 }
  ],
  studentSkills: ['React', 'JavaScript', 'Node.js', 'MySQL'],
  verifiedSkills: [
    { skill: 'React', badgeLevel: 'gold' },
    { skill: 'Node.js', badgeLevel: 'silver' }
  ],
  cgpa: 3.8,
  minCGPA: 3.0,
  weights: {
    skillWeight: 0.75,
    cgpaWeight: 0.25
  }
});

console.log(result);
/*
Output:
{
  matchScore: 60,              // 3 matched skills with weight 6 out of 6.5 total
  recommendationScore: 89.5,   // Includes CGPA + verified bonus
  skillGapReport: {
    matchedSkills: [...],
    missingSkills: [
      {
        skill: 'MongoDB',
        weight: 1.5,
        recommendedLearningPaths: [...]
      },
      {
        skill: 'AWS',
        weight: 1,
        recommendedLearningPaths: [...]
      }
    ],
    completionRatio: 0.9231,
    ...
  }
}
*/
```

## Performance Considerations

- **O(n×m) complexity** where n = required skills, m = student skills
- Uses Set for O(1) lookups of verified skills
- Suitable for real-time calculations
- Efficiently handles 100+ skills per profile

## Ranking Strategy

Candidates ranked by:
1. **Recommendation Score** (primary)
2. **Match Score** (secondary)
3. **CGPA** (tertiary)

This ensures skill fit is prioritized while using CGPA as a tie-breaker.

## Quality Metrics

✅ **Accuracy**: Exact skill matching with normalization
✅ **Fairness**: Verified skills reward credibility, not inflate scores
✅ **Flexibility**: Configurable weights for different internships
✅ **Transparency**: Detailed gap reports for students
✅ **Scalability**: Efficient for large candidate pools

## Error Handling

- Gracefully handles null/undefined skills
- Returns 0 for invalid CGPA inputs
- Caps verification bonus at 8 points
- Validates weight values
