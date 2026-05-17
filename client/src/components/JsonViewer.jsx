import { useState } from 'react';

export default function JsonViewer({ layout, lastActions }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const jsonStr = JSON.stringify(layout, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const rootId = layout?.rootNodes?.[0];
  const artboard = layout?.nodes?.[rootId];
  const nodeCount = artboard?.children?.length || 0;

  return (
    <div className="json-viewer">
      <div className="json-viewer__header">
        <div className="json-viewer__meta">
          <span className="json-meta-pill">
            {artboard?.width || 0} × {artboard?.height || 0}
          </span>
          <span className="json-meta-pill">{nodeCount} nodes</span>
          {lastActions.length > 0 && (
            <span className="json-meta-pill json-meta-pill--action">
              {lastActions.length} action{lastActions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="json-viewer__btns">
          <button className="icon-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            )}
          </button>
          <button className="icon-btn" onClick={handleDownload} title="Download JSON">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={handleCopy} title="Copy JSON">
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {lastActions.length > 0 && (
        <div className="actions-strip">
          {lastActions.map((a, i) => (
            <span key={i} className="action-chip">
              <span className="action-chip__type">{a.type}</span>
              {a.target && <span className="action-chip__target">→ {a.target}</span>}
            </span>
          ))}
        </div>
      )}

      {!collapsed && (
        <pre className="json-pre">
          <code>{jsonStr}</code>
        </pre>
      )}
    </div>
  );
}
