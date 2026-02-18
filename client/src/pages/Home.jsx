import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supaBaseClient';
import './Home.css';

const getEventKey = (event) => {
  if (event?.id) return `id:${event.id}`;
  if (event?.redirectURL) return `url:${event.redirectURL}`;
  return `title:${event?.title || 'event'}|${event?.hostedBy || 'host'}`;
};

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterFree, setFilterFree] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterBeginner, setFilterBeginner] = useState(false);
  const [filterPrize, setFilterPrize] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');

  const [user, setUser] = useState(null);
  const [savedEventKeys, setSavedEventKeys] = useState([]);
  const [savingKey, setSavingKey] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(12); // You can make this changeable
  const [serverMeta, setServerMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  const fetchEvents = useCallback(async ({ page = 1 } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const payload = await getEvents({
        page,
        limit: eventsPerPage,
        search: debouncedSearch,
        platform: selectedPlatform,
        sortBy,
        free: filterFree,
        online: filterOnline,
        beginner: filterBeginner,
        prize: filterPrize,
        location: locationQuery
      });
      setEvents(payload?.data || []);
      setServerMeta({
        page: payload?.page || page,
        limit: payload?.limit || eventsPerPage,
        total: payload?.total || 0,
        totalPages: payload?.totalPages || 1
      });
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    eventsPerPage,
    debouncedSearch,
    filterBeginner,
    filterFree,
    filterOnline,
    filterPrize,
    locationQuery,
    selectedPlatform,
    sortBy
  ]);

  const savedKeys = useMemo(() => new Set(savedEventKeys), [savedEventKeys]);

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

  useEffect(() => {
    fetchEvents({ page: currentPage });
  }, [currentPage, fetchEvents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    selectedPlatform,
    sortBy,
    filterFree,
    filterOnline,
    filterBeginner,
    filterPrize,
    locationQuery
  ]);

  useEffect(() => {
    if (currentPage > serverMeta.totalPages) {
      setCurrentPage(serverMeta.totalPages || 1);
    }
  }, [currentPage, serverMeta.totalPages]);

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

  // Pagination logic
  const currentEvents = events;
  const totalPages = serverMeta.totalPages;
  const showPagination = totalPages > 1;

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setAuthStatus('');

    if (!authEmail.trim()) {
      setAuthStatus('Please enter your email.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin }
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
    if (!user) {
      setShowAuthPrompt(true);
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

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        setSavedEventKeys((prev) => prev.filter((item) => item !== key));
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

      setSavedEventKeys((prev) => [key, ...prev]);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">Discover Amazing Opportunities</span>
          </div>
          <h1 className="hero-title">
            Explore <span className="gradient-text">Hackathons</span> & Events
          </h1>
          <p className="hero-description">
            Discover cutting-edge hackathons, coding competitions, and tech events from top platforms.
            Join the innovation community and build the future.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions">
            <Link className="btn btn-secondary" to="/saved">
              Saved Events
            </Link>
            {user && (
              <button className="btn btn-secondary" onClick={handleSignOut}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">

          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title">Latest Events</h2>
          </div>

          {/* Search and Filter Controls */}
          {!loading && !error && events.length > 0 && (
            <div className="search-filter-section">
              {/* Search Bar */}
              <div className="search-bar">
                <div className="search-input-container">
                  <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search events, tags, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button
                      className="search-clear"
                      onClick={() => setSearchTerm('')}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Controls */}
              <div className="filter-controls">
                {/* Platform Filter */}
                <div className="filter-group">
                  <label className="filter-label">Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="platform-select"
                  >
                    <option value="all">All Platforms </option>
                    <option value="devfolio">Devfolio </option>
                    <option value="unstop">Unstop </option>
                    <option value="devpost">Devpost</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="filter-group">
                  <label className="filter-label">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="newest">Ending Soon First</option>
                    <option value="endingSoon">Deadline Priority</option>
                    <option value="oldest">Oldest First</option>
                    <option value="deadline">By Deadline</option>
                    <option value="alphabetical">A-Z</option>
                  </select>
                </div>
              </div>

              <div className="filter-chips">
                <label className={`chip ${filterFree ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filterFree}
                    onChange={(e) => setFilterFree(e.target.checked)}
                  />
                  Free
                </label>
                <label className={`chip ${filterOnline ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filterOnline}
                    onChange={(e) => setFilterOnline(e.target.checked)}
                  />
                  Online
                </label>
                <label className={`chip ${filterBeginner ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filterBeginner}
                    onChange={(e) => setFilterBeginner(e.target.checked)}
                  />
                  Beginner
                </label>
                <label className={`chip ${filterPrize ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filterPrize}
                    onChange={(e) => setFilterPrize(e.target.checked)}
                  />
                  Prize
                </label>
                <div className="location-filter">
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Location or region"
                  />
                </div>
              </div>
            </div>
          )}

          {showAuthPrompt && !user && (
            <div className="auth-banner">
              <div className="auth-banner-content">
                <div>
                  <h4>Sign in to save events</h4>
                  <p>We will send a magic link to your email.</p>
                </div>
                <form onSubmit={handleSignIn} className="auth-banner-form">
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <button type="submit" className="btn btn-primary">
                    Send Link
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAuthPrompt(false)}
                  >
                    Later
                  </button>
                </form>
                {authStatus && <span className="auth-status">{authStatus}</span>}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button className="btn btn-sm" onClick={() => fetchEvents({ page: currentPage })}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading amazing events...</p>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && (
            <>
              <div className="events-grid">
                {currentEvents.length > 0 ? (
                  currentEvents.map((event, index) => {
                    const eventKey = getEventKey(event);
                    return (
                      <EventCard
                        key={index}
                        event={event}
                        eventKey={eventKey}
                        isSaved={savedKeys.has(eventKey)}
                        onToggleSave={handleToggleSave}
                        savingKey={savingKey}
                      />
                    );
                  })
                ) : events.length > 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No events found</h3>
                    <p>No events match your current search and filter criteria.</p>
                    <div className="empty-actions">
                      <button className="btn btn-secondary" onClick={() => {
                        setSearchTerm('');
                        setSelectedPlatform('all');
                        setSortBy('newest');
                        setFilterFree(false);
                        setFilterOnline(false);
                        setFilterBeginner(false);
                        setFilterPrize(false);
                        setLocationQuery('');
                      }}>
                        Clear Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <h3>No events found</h3>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {showPagination && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  <div className="pagination-numbers">
                    {getPageNumbers().map((number, index) => (
                      number === '...' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                        >
                          {number}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;