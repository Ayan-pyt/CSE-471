# Testing Guide: Market Trend & NLP Candidate Ranking APIs

## Overview
- **API 1**: Market Trend & Job Data API (Adzuna) - Live job market analysis
- **API 2**: NLP Candidate Ranking API (Affinda) - Smart recommendation scoring from CVs

---

## 🧪 TEST 1: Market Trend API (Adzuna Job Feed)

### Option A: Test via Frontend (Student Insights Page)

**Steps:**
1. **Login as Student** → Go to `/student-insights` page
2. **View "What the market wants right now"** section
3. **You'll see:**
   - Most requested technical skills (bar chart)
   - Emerging skill trends (tags)
   - Department-wise skill demand gaps

**What's happening behind the scenes:**
- Frontend calls `GET /api/analytics/market-skill-trends`
- Backend fetches synced Adzuna jobs from `ExternalJobPost` collection
- Extracts and counts skills from all fetched jobs
- Returns demand rankings

### Option B: Manual Frontend API Test (Browser Console)

Open **Developer Console** (F12) and run:

```javascript
// Get market skill trends
fetch('/api/analytics/market-skill-trends', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => console.log('Market Trends:', data))
.catch(err => console.error('Error:', err));
```

**Expected Response:**
```json
{
  "mostRequestedTechnicalSkills": [
    { "skill": "react", "count": 18 },
    { "skill": "node.js", "count": 15 },
    { "skill": "mongodb", "count": 11 }
  ],
  "emergingSkillTrends": [...],
  "departmentWiseSkillDemandGap": [
    {
      "department": "CSE",
      "topMissingSkills": [
        { "skill": "react", "count": 18 },
        { "skill": "typescript", "count": 9 }
      ]
    }
  ]
}
```

### Option C: Trigger Manual Job Sync (Admin/Company)

**For testing: Manually trigger sync to pull latest jobs**

**From Console:**
```javascript
fetch('/api/analytics/market/sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(data => console.log('Sync Result:', data))
.catch(err => console.error('Error:', err));
```

**Expected Response:**
```json
{
  "message": "External market job sync initiated",
  "syncResult": {
    "fetched": 100,
    "upserted": 45,
    "query": "software intern",
    "pages": 2,
    "resultsPerPage": 50
  }
}
```

### Test Checklist for API 1:
- ✅ StudentInsights page loads market trends
- ✅ Skills are ranked by frequency
- ✅ Departments show missing skills
- ✅ Trends match current job market demand
- ✅ Manual sync endpoint returns job counts

---

## 🧪 TEST 2: NLP Candidate Ranking API (Affinda CV Analysis)

### Overview
The NLP API works through the candidate ranking/shortlist system:
1. Student uploads CV → Affinda extracts skills
2. Skills cached on student profile
3. When company views applicants → Recommendation score includes NLP bonus
4. Auto-shortlist ranks candidates using NLP signals

### Option A: Test via Frontend (Complete Flow)

**Step 1: Student Uploads CV**
1. Login as **Student**
2. Go to `/student-dashboard` → **Profile** section
3. Upload a **PDF resume**
4. System calls Affinda API → extracts skills
5. Check console for success message

**Expected:**
- ✅ CV uploaded and parsed successfully
- ✅ Extracted skills shown
- ✅ Skills cached in profile

**Step 2: Apply to Internship**
1. Go to `/internships` → find a posting
2. Click **Apply**
3. Application stores match + recommendation score with NLP bonus

**Step 3: Company Views Applicants (Tests Ranking)**
1. Login as **Company** who created the internship
2. Go to `/company-dashboard` → **My Internships** → click an internship
3. View **Applicants** section
4. Click **View Details** to see ranking

**What you'll see:**
```
Rank  | Name        | Match Score | Recommendation Score | NLP Bonus
------|-------------|-------------|----------------------|----------
1     | Alice       | 85%         | 92.5 (↑10 NLP)      | ✓ CV skills matched
2     | Bob         | 75%         | 78.0 (↑5 NLP)       | ✓ Some CV match
3     | Charlie     | 70%         | 70.0 (no NLP)       | ✗ No CV uploaded
```

**Step 4: Auto-Shortlist with NLP (Best Test)**
1. Still in **View Applicants**
2. Click **Auto-Shortlist Top Candidates** button
3. Set:
   - Top N: **3**
   - Minimum Recommendation Score: **70**
4. Click **Shortlist**

**Result:**
- ✅ Only candidates with NLP-boosted scores get shortlisted
- ✅ CV-uploaded students rank higher
- ✅ Notifications sent to selected candidates

### Option B: Manual Frontend API Test (Browser Console)

**Test 1: Upload CV and Extract Skills**

```javascript
const formData = new FormData();
const fileInput = document.querySelector('input[type="file"]');
if (fileInput?.files[0]) {
  formData.append('cv', fileInput.files[0]);
  
  fetch('/api/cv/upload-cv', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: formData
  })
  .then(r => r.json())
  .then(data => {
    console.log('CV Upload Result:', data);
    console.log('Extracted Skills:', data.extractedSkills);
    console.log('CV Insights:', data.cvInsights);
  });
}
```

**Test 2: View Applicants for an Internship (Ranked by NLP Score)**

```javascript
const internshipId = 'YOUR_INTERNSHIP_ID'; // Replace with real ID

fetch(`/api/application/internship/${internshipId}`, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(applicants => {
  console.log('Applicants (ranked by NLP-boosted score):');
  applicants.forEach(app => {
    console.log({
      name: app.studentId?.name,
      rank: app.rank,
      matchScore: app.matchScore,
      recommendationScore: app.recommendationScore,
      nlpBonus: app.skillGapReport?.semanticNlpBonus,
      cvExtracted: app.studentProfile?.cvInsights?.extractedSkills?.length || 0
    });
  });
});
```

