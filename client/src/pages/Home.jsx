import React, { useEffect, useState } from 'react';
import { getEvents, getSampleEvents } from '../services/api';
import EventCard from '../components/EventCard';
import './Home.css';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
