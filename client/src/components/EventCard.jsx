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
        return 'cyan';
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
      ? `${event.description.substring(0, 120)}…`
      : 'Check out this event.';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
        setShareStatus('Copied!');
        setTimeout(() => setShareStatus(''), 2000);
        return;
      }
    } catch (error) {
      console.error('Share failed:', error.message);
    }

    setShareStatus('Copy failed');
    setTimeout(() => setShareStatus(''), 2000);
  };

  const handleViewEvent = () => {
    if (event.redirectURL) {
      window.open(event.redirectURL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="ecard">
      {/* Gradient top bar */}
      <div className="ecard__bar" />

      {/* Header */}
      <div className="ecard__header">
        <div className="ecard__platform">
          <span className="ecard__platform-dot" />
          <span>{event.hostedBy || event.hosted_by || 'Unknown'}</span>
        </div>
        <div className="ecard__header-actions">
          {event.verified && (
            <span className="ecard__verified" title="Verified event">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          <button
            type="button"
            className={`ecard__action-btn ecard__save ${isSaved ? 'ecard__save--active' : ''}`}
            onClick={() => onToggleSave?.(event)}
            disabled={!onToggleSave || isSaving}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from saved' : 'Save event'}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>
          <button
            type="button"
            className="ecard__action-btn ecard__share"
            onClick={handleShare}
            aria-label="Share event"
            title={shareStatus || 'Share'}
          >
            {shareStatus === 'Copied!' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="ecard__body">
        {countdownLabel && (
          <span className={`ecard__countdown ecard__countdown--${countdownVariant}`}>
            {countdownLabel}
          </span>
        )}

        <h3 className="ecard__title">{event.title}</h3>

        <p className="ecard__desc">
          {event.description?.substring(0, 150)}
          {event.description?.length > 60 ? '…' : ''}
        </p>

        {/* Tags */}
        <div className="ecard__tags">
          {event.type && (
            <span className={`ecard__tag ecard__tag--${getEventTypeColor(event.type)}`}>
              {event.type}
            </span>
          )}
          {event.tags?.slice(0, 3).map((tag, index) => (
            <span key={index} className="ecard__tag ecard__tag--default">
              {tag}
            </span>
          ))}
        </div>

        {/* Dates */}
        <div className="ecard__dates">
          <div className="ecard__date">
            <span className="ecard__date-emoji">📅</span>
            <div>
              <span className="ecard__date-label">Start</span>
              <span className="ecard__date-value">{formatDate(event.startDate)}</span>
            </div>
          </div>
          {event.endDate && (
            <div className="ecard__date">
              <span className="ecard__date-emoji">🏁</span>
              <div>
                <span className="ecard__date-label">End</span>
                <span className="ecard__date-value">{formatDate(event.endDate)}</span>
              </div>
            </div>
          )}
          {event.deadline && (
            <div className="ecard__date ecard__date--deadline">
              <span className="ecard__date-emoji">⏰</span>
              <div>
                <span className="ecard__date-label">Deadline</span>
                <span className="ecard__date-value">{formatDate(event.deadline)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="ecard__footer">
        <button
          type="button"
          className="ecard__cta"
          onClick={handleViewEvent}
          disabled={!event.redirectURL}
        >
          <span>View Event</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EventCard;
