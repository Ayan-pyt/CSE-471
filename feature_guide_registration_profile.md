# IntelliMatch Viva Guide: 2 Core Features

This document explains only these two features from your current codebase:

1. Registration and Login System
2. Student Profile & Skill Management (including CV upload and skill extraction)

---

## 1) Registration and Login System

### A. What this feature does

- New users register with name, email, password, and role.
- Roles available in code: `student`, `company`, `university_admin`, `system_admin`.
- Password is hashed before saving.
- On successful login/register, backend returns JWT token.
- Frontend stores token and sends it as `Authorization: Bearer <token>` for protected APIs.
- User is redirected to role-based dashboard/page after login.

### B. Where the code is (Backend)

- Route definitions:
  - `backend/routes/authRoutes.js`
- Core auth logic:
  - `backend/controllers/authController.js`
- User schema + password hashing + password check:
  - `backend/models/User.js`
- JWT verification middleware (protect routes):
  - `backend/middleware/auth.js`
- Route mount in app:
  - `backend/server.js` (`/api/auth`)

### C. Important functions used

#### `generateToken(id)` in `authController.js`
- Uses `jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })`.
- Creates signed token containing user id.

#### `register(req, res)` in `authController.js`
- Validates required fields: name, email, password, role.
- Validates role against allowed roles.
- Checks duplicate user by email.
- Creates user using Mongoose.
- Returns user basic info + token.

#### `login(req, res)` in `authController.js`
- Validates email/password present.
- Finds user by email.
- Checks password using model method `matchPassword`.
- Returns user basic info + token.

#### `userSchema.pre('save')` in `User.js`
- Runs before user save.
- If password changed, hashes password with bcrypt (`bcrypt.hash(password, 10)`).
- Ensures plain password is never stored in DB.

#### `userSchema.methods.matchPassword` in `User.js`
- Compares entered password with hashed DB password using `bcrypt.compare`.

#### `protect` middleware in `auth.js`
- Reads `Authorization` header.
- Extracts bearer token.
- Verifies token with JWT secret.
- Loads user from DB and attaches to `req.user`.
- Blocks request with 401 if token invalid/missing.

### D. Where the code is (Frontend)

- Login page form + API call:
  - `frontend/src/pages/LoginPage.jsx`
- Register page form + API call:
  - `frontend/src/pages/RegisterPage.jsx`
- Auth state management:
  - `frontend/src/context/AuthContext.jsx`
- Private route / role route logic:
  - `frontend/src/App.jsx`

### E. Frontend behind logic

#### Register flow
1. User fills form in `RegisterPage`.
2. `axios.post('/api/auth/register', form)` is called.
3. On success: navigate to `/login`.

#### Login flow
1. User fills form in `LoginPage`.
2. `axios.post('/api/auth/login', form)` is called.
3. Response contains token + role.
4. `login(data)` from `AuthContext` stores user in localStorage and sets default axios authorization header.
5. User redirected by role:
   - student -> `/student-dashboard`
   - company -> `/company-dashboard`
   - others -> `/internships`

#### Route protection
- `PrivateRoute` in `App.jsx` checks:
  - If no `user` -> redirect `/login`
  - If role not allowed -> redirect `/`
  - Else render requested page

### F. Viva-ready explanation sentence

"Authentication is JWT-based. Registration validates input and role, hashes password with bcrypt in model pre-save hook, and returns a signed token. Login verifies credentials using bcrypt compare. Protected APIs use middleware to verify bearer token and attach the user object to `req.user`. Frontend persists token in localStorage and injects it into axios headers, then role-based routes decide dashboard access."

### G. Important note about requirement vs current implementation

Requirement text says users provide phone number and company organization verification details during registration.

Current code implementation:
- `User` model stores only `name`, `email`, `password`, `role`.
- No `phone` field in registration payload handling.
- No company verification data model/flow found in auth registration.

So in viva you can say: base auth is implemented; company verification details are not fully implemented yet in current code.

---

## 2) Student Profile & Skill Management

### A. What this feature does

- Students create or update academic profile fields:
  - name, cgpa, department, graduationYear, certifications, projects, skills
- Students can upload PDF CV.
- Backend returns extracted skills (currently mock parser), optional related skills, and stores CV URL.
- Student confirms selected skills; backend saves them in structured `skills` array.

### B. Where the code is (Backend)

