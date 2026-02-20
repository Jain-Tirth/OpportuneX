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
  const [eventsPerPage] = useState(12);
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

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      options: { emailRedirectTo: window.location.origin + '/home' }
    });

    if (signInError) {
      setAuthStatus(signInError.message);
      return;
    }

    setAuthStatus('Check your email for the sign-in link.');
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedPlatform('all');
    setSortBy('newest');
    setFilterFree(false);
    setFilterOnline(false);
    setFilterBeginner(false);
    setFilterPrize(false);
    setLocationQuery('');
  };

  const activeFilterCount = [filterFree, filterOnline, filterBeginner, filterPrize].filter(Boolean).length
    + (selectedPlatform !== 'all' ? 1 : 0)
    + (locationQuery ? 1 : 0)
    + (debouncedSearch ? 1 : 0);

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="home__hero">
        <div className="home__hero-bg">
          <div className="home__hero-orb home__hero-orb--1" />
          <div className="home__hero-orb home__hero-orb--2" />
        </div>
        <div className="home__hero-content">
          <div className="home__hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Discover Amazing Opportunities</span>
          </div>
          <h1 className="home__hero-title">
            Explore <span className="home__gradient-text">Hackathons</span> & Events
          </h1>
          <p className="home__hero-desc">
            Discover cutting-edge hackathons, coding competitions, and tech events from top platforms.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="home__main">
        <div className="home__container">

          {/* Section Header with count */}
          <div className="home__section-header">
            <div className="home__section-left">
              <h2 className="home__section-title">Latest Events</h2>
              {serverMeta.total > 0 && (
                <span className="home__section-count">{serverMeta.total} events</span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button className="home__clear-all" onClick={clearAllFilters}>
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Search and Filter Controls */}
          {!loading && !error && (
            <div className="home__filters">
              {/* Search Bar */}
              <div className="home__search">
                <div className="home__search-inner">
                  <svg className="home__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search events, tags, or descriptions…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="home__search-input"
                    id="event-search-input"
                  />
                  {searchTerm && (
                    <button
                      className="home__search-clear"
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Dropdowns */}
              <div className="home__filter-row">
                <div className="home__filter-group">
                  <label className="home__filter-label">Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="home__select"
                    id="platform-filter"
                  >
                    <option value="all">All Platforms</option>
                    <option value="devfolio">Devfolio</option>
                    <option value="unstop">Unstop</option>
                    <option value="devpost">Devpost</option>
                  </select>
                </div>

                <div className="home__filter-group">
                  <label className="home__filter-label">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="home__select"
                    id="sort-filter"
                  >
                    <option value="newest">Ending Soon First</option>
                    <option value="endingSoon">Deadline Priority</option>
                    <option value="oldest">Oldest First</option>
                    <option value="deadline">By Deadline</option>
                    <option value="alphabetical">A–Z</option>
                  </select>
                </div>
              </div>

              {/* Chips */}
              <div className="home__chips">
                <label className={`home__chip ${filterFree ? 'home__chip--active' : ''}`}>
                  <input type="checkbox" checked={filterFree} onChange={(e) => setFilterFree(e.target.checked)} />
                  💸 Free
                </label>
                <label className={`home__chip ${filterOnline ? 'home__chip--active' : ''}`}>
                  <input type="checkbox" checked={filterOnline} onChange={(e) => setFilterOnline(e.target.checked)} />
                  🌐 Online
                </label>
                <label className={`home__chip ${filterBeginner ? 'home__chip--active' : ''}`}>
                  <input type="checkbox" checked={filterBeginner} onChange={(e) => setFilterBeginner(e.target.checked)} />
                  🌱 Beginner
                </label>
                <label className={`home__chip ${filterPrize ? 'home__chip--active' : ''}`}>
                  <input type="checkbox" checked={filterPrize} onChange={(e) => setFilterPrize(e.target.checked)} />
                  🏆 Prize
                </label>
                <div className="home__location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Location or region"
                    id="location-filter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auth prompt */}
          {showAuthPrompt && !user && (
            <div className="home__auth-banner">
              <div className="home__auth-info">
                <h4>Sign in to save events</h4>
                <p>We'll send a magic link to your email.</p>
              </div>
              <form onSubmit={handleSignIn} className="home__auth-form">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Send Link
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAuthPrompt(false)}
                >
                  Later
                </button>
              </form>
              {authStatus && <span className="home__auth-status">{authStatus}</span>}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="home__error">
              <div className="home__error-icon">⚠️</div>
              <div className="home__error-body">
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button className="btn btn-primary btn-sm" onClick={() => fetchEvents({ page: currentPage })}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="home__loading">
              <div className="home__loading-spinner" />
              <p>Loading amazing events…</p>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && (
            <>
              <div className="home__grid">
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
                ) : (
                  <div className="home__empty">
                    <div className="home__empty-icon">
                      {debouncedSearch || activeFilterCount > 0 ? '🔍' : '🎯'}
                    </div>
                    <h3>No events found</h3>
                    {(debouncedSearch || activeFilterCount > 0) && (
                      <>
                        <p>No events match your current filters.</p>
                        <button className="btn btn-secondary" onClick={clearAllFilters}>
                          Clear Filters
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {showPagination && (
                <div className="home__pagination">
                  <button
                    className="home__page-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    Prev
                  </button>

                  <div className="home__page-numbers">
                    {getPageNumbers().map((number, index) => (
                      number === '...' ? (
                        <span key={`ellipsis-${index}`} className="home__page-ellipsis">…</span>
                      ) : (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`home__page-num ${currentPage === number ? 'home__page-num--active' : ''}`}
                        >
                          {number}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    className="home__page-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
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