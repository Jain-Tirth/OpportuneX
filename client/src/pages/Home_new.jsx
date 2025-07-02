import React, { useEffect, useState } from 'react';
import { getEvents, scrapeEvents, getSampleEvents } from '../services/api';
import EventCard from '../components/EventCard';
import './Home.css';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);

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

  const handleScrapeEvents = async () => {
    try {
      setScraping(true);
      setError(null);
      console.log('Starting scraping...');
      const result = await scrapeEvents();
      console.log('Scraping result:', result);
      
      // Refresh events after scraping
      await fetchEvents();
      
      alert(`Scraping completed! Found ${result.scraped} events, saved ${result.saved} to database.`);
    } catch (err) {
      console.error('Error scraping events:', err);
      setError(`Scraping failed: ${err.message}`);
    } finally {
      setScraping(false);
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
              onClick={handleScrapeEvents}
              disabled={scraping}
            >
              {scraping ? (
                <>
                  <div className="spinner"></div>
                  Scraping...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scrape Latest Events
                </>
              )}
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={handleLoadSampleEvents}
              disabled={loading}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Load Sample Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{events.length}</div>
            <div className="stat-label">Active Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">3</div>
            <div className="stat-label">Platforms</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Live Updates</div>
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
              {events.length > 0 ? (
                events.map((event, index) => (
                  <EventCard key={index} event={event} />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <h3>No events found</h3>
                  <p>Try scraping for new events or load sample data to get started.</p>
                  <div className="empty-actions">
                    <button className="btn btn-primary" onClick={handleScrapeEvents}>
                      Scrape Events
                    </button>
                    <button className="btn btn-secondary" onClick={handleLoadSampleEvents}>
                      Load Sample Data
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
