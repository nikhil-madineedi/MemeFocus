import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './SettingsPage.css';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'X-Auth-Token': token
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setName(profile.name);
          setEmail(profile.email);
          setFocusDuration(profile.defaultFocusDuration);
          setBreakDuration(profile.defaultBreakDuration);
        } else if (response.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } catch (err) {
        console.error('Error fetching profile settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          defaultFocusDuration: focusDuration,
          defaultBreakDuration: breakDuration
        })
      });

      const updatedUser = await response.json();

      if (response.ok) {
        // Save new user profile locally
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ text: 'Preferences updated successfully!', type: 'success' });
      } else {
        setMessage({ text: updatedUser.error || 'Failed to update preferences', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Communication error with backend server', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'X-Auth-Token': token }
      }).catch(() => {});
    }
    localStorage.clear();
    navigate('/');
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete your account? This action is permanent.'
    );
    if (confirmDelete) {
      // Clear session locally and redirect
      localStorage.clear();
      alert('Account deleted successfully. (Mock action complete)');
      navigate('/');
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading preferences...</div>;
  }

  return (
    <div className="settings-page container fade-in">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your developer profile details and focus preference intervals.</p>
      </div>

      {message.text && (
        <div className={`settings-alert ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-layout">
        {/* Settings form */}
        <form onSubmit={handleSave} className="settings-form card">
          <div className="settings-section">
            <h3 className="section-subtitle">Profile Details</h3>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="settings-section divider-top">
            <h3 className="section-subtitle">Default Durations (Minutes)</h3>
            <div className="inputs-row">
              <div className="form-group">
                <label className="form-label" htmlFor="focus-dur">Focus Duration</label>
                <input
                  id="focus-dur"
                  type="number"
                  min="1"
                  max="120"
                  className="form-input"
                  value={focusDuration}
                  onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="break-dur">Break Duration</label>
                <input
                  id="break-dur"
                  type="number"
                  min="1"
                  max="60"
                  className="form-input"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary save-btn" disabled={saving}>
            {saving ? 'Saving changes...' : 'Save Settings'}
          </button>
        </form>

        {/* Account actions card */}
        <div className="card danger-zone-card">
          <h3 className="danger-title">Danger Zone</h3>
          <p className="danger-desc">Actions here can affect or terminate your local session details permanently.</p>
          <div className="action-buttons">
            <button onClick={handleLogout} className="btn btn-secondary logout-action-btn">
              <LogOut size={16} />
              <span>Log Out Session</span>
            </button>
            <button onClick={handleDeleteAccount} className="btn btn-danger delete-account-btn">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
