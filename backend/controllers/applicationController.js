const Application = require('../models/Application');
const Internship = require('../models/Internship');
const StudentProfile = require('../models/StudentProfile');
const { calculateMatchInsights } = require('../utils/matchingEngine');

// POST /api/application
const submitApplication = async (req, res) => {
  const { internshipId } = req.body;
  if (!internshipId) return res.status(400).json({ message: 'internshipId is required' });

  try {
    const exists = await Application.findOne({ studentId: req.user._id, internshipId });
    if (exists) return res.status(400).json({ message: 'Already applied to this internship' });

    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const insights = calculateMatchInsights({
      requiredSkills: internship.requiredSkills,
      studentSkills: profile?.skills || [],
      cgpa: profile?.cgpa || 0,
      minCGPA: internship.minCGPA,
    });

    const application = await Application.create({
      studentId: req.user._id,
      internshipId,
      status: 'Pending',
      matchScore: insights.matchScore,
      recommendationScore: insights.recommendationScore,
      cgpaAtApply: Number(profile?.cgpa) || 0,
      skillGapReport: insights.skillGapReport,
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/application/student/:id
const getStudentApplications = async (req, res) => {
  try {
    const apps = await Application.find({ studentId: req.params.id })
      .populate('internshipId', 'title companyName deadline department')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/application/my
const getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ studentId: req.user._id })
      .populate('internshipId', 'title companyName deadline department requiredSkills minCGPA')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/application/internship/:id — applications for a specific posting (company/admin)
const getApplicationsByInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id).lean();
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    if (req.user.role === 'company' && internship.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const apps = await Application.find({ internshipId: req.params.id })
      .populate('studentId', 'name email')
      .lean();

    const studentIds = apps.map((app) => app.studentId?._id).filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const ranked = apps
      .map((app) => {
        const profile = profileMap.get(app.studentId?._id?.toString());
        const recalculated = calculateMatchInsights({
          requiredSkills: internship.requiredSkills,
          studentSkills: profile?.skills || [],
          cgpa: profile?.cgpa || app.cgpaAtApply || 0,
          minCGPA: internship.minCGPA,
        });

        return {
          ...app,
          matchScore: recalculated.matchScore,
          recommendationScore: recalculated.recommendationScore,
          cgpaAtApply: Number(profile?.cgpa) || app.cgpaAtApply || 0,
          skillGapReport: recalculated.skillGapReport,
          studentProfile: {
            cgpa: profile?.cgpa || 0,
            department: profile?.department || '',
            skills: profile?.skills || [],
            certifications: profile?.certifications || [],
          },
        };
      })
      .sort((a, b) => {
        if (b.recommendationScore !== a.recommendationScore) {
          return b.recommendationScore - a.recommendationScore;
        }
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return (b.cgpaAtApply || 0) - (a.cgpaAtApply || 0);
      })
      .map((app, idx) => ({ ...app, rank: idx + 1 }));

    await Promise.all(
      ranked.map((app) =>
        Application.findByIdAndUpdate(app._id, {
          matchScore: app.matchScore,
          recommendationScore: app.recommendationScore,
          cgpaAtApply: app.cgpaAtApply,
          skillGapReport: app.skillGapReport,
        })
      )
    );

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/application/internship/:id/auto-shortlist
const autoShortlistCandidates = async (req, res) => {
  const topN = Math.max(1, Math.min(50, Number(req.body.topN) || 5));
  const minimumRecommendationScore = Number(req.body.minimumRecommendationScore) || 60;

  try {
    const internship = await Internship.findById(req.params.id).lean();
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    if (req.user.role === 'company' && internship.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const apps = await Application.find({ internshipId: req.params.id }).lean();
    const studentIds = apps.map((app) => app.studentId).filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const ranked = apps
      .map((app) => {
        const profile = profileMap.get(app.studentId?.toString());
        const insight = calculateMatchInsights({
          requiredSkills: internship.requiredSkills,
          studentSkills: profile?.skills || [],
          cgpa: profile?.cgpa || app.cgpaAtApply || 0,
          minCGPA: internship.minCGPA,
        });

        return {
          app,
          insight,
          cgpa: Number(profile?.cgpa) || Number(app.cgpaAtApply) || 0,
        };
      })
      .sort((a, b) => {
        if (b.insight.recommendationScore !== a.insight.recommendationScore) {
          return b.insight.recommendationScore - a.insight.recommendationScore;
        }
        if (b.insight.matchScore !== a.insight.matchScore) {
          return b.insight.matchScore - a.insight.matchScore;
        }
        return b.cgpa - a.cgpa;
      });

    const selected = ranked
      .filter((item) => item.insight.recommendationScore >= minimumRecommendationScore)
      .slice(0, topN);

    await Promise.all(
      selected.map(({ app, insight, cgpa }) =>
        Application.findByIdAndUpdate(app._id, {
          status: app.status === 'Selected' ? 'Selected' : 'Shortlisted',
          matchScore: insight.matchScore,
          recommendationScore: insight.recommendationScore,
          cgpaAtApply: cgpa,
          skillGapReport: insight.skillGapReport,
        })
      )
    );

    res.json({
      message: `Auto-shortlisted ${selected.length} candidate(s)`,
      shortlistedApplicationIds: selected.map((item) => item.app._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/application/:id/status
const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Shortlisted', 'Rejected', 'Selected'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status value' });

  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  submitApplication,
  getStudentApplications,
  getMyApplications,
  getApplicationsByInternship,
  updateApplicationStatus,
  autoShortlistCandidates,
};
