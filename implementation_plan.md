# IntelliMatch Module 1 Implementation Plan

## Goal Description
Build Module 1 of the IntelliMatch platform. This involves setting up a full-stack MERN application with 4 primary features focusing on Student Profiles, Internship Posting, Internship Browsing/Application, and CV parsing for automatic skill extraction.

## User Review Required
> [!IMPORTANT]
> The CV extraction feature requires specific API keys to function fully:
> - **Affinda Resume Parser API**
> - **OpenAI API**
> 
> By default, if keys are not provided, I will build out the API integration logic but use fallback mock data so the frontend flow works. Let me know if you would like me to use mock data temporarily or if you will provide the `.env` API keys for real parsing!
> 
> Also, please confirm if you're okay with standard local MongoDB via a connection string like `mongodb://localhost:27017/intellimatch`.

## Proposed Changes

We will use a standard monorepo-style structure inside `e:\CSE471 PROJECT`:
- `/backend` (Express.js)
- `/frontend` (React + Vite + TailwindCSS)

---
### Backend Project Setup
- We will set up core dependencies including `express`, `mongoose`, `jsonwebtoken`, `cors`, `dotenv`, and `multer`.
#### [NEW] backend/server.js
#### [NEW] backend/middleware/auth.js

---
### Database Models
We will define Mongoose schemas reflecting your hints.
#### [NEW] backend/models/StudentProfile.js
#### [NEW] backend/models/Internship.js
#### [NEW] backend/models/Application.js
#### [NEW] backend/models/User.js (For auth, mimicking dummy user system based on roles)

---
### Features 1-4 (Controllers & Routes)
APIs will be separated by entity logic.
#### [NEW] backend/routes/studentRoutes.js
#### [NEW] backend/controllers/studentController.js
#### [NEW] backend/routes/internshipRoutes.js
#### [NEW] backend/controllers/internshipController.js
#### [NEW] backend/routes/applicationRoutes.js
#### [NEW] backend/controllers/applicationController.js
#### [NEW] backend/controllers/cvController.js (Handles Affinda, OpenAI, Datamuse)

---
### Frontend Project Setup
We will scaffold Vite and configure Tailwind.
#### [NEW] frontend/package.json
#### [NEW] frontend/tailwind.config.js
#### [NEW] frontend/src/App.jsx

---
### Frontend UI Features (React Components)
Modular components matching the design specifications.
#### [NEW] frontend/src/pages/StudentDashboard.jsx
#### [NEW] frontend/src/pages/CompanyDashboard.jsx
#### [NEW] frontend/src/components/StudentProfileForm.jsx
#### [NEW] frontend/src/components/InternshipPostingForm.jsx
#### [NEW] frontend/src/components/InternshipSearch.jsx
#### [NEW] frontend/src/components/CVUploadFlow.jsx

## Verification Plan

### Automated Tests
- We'll construct requests for testing using Postman (can be described for you manually or added as a postman collection) or test endpoints manually with cURL.

### Manual Verification
1. Run backend using `npm run dev`. Connect to local MongoDB.
2. Run frontend using `npm run dev`. Navigate to `http://localhost:5173`.
3. Test JWT mock login to generate tokens for a 'Student' and 'Company' role.
4. Using the Student role, submit test profile data and a mock PDF CV to verify extraction logic.
5. Using the Company role, post an internship, verify it saves into DB.
6. Using the Student role, search for the internship and click Apply. Check "My Applications".
