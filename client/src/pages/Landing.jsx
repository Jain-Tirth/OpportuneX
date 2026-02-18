import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supaBaseClient';
import './Landing.css';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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

    setStatus(`${intentLabel} link sent. Check your inbox.`);
    setLoading(false);
  };

  return (
    <div className="landing">
      <header className="landing-hero">
        <nav className="landing-nav">
          <div className="brand">
            <span className="brand-mark">OpportuneX</span>
          </div>
          <div className="nav-actions">
            <Link to="/home" className="nav-link">
              Explore events
            </Link>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-tag">Find opportunities fast</span>
            <h1>
              Discover hackathons,
              <span className="accent"> curated for builders.</span>
            </h1>
            <p>
              OpportuneX surfaces the best events across platforms with smart filters and
              reminders, so you never miss a deadline.
            </p>
            <div className="hero-cta">
              <Link to="/home" className="btn btn-primary">
                Browse events
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(event) => handleMagicLink(event, 'Login')}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Login'}
              </button>
            </div>
          </div>

          <div className="hero-card">
            <h2>Get started</h2>
            <p>Use a magic link to sign in or create your account.</p>
            <form className="hero-form">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(event) => handleMagicLink(event, 'Login')}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(event) => handleMagicLink(event, 'Sign up')}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Sign up'}
                </button>
              </div>
              {status && <span className="form-status">{status}</span>}
            </form>
          </div>
        </div>
      </header>

      <section className="landing-highlights">
        <div className="highlight-card">
          <h3>Smart filters</h3>
          <p>Slice events by platform, location, and deadline to find the right fit.</p>
        </div>
        <div className="highlight-card">
          <h3>Live updates</h3>
          <p>Stay ahead with constantly refreshed hackathon listings and details.</p>
        </div>
        <div className="highlight-card">
          <h3>Save & share</h3>
          <p>Bookmark events and share with your team in seconds.</p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
