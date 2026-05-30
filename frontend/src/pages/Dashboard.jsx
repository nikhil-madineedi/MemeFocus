import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Flame, Clock, Calendar, CheckCircle2, ShieldPlus, Play } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Dashboard.css';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState({});
  const [taskName, setTaskName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 'X-Auth-Token': token };
        
        const [profileRes, statsRes, activityRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/profile`, { headers }),
          fetch(`${API_BASE_URL}/api/focus/stats`, { headers }),
          fetch(`${API_BASE_URL}/api/focus/activity`, { headers })
        ]);

        if (profileRes.status === 401) {
          // Token expired or invalid
          localStorage.clear();
          navigate('/login');
          return;
        }

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();
        const activityData = await activityRes.json();

        setProfile(profileData);
        setStats(statsData);
        setActivity(activityData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  // Quick Action: Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ name: taskName.trim() })
      });

      if (response.ok) {
        setTaskName('');
        showNotification('Task added successfully!', 'success');
      } else {
        const errData = await response.json();
        showNotification(errData.error || 'Failed to add task', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // Quick Action: Add Blocked Website
  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/blocked-websites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ url: websiteUrl.trim() })
      });

      if (response.ok) {
        setWebsiteUrl('');
        showNotification('Website added to blacklist!', 'success');
      } else {
        const errData = await response.json();
        showNotification(errData.error || 'Failed to block website', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Helper to generate the contribution calendar data (past 12 weeks / 84 days)
  const getContributionGrid = () => {
    const grid = [];
    const today = new Date();
    
    // Set to start of day
    today.setHours(0, 0, 0, 0);

    // Compute 84 days ago (12 weeks)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const count = activity[dateString] || 0;
      grid.push({ date: dateString, count });
    }
    return grid;
  };

  if (loading) {
    return <div className="dashboard-loading">Loading focus metrics...</div>;
  }

  const gridData = getContributionGrid();

  return (
    <div className="dashboard container fade-in">
      <div className="dashboard-welcome">
        <h1>Welcome back, {profile?.name || 'Developer'}</h1>
        <p>Your focus command center. Ready to grind?</p>
      </div>

      {message.text && (
        <div className={`toast-notification ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="dashboard-grid">
        {/* User Card */}
        <div className="card stat-card profile-card">
          <div className="card-header">
            <User className="icon-blue" size={24} />
            <h3>Developer Profile</h3>
          </div>
          <div className="card-body">
            <p className="profile-name">{profile?.name}</p>
            <p className="profile-email">{profile?.email}</p>
            <div className="profile-badge">Focus Level: Apprentice</div>
          </div>
        </div>

        {/* Streaks Card */}
        <div className="card stat-card streak-card">
          <div className="card-header">
            <Flame className="icon-orange" size={24} />
            <h3>Streaks</h3>
          </div>
          <div className="card-body">
            <div className="streak-stats">
              <div>
                <p className="streak-num">{stats?.currentStreak || 0}</p>
                <p className="streak-label">Current Days</p>
              </div>
              <div className="streak-divider"></div>
              <div>
                <p className="streak-num">{stats?.longestStreak || 0}</p>
                <p className="streak-label">Longest Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Focus Time Card */}
        <div className="card stat-card time-card">
          <div className="card-header">
            <Clock className="icon-indigo" size={24} />
            <h3>Focus Log</h3>
          </div>
          <div className="card-body">
            <div className="time-stats">
              <div>
                <p className="time-num">{stats?.todayMinutes || 0}m</p>
                <p className="time-label">Focus Today</p>
              </div>
              <div className="time-divider"></div>
              <div>
                <p className="time-num">{stats?.totalMinutes || 0}m</p>
                <p className="time-label">Total Time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Calendar Grid */}
      <div className="card activity-card">
        <div className="activity-header">
          <Calendar size={20} className="icon-indigo" />
          <h3>Focus consistency (Past 12 Weeks)</h3>
        </div>
        <div className="activity-grid">
          {gridData.map((day) => {
            let colorClass = 'lvl-0';
            if (day.count === 1) colorClass = 'lvl-1';
            else if (day.count === 2) colorClass = 'lvl-2';
            else if (day.count > 2) colorClass = 'lvl-3';
            
            return (
              <div
                key={day.date}
                className={`grid-cell ${colorClass}`}
                title={`${day.date}: ${day.count} session(s)`}
              />
            );
          })}
        </div>
        <div className="grid-legend">
          <span>Less</span>
          <div className="grid-cell lvl-0"></div>
          <div className="grid-cell lvl-1"></div>
          <div className="grid-cell lvl-2"></div>
          <div className="grid-cell lvl-3"></div>
          <span>More</span>
        </div>
      </div>

      {/* Quick Actions & Short Forms */}
      <div className="quick-actions-grid">
        {/* Quick Launch */}
        <div className="card quick-card flex-center">
          <h3>Ready to Focus?</h3>
          <p>Launch a custom Pomodoro countdown block now.</p>
          <Link to="/timer" className="btn btn-primary start-session-btn">
            <Play size={16} fill="white" />
            <span>Open Timer</span>
          </Link>
        </div>

        {/* Quick Add Task */}
        <div className="card quick-card">
          <div className="card-header">
            <CheckCircle2 size={18} className="icon-green" />
            <h3>Quick Add Task</h3>
          </div>
          <form onSubmit={handleAddTask} className="quick-form">
            <input
              type="text"
              placeholder="What needs to be done?"
              className="form-input"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">Add Task</button>
          </form>
        </div>

        {/* Quick Add Website */}
        <div className="card quick-card">
          <div className="card-header">
            <ShieldPlus size={18} className="icon-red" />
            <h3>Block Distraction</h3>
          </div>
          <form onSubmit={handleAddWebsite} className="quick-form">
            <input
              type="text"
              placeholder="e.g. facebook.com"
              className="form-input"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">Block site</button>
          </form>
        </div>
      </div>
    </div>
  );
}
