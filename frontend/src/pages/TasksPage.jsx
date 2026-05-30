import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckSquare, Square, ClipboardList, Plus } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './TasksPage.css';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch tasks
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
          headers: {
            'X-Auth-Token': token
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        } else if (response.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token, navigate]);

  // Handle Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ name: newTaskName.trim() })
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
        setNewTaskName('');
      } else {
        const err = await response.json();
        setMessage(err.error || 'Failed to create task');
      }
    } catch (err) {
      setMessage('Server error while adding task');
    }
  };

  // Toggle Task Status (complete/active)
  const handleToggleTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask : t))
        );
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) {
    return <div className="tasks-loading">Loading your board...</div>;
  }

  return (
    <div className="tasks-page container fade-in">
      <div className="tasks-header">
        <h1>Task Organizer</h1>
        <p>List tasks before working, check them off as you grind.</p>
      </div>

      {message && <div className="error-alert">{message}</div>}

      {/* Add Task Block */}
      <form onSubmit={handleAddTask} className="add-task-form card">
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Finish programming assignment..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </form>

      {/* Task Panels */}
      <div className="tasks-layout">
        {/* Active Tasks Panel */}
        <div className="tasks-panel">
          <h3 className="panel-title">Active ({activeTasks.length})</h3>
          {activeTasks.length === 0 ? (
            <div className="empty-panel card">
              <ClipboardList size={32} className="icon-muted" />
              <p>No active tasks! Write one above to start.</p>
            </div>
          ) : (
            <div className="task-list">
              {activeTasks.map((task) => (
                <div key={task.id} className="task-item card">
                  <button 
                    onClick={() => handleToggleTask(task.id)} 
                    className="task-toggle-btn"
                  >
                    <Square size={20} className="icon-muted" />
                  </button>
                  <span className="task-name">{task.name}</span>
                  <button 
                    onClick={() => handleDeleteTask(task.id)} 
                    className="task-delete-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks Panel */}
        <div className="tasks-panel">
          <h3 className="panel-title">Completed ({completedTasks.length})</h3>
          {completedTasks.length === 0 ? (
            <div className="empty-panel card">
              <ClipboardList size={32} className="icon-muted" />
              <p>No tasks completed yet. Keep pushing!</p>
            </div>
          ) : (
            <div className="task-list">
              {completedTasks.map((task) => (
                <div key={task.id} className="task-item completed card">
                  <button 
                    onClick={() => handleToggleTask(task.id)} 
                    className="task-toggle-btn"
                  >
                    <CheckCircle2 className="icon-green" size={20} />
                  </button>
                  <span className="task-name">{task.name}</span>
                  <button 
                    onClick={() => handleDeleteTask(task.id)} 
                    className="task-delete-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Local CheckCircle helper since CheckSquare is exported from lucide, but CheckCircle2 is better for completed state
import { CheckCircle2 } from 'lucide-react';
