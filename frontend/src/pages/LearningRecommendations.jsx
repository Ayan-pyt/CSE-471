import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'http://localhost:5000/api';

const LearningRecommendations = () => {
  const { user } = useAuth();
  const { internshipId } = useParams();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [savedProgress, setSavedProgress] = useState({});

  useEffect(() => {
    if (internshipId) {
      fetchRecommendations();
    }
  }, [internshipId]);

  useEffect(() => {
    if (recommendations?.savedProgress) {
      const dbProgress = {};
      recommendations.savedProgress.forEach(p => {
        dbProgress[p.videoId] = true;
      });
      setSavedProgress(dbProgress);
    }
  }, [recommendations]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/learning/recommendations/${internshipId}`,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );
      setRecommendations(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoWatched = async (skill, video) => {
    try {
      await axios.post(
        `${API_URL}/learning/save-progress`,
        {
          skill,
          videoId: video.id,
          videoTitle: video.title,
          minutesWatched: 10,
          completed: true,
        },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );

      // Permanently keep it saved in local state
      setSavedProgress((prev) => ({
        ...prev,
        [video.id]: true,
      }));
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const downloadDetailedReport = () => {
    if (!recommendations) return;
    const doc = new jsPDF();
    
    // Brand Colors
    const brandPrimary = [41, 128, 185];
    const brandDark = [26, 32, 44];
    const brandGray = [100, 116, 139];

    // Header Background
    doc.setFillColor(...brandPrimary);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('IntelliMatch', 15, 20);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Skill Gap Analysis & Learning Curriculum', 15, 28);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 36);

    // Target Profile Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 55, 180, 25, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 55, 180, 25, 'S');

    doc.setFontSize(12);
    doc.setTextColor(...brandDark);
    doc.setFont('helvetica', 'bold');
    doc.text('Target Role:', 20, 65);
    doc.text('Target Company:', 20, 73);
    
    doc.setFont('helvetica', 'normal');
    doc.text(recommendations.internship.title || 'Internship Role', 55, 65);
    doc.text(recommendations.internship.company || 'Company Name', 60, 73);

    // Executive Summary
    const matchPercentage = Math.round(recommendations.studentMatch.matchScore);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...brandPrimary);
    doc.text('Executive Summary', 15, 95);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...brandGray);
    
    const summaryText = `Your profile currently matches the requirements for this position by ${matchPercentage}%. The system has identified ${recommendations.missingSkills} critical skills missing from your current portfolio. By completing the personalized curriculum outlined in this report, you can significantly bridge this gap and increase your employability.`;
    const splitSummary = doc.splitTextToSize(summaryText, 180);
    doc.text(splitSummary, 15, 105);

    // Gap Analysis Matrix
    const gapScoreTextY = 105 + (splitSummary.length * 6) + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...brandPrimary);
    doc.text('Gap Analysis Matrix', 15, gapScoreTextY);
    
    const tableColumn = ["Skill Name", "Priority Level", "Difficulty", "Est. Hours"];
    const tableRows = recommendations.recommendations.map(rec => [
      rec.skill,
      rec.priority.toUpperCase(),
      rec.difficulty,
      `${rec.estimatedLearningTime}h`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: gapScoreTextY + 5,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Detailed Next Steps per Skill
    let currentY = doc.lastAutoTable.finalY + 15;

    recommendations.recommendations.forEach(rec => {
      // Check page break
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      // Skill Header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 10, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandDark);
      doc.text(`Action Plan: ${rec.skill}`, 20, currentY + 7);
      
      currentY += 18;
      
      // Resources
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...brandGray);
      
      rec.alternativeResourceTypes?.forEach((cert) => {
        if (currentY > 280) { doc.addPage(); currentY = 20; }
        doc.text(`• ${cert.type}: ${cert.description}`, 20, currentY);
        currentY += 6;
      });
      
      currentY += 6;
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`IntelliMatch Skill Gap Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`IntelliMatch_${recommendations.internship.company.replace(/\s+/g, '_')}_Report.pdf`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Analyzing your skills against job requirements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container glass-panel">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error}</div>
        <button onClick={fetchRecommendations} className="btn-primary">Try Again</button>
      </div>
    );
  }

  if (!recommendations) return null;

  // Fix Mathematical Bugs
  const matchPercentage = Math.round(recommendations.studentMatch.matchScore);
  const potentialImprovement = Math.round(
    (recommendations.missingSkills > 0) ? (100 - matchPercentage) * 0.8 : 0 
  );

  // Derive Progress Metrics
  const totalVideos = recommendations.recommendations.reduce((sum, rec) => sum + (rec.youtubeVideos?.length || 0), 0);
  const completedVideos = Object.keys(savedProgress).length;
  const progressPercentage = totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100);

  return (
    <div className="learning-recommendations-container">
      {/* Dynamic Ambient Background */}
      <div className="ambient-bg shape-1"></div>
      <div className="ambient-bg shape-2"></div>

      {/* Header Panel */}
      <div className="header-panel">
        <div className="header-content">
          <h1 className="page-title">Personalized Learning Path</h1>
          <p className="page-subtitle">
            Curated curriculum to close your skill gap for <strong>{recommendations.internship.title}</strong> at <strong>{recommendations.internship.company}</strong>
          </p>
        </div>
        <button onClick={downloadDetailedReport} className="btn-download-report">
          📄 Download Detailed Report
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Metrics & Tracker */}
        <div className="sidebar-metrics">
          {/* Match Score Glass Card */}
          <div className="glass-card match-score-card">
            <h3>Match Insights</h3>
            <div className="metric-row">
              <span className="metric-label">Current Match</span>
              <span className="metric-value current" style={{ color: matchPercentage >= 70 ? '#4ade80' : matchPercentage >= 40 ? '#fbbf24' : '#f87171' }}>
                {matchPercentage}%
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Potential Upside</span>
              <span className="metric-value potential">+{potentialImprovement}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Missing Skills</span>
              <span className="metric-value neutral">{recommendations.missingSkills}</span>
            </div>
            
            <div className="divider"></div>
            
            {/* Global Progress Tracker */}
            <div className="global-progress">
              <div className="progress-header">
                <h3>Curriculum Progress</h3>
                <span className="progress-text">{completedVideos}/{totalVideos} Videos</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-fill premium-gradient"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
                <div className="progress-glow" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skills */}
        <div className="skills-column">
          <h2 className="section-title">Target Skills Pipeline</h2>
          
          <div className="recommendations-list">
            {recommendations.recommendations.map((rec, index) => {
              const skillVideos = rec.youtubeVideos || [];
              const watchedSkillVideos = skillVideos.filter(v => savedProgress[v.id]).length;
              const isSkillComplete = skillVideos.length > 0 && watchedSkillVideos === skillVideos.length;

              return (
                <div key={index} className={`skill-accordion glass-card ${expandedSkill === index ? 'expanded' : ''} ${isSkillComplete ? 'completed-card' : ''}`}>
                  <div 
                    className="accordion-header" 
                    onClick={() => setExpandedSkill(expandedSkill === index ? null : index)}
                    style={{ borderLeft: getPriorityBorder(rec.priority) }}
                  >
                    <div className="skill-info">
                      <div className="skill-title-row">
                        <h3 className="skill-name">{rec.skill}</h3>
                        {isSkillComplete && <span className="completion-badge">✓ Complete</span>}
                      </div>
                      <div className="skill-badges">
                        <span className={`badge badge-${rec.priority}`}>{rec.priority} Priority</span>
                        <span className="badge badge-difficulty">{rec.difficulty}</span>
                        <span className="badge badge-time">~{rec.estimatedLearningTime}h</span>
                      </div>
                    </div>
                    <div className="accordion-action">
                      <div className="mini-progress">
                        {watchedSkillVideos}/{skillVideos.length} done
                      </div>
                      <div className={`chevron ${expandedSkill === index ? 'open' : ''}`}>▼</div>
                    </div>
                  </div>

                  {expandedSkill === index && (
                    <div className="accordion-body">
                      {/* Videos Grid */}
                      <div className="content-module">
                        <h4>📹 Top Recommended Tutorials</h4>
                        <div className="videos-grid">
                          {skillVideos.length > 0 ? (
                            skillVideos.map((video, vidIndex) => {
                              const isWatched = !!savedProgress[video.id];
                              
                              return (
                                <div key={vidIndex} className={`video-card premium-hover ${isWatched ? 'watched' : ''}`}>
                                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-thumbnail-link">
                                    <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                                    <div className="play-overlay">
                                      <span className="play-icon">▶</span>
                                    </div>
                                    {isWatched && <div className="watched-overlay">✓ WATCHED</div>}
                                  </a>
                                  <div className="video-info">
                                    <p className="video-title" title={video.title}>{video.title}</p>
                                    <p className="video-channel">{video.channel}</p>
                                    <button
                                      className={`action-btn ${isWatched ? 'btn-success' : 'btn-outline'}`}
                                      onClick={() => handleVideoWatched(rec.skill, video)}
                                      disabled={isWatched}
                                    >
                                      {isWatched ? '✓ Progress Saved' : 'Mark as Watched'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="no-content">No videos available for this skill.</p>
                          )}
                        </div>
                      </div>

                      {/* Certifications and Steps */}
                      <div className="content-module side-by-side">
                        <div className="cert-section">
                          <h4>🏆 Certifications</h4>
                          <ul className="elegant-list">
                            {rec.alternativeResourceTypes && rec.alternativeResourceTypes.map((cert, certIndex) => (
                              <li key={certIndex}>
                                <strong>{cert.type}:</strong> {cert.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="steps-section">
                          <h4>✅ Action Plan</h4>
                          <ul className="elegant-list numbered">
                            {rec.nextSteps && rec.nextSteps.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        /* Premium Variables */
        :root {
          --glass-bg: rgba(17, 24, 39, 0.7);
          --glass-border: rgba(255, 255, 255, 0.08);
          --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          --neon-blue: #60a5fa;
          --neon-purple: #a855f7;
          --neon-green: #4ade80;
          --text-main: #f3f4f6;
          --text-dim: #9ca3af;
        }

        .learning-recommendations-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 40px 24px;
          position: relative;
          color: var(--text-main);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* Ambient Glob Backgrounds */
        .ambient-bg {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          z-index: -1;
          opacity: 0.4;
          pointer-events: none;
        }
        .shape-1 {
          width: 500px;
          height: 500px;
          background: var(--neon-blue);
          top: -100px;
          left: -100px;
          animation: float 20s ease-in-out infinite alternate;
        }
        .shape-2 {
          width: 600px;
          height: 600px;
          background: var(--neon-purple);
          bottom: -100px;
          right: -100px;
          animation: float 25s ease-in-out infinite alternate-reverse;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        /* Glassmorphism Classes */
        .glass-card {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          box-shadow: var(--glass-shadow);
        }

        .header-panel {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--glass-border);
        }

        .page-title {
          font-size: 38px;
          font-weight: 800;
          margin: 0 0 12px 0;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          font-size: 16px;
          color: var(--text-dim);
          margin: 0;
          max-width: 600px;
          line-height: 1.5;
        }

        .page-subtitle strong {
          color: #fff;
        }

        .btn-download-report {
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid rgba(96, 165, 250, 0.3);
          color: var(--neon-blue);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-download-report:hover {
          background: rgba(96, 165, 250, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
        }

        /* Dashboard Grid Layout */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
        }

        /* Metrics Sidebar */
        .sidebar-metrics {
          position: sticky;
          top: 40px;
          height: fit-content;
        }

        .match-score-card {
          padding: 24px;
        }

        .match-score-card h3 {
          margin: 0 0 24px 0;
          font-size: 18px;
          color: #fff;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .metric-label {
          color: var(--text-dim);
          font-size: 14px;
          font-weight: 500;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .metric-value.potential { color: var(--neon-blue); }
        .metric-value.neutral { color: #fff; }

        .divider {
          height: 1px;
          background: var(--glass-border);
          margin: 24px 0;
        }

        .global-progress .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .global-progress h3 {
          margin: 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-dim);
        }

        .progress-text {
          font-size: 12px;
          color: var(--neon-blue);
          font-weight: 600;
        }

        .progress-bar-container {
          height: 8px;
          background: rgba(0,0,0,0.4);
          border-radius: 8px;
          position: relative;
          overflow: visible;
        }

        .progress-fill {
          height: 100%;
          border-radius: 8px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 2;
        }

        .premium-gradient {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        }

        .progress-glow {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          filter: blur(8px);
          opacity: 0.6;
          transition: width 0.8s ease;
          border-radius: 8px;
          z-index: 1;
        }

        /* Skills Column */
        .section-title {
          font-size: 24px;
          margin: 0 0 24px 0;
          color: #fff;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skill-accordion {
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .skill-accordion.expanded {
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          border-color: rgba(255,255,255,0.15);
        }
        
        .skill-accordion.completed-card {
           background: rgba(16, 185, 129, 0.05); /* very faint green */
        }

        .accordion-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
          background: rgba(255,255,255,0.02);
        }

        .accordion-header:hover {
          background: rgba(255,255,255,0.05);
        }

        .skill-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .skill-name {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }
        
        .completion-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .skill-badges {
          display: flex;
          gap: 8px;
        }

        .badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          text-transform: uppercase;
        }

        .badge-critical { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-high { background: rgba(249, 115, 22, 0.15); color: #fdba74; border: 1px solid rgba(249, 115, 22, 0.3); }
        .badge-medium { background: rgba(234, 179, 8, 0.15); color: #fef08a; border: 1px solid rgba(234, 179, 8, 0.3); }
        .badge-low { background: rgba(34, 197, 94, 0.15); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
        .badge-difficulty { background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3); }
        .badge-time { background: rgba(96, 165, 250, 0.15); color: #93c5fd; border: 1px solid rgba(96, 165, 250, 0.3); }

        .accordion-action {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mini-progress {
          font-size: 13px;
          color: var(--text-dim);
          background: rgba(0,0,0,0.3);
          padding: 4px 10px;
          border-radius: 12px;
        }

        .chevron {
          transition: transform 0.3s ease;
          color: var(--text-dim);
          font-size: 14px;
        }

        .chevron.open {
          transform: rotate(180deg);
          color: #fff;
        }

        .accordion-body {
          padding: 24px;
          border-top: 1px solid var(--glass-border);
          background: rgba(0,0,0,0.2);
        }

        .content-module {
          margin-bottom: 32px;
        }

        .content-module h4 {
          font-size: 16px;
          margin: 0 0 16px 0;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .video-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .video-card.watched {
          opacity: 0.8;
          border-color: rgba(74, 222, 128, 0.3);
        }

        .premium-hover:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 24px rgba(0,0,0,0.4);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.2);
        }

        .video-thumbnail-link {
          display: block;
          position: relative;
          height: 140px;
          overflow: hidden;
        }

        .video-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .video-card:hover .video-thumbnail {
          transform: scale(1.08);
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .play-icon {
          width: 48px;
          height: 48px;
          background: var(--neon-blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          padding-left: 4px; /* visual center for triangle */
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.5);
          transform: scale(0.8);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .video-card:hover .play-overlay { opacity: 1; }
        .video-card:hover .play-icon { transform: scale(1); }

        .watched-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(16, 185, 129, 0.9);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          backdrop-filter: blur(4px);
        }

        .video-info {
          padding: 16px;
        }

        .video-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          margin: 0 0 8px 0;
          color: #fff;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .video-channel {
          font-size: 12px;
          color: var(--text-dim);
          margin: 0 0 16px 0;
        }

        .action-btn {
          width: 100%;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: var(--text-main);
        }

        .btn-outline:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.4);
        }

        .btn-success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          cursor: default;
        }

        .side-by-side {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .elegant-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .elegant-list li {
          position: relative;
          padding-left: 20px;
          margin-bottom: 12px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-dim);
        }

        .elegant-list li::before {
          content: "•";
          color: var(--neon-purple);
          position: absolute;
          left: 0;
          font-size: 18px;
          top: -2px;
        }

        .elegant-list.numbered {
          counter-reset: elegant-counter;
        }

        .elegant-list.numbered li {
          padding-left: 28px;
        }

        .elegant-list.numbered li::before {
          counter-increment: elegant-counter;
          content: counter(elegant-counter);
          position: absolute;
          left: 0;
          top: 0;
          font-size: 12px;
          font-weight: 700;
          background: rgba(255,255,255,0.1);
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #fff;
        }

        /* Loaders and Errors */
        .loading-container {
          height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: var(--neon-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .sidebar-metrics { position: static; }
          .header-panel { flex-direction: column; align-items: flex-start; gap: 20px; }
        }
        @media (max-width: 768px) {
          .side-by-side { grid-template-columns: 1fr; }
          .page-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
};

const getPriorityBorder = (priority) => {
  const map = { critical: '4px solid #ef4444', high: '4px solid #f97316', medium: '4px solid #eab308', low: '4px solid #22c55e' };
  return map[priority?.toLowerCase()] || '4px solid #3b82f6';
};

export default LearningRecommendations;
