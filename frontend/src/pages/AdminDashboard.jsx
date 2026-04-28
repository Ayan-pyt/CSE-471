import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [weights, setWeights] = useState({ skillWeight: 0.75, cgpaWeight: 0.25 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, p, w, logs] = await Promise.all([
        axios.get('/api/analytics/admin/dashboard'),
        axios.get('/api/admin/companies/pending'),
        axios.get('/api/admin/algorithm-weights'),
        axios.get('/api/admin/activity?limit=25'),
      ]);
      setAnalytics(a.data);
      setPendingCompanies(p.data || []);
      setWeights(w.data.recommendationWeights || { skillWeight: 0.75, cgpaWeight: 0.25 });
      setActivity(logs.data || []);
    } catch {
      setAnalytics(null);
      setPendingCompanies([]);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reviewCompany = async (id, decision) => {
    await axios.put(`/api/admin/companies/${id}/review`, { decision });
    load();
  };

  const updateWeights = async (e) => {
    e.preventDefault();
    await axios.put('/api/admin/algorithm-weights', weights);
    load();
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '24px' }}>
          <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: '800' }}>IntelliMatch</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Admin Console</p>
        </div>
        <hr className="divider" />
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/admin-dashboard" className="nav-link active"><span>🛡️</span> Dashboard</a>
          <a href="/interviews" className="nav-link"><span>🗓️</span> Interviews</a>
          <a href="/notifications" className="nav-link"><span>🔔</span> Notifications</a>
          <a href="/internships" className="nav-link"><span>📌</span> Internship Board</a>
        </nav>
        <hr className="divider" />
        <button className="btn-danger" onClick={logout} style={{ width: '100%' }}>Sign Out</button>
      </aside>

      <main className="content-area">
        <h1 className="page-title">Dashboard & Analytics System</h1>
        <p className="page-subtitle">Monitor placements, skills demand, moderation queue, and algorithm controls.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner"></div></div>
        ) : (
          <>
            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div className="glass-card"><p className="metric-label">Total Internship Postings</p><h3 style={{ marginTop: '8px' }}>{analytics.totalInternshipPostings}</h3></div>
                <div className="glass-card"><p className="metric-label">Student Placement Ratio</p><h3 style={{ marginTop: '8px' }}>{analytics.studentPlacementRatio}%</h3></div>
                <div className="glass-card"><p className="metric-label">Total Applications</p><h3 style={{ marginTop: '8px' }}>{analytics.totalApplications}</h3></div>
                <div className="glass-card"><p className="metric-label">Selected Applications</p><h3 style={{ marginTop: '8px' }}>{analytics.selectedApplications}</h3></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Department-wise Placement Performance</h3>
                {(analytics?.departmentPlacement || []).slice(0, 8).map((d) => (
                  <div key={d.department} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>{d.department}</span><span>{d.selected}/{d.total} ({d.ratio}%)</span>
                  </div>
                ))}
              </div>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Top In-demand Skills</h3>
                {(analytics?.topInDemandSkills || []).slice(0, 10).map((s) => (
                  <div key={s.skill} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>{s.skill}</span><span>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '10px' }}>Admin Monitoring & Moderation</h3>
                {pendingCompanies.length === 0 ? (
                  <p className="metric-note">No pending company registrations.</p>
                ) : (
                  pendingCompanies.map((c) => (
                    <div key={c._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <p style={{ fontWeight: 600 }}>{c.name}</p>
                      <p className="metric-note" style={{ marginBottom: '8px' }}>{c.email}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" onClick={() => reviewCompany(c._id, 'approved')}>Approve</button>
                        <button className="btn-danger" onClick={() => reviewCompany(c._id, 'rejected')}>Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className="glass-card" onSubmit={updateWeights}>
                <h3 style={{ marginBottom: '10px' }}>Adjust Algorithm Weights</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">Skill Weight</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={weights.skillWeight}
                    onChange={(e) => setWeights({ ...weights, skillWeight: e.target.value })} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label">CGPA Weight</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={weights.cgpaWeight}
                    onChange={(e) => setWeights({ ...weights, cgpaWeight: e.target.value })} />
                </div>
                <button className="btn-primary" type="submit">Save Weights</button>
              </form>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: '10px' }}>System Activity Monitor</h3>
              {activity.length === 0 ? (
                <p className="metric-note">No activity logs available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activity.map((entry) => (
                    <span key={entry._id} className="metric-note">
                      {new Date(entry.createdAt).toLocaleString()} | {entry.action} | {entry.actorId?.name || 'System'} ({entry.actorRole || 'N/A'})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
