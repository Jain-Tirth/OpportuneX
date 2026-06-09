import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supaBaseClient';
import './Hub.css';

const getEventKey = (event) => {
  if (event?.id) return `id:${event.id}`;
  if (event?.redirectURL) return `url:${event.redirectURL}`;
  return `title:${event?.title || 'event'}|${event?.hostedBy || 'host'}`;
};

export default function Hub() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [savedEventKeys, setSavedEventKeys] = useState([]);
  const [savingKey, setSavingKey] = useState('');
  const navigate = useNavigate();

  // Load user and saved keys
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchSavedKeys(currentUser);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchSavedKeys(currentUser);
      } else {
        setSavedEventKeys([]);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchSavedKeys = async (currentUser) => {
    const { data, error: fetchError } = await supabase
      .from('saved_events')
      .select('event_key')
      .eq('user_id', currentUser.id);

    if (fetchError) {
      console.error('Failed to load saved events:', fetchError.message);
      return;
    }
    setSavedEventKeys((data || []).map((row) => row.event_key));
  };

  // Fetch top events for dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get newest events
        const res = await getEvents({ page: 1, limit: 10, sortBy: 'newest' });
        setEvents(res?.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const savedKeys = useMemo(() => new Set(savedEventKeys), [savedEventKeys]);

  const handleToggleSave = async (event) => {
    if (!user) {
      navigate('/');
      return;
    }

    const key = getEventKey(event);
    try {
      setSavingKey(key);
      if (savedKeys.has(key)) {
        const { error: deleteError } = await supabase
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_key', key);

        if (deleteError) throw new Error(deleteError.message);
        setSavedEventKeys((prev) => prev.filter((item) => item !== key));
        return;
      }

      const { error: insertError } = await supabase
        .from('saved_events')
        .insert([{ user_id: user.id, event_key: key, event }]);

      if (insertError) throw new Error(insertError.message);
      setSavedEventKeys((prev) => [key, ...prev]);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingKey('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/filter?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleChipClick = (tech) => {
    navigate(`/filter?search=${encodeURIComponent(tech)}`);
  };

  const userName = user?.email ? user.email.split('@')[0] : 'Builder';

  // Split events for sections
  const trendingEvents = events.slice(0, 4);
  const closingSoonEvents = events.slice(4, 8);

  return (
    <div className="hub-page">
      {/* Hero Welcome Banner */}
      <section className="hub-hero">
        <div className="hub-hero__content">
          <h1 className="hub-hero__title">
            Hello, <span className="hub-hero__username">{userName}</span>!
          </h1>
          <p className="hub-hero__subtitle">Ready to build the future today?</p>
        </div>

        {/* Search Bar Redirector */}
        <form onSubmit={handleSearchSubmit} className="hub-search-form">
          <div className="hub-search-box">
            <svg className="hub-search-box__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search hackathons, tech stacks, or prizes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hub-search-box__input"
            />
            <button type="submit" className="hub-search-box__btn btn btn-primary">
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Tech Stack Chips Section */}
      <section className="hub-section">
        <h2 className="hub-section__title">Stacks You Love</h2>
        <div className="hub-chips">
          {['React', 'Python', 'Node.js', 'Solidity', 'Flutter', 'AI/ML', 'Rust', 'Web3'].map((tech) => (
            <button
              key={tech}
              onClick={() => handleChipClick(tech)}
              className="hub-chip"
            >
              {tech}
            </button>
          ))}
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section className="hub-ai-banner">
        <div className="hub-ai-banner__glow" />
        <div className="hub-ai-banner__icon">🤖</div>
        <div className="hub-ai-banner__info">
          <h3>Need a personalized recommendation?</h3>
          <p>Talk to our RAG-powered chatbot to instantly match hackathons with your skillset.</p>
        </div>
        <Link to="/ai-navigator" className="btn btn-primary hub-ai-banner__cta">
          Ask AI Navigator
        </Link>
      </section>

      {/* Loading & Error States */}
      {loading && (
        <div className="hub-status">
          <div className="hub-status__spinner" />
          <p>Fetching latest events...</p>
        </div>
      )}

      {error && (
        <div className="hub-status hub-status--error">
          <p>⚠️ Failed to load events: {error}</p>
        </div>
      )}

      {/* Trending Hackathons Section */}
      {!loading && !error && trendingEvents.length > 0 && (
        <section className="hub-section">
          <div className="hub-section__header">
            <h2 className="hub-section__title">Trending Now</h2>
            <Link to="/filter?sort=newest" className="hub-section__link">View All →</Link>
          </div>
          <div className="hub-carousel hide-scrollbar">
            {trendingEvents.map((event, idx) => (
              <div key={idx} className="hub-carousel__item">
                <EventCard
                  event={event}
                  eventKey={getEventKey(event)}
                  isSaved={savedKeys.has(getEventKey(event))}
                  onToggleSave={handleToggleSave}
                  savingKey={savingKey}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing Soon Section */}
      {!loading && !error && closingSoonEvents.length > 0 && (
        <section className="hub-section">
          <div className="hub-section__header">
            <h2 className="hub-section__title">Closing Soon</h2>
            <Link to="/filter?sort=endingSoon" className="hub-section__link">View All →</Link>
          </div>
          <div className="hub-grid">
            {closingSoonEvents.map((event, idx) => (
              <EventCard
                key={idx}
                event={event}
                eventKey={getEventKey(event)}
                isSaved={savedKeys.has(getEventKey(event))}
                onToggleSave={handleToggleSave}
                savingKey={savingKey}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