- Student profile APIs:
  - `backend/routes/studentRoutes.js`
  - `backend/controllers/studentController.js`
  - `backend/models/StudentProfile.js`
- CV upload + skill confirm APIs:
  - `backend/controllers/cvController.js`
  - `backend/routes/studentRoutes.js` (also duplicated in `backend/routes/cvRoutes.js`)
- Static file serving for uploaded CV:
  - `backend/server.js` with `app.use('/uploads', express.static(...))`

### C. Student profile data model

In `StudentProfile.js` schema:
- `userId` (unique reference to `User`)
- `name`
- `cgpa` (0 to 4)
- `department`
- `graduationYear`
- `certifications` (array of string)
- `projects` (array of string)
- `skills` (array of string)
- `cvUrl`

This is why skills are stored in structured form, usable later for searching/matching logic.

### D. Important functions used

#### `createProfile(req, res)` in `studentController.js`
- Creates profile for logged-in student.
- Rejects if profile already exists.
- Initializes arrays for certifications/projects/skills.

#### `updateProfile(req, res)` in `studentController.js`
- Uses `findOneAndUpdate` by `userId`.
- `upsert: true` means profile is created if missing.
- `runValidators: true` applies schema validation.

#### `getMyProfile(req, res)` in `studentController.js`
- Fetches currently logged-in student's profile.
- Used by frontend to prefill form.

#### `uploadCV(req, res)` in `cvController.js`
- Accepts uploaded file from multer (`upload.single('cv')`).
- Builds `cvUrl` and stores it in `StudentProfile`.
- Calls `mockParsePDF` to get extracted skills (placeholder parser).
- Optionally calls Datamuse public API for related skills.
- Returns `extractedSkills` + `relatedSkills` to frontend.

#### `confirmSkills(req, res)` in `cvController.js`
- Accepts `skills` array from frontend.
- Saves unique skills using `$addToSet` with `$each`.
- Returns updated skill list.

### E. Multer and file handling logic

In `studentRoutes.js`:
- `multer.diskStorage` saves files to `uploads/` directory.
- Filename format: `<userId>-<timestamp>.pdf`.
- `fileFilter` only allows `application/pdf`.

In `server.js`:
- `app.use('/uploads', express.static(...))` exposes uploaded files by URL.

### F. Where the code is (Frontend)

- Main student feature UI:
  - `frontend/src/pages/StudentDashboard.jsx`
- Auth context (token for secured APIs):
  - `frontend/src/context/AuthContext.jsx`

### G. Frontend behind logic

#### Profile section (`ProfileForm`)
1. On mount, calls `GET /api/student/profile/me`.
2. Prefills form with existing profile data.
3. User edits fields and skill tags.
4. On save, calls `PUT /api/student/profile`.
5. Success/failure message shown.

#### CV section (`CVUploadSection`)
1. User picks PDF file.
2. Builds `FormData` and sends `POST /api/student/upload-cv`.
3. Receives extracted skills and related skills.
4. User toggles selected skills.
5. On confirm, sends `POST /api/student/confirm-skills`.
6. Skills are merged into DB profile without duplicates.

### H. Viva-ready explanation sentence

"Student profile management is separated into structured academic data and CV-assisted skill extraction. The profile API stores CGPA, department, graduation year, certifications, projects, and skills in a dedicated StudentProfile collection. CV upload uses multer for PDF storage, then parser output is shown to the student for confirmation. Confirmed skills are saved using MongoDB `$addToSet` so duplicates are prevented."

### I. Important note about matching analysis

Requirement text says skill data is stored for matching analysis.

Current code status:
- Skills are stored in `StudentProfile.skills`.
- Internship postings store `requiredSkills`.
- Internship search can filter by skill (`requiredSkills.skill`).
- No full auto match-score engine (e.g., percentage score between student profile and each internship) found in current code.

So in viva you can say: matching-ready data structures exist, and filtering is present; advanced scoring engine is future enhancement.

---

## Quick viva checklist (you can memorize)

- Auth uses JWT + bcrypt.
- Password hashing is in User model pre-save hook.
- Role-based access uses `authorizeRoles` middleware + frontend `PrivateRoute`.
- Student profile is a separate collection linked by `userId`.
- Skills are captured in two ways: manual profile edit + CV extraction confirmation.
- CV upload accepts PDF only and stores file path in `cvUrl`.
- Duplicate skills are prevented by `$addToSet`.
- Current project has core flow working; phone/company verification and full match scoring are not fully implemented yet.
