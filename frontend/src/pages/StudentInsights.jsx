import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function StudentInsights() {
  const { logout } = useAuth();
  const [trends, setTrends] = useState(null);
  const [verifiedSkills, setVerifiedSkills] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [t, v, f] = await Promise.all([
        axios.get('/api/analytics/student/match-trends'),
        axios.get('/api/skill-verification/my'),
        axios.get('/api/feedback/my'),
      ]);
      setTrends(t.data);
      setVerifiedSkills(v.data || []);
      setFeedback(f.data || []);
    } catch {
      setTrends(null);
      setVerifiedSkills([]);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Student Insights</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/student-dashboard" className="nav-link"><span>👤</span> Dashboard</a>
          <a href="/my-applications" className="nav-link"><span>📨</span> My Applications</a>
          <a href="/student-insights" className="nav-link active"><span>📈</span> Match Trends</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <h1 className="page-title">Personal Match Trends</h1>
        <p className="page-subtitle">Track your recommendation trend and verified skill growth.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card"><p className="metric-label">Total Applications</p><h3 style={{ marginTop: '8px' }}>{trends?.totalApplications || 0}</h3></div>
              <div className="glass-card"><p className="metric-label">Average Match Score</p><h3 style={{ marginTop: '8px' }}>{trends?.avgMatchScore || 0}%</h3></div>
              <div className="glass-card"><p className="metric-label">Verified Skills</p><h3 style={{ marginTop: '8px' }}>{verifiedSkills.length}</h3></div>
            </div>

            <div className="glass-card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '10px' }}>Application Match Trend</h3>
              {(trends?.trend || []).length === 0 ? (
                <p className="metric-note">No applications yet.</p>
              ) : (
                (trends?.trend || []).map((row) => (
                  <div key={row.applicationId} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 600 }}>{row.title}</p>
                    <p className="metric-note">{new Date(row.appliedAt).toLocaleDateString()} | Match {row.matchScore}% | Recommendation {row.recommendationScore}% | {row.status}</p>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Skill Verification Badges</h3>
                {verifiedSkills.length === 0 ? (
                  <p className="metric-note">No verified skills yet.</p>
                ) : (
                  verifiedSkills.map((skill, idx) => (
                    <div key={`${skill.skill}_${idx}`} style={{ marginBottom: '8px' }}>
                      <span className="skill-tag" style={{ background: 'rgba(34,197,94,0.14)', borderColor: 'rgba(34,197,94,0.45)', color: '#86efac' }}>Verified: {skill.skill}</span>
                      <p className="metric-note" style={{ marginTop: '4px' }}>Source: {skill.source} | Verified at: {new Date(skill.verifiedAt).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Internship Performance Feedback</h3>
                {feedback.length === 0 ? (
                  <p className="metric-note">No feedback received yet.</p>
                ) : (
                  feedback.map((item) => (
                    <div key={item._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <p style={{ fontWeight: 600 }}>{item.internshipId?.title || 'Internship'}</p>
                      <p className="metric-note">Rating: {item.overallRating}/5 | From: {item.fromUserId?.name || 'Reviewer'}</p>
                      {item.comment && <p className="metric-note">"{item.comment}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
