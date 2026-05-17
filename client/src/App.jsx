import { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import WireframePreview from './components/WireframePreview';
import JsonViewer from './components/JsonViewer';
import { useLayoutAgent } from './hooks/useLayoutAgent';
import './App.css';

export default function App() {
  const { layout, messages, loading, lastActions, sendMessage, resetLayout } = useLayoutAgent();
  const [rightTab, setRightTab] = useState('preview'); // 'preview' | 'json'

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="8" height="8" rx="1"/>
              <rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/>
              <rect x="13" y="13" width="8" height="8" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 className="header-title">Layout Agent</h1>
            <p className="header-subtitle">AI-powered design layout transformation</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="status-dot" title="Server connected" />
          <button className="reset-btn" onClick={resetLayout} title="Reset layout to original">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        </div>
      </header>

      {/* ── Main 2-column layout ── */}
      <main className="app-main">
        {/* ── LEFT: Chat Panel ── */}
        <section className="panel panel--chat">
          <div className="panel__header">
            <span className="panel__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat
            </span>
            <span className="panel__badge">{messages.length} messages</span>
          </div>
          <ChatWindow messages={messages} loading={loading} />
          <ChatInput onSend={sendMessage} loading={loading} />
        </section>

        {/* ── RIGHT: Preview + JSON Panel ── */}
        <section className="panel panel--right">
          <div className="panel__header">
            <div className="tab-group">
              <button
                className={`tab-btn ${rightTab === 'preview' ? 'tab-btn--active' : ''}`}
                onClick={() => setRightTab('preview')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                Preview
              </button>
              <button
                className={`tab-btn ${rightTab === 'json' ? 'tab-btn--active' : ''}`}
                onClick={() => setRightTab('json')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                JSON
              </button>
            </div>
          </div>

          <div className="panel__content">
            {rightTab === 'preview' ? (
              <div className="preview-area">
                <WireframePreview layout={layout} />
              </div>
            ) : (
              <div className="json-area">
                <JsonViewer layout={layout} lastActions={lastActions} />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
