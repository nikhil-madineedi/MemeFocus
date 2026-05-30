import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Trash2, Plus, Globe } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './BlockedPage.css';

export default function BlockedPage() {
  const [websites, setWebsites] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch blocked websites
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchWebsites = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/blocked-websites`, {
          headers: {
            'X-Auth-Token': token
          }
        });
        if (response.ok) {
          const data = await response.json();
          setWebsites(data);
        } else if (response.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } catch (err) {
        console.error('Error fetching websites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, [token, navigate]);

  // Periodically check if Chrome Extension is connected (injects data attribute to body)
  useEffect(() => {
    const checkStatus = () => {
      const isConnected = document.body.dataset.memefocusExtensionActive === 'true' || 
                          window.__MemeFocusExtensionInstalled === true;
      setExtensionConnected(isConnected);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  // Handle add website
  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/blocked-websites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ url: newUrl.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setWebsites(prev => [...prev, data]);
        setNewUrl('');
        setMessage('');
      } else {
        setMessage(data.error || 'Failed to add website');
      }
    } catch (err) {
      setMessage('Server error while adding website');
    }
  };

  // Handle remove website
  const handleRemoveWebsite = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blocked-websites/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        setWebsites(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error('Error removing website:', err);
    }
  };

  if (loading) {
    return <div className="blocked-loading">Loading blocked websites...</div>;
  }

  return (
    <div className="blocked-page container fade-in">
      <div className="blocked-header">
        <h1>Website Blacklist</h1>
        <p>Add URLs of websites you want to block. We will redirect you to memes if you visit them during focus mode.</p>
      </div>

      {message && <div className="error-alert">{message}</div>}

      <div className="blocked-layout">
        {/* Left Side: Add and List */}
        <div className="blocked-main">
          {/* Add form */}
          <form onSubmit={handleAddWebsite} className="add-website-form card">
            <div className="input-with-icon">
              <Globe size={18} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. youtube.com, instagram.com, reddit.com"
                className="form-input"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-danger">
              <Plus size={16} />
              <span>Block Site</span>
            </button>
          </form>

          {/* Website list */}
          <h3 className="list-title">Currently Blocked ({websites.length})</h3>
          {websites.length === 0 ? (
            <div className="empty-list card">
              <Globe size={32} className="icon-muted" />
              <p>Your blacklist is empty. Add a website above to stay focused.</p>
            </div>
          ) : (
            <div className="website-list">
              {websites.map(site => (
                <div key={site.id} className="website-item card">
                  <div className="site-info">
                    <span className="dot-red"></span>
                    <span className="site-url">{site.url}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveWebsite(site.id)} 
                    className="site-delete-btn"
                    title="Remove from blocklist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Extension Connection status */}
        <div className="blocked-sidebar">
          <div className={`card connection-card ${extensionConnected ? 'connected' : 'disconnected'}`}>
            <div className="connection-header">
              {extensionConnected ? (
                <ShieldCheck className="icon-connected" size={32} />
              ) : (
                <ShieldAlert className="icon-disconnected" size={32} />
              )}
              <h3>Chrome Extension</h3>
            </div>
            <div className="connection-body">
              {extensionConnected ? (
                <>
                  <div className="status-badge connected">Connected</div>
                  <p>The MemeFocus extension is active and synced. Your blacklist rules will apply during focus sessions.</p>
                </>
              ) : (
                <>
                  <div className="status-badge disconnected">Not Connected</div>
                  <p>MemeFocus extension was not detected. Please install the extension locally in developer mode to start blocking websites.</p>
                  <div className="install-instructions">
                    <h4>How to load extension:</h4>
                    <ol>
                      <li>Go to <code>chrome://extensions</code> in Chrome.</li>
                      <li>Enable <strong>Developer mode</strong> (toggle top right).</li>
                      <li>Click <strong>Load unpacked</strong> and select the <code>extension</code> folder in this project root.</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
