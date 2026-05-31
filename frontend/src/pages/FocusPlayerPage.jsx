import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Plus, Trash2, Edit2, Save, X, Search, 
  Download, Clock, Tv, 
  Video, Columns, Maximize2, Minimize2, Check, BookOpen 
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import './FocusPlayerPage.css';

// Custom inline YouTube icon SVG since it isn't exported by some versions of lucide-react
const YoutubeIcon = ({ size = 24, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" stroke="none" />
  </svg>
);


// Key for local storage
const SESSIONS_STORAGE_KEY = 'memefocus_video_sessions';

export default function FocusPlayerPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // URL parsing & loading states
  const [inputUrl, setInputUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [playerType, setPlayerType] = useState(null); // 'youtube' | 'vimeo' | 'direct' | 'fallback'
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Player and synchronization references
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytApiLoadedRef = useRef(false);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteTag, setNoteTag] = useState('standard'); // 'standard' | 'important' | 'question' | 'idea'
  const [composerTime, setComposerTime] = useState(null); // Captured timestamp, if any
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Recent sessions state
  const [sessions, setSessions] = useState([]);
  
  // Tasks integration
  const [tasks, setTasks] = useState([]);
  const [associatedTaskId, setAssociatedTaskId] = useState('');

  // Layout mode state
  const [layout, setLayout] = useState('split'); // 'split' | 'theater' | 'focus'
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Notification / feedback toast
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Helper: Format seconds to HH:MM:SS or MM:SS
  const formatSeconds = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return '0:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: Extract YouTube video ID
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper: Extract Vimeo video ID
  const getVimeoId = (url) => {
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Helper: Detect if URL is a direct video link
  const isDirectVideo = (url) => {
    try {
      const cleanUrl = url.split('?')[0].split('#')[0];
      return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
    } catch (e) {
      return false;
    }
  };

  // Toast feedback show utility
  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // 1. Initial setups: check auth, fetch tasks, load sessions list
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch active tasks from MemeFocus API to allow notes association
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
          headers: { 'X-Auth-Token': token }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter to incomplete ones
          setTasks(data.filter(t => !t.completed));
        }
      } catch (err) {
        console.error('Error fetching tasks for context:', err);
      }
    };

    // Load recent sessions from localStorage
    const savedSessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
    setSessions(savedSessions);

    fetchTasks();
  }, [token, navigate]);

  // 2. YouTube IFrame API Script injection
  useEffect(() => {
    if (playerType === 'youtube' && !window.YT) {
      // Add YT script tag
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      // Setup global callback
      window.onYouTubeIframeAPIReady = () => {
        ytApiLoadedRef.current = true;
        initializeYtPlayer();
      };
    } else if (playerType === 'youtube' && window.YT) {
      initializeYtPlayer();
    }
  }, [playerType, videoId]);

  // Initialize YT.Player on the iframe
  const initializeYtPlayer = () => {
    if (!window.YT || !videoId) return;

    // Destroy existing player if present
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch (e) {
        console.log('Error destroying old YT player instance', e);
      }
      ytPlayerRef.current = null;
      setYtPlayerReady(false);
    }

    try {
      ytPlayerRef.current = new window.YT.Player('youtube-player-iframe', {
        events: {
          'onReady': (event) => {
            setYtPlayerReady(true);
            
            // Check if there was a saved lastPlayedTime for this URL and seek to it
            const matchedSession = sessions.find(s => s.url === currentUrl);
            if (matchedSession && matchedSession.lastPlayedTime) {
              event.target.seekTo(matchedSession.lastPlayedTime, true);
            }
          },
          'onStateChange': (event) => {
            // Can monitor player state here
          }
        }
      });
    } catch (e) {
      console.error('Failed to initialize YouTube IFrame Player:', e);
    }
  };

  // Periodic saver: saves the video's current playback progress every 5 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (!currentUrl) return;
      
      const currentTime = getPlayerCurrentTime();
      if (currentTime > 0) {
        updateSessionInStorage(currentUrl, { lastPlayedTime: currentTime });
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [currentUrl, playerType, ytPlayerReady]);

  // Extract current time of the player
  const getPlayerCurrentTime = () => {
    if (playerType === 'youtube' && ytPlayerRef.current && ytPlayerReady && typeof ytPlayerRef.current.getCurrentTime === 'function') {
      try {
        return Math.floor(ytPlayerRef.current.getCurrentTime());
      } catch (e) {
        return 0;
      }
    }
    if (playerType === 'direct' && videoRef.current) {
      return Math.floor(videoRef.current.currentTime);
    }
    return 0;
  };

  // Seek the player to a target timestamp
  const seekToTime = (seconds) => {
    if (playerType === 'youtube' && ytPlayerRef.current && ytPlayerReady && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
      ytPlayerRef.current.playVideo();
    } else if (playerType === 'direct' && videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    } else {
      showFeedback('Seeking is only supported for YouTube and native video files');
    }
  };

  // Update session info in localStorage
  const updateSessionInStorage = (url, updatedFields) => {
    if (!url) return;
    
    setSessions((prevSessions) => {
      const existingIdx = prevSessions.findIndex(s => s.url === url);
      let newSessions = [...prevSessions];
      
      if (existingIdx > -1) {
        newSessions[existingIdx] = {
          ...newSessions[existingIdx],
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
      } else {
        newSessions.push({
          url,
          title: videoTitle || 'Video Study Session',
          notes: notes,
          lastPlayedTime: 0,
          taskId: associatedTaskId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...updatedFields
        });
      }
      
      // Sort by updatedAt descending
      newSessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newSessions));
      return newSessions;
    });
  };

  // Load a video session
  const loadVideoUrl = (url, titleFromSession = '') => {
    if (!url.trim()) return;

    // Identify sources
    const ytId = getYouTubeId(url);
    const vimeoId = getVimeoId(url);
    const isDirect = isDirectVideo(url);

    let detectedType = 'fallback';
    let idValue = '';

    if (ytId) {
      detectedType = 'youtube';
      idValue = ytId;
    } else if (vimeoId) {
      detectedType = 'vimeo';
      idValue = vimeoId;
    } else if (isDirect) {
      detectedType = 'direct';
      idValue = url;
    }

    setPlayerType(detectedType);
    setVideoId(idValue);
    setCurrentUrl(url);

    // Look up this URL in saved sessions to load past notes & meta
    const saved = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
    const existingSession = saved.find(s => s.url === url);

    if (existingSession) {
      setNotes(existingSession.notes || []);
      setVideoTitle(existingSession.title || 'Untitled Study Video');
      setAssociatedTaskId(existingSession.taskId || '');
      showFeedback('Past note-taking session restored!');
    } else {
      setNotes([]);
      const defaultTitle = titleFromSession || `Study Session (${new Date().toLocaleDateString()})`;
      setVideoTitle(defaultTitle);
      setAssociatedTaskId('');
      
      // Initialize this session in local storage
      const newSession = {
        url,
        title: defaultTitle,
        notes: [],
        lastPlayedTime: 0,
        taskId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const newSessionsList = [newSession, ...saved.filter(s => s.url !== url)];
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newSessionsList));
      setSessions(newSessionsList);
    }
  };

  // URL Submission
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl) return;
    loadVideoUrl(inputUrl);
  };

  // Note Submission
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    // Capture the time
    let timeOfNote = composerTime;
    if (timeOfNote === null) {
      timeOfNote = getPlayerCurrentTime();
    }

    const newNote = {
      id: Date.now().toString(),
      time: timeOfNote,
      content: noteText.trim(),
      tag: noteTag,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...notes, newNote].sort((a, b) => {
      // Sort by timestamp if both have one, otherwise general notes at top
      if (a.time === null && b.time !== null) return -1;
      if (a.time !== null && b.time === null) return 1;
      if (a.time === null && b.time === null) return new Date(b.createdAt) - new Date(a.createdAt);
      return a.time - b.time;
    });

    setNotes(updatedNotes);
    setNoteText('');
    setComposerTime(null);
    setNoteTag('standard');

    // Save to storage
    updateSessionInStorage(currentUrl, { notes: updatedNotes });
    showFeedback('Note logged!');
  };

  // Sync composer time button
  const handleComposerTimeCapture = () => {
    const time = getPlayerCurrentTime();
    setComposerTime(time);
    showFeedback(`Timestamp captured: ${formatSeconds(time)}`);
  };

  // Clear composer timestamp
  const handleClearComposerTime = () => {
    setComposerTime(null);
  };

  // Delete note
  const handleDeleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    updateSessionInStorage(currentUrl, { notes: updated });
    showFeedback('Note deleted.');
  };

  // Start editing a note inline
  const handleStartEdit = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.content);
  };

  // Save inline edit
  const handleSaveEdit = (id) => {
    if (!editingNoteText.trim()) return;

    const updated = notes.map(n => {
      if (n.id === id) {
        return { ...n, content: editingNoteText.trim() };
      }
      return n;
    });

    setNotes(updated);
    setEditingNoteId(null);
    setEditingNoteText('');
    updateSessionInStorage(currentUrl, { notes: updated });
    showFeedback('Note updated.');
  };

  // Delete a recent session entirely from history
  const handleDeleteSession = (e, urlToDelete) => {
    e.stopPropagation();
    if (window.confirm('Delete this session and all its notes? This cannot be undone.')) {
      const saved = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
      const filtered = saved.filter(s => s.url !== urlToDelete);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
      setSessions(filtered);
      
      if (currentUrl === urlToDelete) {
        setCurrentUrl('');
        setPlayerType(null);
        setVideoId('');
        setNotes([]);
      }
      showFeedback('Study notebook removed.');
    }
  };

  // Rename session title
  const handleRenameTitle = () => {
    if (!tempTitle.trim()) return;
    setVideoTitle(tempTitle.trim());
    setIsEditingTitle(false);
    updateSessionInStorage(currentUrl, { title: tempTitle.trim() });
    showFeedback('Notebook renamed.');
  };

  // Task Association Change
  const handleTaskChange = (taskId) => {
    setAssociatedTaskId(taskId);
    updateSessionInStorage(currentUrl, { taskId: taskId });
    showFeedback('Session associated with task!');
  };

  // Keyboard shortcut listener for active playback
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentUrl) return;

      // Ensure we don't block typing in inputs or textareas, unless using Alt modifications
      const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      // Alt + P -> Play/Pause
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePlayPause();
      }

      // Alt + N -> Capture current timestamp and focus the composer
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const time = getPlayerCurrentTime();
        setComposerTime(time);
        
        const composerElement = document.querySelector('.composer-textarea');
        if (composerElement) {
          composerElement.focus();
        }
        showFeedback(`Focusing composer at ${formatSeconds(time)}`);
      }

      // Alt + T -> Grab timestamp but don't force focus
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const time = getPlayerCurrentTime();
        setComposerTime(time);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUrl, playerType, ytPlayerReady]);

  // Toggle Video Play/Pause
  const togglePlayPause = () => {
    if (playerType === 'youtube' && ytPlayerRef.current && ytPlayerReady) {
      try {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) { // playing
          ytPlayerRef.current.pauseVideo();
          showFeedback('Video paused');
        } else {
          ytPlayerRef.current.playVideo();
          showFeedback('Video playing');
        }
      } catch (e) {}
    } else if (playerType === 'direct' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        showFeedback('Video playing');
      } else {
        videoRef.current.pause();
        showFeedback('Video paused');
      }
    }
  };

  // Export Notes to Markdown File
  const handleExportMarkdown = () => {
    if (notes.length === 0) {
      showFeedback('No notes available to export');
      return;
    }

    const taskName = tasks.find(t => t.id === parseInt(associatedTaskId))?.name || 'None';
    
    let mdContent = `# Focus Study Notes: ${videoTitle}\n\n`;
    mdContent += `- **Source URL**: ${currentUrl}\n`;
    mdContent += `- **Associated Task**: ${taskName}\n`;
    mdContent += `- **Session Created**: ${new Date(sessions.find(s => s.url === currentUrl)?.createdAt || Date.now()).toLocaleString()}\n\n`;
    mdContent += `## Notes Checklist & Timeline\n\n`;

    notes.forEach(note => {
      const timeStr = note.time !== null ? `\`[${formatSeconds(note.time)}]\`` : '`[General]`';
      const tagStr = note.tag !== 'standard' ? ` **(${note.tag.toUpperCase()})**` : '';
      mdContent += `${timeStr}${tagStr} ${note.content}\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${videoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Markdown notes exported!');
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatSeconds(note.time).includes(searchQuery)
  );

  return (
    <div className={`focus-player-page ${isCinemaMode ? 'cinema-mode' : ''} fade-in`}>
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="error-alert" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)'
        }}>
          {feedbackMsg}
        </div>
      )}

      {/* Header bar */}
      <div className="player-header">
        <div className="player-title-section">
          {currentUrl && !isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1>{videoTitle}</h1>
              <button 
                onClick={() => {
                  setTempTitle(videoTitle);
                  setIsEditingTitle(true);
                }} 
                className="note-action-btn"
                title="Rename Session"
              >
                <Edit2 size={16} />
              </button>
            </div>
          ) : currentUrl && isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.3rem 0.6rem', fontSize: '1.1rem', background: '#1e293b', border: '1px solid var(--primary)', color: 'white', width: '250px' }}
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                autoFocus
              />
              <button onClick={handleRenameTitle} className="note-action-btn text-green" title="Save">
                <Check size={18} className="icon-green" style={{ color: 'var(--accent-success)' }} />
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="note-action-btn" title="Cancel">
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <h1>Focus Player</h1>
              <p>Distraction-free video workspace for heavy grinders.</p>
            </>
          )}
        </div>

        {currentUrl && (
          <div className="layout-controls">
            <button 
              className={`layout-btn ${layout === 'split' && !isCinemaMode ? 'active' : ''}`}
              onClick={() => {
                setLayout('split');
                setIsCinemaMode(false);
              }}
              title="Split View"
            >
              <Columns size={16} />
              <span>Split Screen</span>
            </button>
            
            <button 
              className={`layout-btn ${layout === 'theater' && !isCinemaMode ? 'active' : ''}`}
              onClick={() => {
                setLayout('theater');
                setIsCinemaMode(false);
              }}
              title="Theater View"
            >
              <Tv size={16} />
              <span>Theater Mode</span>
            </button>
            
            <button 
              className={`layout-btn ${isCinemaMode ? 'active' : ''}`}
              onClick={() => {
                setIsCinemaMode(!isCinemaMode);
              }}
              title="Cinema Mode (Distraction-Free)"
            >
              {isCinemaMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>Cinema Mode</span>
            </button>

            <button 
              className="layout-btn btn-danger"
              style={{ padding: '0.5rem 0.75rem' }}
              onClick={() => {
                setCurrentUrl('');
                setPlayerType(null);
                setVideoId('');
                setNotes([]);
              }}
            >
              <X size={16} />
              <span>Close Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      {!currentUrl ? (
        /* SETUP MODE - URL INPUT CARD */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
          <div className="url-setup-container">
            <div className="url-setup-card fade-in">
              <div className="setup-icon-wrapper">
                <Video size={36} />
              </div>
              <h2>Start Study Session</h2>
              <p>Paste a YouTube link, Vimeo URL, or direct video file path to start taking timestamped notes.</p>
              
              <form onSubmit={handleUrlSubmit} className="url-input-form">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem' }}>
                  <span>Load Notebook Player</span>
                </button>
              </form>

              <div className="supported-badge-row">
                <span className="supported-badge">
                  <YoutubeIcon size={12} style={{ color: '#ef4444' }} /> YouTube
                </span>
                <span className="supported-badge">
                  <Tv size={12} style={{ color: '#38bdf8' }} /> Vimeo
                </span>
                <span className="supported-badge">
                  <Video size={12} style={{ color: '#10b981' }} /> MP4 / WebM
                </span>
              </div>
            </div>
          </div>

          {/* Recent Video Notebooks */}
          {sessions.length > 0 && (
            <div className="recent-sessions-card container" style={{ maxWidth: '800px', width: '100%', margin: '0 auto 3rem' }}>
              <h3>Your Study Notebooks ({sessions.length})</h3>
              <div className="recent-list">
                {sessions.map((sess) => (
                  <div 
                    key={sess.url} 
                    className="recent-item"
                    onClick={() => {
                      setInputUrl(sess.url);
                      loadVideoUrl(sess.url, sess.title);
                    }}
                  >
                    <div className="recent-info">
                      <span className="recent-title">{sess.title}</span>
                      <span className="recent-url">{sess.url}</span>
                    </div>
                    <span className="recent-notes-count">
                      {sess.notes ? sess.notes.length : 0} notes
                    </span>
                    <button 
                      onClick={(e) => handleDeleteSession(e, sess.url)} 
                      className="recent-delete-btn"
                      title="Delete Notebook"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* WORKSPACE MODE - VIDEO + NOTES */
        <div className={`workspace-layout ${layout} ${isCinemaMode ? 'focus-mode' : ''}`}>
          
          {/* Column 1: Video Display & Controls */}
          <div className="video-column">
            <div className="video-player-wrapper">
              {playerType === 'youtube' && (
                <iframe
                  id="youtube-player-iframe"
                  className="video-iframe"
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&iv_load_policy=3&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube Focus Embed"
                ></iframe>
              )}
              {playerType === 'vimeo' && (
                <iframe
                  className="video-iframe"
                  src={`https://player.vimeo.com/video/${videoId}?autoplay=0&dnt=1`}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Vimeo Focus Embed"
                ></iframe>
              )}
              {playerType === 'direct' && (
                <video
                  ref={videoRef}
                  className="native-video"
                  controls
                  src={videoId}
                  title="Native Video Player"
                ></video>
              )}
              {playerType === 'fallback' && (
                <iframe
                  className="video-iframe"
                  src={currentUrl}
                  title="Web Focus Embed"
                ></iframe>
              )}
            </div>

            {/* Video metadata controls */}
            <div className="video-meta-bar">
              <div className="video-info">
                <span className={`video-source-badge ${playerType}`}>
                  {playerType}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.75rem' }}>
                  Resumes from last position
                </span>
              </div>

              <div className="video-actions">
                {/* Associated Task */}
                <div className="task-association-row">
                  <BookOpen size={14} style={{ color: '#818cf8' }} />
                  <select 
                    value={associatedTaskId}
                    onChange={(e) => handleTaskChange(e.target.value)}
                  >
                    <option value="">No Associated Task</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Recent Video sessions sidebar shown under player in Theater Mode to conserve space */}
            {layout === 'theater' && sessions.length > 1 && (
              <div className="recent-sessions-card" style={{ marginTop: '1rem' }}>
                <h3>Quick Switch Notebooks</h3>
                <div className="recent-list" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', flexWrap: 'wrap', maxHeight: 'none' }}>
                  {sessions.filter(s => s.url !== currentUrl).slice(0, 4).map((sess) => (
                    <div 
                      key={sess.url} 
                      className="recent-item" 
                      style={{ flex: '1 1 200px', maxWidth: '240px' }}
                      onClick={() => loadVideoUrl(sess.url, sess.title)}
                    >
                      <div className="recent-info">
                        <span className="recent-title">{sess.title}</span>
                      </div>
                      <span className="recent-notes-count">{sess.notes?.length || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Note Taking Sheet */}
          <div className="notes-column">
            <div className="notes-header">
              <h2>
                <Clock size={18} style={{ color: '#818cf8' }} />
                <span>Video Study Notes ({notes.length})</span>
              </h2>

              <button 
                onClick={handleExportMarkdown} 
                className="layout-btn"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                title="Export notes to local markdown"
              >
                <Download size={14} />
                <span>Export MD</span>
              </button>
            </div>

            {/* Notes Search Filter */}
            <div className="notes-search-wrapper">
              <div className="search-input-container">
                <Search size={14} className="search-icon-left" />
                <input
                  type="text"
                  placeholder="Filter notes by text, tag or timestamp..."
                  className="search-notes-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Notes List */}
            <div className="notes-list">
              {filteredNotes.length === 0 ? (
                <div className="empty-notes">
                  <BookOpen size={36} style={{ color: '#334155' }} />
                  <p>{searchQuery ? 'No matching notes found.' : 'Your notes are blank. Log important timelines and ideas below!'}</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div key={note.id} className={`note-item ${note.tag}`}>
                    
                    {/* Note Item Header (Meta and Actions) */}
                    <div className="note-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {note.time !== null && (
                          <button 
                            className="timestamp-badge"
                            onClick={() => seekToTime(note.time)}
                            title="Jump to timeline"
                          >
                            <Play size={10} fill="currentColor" />
                            <span>{formatSeconds(note.time)}</span>
                          </button>
                        )}
                        {note.tag !== 'standard' && (
                          <span className={`note-tag ${note.tag}`}>{note.tag}</span>
                        )}
                      </div>

                      {editingNoteId !== note.id && (
                        <div className="note-actions">
                          <button 
                            onClick={() => handleStartEdit(note)} 
                            className="note-action-btn"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteNote(note.id)} 
                            className="note-action-btn delete"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content Display or Edit input */}
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea
                          className="edit-note-textarea"
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                        />
                        <div className="edit-actions-row">
                          <button 
                            onClick={() => handleSaveEdit(note.id)} 
                            className="btn btn-primary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingNoteId(null)} 
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="note-content-text">{note.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Note Composer */}
            <form onSubmit={handleAddNote} className="note-composer">
              <div className="composer-input-row">
                <textarea
                  className="composer-textarea"
                  placeholder="Type a study note... Press Enter to log."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter logs note, Shift+Enter permits newlines
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote(e);
                    }
                  }}
                  required
                />
                
                {/* Sync Playback Time Button */}
                <button
                  type="button"
                  onClick={handleComposerTimeCapture}
                  className={`quick-timestamp-btn ${composerTime !== null ? 'has-timestamp' : ''}`}
                  title="Capture current video playback time"
                >
                  <Clock size={16} />
                  <span>{composerTime !== null ? formatSeconds(composerTime) : 'Capture'}</span>
                </button>

                {composerTime !== null && (
                  <button
                    type="button"
                    onClick={handleClearComposerTime}
                    className="note-action-btn"
                    title="Remove Timestamp"
                    style={{ padding: '0 0.25rem' }}
                  >
                    <X size={14} className="text-danger" />
                  </button>
                )}
              </div>

              {/* Lower Tool Bar: Tag Selector, Shortcuts helper, Submission */}
              <div className="composer-tools-row">
                <div className="composer-tags">
                  <button
                    type="button"
                    onClick={() => setNoteTag('standard')}
                    className={`tag-selector-btn ${noteTag === 'standard' ? 'active standard' : ''}`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteTag('important')}
                    className={`tag-selector-btn ${noteTag === 'important' ? 'active important' : ''}`}
                  >
                    Important
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteTag('question')}
                    className={`tag-selector-btn ${noteTag === 'question' ? 'active question' : ''}`}
                  >
                    Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteTag('idea')}
                    className={`tag-selector-btn ${noteTag === 'idea' ? 'active idea' : ''}`}
                  >
                    Idea
                  </button>
                </div>

                <div className="composer-actions">
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Plus size={14} />
                    <span>Log Note</span>
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcut Hints */}
              <div className="keyboard-shortcut-hint">
                Shortcuts: <kbd>Alt+P</kbd> Play/Pause • <kbd>Alt+N</kbd> Log Note at Time • <kbd>Alt+T</kbd> Capture Time
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
