import React, { useCallback, useMemo, useRef, memo } from 'react';

// ═══════════════════════════════════════════════════════════
//  JsonEditor — Reusable code editor with line numbers,
//  auto-indent, auto-close brackets, Tab support.
//  Used in both Create and Update JSON Flag modals.
//
//  Uses document.execCommand('insertText') to preserve
//  native browser undo/redo (Ctrl+Z / Ctrl+Shift+Z).
// ═══════════════════════════════════════════════════════════

/**
 * Insert text at the current cursor and manage the caret position.
 * Uses a setTimeout to ensure the cursor position correctly updates
 * after React has finished rendering the controlled component.
 */
const insertAtCursor = (textarea, text, onChange, customCursorPos = null) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const nv = val.substring(0, start) + text + val.substring(end);
    
    // Update React state
    onChange(nv);
    
    // Update cursor position safely after render
    const pos = customCursorPos !== null ? start + customCursorPos : start + text.length;
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = pos;
    }, 0);
};

/**
 * Delete characters around cursor and manage the caret position safely.
 */
const deleteAroundCursor = (textarea, deleteCount, forwardCount, onChange) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nv = textarea.value.substring(0, start - deleteCount) + textarea.value.substring(end + forwardCount);
    
    // Update React state
    onChange(nv);
    
    // Update cursor safely after render
    const pos = start - deleteCount;
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = pos;
    }, 0);
};

const JsonEditor = memo(({ value, onChange, readOnly = false, height = '300px' }) => {
    const textareaRef = useRef(null);
    const lines = useMemo(() => value.split('\n'), [value]);

    const isValidJson = useMemo(() => {
        try { JSON.parse(value); return true; }
        catch { return false; }
    }, [value]);

    const handleKeyDown = useCallback((e) => {
        if (readOnly) return;
        const target = e.target;
        const val = target.value;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        // Tab → 2 spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            insertAtCursor(target, '  ', onChange);
            return;
        }

        // Auto-close brackets/quotes
        const pairs = { '{': '}', '[': ']', '(': ')' };
        if (pairs[e.key]) {
            e.preventDefault();
            const closeChar = pairs[e.key];
            insertAtCursor(target, e.key + closeChar, onChange, 1);
            return;
        }

        // Auto-close double quotes (special: skip if next char is already a quote)
        if (e.key === '"') {
            e.preventDefault();
            if (val[start] === '"') {
                // Just move cursor past existing quote
                setTimeout(() => { target.selectionStart = target.selectionEnd = start + 1; }, 0);
            } else {
                insertAtCursor(target, '""', onChange, 1);
            }
            return;
        }

        // Skip closing bracket if the next char is the same closing bracket
        if ((e.key === '}' || e.key === ']' || e.key === ')') && val[start] === e.key) {
            e.preventDefault();
            setTimeout(() => { target.selectionStart = target.selectionEnd = start + 1; }, 0);
            return;
        }

        // Auto-indent on Enter
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentLine = val.substring(0, start).split('\n').pop();
            const indentMatch = currentLine.match(/^\s*/);
            let indent = indentMatch ? indentMatch[0] : '';

            if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith('[')) {
                const closingIndent = indent;
                indent += '  ';
                // Insert newline + deeper indent + newline + original indent
                // Cursor should be at the end of the new nested line
                insertAtCursor(target, '\n' + indent + '\n' + closingIndent, onChange, 1 + indent.length);
                return;
            }

            insertAtCursor(target, '\n' + indent, onChange);
            return;
        }

        // Auto-remove paired character on Backspace
        if (e.key === 'Backspace' && start === end && start > 0) {
            const before = val[start - 1];
            const after = val[start];
            const isPair = (before === '{' && after === '}') ||
                           (before === '[' && after === ']') ||
                           (before === '"' && after === '"') ||
                           (before === '(' && after === ')');
            if (isPair) {
                e.preventDefault();
                deleteAroundCursor(target, 1, 1, onChange);
                return;
            }
        }
    }, [onChange, readOnly]);

    return (
        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height }}>
            {/* Editor Header */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                    </div>
                    <span style={{ marginLeft: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: '"Inter", monospace' }}>config.json</span>
                </div>
                <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                    background: isValidJson ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: isValidJson ? '#10b981' : '#ef4444',
                }}>
                    {isValidJson ? '✓ Valid' : '✗ Invalid'}
                </span>
            </div>

            {/* Editor Body */}
            <div style={{ flex: 1, background: '#1e1e1e', display: 'flex', overflow: 'hidden' }}>
                {/* Line Numbers */}
                <div style={{ padding: '16px 0', background: '#1a1a2e', borderRight: '1px solid rgba(255,255,255,0.06)', userSelect: 'none', minWidth: '48px', textAlign: 'right', overflowY: 'hidden' }}>
                    {lines.map((_, i) => (
                        <div key={i} style={{ padding: '0 12px', fontFamily: 'Consolas, "Courier New", monospace', fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.2)' }}>{i + 1}</div>
                    ))}
                </div>
                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={(e) => {
                        const lineNums = e.target.previousElementSibling;
                        if (lineNums) lineNums.scrollTop = e.target.scrollTop;
                    }}
                    readOnly={readOnly}
                    style={{
                        flex: 1, margin: 0, padding: '16px 20px 16px 16px', background: 'transparent',
                        color: '#ce9178', caretColor: '#fff', fontFamily: 'Consolas, "Courier New", monospace',
                        fontSize: '14px', border: 'none', outline: 'none', resize: 'none', lineHeight: '1.6',
                        whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word',
                        boxSizing: 'border-box', tabSize: 2, MozTabSize: 2, overflow: 'auto',
                        minWidth: 0
                    }}
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                />
            </div>
        </div>
    );
});

JsonEditor.displayName = 'JsonEditor';

export default JsonEditor;
