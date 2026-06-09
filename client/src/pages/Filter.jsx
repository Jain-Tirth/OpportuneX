import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supaBaseClient';
import './Filter.css';

const getEventKey = (event) => {
  if (event?.id) return `id:${event.id}`;
  if (event?.redirectURL) return `url:${event.redirectURL}`;
  return `title:${event?.title || 'event'}|${event?.hostedBy || 'host'}`;
};

export default function Filter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load basic queries from URL or defaults
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  // Filters State
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState(initialSort);
  const [filterFree, setFilterFree] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterBeginner, setFilterBeginner] = useState(false);
  const [filterPrize, setFilterPrize] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(12);
  const [serverMeta, setServerMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Auth/Saved events logic
  const [user, setUser] = useState(null);
  const [savedEventKeys, setSavedEventKeys] = useState([]);
  const [savingKey, setSavingKey] = useState('');

  // Handle debounced search term
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      // Sync URL parameter
      const params = new URLSearchParams(searchParams);
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      } else {
        params.delete('search');
      }
      setSearchParams(params, { replace: true });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, setSearchParams, searchParams]);

  // Sync state if URL param changes externally (e.g. from nav or chips)
  useEffect(() => {
    const s = searchParams.get('search') || '';
    if (s !== searchTerm) {
      setSearchTerm(s);
      setDebouncedSearch(s);
    }
    const so = searchParams.get('sort') || 'newest';
    if (so !== sortBy) {
      setSortBy(so);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load user
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user || null);
      if (data.session?.user) {
        fetchSavedKeys(data.session.user);
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
    selectedPlatform,
    sortBy,
    filterFree,
    filterOnline,
    filterBeginner,
    filterPrize,
    locationQuery
  ]);

  const savedKeys = useMemo(() => new Set(savedEventKeys), [savedEventKeys]);

  useEffect(() => {
    fetchEvents({ page: currentPage });
  }, [currentPage, fetchEvents]);

  // Reset page when filters change
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

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const totalPages = serverMeta.totalPages;

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

  return (
    <div className="filter-page">
      {/* Search Bar Interface */}
      <section className="filter-header">
        <div className="filter-search-wrap">
          <svg className="filter-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search hackathons, stacks, or prizes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="filter-search-clear" onClick={() => setSearchTerm('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Horizontal Filter Chips */}
      <section className="filter-quick-chips">
        <button
          className={`filter-chip ${filterOnline ? 'filter-chip--active' : ''}`}
          onClick={() => setFilterOnline(!filterOnline)}
        >
          🌐 Online / Remote
        </button>
        <button
          className={`filter-chip ${filterPrize ? 'filter-chip--active' : ''}`}
          onClick={() => setFilterPrize(!filterPrize)}
        >
          🏆 High Prize Pools
        </button>
        <button
          className={`filter-chip ${filterFree ? 'filter-chip--active' : ''}`}
          onClick={() => setFilterFree(!filterFree)}
        >
          💸 Free Entry
        </button>
        <button
          className={`filter-chip ${filterBeginner ? 'filter-chip--active' : ''}`}
          onClick={() => setFilterBeginner(!filterBeginner)}
        >
          🌱 Beginner Friendly
        </button>
      </section>

      {/* Results Title Area */}
      <div className="filter-results-info">
        <h2 className="filter-results-title">
          Recommended for you
          {!loading && <span className="filter-results-count">{serverMeta.total} Results</span>}
        </h2>
        {activeFilterCount > 0 && (
          <button className="filter-clear-all" onClick={clearAllFilters}>
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="filter-error">
          <p>⚠️ Oops! Failed to fetch events: {error}</p>
          <button className="btn btn-primary" onClick={() => fetchEvents({ page: currentPage })}>Try Again</button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="filter-loading">
          <div className="filter-loading-spinner" />
          <p>Scanning global database...</p>
        </div>
      )}

      {/* Vertical Results List */}
      {!loading && !error && (
        <section className="filter-results-list">
          {events.length > 0 ? (
            <div className="filter-grid">
              {events.map((event, index) => {
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
              })}
            </div>
          ) : (
            <div className="filter-empty">
              <div className="filter-empty-icon">🔍</div>
              <h3>No hackathons found</h3>
              <p>We couldn't find any events matching your selected filters.</p>
              <button className="btn btn-secondary" onClick={clearAllFilters}>Reset Filters</button>
            </div>
          )}
        </section>
      )}

      {/* Pagination Controls */}
      {!loading && !error && serverMeta.totalPages > 1 && (
        <div className="filter-pagination">
          <button
            className="filter-pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <div className="filter-pagination-pages">
            {getPageNumbers().map((number, idx) => (
              number === '...' ? (
                <span key={idx} className="filter-pagination-ellipsis">…</span>
              ) : (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`filter-pagination-num ${currentPage === number ? 'filter-pagination-num--active' : ''}`}
                >
                  {number}
                </button>
              )
            ))}
          </div>
          <button
            className="filter-pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === serverMeta.totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Floating Filter FAB */}
      <button
        className="filter-fab animate-pulse-slow"
        onClick={() => setShowAdvanced(true)}
        aria-label="Open advanced filters"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {/* Advanced Filters Sliding Drawer Overlay */}
      {showAdvanced && (
        <div className="filter-modal" onClick={() => setShowAdvanced(false)}>
          <div className="filter-drawer animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="filter-drawer-header">
              <h3>Advanced Filters</h3>
              <button className="filter-drawer-close" onClick={() => setShowAdvanced(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="filter-drawer-body">
              {/* Platform Selector */}
              <div className="filter-group">
                <label className="filter-label">Host Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Platforms</option>
                  <option value="devfolio">Devfolio</option>
                  <option value="unstop">Unstop</option>
                  <option value="devpost">Devpost</option>
                </select>
              </div>

              {/* Sorting Options */}
              <div className="filter-group">
                <label className="filter-label">Sort Priority</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="newest">Ending Soon First</option>
                  <option value="endingSoon">Deadline Priority</option>
                  <option value="oldest">Oldest First</option>
                  <option value="deadline">By Deadline</option>
                  <option value="alphabetical">A–Z</option>
                </select>
              </div>

              {/* Location Text Search */}
              <div className="filter-group">
                <label className="filter-label">Location / Region</label>
                <div className="filter-location-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <input
                    type="text"
                    className="filter-location-input"
                    placeholder="e.g. San Francisco, Online, India..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-drawer-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  clearAllFilters();
                  setShowAdvanced(false);
                }}
              >
                Reset All
              </button>
              <button className="btn btn-primary" onClick={() => setShowAdvanced(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
