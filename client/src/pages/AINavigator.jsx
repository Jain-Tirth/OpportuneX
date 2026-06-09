import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supaBaseClient';
import './AINavigator.css';

const getEventKey = (event) => {
  if (event?.id) return `id:${event.id}`;
  if (event?.redirectURL) return `url:${event.redirectURL}`;
  return `title:${event?.title || 'event'}|${event?.hostedBy || 'host'}`;
};

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
        elements.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3] && match[4]) {
        elements.push(
          <a
            key={match.index}
            href={match[4]}
            target="_blank"
            rel="noopener noreferrer"
            className="ai-chat-link"
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
        <li key={lineIdx} className="ai-chat-bullet-item">
          {elements}
        </li>
      );
    }

    return cleanLine.trim() === '' ? (
      <div key={lineIdx} className="ai-chat-paragraph-gap" />
    ) : (
      <p key={lineIdx} className="ai-chat-paragraph">
        {elements}
      </p>
    );
  });
}

export default function AINavigator() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi! I'm your AI Navigator. Ask me about hackathons you'd like to join! For example: *'Show me online AI hackathons'*."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [savedEventKeys, setSavedEventKeys] = useState([]);
  const [savingKey, setSavingKey] = useState('');

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

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

  const savedKeys = useMemo(() => new Set(savedEventKeys), [savedEventKeys]);

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

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', { message: messageText });
      if (response.data && response.data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: response.data.reply,
            events: response.data.sources || []
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'I received an empty response. Please try again.' }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = err.response?.data?.error || 'Sorry, I had trouble communicating with the server.';
      setMessages((prev) => [...prev, { sender: 'bot', text: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleChipClick = (suggestion) => {
    handleSend(suggestion);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="ai-navigator-page">
      <div className="ai-navigator-chat">
        {/* Chat History Container */}
        <div className="ai-chat-history hide-scrollbar">
          {messages.length === 1 && (
            <div className="ai-chat-intro">
              <div className="ai-chat-intro__icon">🤖</div>
              <h2>Meet your AI Navigator</h2>
              <p>
                I leverage real-time <strong>RAG (Retrieval-Augmented Generation)</strong> to scan thousands of global hackathons and find your perfect match based on your tech stack and interests.
              </p>
              <div className="ai-chat-intro__suggestions">
                <button onClick={() => handleChipClick('Find Web3 Hackathons')} className="ai-chat-intro__chip">
                  Find Web3 Hackathons
                </button>
                <button onClick={() => handleChipClick('Highest prize pools?')} className="ai-chat-intro__chip">
                  Highest prize pools?
                </button>
                <button onClick={() => handleChipClick('Remote AI challenges')} className="ai-chat-intro__chip">
                  Remote AI challenges
                </button>
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <div key={idx} className={`ai-message-row ${m.sender}`}>
              <div className="ai-message-container">
                {m.sender === 'bot' && (
                  <div className="ai-message-avatar">🤖</div>
                )}
                <div className={`ai-chat-bubble ${m.sender}`}>
                  {renderFormattedText(m.text)}
                </div>
              </div>

              {/* Mapped Event Cards Carousel */}
              {m.sender === 'bot' && m.events && m.events.length > 0 && (
                <div className="ai-chat-sources-carousel hide-scrollbar">
                  {m.events.map((event, eIdx) => (
                    <div key={eIdx} className="ai-chat-source-card">
                      <EventCard
                        event={event}
                        eventKey={getEventKey(event)}
                        isSaved={savedKeys.has(getEventKey(event))}
                        onToggleSave={handleToggleSave}
                        savingKey={savingKey}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-message-row bot">
              <div className="ai-message-container">
                <div className="ai-message-avatar">🤖</div>
                <div className="ai-chat-bubble bot typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area Form */}
        <form className="ai-chat-input-area" onSubmit={onSubmit}>
          <div className="ai-chat-input-container">
            <input
              type="text"
              className="ai-chat-input-box"
              placeholder="Ask AI about hackathons, stacks, or prizes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary ai-chat-send-btn"
              disabled={!input.trim() || loading}
            >
              Ask AI ⚡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
