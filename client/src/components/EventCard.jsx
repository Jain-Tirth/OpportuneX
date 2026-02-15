import React, { useMemo, useState } from 'react';
import './EventCard.css';

const EventCard = ({ event, eventKey = '', isSaved = false, onToggleSave, savingKey = '' }) => {
  const [shareStatus, setShareStatus] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'hackathon':
        return 'purple';
      case 'competition':
        return 'blue';
      case 'workshop':
        return 'green';
      default:
        return 'indigo';
    }
  };

  const countdownLabel = useMemo(() => {
    const targetDate = event.deadline || event.endDate;
    if (!targetDate) return '';

    const end = new Date(targetDate);
    if (Number.isNaN(end.getTime())) return '';

    const today = new Date();
    const msLeft = end.setHours(23, 59, 59, 999) - today.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Ended';
    if (daysLeft === 0) return 'Ends today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  }, [event.deadline, event.endDate]);

  const countdownVariant = useMemo(() => {
    if (!countdownLabel || countdownLabel === 'Ended') return 'muted';
    const match = countdownLabel.match(/\d+/);
    const days = match ? Number(match[0]) : 0;
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  }, [countdownLabel]);

  const isSaving = savingKey && eventKey && savingKey === eventKey;

  const handleShare = async () => {
    const url = event.redirectURL || window.location.href;
    const title = event.title || 'Event';
    const text = event.description
      ? `${event.description.substring(0, 120)}...`
      : 'Check out this event.';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
        setShareStatus('Copied');
        setTimeout(() => setShareStatus(''), 2000);
        return;
      }
    } catch (error) {
      console.error('Share failed:', error.message);
    }

    setShareStatus('Copy failed');
    setTimeout(() => setShareStatus(''), 2000);
  };

  return (
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-badge">
          <span className="badge-text">{event.hostedBy || event.hosted_by}</span>
        </div>
        <div className="event-card-actions">
          <button
            type="button"
            className={`save-button ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave?.(event)}
            disabled={!onToggleSave || isSaving}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from saved' : 'Save event'}
          >
            <svg className="save-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
            </svg>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            className="share-button"
            onClick={handleShare}
            aria-label="Share event"
          >
            <svg className="share-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>{shareStatus || 'Share'}</span>
          </button>
          {event.verified && (
            <div className="verified-badge">
              <svg className="verified-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>

      <div className="event-card-content">
        {countdownLabel && (
          <div className={`countdown-badge countdown-${countdownVariant}`}>
            {countdownLabel}
          </div>
        )}
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">
          {event.description?.substring(0, 150)}
          {event.description?.length > 60 ? '...' : ''}
        </p>

        <div className="event-tags">
          {event.type && (
            <span className={`event-tag event-tag-${getEventTypeColor(event.type)}`}>
              {event.type}
            </span>
          )}
          {event.tags?.slice(0, 3).map((tag, index) => (
            <span key={index} className="event-tag event-tag-secondary">
              {tag}
            </span>
          ))}
        </div>

        <div className="event-dates">
          <div className="date-item">
            <div className="date-icon">📅</div>
            <div className="date-content">
              <span className="date-label">Start Date</span>
              <span className="date-value">{formatDate(event.startDate)}</span>
            </div>
          </div>
          
          {event.endDate && (
            <div className="date-item">
              <div className="date-icon">🏁</div>
              <div className="date-content">
                <span className="date-label">End Date</span>
                <span className="date-value">{formatDate(event.endDate)}</span>
              </div>
            </div>
          )}
          
          {event.deadline && (
            <div className="date-item deadline">
              <div className="date-icon">⏰</div>
              <div className="date-content">
                <span className="date-label">Deadline</span>
                <span className="date-value">{formatDate(event.deadline)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="event-card-footer">
        <a 
          href={event.redirectURL} 
          target="_blank" 
          rel="noreferrer" 
          className="event-link"
        >
          <span>View Event</span>
          <svg className="link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default EventCard;
