import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Simple lightweight regex-based JSON syntax highlighter
const syntaxHighlight = (json) => {
    if (!json) return '';
    let processed = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return processed.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let color = '#bd93f9'; // json-number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                color = '#8be9fd'; // json-key
            } else {
                color = '#f1fa8c'; // json-string
            }
        } else if (/true|false/.test(match)) {
            color = '#ff79c6'; // json-boolean
        } else if (/null/.test(match)) {
            color = '#6272a4'; // json-null
        }
        return `<span style="color: ${color}">${match}</span>`;
    });
};

const JsonViewerModal = ({ isOpen, onClose, jsonContent, title = "JSON Payload" }) => {
    const [copied, setCopied] = useState(false);
    
    // Reset state when closed
    useEffect(() => {
        if (!isOpen) setCopied(false);
    }, [isOpen]);

    if (!isOpen) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(console.error);
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onMouseDown={onClose} style={{ zIndex: 9999 }}>
            <div 
                className="modal-content glass-card" 
                style={{ 
                    maxWidth: '680px', 
                    width: '90%', 
                    maxHeight: '85vh',
                    padding: '24px', 
                    background: 'linear-gradient(145deg, rgba(16,11,35,0.95) 0%, rgba(13,9,28,0.98) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column'
                }} 
                onMouseDown={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                            <i className="ri-braces-line" style={{ fontSize: '18px' }}></i>
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '0.3px' }}>{title}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                    </button>
                </div>

                {/* Body (Code Editor style) */}
                <div style={{ 
                    position: 'relative', 
                    background: '#0d0817', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flex: 1,
                    minHeight: 0
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 20px',
                        background: 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        flexShrink: 0
                    }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
                            Read-only format
                        </span>
                        
                        <button
                            onClick={copyToClipboard}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: copied ? '#4ade80' : 'rgba(255,255,255,0.8)',
                                padding: '5px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: 500
                            }}
                            onMouseEnter={e => {
                                if (!copied) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.color = '#fff';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!copied) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                                }
                            }}
                        >
                            <i className={copied ? "ri-check-line" : "ri-clipboard-line"} style={{ fontSize: '14px' }}></i> 
                            {copied ? 'Copied!' : 'Copy JSON'}
                        </button>
                    </div>

                    <div style={{
                        overflowY: 'auto',
                        overflowX: 'auto',
                        padding: '0',
                        flex: 1
                    }} className="custom-scrollbar">
                        <pre style={{
                            margin: 0,
                            padding: '24px 20px',
                            minHeight: '100px',
                            fontSize: '13.5px',
                            color: '#f8f8f2',
                            fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                            lineHeight: 1.6
                        }}>
                            <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonContent) || 'No data...' }} />
                        </pre>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default JsonViewerModal;
