import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Target, LogOut, CheckSquare, ShieldAlert, Settings, LayoutDashboard, Timer, Tv } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    // Call logout endpoint (fire-and-forget or sync)
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': token
        }
      }).catch(err => console.log('Logout failed on backend, cleaning up locally anyway', err));
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={token ? "/dashboard" : "/"} className="navbar-logo">
          <Target className="logo-icon" />
          <span>MemeFocus</span>
        </Link>

        <div className="navbar-links">
          {token ? (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/timer" className={`nav-link ${isActive('/timer')}`}>
                <Timer size={18} />
                <span>Timer</span>
              </Link>
              <Link to="/focus-player" className={`nav-link ${isActive('/focus-player')}`}>
                <Tv size={18} />
                <span>Focus Player</span>
              </Link>
              <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`}>
                <CheckSquare size={18} />
                <span>Tasks</span>
              </Link>
              <Link to="/blocked" className={`nav-link ${isActive('/blocked')}`}>
                <ShieldAlert size={18} />
                <span>Blocked Sites</span>
              </Link>
              <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>
                <Settings size={18} />
                <span>Settings</span>
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <a href="#features" className="nav-link">Features</a>
              <Link to="/login" className="btn btn-secondary nav-btn">Login</Link>
              <Link to="/signup" className="btn btn-primary nav-btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
