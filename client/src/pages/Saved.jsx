import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supaBaseClient';
import './Saved.css';

const Saved = () => {
  const [user, setUser] = useState(null);
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [savingKey, setSavingKey] = useState('');

  const savedKeys = useMemo(
    () => new Set(savedEvents.map((item) => item.event_key)),
    [savedEvents]
  );

  const getEventKey = (event) => {
    if (event?.id) return `id:${event.id}`;
    if (event?.redirectURL) return `url:${event.redirectURL}`;
    return `title:${event?.title || 'event'}|${event?.hostedBy || 'host'}`;
  };

  const fetchSavedEvents = async (currentUser) => {
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('saved_events')
        .select('id, event_key, event, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setSavedEvents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user || null);
      if (data.session?.user) {
        fetchSavedEvents(data.session.user);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) {
        fetchSavedEvents(session.user);
      } else {
        setSavedEvents([]);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setAuthStatus('');

    if (!authEmail.trim()) {
      setAuthStatus('Please enter your email.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin + '/saved' }
    });

    if (signInError) {
      setAuthStatus(signInError.message);
      return;
    }

    setAuthStatus('Check your email for the sign-in link.');
  };

  const handleToggleSave = async (event) => {
    if (!user) return;
    const key = getEventKey(event);

    try {
      setSavingKey(key);
      if (savedKeys.has(key)) {
        const { error: deleteError } = await supabase
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_key', key);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        setSavedEvents((prev) => prev.filter((item) => item.event_key !== key));
        return;
      }

      const { error: insertError } = await supabase
        .from('saved_events')
        .insert([
          {
            user_id: user.id,
            event_key: key,
            event: event
          }
        ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSavedEvents((prev) => [
        { event_key: key, event },
        ...prev
      ]);
    } catch (err) {
      setError(err.message || 'Failed to update saved events.');
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="saved">
      {/* Hero */}
      <div className="saved__hero">
        <div className="saved__hero-bg">
          <div className="saved__orb saved__orb--1" />
          <div className="saved__orb saved__orb--2" />
        </div>
        <div className="saved__hero-content">
          <Link className="saved__back" to="/home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Events
          </Link>
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-4px', marginRight: '8px', color: 'var(--accent-cyan)' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Saved Events
          </h1>
          <p>Keep track of the opportunities you want to join.</p>
          {savedEvents.length > 0 && (
            <span className="saved__count">{savedEvents.length} saved</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="saved__content">
        {/* Not signed in */}
        {!user && (
          <div className="saved__auth-card">
            <div className="saved__auth-icon">🔐</div>
            <h3>Sign in to view your saved events</h3>
            <p>We'll send a magic link — no password needed.</p>
            <form onSubmit={handleSignIn} className="saved__auth-form">
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="saved__auth-input"
              />
              <button type="submit" className="btn btn-primary">
                Send Sign-in Link
              </button>
            </form>
            {authStatus && <span className="saved__auth-status">{authStatus}</span>}
          </div>
        )}

        {/* Error */}
        {user && error && (
          <div className="saved__error">{error}</div>
        )}

        {/* Loading */}
        {user && loading && (
          <div className="saved__loading">
            <div className="saved__loading-spinner" />
            <p>Loading saved events…</p>
          </div>
        )}

        {/* Empty */}
        {user && !loading && savedEvents.length === 0 && (
          <div className="saved__empty">
            <div className="saved__empty-icon">⭐</div>
            <h3>No saved events yet</h3>
            <p>Save events from the explore page to see them here.</p>
            <Link to="/home" className="btn btn-primary">
              Browse events
            </Link>
          </div>
        )}

        {/* Grid */}
        {user && !loading && savedEvents.length > 0 && (
          <div className="saved__grid">
            {savedEvents.map((item) => (
              <EventCard
                key={item.event_key}
                event={item.event}
                eventKey={item.event_key}
                isSaved={savedKeys.has(item.event_key)}
                onToggleSave={handleToggleSave}
                savingKey={savingKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
