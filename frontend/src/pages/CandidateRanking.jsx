import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ── Helpers ───────────────────────────────────────────────────────
function getScoreCircleClass(score) {
  if (score >= 70) return 'score-circle score-circle-high';
  if (score >= 40) return 'score-circle score-circle-mid';
  return 'score-circle score-circle-low';
}
function getRankRowClass(rank) {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return '';
}
function getRankMedal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
function getMatchBarColor(score) {
  if (score >= 70) return 'linear-gradient(90deg, #22c55e, #4ade80)';
  if (score >= 40) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #ef4444, #f87171)';
}

// ── Animated Mini Bar ─────────────────────────────────────────────
function MiniMatchBar({ score }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(score), 150); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="match-bar-track" style={{ flex: 1 }}>
        <div className="match-bar-fill" style={{ width: `${width}%`, background: getMatchBarColor(score) }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', color: score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171', minWidth: '36px' }}>
        {score}%
      </span>
    </div>
  );
}

// ── Candidate Row ─────────────────────────────────────────────────
function CandidateRow({ applicant, rank }) {
  const [open, setOpen] = useState(false);
  const s = applicant.student;

  return (
    <>
      <div
        className={`glass-card ${getRankRowClass(rank)}`}
        style={{ padding: '16px 20px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Medal */}
          <div style={{ fontSize: rank <= 3 ? '26px' : '14px', fontWeight: '800', width: '36px', textAlign: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
            {getRankMedal(rank)}
          </div>

          {/* Score circle */}
          <div className={getScoreCircleClass(applicant.matchScore)}>
            {applicant.matchScore}%
          </div>

          {/* Student info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>{s.name}</span>
              <span className={applicant.matchScore >= 70 ? 'badge-match-high' : applicant.matchScore >= 40 ? 'badge-match-mid' : 'badge-match-low'}
                style={{ fontSize: '11px', padding: '2px 8px' }}>
                {applicant.matchLabel}
              </span>
              <span style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                {applicant.applicationStatus}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {s.email}
              {s.department && <span style={{ marginLeft: '12px' }}>📁 {s.department}</span>}
              {s.cgpa && <span style={{ marginLeft: '12px' }}>🎓 CGPA: {s.cgpa}</span>}
            </div>
            <div style={{ marginTop: '8px', maxWidth: '320px' }}>
              <MiniMatchBar score={applicant.matchScore} />
            </div>
          </div>

          {/* Weight summary & Rec Score */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rec Score</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#a5b4fc' }}>
              {applicant.recommendationScore}<span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Matched Wt: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{applicant.matchedWeight}/{applicant.totalWeight}</span>
            </div>
          </div>

          {/* Expand arrow */}
          <div style={{ color: 'var(--text-muted)', fontSize: '16px', flexShrink: 0 }}>{open ? '▲' : '▼'}</div>
        </div>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div className="glass-card" style={{ marginTop: '-6px', marginBottom: '10px', padding: '16px 20px', borderRadius: '0 0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#4ade80', marginBottom: '8px' }}>
                ✓ {applicant.matchedSkills.length} Matched Skills
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {applicant.matchedSkills.length > 0
                  ? applicant.matchedSkills.map(sk => <span key={sk} className="skill-matched">{sk}</span>)
                  : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None matched</span>}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#f87171', marginBottom: '8px' }}>
                ✗ {applicant.missingSkills.length} Missing Skills
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {applicant.missingSkills.length > 0
                  ? applicant.missingSkills.map(sk => <span key={sk} className="skill-missing">{sk}</span>)
                  : <span style={{ fontSize: '13px', color: '#4ade80' }}>🎉 No missing skills!</span>}
              </div>
            </div>
          </div>
          {s.skills.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>🧠 All Student Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {s.skills.map(sk => <span key={sk} className="skill-tag" style={{ fontSize: '12px' }}>{sk}</span>)}
              </div>
            </div>
          )}
          {s.certifications.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>📜 Certifications</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {s.certifications.map(c => (
                  <span key={c} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{c}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            🕐 Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function CandidateRanking({ internshipId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('matchScore');

  useEffect(() => {
    if (!internshipId) return;
    setLoading(true); setError('');
    axios.get(`/api/match/applicants/${internshipId}`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load applicants'))
      .finally(() => setLoading(false));
  }, [internshipId]);

  let filtered = (data?.rankedApplicants || []).filter(a =>
    a.student.name.toLowerCase().includes(filterText.toLowerCase()) &&
    a.matchScore >= Number(minScore)
  );

  filtered.sort((a, b) => {
    if (sortBy === 'recommendationScore') return b.recommendationScore - a.recommendationScore;
    if (sortBy === 'cgpa') return (b.student.cgpa || 0) - (a.student.cgpa || 0);
    return b.matchScore - a.matchScore;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '64px' }}><div className="spinner" /></div>;

  if (error) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: '#f87171' }}>
      <div style={{ fontSize: '40px' }}>⚠️</div>
      <p style={{ marginTop: '12px' }}>{error}</p>
      <button className="btn-secondary" onClick={onBack} style={{ marginTop: '16px' }}>← Go Back</button>
    </div>
  );

  const { internship, totalApplicants } = data || {};
  const avg = filtered.length > 0 ? Math.round(filtered.reduce((s, a) => s + a.matchScore, 0) / filtered.length) : 0;
  const top = filtered[0]?.matchScore ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '8px 14px', fontSize: '13px', flexShrink: 0 }}>← Back</button>
        <div>
          <h1 className="page-title">🏆 Candidate Ranking</h1>
          <p className="page-subtitle">
            {internship?.title} · {totalApplicants} applicant{totalApplicants !== 1 ? 's' : ''} · ranked by AI skill match score
          </p>
        </div>
      </div>

      {/* Required Skills */}
      {internship?.requiredSkills?.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '10px' }}>⚖️ Required Skills & Weights for this Position</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {internship.requiredSkills.map(s => (
              <span key={s.skill} className="skill-tag">
                {s.skill}
                <span style={{ background: 'rgba(99,102,241,0.3)', borderRadius: '20px', padding: '1px 6px', fontSize: '11px', color: '#c7d2fe' }}>w:{s.weight}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Applicants', value: totalApplicants, color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)', icon: '👥' },
          { label: 'Average Match Score', value: `${avg}%`, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', icon: '📊' },
          { label: 'Top Score', value: `${top}%`, color: '#4ade80', bg: 'rgba(34,197,94,0.1)', icon: '🏆' },
          { label: 'Excellent Match (≥70%)', value: (data?.rankedApplicants || []).filter(a => a.matchScore >= 70).length, color: '#4ade80', bg: 'rgba(34,197,94,0.08)', icon: '🟢' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '14px', padding: '14px 18px' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.icon} {s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label">Search by Name</label>
          <input className="form-input" placeholder="Filter candidates..." value={filterText}
            onChange={e => setFilterText(e.target.value)} />
        </div>
        <div style={{ minWidth: '200px' }}>
          <label className="form-label">Min Match Score: <strong style={{ color: 'var(--primary)' }}>{minScore}%</strong></label>
          <input type="range" min="0" max="100" step="5" value={minScore}
            onChange={e => setMinScore(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '4px', cursor: 'pointer' }} />
        </div>
        <div style={{ minWidth: '220px' }}>
          <label className="form-label">Sort Applicants By</label>
          <select className="form-input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="matchScore">Match Score (AI Based)</option>
            <option value="recommendationScore">Smart HR Rec. Score</option>
            <option value="cgpa">Highest CGPA First</option>
          </select>
        </div>
        <button className="btn-secondary" onClick={() => { setFilterText(''); setMinScore(0); setSortBy('matchScore'); }}>Reset</button>
      </div>

      {/* Ranked List */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px' }}>📭</div>
          <p style={{ marginTop: '12px' }}>No applicants match your current filters</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '8px', padding: '0 20px 10px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ width: '36px' }}>Rank</span>
            <span style={{ width: '48px' }}>Score</span>
            <span style={{ flex: 1 }}>Student</span>
            <span>Wt.</span>
          </div>
          {filtered.map((applicant, idx) => (
            <CandidateRow key={applicant.applicationId} applicant={applicant} rank={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
