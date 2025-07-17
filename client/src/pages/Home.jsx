import React, { useEffect, useState } from 'react';
import { getEvents, getSampleEvents } from '../services/api';
import EventCard from '../components/EventCard';
import './Home.css';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents();
      console.log("Events fetched: ", data);
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const sampleData = await getSampleEvents();
      console.log("Sample events fetched: ", sampleData);
      setEvents(sampleData || []);
    } catch (err) {
      console.error('Error fetching sample events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort events
  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(event => 
        event.hostedBy?.toLowerCase() === selectedPlatform.toLowerCase()
      );
    }

    // Sort events
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.startDate || b.created_at) - new Date(a.startDate || a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.startDate || a.created_at) - new Date(b.startDate || b.created_at));
        break;
      case 'deadline':
        filtered.sort((a, b) => {
          const aDeadline = new Date(a.deadline || a.endDate);
          const bDeadline = new Date(b.deadline || b.endDate);
          return aDeadline - bDeadline;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title?.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
  };

  // Effect to filter events when dependencies change
  useEffect(() => {
    filterAndSortEvents();
  }, [events, searchTerm, selectedPlatform, sortBy]);

  // Get platform counts
  const getPlatformCounts = () => {
    const counts = {
      all: events.length,
      devfolio: events.filter(e => e.hostedBy?.toLowerCase() === 'devfolio').length,
      unstop: events.filter(e => e.hostedBy?.toLowerCase() === 'unstop').length,
      eventbrite: events.filter(e => e.hostedBy?.toLowerCase() === 'eventbrite').length
    };
    return counts;
  };

  const platformCounts = getPlatformCounts();

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">🚀 Discover Amazing Opportunities</span>
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
            <button 
              className="btn btn-primary" 
              onClick={fetchEvents}
              disabled={loading}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Events
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          
          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title">Latest Events</h2>
            <p className="section-subtitle">
              Handpicked hackathons and coding events from Devfolio, Unstop, and Eventbrite
            </p>
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
                  <div className="platform-filters">
                    <button 
                      className={`platform-filter ${selectedPlatform === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedPlatform('all')}
                    >
                      All ({platformCounts.all})
                    </button>
                    <button 
                      className={`platform-filter ${selectedPlatform === 'devfolio' ? 'active' : ''}`}
                      onClick={() => setSelectedPlatform('devfolio')}
                    >
                      🚀 Devfolio ({platformCounts.devfolio})
                    </button>
                    <button 
                      className={`platform-filter ${selectedPlatform === 'unstop' ? 'active' : ''}`}
                      onClick={() => setSelectedPlatform('unstop')}
                    >
                      🎯 Unstop ({platformCounts.unstop})
                    </button>
                    <button 
                      className={`platform-filter ${selectedPlatform === 'eventbrite' ? 'active' : ''}`}
                      onClick={() => setSelectedPlatform('eventbrite')}
                    >
                      🎪 Eventbrite ({platformCounts.eventbrite})
                    </button>
                  </div>
                </div>

                {/* Sort Filter */}
                <div className="filter-group">
                  <label className="filter-label">Sort by</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="deadline">Deadline</option>
                    <option value="alphabetical">A-Z</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="results-info">
                <span className="results-count">
                  {filteredEvents.length} of {events.length} events
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedPlatform !== 'all' && ` from ${selectedPlatform}`}
                </span>
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
                <button className="btn btn-sm" onClick={fetchEvents}>
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
            <div className="events-grid">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <EventCard key={index} event={event} />
                ))
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
                    }}>
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <h3>No events found</h3>
                  <p>Use the automated scheduler above to scrape for new events, or load sample data to get started.</p>
                  <div className="empty-actions">
                    <button className="btn btn-secondary" onClick={handleLoadSampleEvents}>
                      Load Sample Data
                    </button>
                    <button className="btn btn-primary" onClick={fetchEvents}>
                      Refresh Events
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
