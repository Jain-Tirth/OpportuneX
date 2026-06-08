import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatWidget.css';

/**
 * Parses a subset of markdown (bold text, links, bullet points, line breaks)
 * into React elements for safe rendering in message bubbles.
 */
function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const cleanLine = isBullet ? line.trim().substring(2) : line;

    const elements = [];
    let lastIdx = 0;
    const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
    let match;

    while ((match = regex.exec(cleanLine)) !== null) {
      if (match.index > lastIdx) {
        elements.push(cleanLine.substring(lastIdx, match.index));
      }

      if (match[2]) {
        // Bold match
        elements.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3] && match[4]) {
        // Link match
        elements.push(
          <a
            key={match.index}
            href={match[4]}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {match[3]}
          </a>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < cleanLine.length) {
      elements.push(cleanLine.substring(lastIdx));
    }

    if (isBullet) {
      return (
        <li key={lineIdx} className="chat-bullet-item">
          {elements}
        </li>
      );
    }

    // Return blank line or paragraph
    return cleanLine.trim() === '' ? (
      <div key={lineIdx} className="chat-paragraph-gap" />
    ) : (
      <p key={lineIdx} className="chat-paragraph">
        {elements}
      </p>
    );
  });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: "Hi! I'm your UniStop AI Assistant. Ask me about hackathons you'd like to join! For example: *'I want to attend an online AI hackathon'*." 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', { message: input });
      if (response.data && response.data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'I received an empty response. Please try again.' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = err.response?.data?.error || 'Sorry, I had trouble communicating with the server.';
      setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-card animate-slide-up">
          {/* Header */}
          <div className="chat-card-header">
            <div className="chat-card-header__info">
              <span className="chat-card-header__status-dot" />
              <div>
                <h4>UniStop AI Assistant</h4>
                <p>Powered by Groq Llama 3</p>
              </div>
            </div>
            <button className="chat-card-close-btn" onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages Body */}
          <div className="chat-card-body">
            {messages.map((m, idx) => (
              <div key={idx} className={`message-row ${m.sender}`}>
                {m.sender === 'bot' && (
                  <div className="bot-avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z"></path>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                  </div>
                )}
                <div className={`chat-bubble ${m.sender}`}>
                  {renderFormattedText(m.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-row bot">
                <div className="bot-avatar">
                  <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                </div>
                <div className="chat-bubble bot typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form className="chat-card-footer" onSubmit={handleSend}>
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Type your message..."
              disabled={loading}
              aria-label="Chat input message"
            />
            <button type="submit" className="chat-send-btn" disabled={!input.trim() || loading} aria-label="Send Message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <button className="chat-floating-btn animate-bounce-in" onClick={() => setIsOpen(true)} aria-label="Open Chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Ask AI</span>
        </button>
      )}
    </div>
  );
}
