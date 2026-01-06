import React, { useEffect, useState, useCallback } from 'react';
import { getEvents} from '../services/api';
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(12); // You can make this changeable

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

  // Filter and sort events
  const filterAndSortEvents = useCallback(() => {
    let filtered = [...events];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedPlatform === 'unstop') {
      filtered = filtered.filter(event =>
        event.tags?.includes('unstop')
      );
    }

    // Filter by platform
    if (selectedPlatform !== 'all' && selectedPlatform !== 'unstop') {
      filtered = filtered.filter(event => 
        event.hostedBy?.toLowerCase() === selectedPlatform.toLowerCase()
      );
    }

    // Sort events
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const today = new Date();
          const aEndDate = new Date(a.endDate);
          const bEndDate = new Date(b.endDate);
          
          if (aEndDate >= today && bEndDate >= today) {
            return aEndDate - bEndDate;
          }
          if (aEndDate < today && bEndDate < today) {
            return bEndDate - aEndDate;
          }
          if (aEndDate >= today && bEndDate < today) {
            return -1;
          }
          if (bEndDate >= today && aEndDate < today) {
            return 1;
          }
          return 0;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case 'deadline':
        filtered.sort((a, b) => {
          const today = new Date();
          const aDeadline = new Date(a.deadline || a.endDate);
          const bDeadline = new Date(b.deadline || b.endDate);
          
          if (aDeadline >= today && bDeadline >= today) {
            return aDeadline - bDeadline;
          }
          if (aDeadline < today && bDeadline < today) {
            return bDeadline - aDeadline;
          }
          if (aDeadline >= today && bDeadline < today) {
            return -1;
          }
          if (bDeadline >= today && aDeadline < today) {
            return 1;
          }
          return 0;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title?.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [events, searchTerm, selectedPlatform, sortBy]);

  // Effect to filter events when dependencies change
  useEffect(() => {
    filterAndSortEvents();
  }, [filterAndSortEvents]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

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
            {!loading && !error && filteredEvents.length > 0 && (
              <p className="results-count">
                Showing {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} events
              </p>
            )}
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
                    <option value="oldest">Oldest First</option>
                    <option value="deadline">By Deadline</option>
                    <option value="alphabetical">A-Z</option>
                  </select>
                </div>
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
            <>
              <div className="events-grid">
                {currentEvents.length > 0 ? (
                  currentEvents.map((event, index) => (
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
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredEvents.length > eventsPerPage && (
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