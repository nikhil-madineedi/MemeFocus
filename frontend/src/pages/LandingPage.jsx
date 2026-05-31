import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, CheckSquare, ShieldAlert, BarChart3, Laugh, ArrowRight, Download, Tv } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const token = localStorage.getItem('token');

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container fade-in">
          <h1 className="hero-title">Stay Focused. Or Get Roasted.</h1>
          <p className="hero-subtitle">
            MemeFocus combines a Pomodoro timer, task list, and website blocker with a twist: 
            if you try to visit distracting sites, we redirect you to memes and roasts to force you back to work!
          </p>
          <div className="hero-actions">
            <Link to={token ? "/dashboard" : "/signup"} className="btn btn-primary btn-lg">
              <span>{token ? "Go to Dashboard" : "Start Focusing Free"}</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">How It Works</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card card">
              <Timer className="feature-icon text-indigo" size={32} />
              <h3>Pomodoro Timer</h3>
              <p>Work in blocks of 25 minutes (or configure your own) with automated break alerts.</p>
            </div>
            <div className="feature-card card">
              <CheckSquare className="feature-icon text-green" size={32} />
              <h3>Task Management</h3>
              <p>Keep track of your daily tasks and select what to focus on before starting the timer.</p>
            </div>
            <div className="feature-card card">
              <ShieldAlert className="feature-icon text-red" size={32} />
              <h3>Website Blocking</h3>
              <p>Block distracting websites (social media, news, video streams) during your sessions.</p>
            </div>
            <div className="feature-card card">
              <BarChart3 className="feature-icon text-purple" size={32} />
              <h3>Productivity Tracking</h3>
              <p>Monitor your focus stats, daily sessions, and build a focus streak calendar grid.</p>
            </div>
            <div className="feature-card card">
              <Laugh className="feature-icon text-orange" size={32} />
              <h3>Meme Redirects</h3>
              <p>Get instant redirects to humorous programmer memes and motivational roasts if you slither off track.</p>
            </div>
            <div className="feature-card card">
              <Tv className="feature-icon text-indigo" size={32} />
              <h3>Focus Player & Notes</h3>
              <p>Watch YouTube or Vimeo lecture videos in a distraction-free layout with timeline-synchronized study notes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h4>Start Focus Session</h4>
              <p>Pick a task and run the timer. Your focus clock begins ticking down.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h4>Extension Blocks Distractions</h4>
              <p>Our companion Chrome extension blocks websites you added to your blacklist.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h4>Meme Redirects Appear</h4>
              <p>Instead of social media feeds, you are redirected to a funny meme and a roast.</p>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <h4>Get Back To Work</h4>
              <p>Embarrassed or amused, you close the tab and return to finishing your tasks!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Extension Install Section */}
      <section id="download-extension" className="extension-section">
        <div className="extension-card-landing">
          <h2 className="section-title">Get the Companion Blocker</h2>
          <p className="extension-desc">
            To enforce your focus sessions and redirect distracting sites to roasts, install our lightweight companion Chrome extension manually in under a minute.
          </p>
          <div className="extension-steps">
            <div className="ext-step">
              <span className="ext-num">1</span>
              <p>Click the button below to download the extension as a <strong>ZIP file</strong>.</p>
            </div>
            <div className="ext-step">
              <span className="ext-num">2</span>
              <p>Extract (unzip) the downloaded file on your computer into a folder.</p>
            </div>
            <div className="ext-step">
              <span className="ext-num">3</span>
              <p>Open Google Chrome and navigate to <code>chrome://extensions</code>.</p>
            </div>
            <div className="ext-step">
              <span className="ext-num">4</span>
              <p>Toggle the <strong>Developer mode</strong> switch in the top-right corner.</p>
            </div>
            <div className="ext-step">
              <span className="ext-num">5</span>
              <p>Click the <strong>Load unpacked</strong> button in the top-left and select the extracted folder!</p>
            </div>
          </div>
          <a href="/extension.zip" download className="btn btn-primary btn-lg extension-dl-btn">
            <Download size={18} />
            <span>Download Extension (.ZIP)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
