import { useEffect, useRef } from 'react';

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="chat-window">
      {messages.length === 0 && !loading && (
        <div className="chat-empty">
          <div className="chat-empty__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <p>Start transforming your layout</p>
          <span>Type an instruction like "move the headline up" or "make the badge bigger"</span>
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} />
      ))}
      {loading && (
        <div className="bubble bubble--assistant">
          <div className="bubble__avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <path d="M9 9h6M9 12h6M9 15h4"/>
            </svg>
          </div>
          <div className="bubble__body bubble--assistant sofa-loading-bubble">
            <SofaLoader />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function SofaLoader() {
  return (
    <div className="sofa-loader">
      <svg className="sofa-loader__svg" viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sofa base / seat */}
        <rect x="10" y="42" width="100" height="12" rx="2" fill="rgba(0,212,255,0.12)" stroke="#00d4ff" strokeWidth="1"/>
        {/* Left arm */}
        <rect x="6" y="28" width="14" height="26" rx="2" fill="rgba(0,212,255,0.10)" stroke="#00d4ff" strokeWidth="1"/>
        {/* Right arm */}
        <rect x="100" y="28" width="14" height="26" rx="2" fill="rgba(0,212,255,0.10)" stroke="#00d4ff" strokeWidth="1"/>
        {/* Sofa back */}
        <rect x="10" y="26" width="100" height="14" rx="2" fill="rgba(0,212,255,0.08)" stroke="#00d4ff" strokeWidth="1"/>
        {/* Legs */}
        <rect x="18" y="54" width="4" height="8" rx="1" fill="rgba(0,212,255,0.5)" stroke="#00d4ff" strokeWidth="0.5"/>
        <rect x="98" y="54" width="4" height="8" rx="1" fill="rgba(0,212,255,0.5)" stroke="#00d4ff" strokeWidth="0.5"/>

        {/* Cushion 1 */}
        <rect className="sofa-cushion sofa-cushion--1" x="16" y="32" width="24" height="10" rx="2"
          fill="rgba(0,212,255,0.2)" stroke="#00d4ff" strokeWidth="1.5"/>
        {/* Cushion 2 */}
        <rect className="sofa-cushion sofa-cushion--2" x="48" y="32" width="24" height="10" rx="2"
          fill="rgba(0,212,255,0.2)" stroke="#00d4ff" strokeWidth="1.5"/>
        {/* Cushion 3 */}
        <rect className="sofa-cushion sofa-cushion--3" x="80" y="32" width="24" height="10" rx="2"
          fill="rgba(0,212,255,0.2)" stroke="#00d4ff" strokeWidth="1.5"/>
      </svg>
      <span className="sofa-loader__text">Designing<span className="sofa-loader__dots"><i/><i/><i/></span></span>
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`bubble bubble--${isUser ? 'user' : 'assistant'}`}>
      <div className="bubble__avatar">
        {isUser ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
        )}
      </div>
      <div className="bubble__body">
        {content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}
