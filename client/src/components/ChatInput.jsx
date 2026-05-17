import { useState, useRef } from 'react';

const QUICK_PROMPTS = [
  'Convert to 9:16',
  'Move headline to top',
  'Make discount badge bigger',
  'Center the product image',
  'Convert to 16:9',
  'Make headline font smaller',
];

export default function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="chat-input-area">
      <div className="quick-prompts">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            className="quick-prompt-chip"
            onClick={() => { setValue(p); textareaRef.current?.focus(); }}
            disabled={loading}
          >
            {p}
          </button>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe a layout change… (Enter to send)"
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          className={`send-btn ${loading ? 'send-btn--loading' : ''}`}
          disabled={!value.trim() || loading}
          aria-label="Send message"
        >
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
