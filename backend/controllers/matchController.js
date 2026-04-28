const Internship = require('../models/Internship');
const StudentProfile = require('../models/StudentProfile');
const Application = require('../models/Application');

// ─────────────────────────────────────────────────────────────────
// CORE ALGORITHM
// Match Score = (Sum of Matched Skill Weights / Total Required Skill Weights) × 100
// Uses case-insensitive substring matching for flexibility
// ─────────────────────────────────────────────────────────────────
function computeMatchScore(studentSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 100, matchedSkills: [], missingSkills: [], matchedWeight: 0, totalWeight: 0 };
  }

  // Normalize student skills to lowercase trimmed strings
  const normalizedStudent = (studentSkills || []).map(s => s.toLowerCase().trim());

  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedSkills = [];
  const missingSkills = [];

  for (const req of requiredSkills) {
    const w = Math.max(1, Number(req.weight) || 5);
    totalWeight += w;

    const reqNorm = req.skill.toLowerCase().trim();

    // Flexible matching: exact, student-contains-req, req-contains-student
    const isMatched = normalizedStudent.some(s =>
      s === reqNorm ||
      s.includes(reqNorm) ||
      reqNorm.includes(s)
    );

    if (isMatched) {
      matchedWeight += w;
      matchedSkills.push(req.skill);
    } else {
      missingSkills.push(req.skill);
    }
  }

  const score = totalWeight === 0 ? 0 : Math.round((matchedWeight / totalWeight) * 100);

  return { score, matchedSkills, missingSkills, matchedWeight, totalWeight };
}

// Helper to get label from score
function getMatchLabel(score) {
  if (score >= 70) return 'Excellent Match';
  if (score >= 40) return 'Good Match';
  return 'Low Match';
}

// ─────────────────────────────────────────────────────────────────
// GET /api/match/internships
// Student: returns all internships sorted by personal match score
// ─────────────────────────────────────────────────────────────────
const getMatchedInternships = async (req, res) => {
  try {
    // Load student's own profile
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const studentSkills = profile ? (profile.skills || []) : [];
    const studentCGPA = profile ? (profile.cgpa || 0) : 0;

    // Load all internships
    const internships = await Internship.find().sort({ createdAt: -1 });

    // Compute match score for each
    const scored = internships.map(intern => {
      const { score, matchedSkills, missingSkills, matchedWeight, totalWeight } =
        computeMatchScore(studentSkills, intern.requiredSkills);

      // Check CGPA eligibility
      const cgpaOk = !intern.minCGPA || studentCGPA >= intern.minCGPA;

      return {
        _id: intern._id,
        title: intern.title,
        companyName: intern.companyName,
        description: intern.description,
        deadline: intern.deadline,
        minCGPA: intern.minCGPA,
        department: intern.department,
        requiredSkills: intern.requiredSkills,
        createdAt: intern.createdAt,
        // Match data
        matchScore: score,
        matchLabel: getMatchLabel(score),
        matchedSkills,
        missingSkills,
        matchedWeight,
        totalWeight,
        cgpaEligible: cgpaOk,
      };
    });

    // Sort by match score descending, then by title alphabetically
    scored.sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title));

    res.json({
      studentSkills,
      studentCGPA,
      internships: scored,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/match/applicants/:internshipId
// Company/Admin: returns ranked list of applicants for a posting
// ─────────────────────────────────────────────────────────────────
const getRankedApplicants = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    // Only the owning company or admin can view
    const isOwner = internship.companyId.toString() === req.user._id.toString();
    const isAdmin = ['system_admin', 'university_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Unauthorized' });

    // Get all applications for this internship
    const applications = await Application.find({ internshipId: req.params.internshipId })
      .populate('studentId', 'name email');

    if (applications.length === 0) {
      return res.json({ internship, rankedApplicants: [] });
    }

    // Fetch student profiles for all applicants
    const studentIds = applications.map(a => a.studentId?._id).filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

    // Score each applicant
    const ranked = applications.map(app => {
      const profile = profileMap[app.studentId?._id?.toString()];
      const studentSkills = profile ? (profile.skills || []) : [];
      const { score, matchedSkills, missingSkills, matchedWeight, totalWeight } =
        computeMatchScore(studentSkills, internship.requiredSkills);

      const cgpa = profile?.cgpa || 0;
      
      // Smart Recommendation Score calculation: 70% match score + 30% CGPA (normalized)
      const recommendationScore = Math.round((score * 0.7) + ((Math.min(cgpa, 4) / 4) * 100 * 0.3));

      return {
        applicationId: app._id,
        applicationStatus: app.status,
        appliedAt: app.appliedAt,
        student: {
          id: app.studentId?._id,
          name: app.studentId?.name || 'Unknown',
          email: app.studentId?.email || '',
          cgpa: profile?.cgpa || null,
          department: profile?.department || '',
          skills: studentSkills,
          certifications: profile?.certifications || [],
        },
        matchScore: score,
        recommendationScore,
        matchLabel: getMatchLabel(score),
        matchedSkills,
        missingSkills,
        matchedWeight,
        totalWeight,
      };
    });

    // Sort by match score descending
    ranked.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      internship: {
        _id: internship._id,
        title: internship.title,
        companyName: internship.companyName,
        requiredSkills: internship.requiredSkills,
        department: internship.department,
        minCGPA: internship.minCGPA,
        deadline: internship.deadline,
      },
      totalApplicants: ranked.length,
      rankedApplicants: ranked,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMatchedInternships, getRankedApplicants, computeMatchScore };
