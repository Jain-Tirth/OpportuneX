import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supaBaseClient';
import './Landing.css';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMagicLink = async (event, intentLabel) => {
    event.preventDefault();
    setStatus('');

    if (!email.trim()) {
      setStatus('Please enter your email.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/home` }
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatus(`${intentLabel} link sent! Check your inbox.`);
    setLoading(false);
  };

  return (
    <div className="landing">
      {/* Animated background elements */}
      <div className="landing__bg">
        <div className="landing__orb landing__orb--1" />
        <div className="landing__orb landing__orb--2" />
        <div className="landing__orb landing__orb--3" />
        <div className="landing__grid-lines" />
      </div>

      {/* Navigation */}
      <nav className="landing__nav">
        <div className="landing__nav-brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="landingLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#landingLogoGrad)" />
            <path d="M10 22V12l6-4 6 4v10l-6 4-6-4z" fill="rgba(255,255,255,0.95)" />
          </svg>
          <span>UniStop</span>
        </div>
        <div className="landing__nav-actions">
          <Link to="/home" className="landing__nav-link">
            Explore events →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="landing__hero">
        <div className="landing__hero-content">
          <div className="landing__badge">
            <span className="landing__badge-dot" />
            <span>Find opportunities fast</span>
          </div>

          <h1 className="landing__title">
            Discover hackathons,
            <br />
            <span className="landing__title-accent">curated for builders.</span>
          </h1>

          <p className="landing__subtitle">
            UniStop surfaces the best events across Devfolio, Unstop, Devpost & more
            — with smart filters and reminders, so you never miss a deadline.
          </p>

          <div className="landing__hero-cta">
            <Link to="/home" className="btn btn-primary landing__btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Browse events
            </Link>
          </div>
        </div>

        {/* Auth Card */}
        <div className="landing__auth-card">
          <div className="landing__auth-glow" />
          <h2>Get started</h2>
          <p>Use a magic link to sign in or create your account — no password needed.</p>
          <form className="landing__form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="email" className="landing__form-label">
              Email address
            </label>
            <div className="landing__input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="landing__form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => handleMagicLink(e, 'Login')}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Login'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(e) => handleMagicLink(e, 'Sign up')}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Sign up'}
              </button>
            </div>
            {status && (
              <span className={`landing__status ${status.includes('Check') ? 'landing__status--success' : ''}`}>
                {status}
              </span>
            )}
          </form>
        </div>
      </header>

      {/* Feature Highlights */}
      <section className="landing__features">
        <div className="landing__feature-card">
          <div className="landing__feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <h3>Smart filters</h3>
          <p>Slice events by platform, type, location, and deadline to find the right fit.</p>
        </div>
        <div className="landing__feature-card">
          <div className="landing__feature-icon landing__feature-icon--purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
            </svg>
          </div>
          <h3>Live updates</h3>
          <p>Stay ahead with constantly refreshed hackathon listings and details.</p>
        </div>
        <div className="landing__feature-card">
          <div className="landing__feature-icon landing__feature-icon--pink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>Save & share</h3>
          <p>Bookmark events and share with your team in seconds.</p>
        </div>
      </section>

      {/* Platform Logos */}
      <section className="landing__platforms">
        <span className="landing__platforms-label">Aggregating events from</span>
        <div className="landing__platforms-list">
          <span className="landing__platform">Devfolio</span>
          <span className="landing__platform-dot">·</span>
          <span className="landing__platform">Unstop</span>
          <span className="landing__platform-dot">·</span>
          <span className="landing__platform">Devpost</span>
          <span className="landing__platform-dot">·</span>
          <span className="landing__platform">Eventbrite</span>
        </div>
      </section>
    </div>
  );
};

export default Landing;