**Test 3: Trigger Auto-Shortlist**

```javascript
const internshipId = 'YOUR_INTERNSHIP_ID';

fetch(`/api/application/internship/${internshipId}/auto-shortlist`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topN: 3,
    minimumRecommendationScore: 70
  })
})
.then(r => r.json())
.then(data => {
  console.log('Shortlist Result:', data);
  console.log(`${data.shortlistedApplicationIds.length} candidates shortlisted`);
});
```

### Option C: Test with cURL (Command Line)

**1. Upload CV:**
```bash
curl -X POST http://localhost:5000/api/cv/upload-cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cv=@/path/to/resume.pdf"
```

**Expected:**
```json
{
  "message": "CV uploaded and parsed successfully",
  "cvUrl": "/uploads/user_id-timestamp.pdf",
  "extractedSkills": ["React", "Node.js", "MongoDB", "Python"],
  "cvInsights": {
    "provider": "affinda",
    "extractedSkills": ["React", "Node.js", "MongoDB", "Python"],
    "analyzedAt": "2026-04-27T..."
  }
}
```

**2. Get Ranked Applicants:**
```bash
curl -X GET "http://localhost:5000/api/application/internship/INTERNSHIP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Auto-Shortlist:**
```bash
curl -X POST "http://localhost:5000/api/application/internship/INTERNSHIP_ID/auto-shortlist" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topN": 3,
    "minimumRecommendationScore": 70
  }'
```

### Test Checklist for API 2:
- ✅ Student can upload PDF CV
- ✅ Affinda extracts skills successfully
- ✅ Skills cached in student profile
- ✅ Recommendation score increased by NLP bonus (up to +10 points)
- ✅ Applicants ranked with CV-uploaded students higher
- ✅ Auto-shortlist uses NLP-boosted scores
- ✅ Students without CVs don't get NLP bonus
- ✅ All applicants still ranked (NLP is bonus, not gate)

---

## 📊 Comparison: Before vs After NLP

### Score Calculation

**Before NLP:**
```
Recommendation Score = (Match Score × 0.75) + (CGPA Score × 0.25) + Verified Badge Bonus (0-8)
Max: 100
```

**After NLP (Now):**
```
Recommendation Score = (Match Score × 0.75) + (CGPA Score × 0.25) + Verified Badge Bonus (0-8) + NLP Semantic Bonus (0-10)
Max: 110 (capped at 100)
```

**NLP Semantic Bonus Calculation:**
- Matches skills found in CV against required skills
- Bonus = (CV Matched Skills / Required Skills) × 10
- Maximum +10 points for perfect CV match
- 0 points if no CV uploaded

---

## 🐛 Troubleshooting

### Market Trend API Issues

**Problem: "No market trend data"**
- Solution: Run manual sync first: `POST /api/analytics/market/sync`
- Check: Is `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` set in `.env`?

**Problem: Skills not extracting from jobs**
- Solution: Check Adzuna API response format
- Run: `console.log('Raw jobs:', marketTrends)` to see API structure

### NLP Candidate Ranking Issues

**Problem: "Failed to parse CV"**
- Solution: Ensure file is valid PDF
- Check: Is `AFFINDA_API_KEY` set in `.env`?
- Verify: PDF is under 10MB

**Problem: No NLP bonus appearing**
- Solution: Confirm CV uploaded successfully and skills extracted
- Check: Student profile has `cvInsights` field populated
- Test: `fetch('/api/student/profile/me')` to see CV insights

**Problem: Applicants not ranking correctly**
- Solution: Ensure all applicants have the same internship
- Check: Recalculation happens when viewing applicants list
- Verify: `requireSkills` are set on internship posting

---

## 📋 Complete Testing Scenario

### Scenario: Full workflow test

**User 1 (Student Alice):**
1. Register and login
2. Complete profile (CGPA: 3.8, Skills: ["React", "Node.js"])
3. Upload CV → Affinda extracts: ["React", "Node.js", "MongoDB", "Docker", "AWS"]
4. Browse internships → Apply to "Full Stack Developer" internship

**User 2 (Company)**
1. Register and login as company
2. Create internship posting with required skills:
   - React (weight: 3)
   - Node.js (weight: 3)
   - MongoDB (weight: 2)
   - AWS (weight: 2)
3. View applicants for the internship
4. See Alice ranked #1 with NLP bonus from CV
5. Auto-shortlist top 1 candidate

**Expected Result:**
- Alice's recommendation score = ~95+ (includes +5 NLP bonus from CV match)
- Alice gets shortlisted
- Alice receives notification

---

## 🎯 Key Metrics to Verify

| Metric | API 1 (Market) | API 2 (NLP) |
|--------|----------------|------------|
| API Response Time | < 500ms | < 1000ms (includes NLP) |
| Skills Extracted | 10+ unique skills | Per CV file |
| Accuracy | Market matches Adzuna | CV skill extraction accurate |
| Update Frequency | Every 6 hours (default) | On upload |
| Cache Status | MongoDB ExternalJobPost | StudentProfile.cvInsights |

---

## 📝 Notes

- Both APIs require valid credentials in `.env`
- Market API syncs on server startup + periodic schedule
- NLP API runs on-demand when student uploads CV
- Both integrate seamlessly into existing ranking system
- No breaking changes to frontend/API contracts
