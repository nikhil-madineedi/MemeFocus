import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, AlertTriangle, Coffee, Brain } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './TimerPage.css';

export default function TimerPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Load profile defaults and tasks
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 'X-Auth-Token': token };
        
        // Fetch profile to get default times
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, { headers });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setFocusDuration(profile.defaultFocusDuration);
          setBreakDuration(profile.defaultBreakDuration);
          setTimeLeft(profile.defaultFocusDuration * 60);
        }

        // Fetch tasks
        const tasksRes = await fetch(`${API_BASE_URL}/api/tasks`, { headers });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.filter(t => !t.completed));
        }
      } catch (err) {
        console.error('Error fetching timer initialization data:', err);
      }
    };

    fetchData();
  }, [token, navigate]);

  // Sync state to localStorage for the extension to inspect
  useEffect(() => {
    if (isRunning && mode === 'focus') {
      localStorage.setItem('focusSessionActive', 'true');
      const expiry = Date.now() + timeLeft * 1000;
      localStorage.setItem('focusSessionExpiry', expiry.toString());
      localStorage.setItem('focusSessionTimeRemaining', timeLeft.toString());
    } else {
      localStorage.setItem('focusSessionActive', 'false');
      localStorage.removeItem('focusSessionExpiry');
      localStorage.removeItem('focusSessionTimeRemaining');
    }

    return () => {
      // Don't clear on toggle, but clear on unmount if not running
      if (!isRunning) {
        localStorage.setItem('focusSessionActive', 'false');
        localStorage.removeItem('focusSessionExpiry');
      }
    };
  }, [isRunning, timeLeft, mode]);

  // Countdown timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  // Handle countdown finish
  const handleSessionComplete = async () => {
    setIsRunning(false);
    localStorage.setItem('focusSessionActive', 'false');
    
    // Play alert sound (web synth beep)
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('AudioContext beep blocked or unsupported');
    }

    if (mode === 'focus') {
      alert('Focus session complete! Storing progress...');
      
      // Log session to backend
      try {
        const response = await fetch(`${API_BASE_URL}/api/focus`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token
          },
          body: JSON.stringify({ durationMinutes: focusDuration })
        });

        if (response.ok) {
          // If task selected, complete it (optional feature)
          if (selectedTaskId) {
            await fetch(`${API_BASE_URL}/api/tasks/${selectedTaskId}`, {
              method: 'PUT',
              headers: { 'X-Auth-Token': token }
            });
            // Remove from list
            setTasks(prev => prev.filter(t => t.id !== parseInt(selectedTaskId)));
            setSelectedTaskId('');
          }
        }
      } catch (err) {
        console.error('Error logging focus session:', err);
      }

      // Switch to break mode
      setMode('break');
      setTimeLeft(breakDuration * 60);
    } else {
      alert('Break is over! Time to focus again.');
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleStart = () => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const handleModeChange = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSelectedTaskName = () => {
    const task = tasks.find(t => t.id === parseInt(selectedTaskId));
    return task ? task.name : 'No task selected';
  };

  return (
    <div className="timer-page container fade-in">
      <div className="timer-wrapper">
        {/* Mode Selector */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'focus' ? 'active focus-mode' : ''}`}
            onClick={() => handleModeChange('focus')}
            disabled={isRunning}
          >
            <Brain size={18} />
            <span>Focus Session</span>
          </button>
          <button 
            className={`mode-btn ${mode === 'break' ? 'active break-mode' : ''}`}
            onClick={() => handleModeChange('break')}
            disabled={isRunning}
          >
            <Coffee size={18} />
            <span>Break</span>
          </button>
        </div>

        {/* Circular Display card */}
        <div className={`card timer-card ${mode}`}>
          <div className="timer-circle">
            <span className="timer-countdown">{formatTime(timeLeft)}</span>
            <span className="timer-label">{mode === 'focus' ? 'Focusing' : 'Relaxing'}</span>
          </div>

          <div className="timer-controls">
            {isRunning ? (
              <button onClick={handlePause} className="control-btn pause-btn" title="Pause">
                <Pause size={24} fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleStart} className="control-btn start-btn" title="Start">
                <Play size={24} fill="currentColor" />
              </button>
            )}
            <button onClick={handleReset} className="control-btn reset-btn" title="Reset">
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Task Selection */}
        {mode === 'focus' && (
          <div className="card timer-task-card">
            <h3>Active Task Context</h3>
            <div className="form-group select-wrapper">
              <select
                className="form-input"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={isRunning}
              >
                <option value="">-- Focus on general tasks --</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.name}</option>
                ))}
              </select>
            </div>
            {selectedTaskId && (
              <div className="active-task-indicator">
                <span>Working on: <strong>{getSelectedTaskName()}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Local settings overrides */}
        <div className="card timer-settings-card">
          <h3>Quick Timer Adjust</h3>
          <div className="quick-inputs">
            <div className="form-group">
              <label className="form-label">Focus (mins)</label>
              <input
                type="number"
                min="1"
                max="120"
                className="form-input"
                value={focusDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 25;
                  setFocusDuration(val);
                  if (mode === 'focus') setTimeLeft(val * 60);
                }}
                disabled={isRunning}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Break (mins)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="form-input"
                value={breakDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  setBreakDuration(val);
                  if (mode === 'break') setTimeLeft(val * 60);
                }}
                disabled={isRunning}
              />
            </div>
          </div>
          {isRunning && (
            <div className="timer-lock-warning">
              <AlertTriangle size={16} />
              <span>Settings locked while timer runs.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
