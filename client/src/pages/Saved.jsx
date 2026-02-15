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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    <div className="saved-page">
      <div className="saved-hero">
        <div className="saved-hero-content">
          <Link className="saved-back" to="/">
            Back to Events
          </Link>
          <h1>Saved Events</h1>
          <p>Keep track of the opportunities you want to join.</p>
          {user && (
            <button className="btn btn-secondary" onClick={handleSignOut}>
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="saved-content">
        {!user && (
          <div className="auth-card">
            <h3>Sign in to view your saved events</h3>
            <p>We will send a magic link to your email.</p>
            <form onSubmit={handleSignIn} className="auth-form">
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
              />
              <button type="submit" className="btn btn-primary">
                Send Sign-in Link
              </button>
            </form>
            {authStatus && <span className="auth-status">{authStatus}</span>}
          </div>
        )}

        {user && error && (
          <div className="saved-error">{error}</div>
        )}

        {user && loading && (
          <div className="saved-loading">Loading saved events...</div>
        )}

        {user && !loading && savedEvents.length === 0 && (
          <div className="saved-empty">
            <div className="saved-empty-icon">⭐</div>
            <h3>No saved events yet</h3>
            <p>Save events from the home page to see them here.</p>
            <Link to="/" className="btn btn-primary">Browse events</Link>
          </div>
        )}

        {user && !loading && savedEvents.length > 0 && (
          <div className="saved-grid">
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
