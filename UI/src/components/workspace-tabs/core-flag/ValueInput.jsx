import React, { memo, useState, useMemo, useCallback } from 'react';
import JsonEditor from '../json-flag/JsonEditor';

const ValueInput = memo(({ type, value, onChange, error }) => {
    const errClass = error ? 'input-error' : '';

    // ─── Local JSON string buffer (decouples UI from parsed model) ───
    const [jsonStr, setJsonStr] = useState(() => {
        if (type === 'JSON') {
            return typeof value === 'string' ? value
                : typeof value === 'object' ? JSON.stringify(value, null, 2)
                : '{\n  "key": "value"\n}';
        }
        return '';
    });

    const jsonValid = useMemo(() => {
        if (type !== 'JSON') return true;
        try { JSON.parse(jsonStr); return true; }
        catch { return false; }
    }, [type, jsonStr]);

    const handleJsonChange = useCallback((str) => {
        setJsonStr(str);
        try {
            const parsed = JSON.parse(str);
            onChange(parsed);
        } catch {
            // Don't update parent until valid
        }
    }, [onChange]);

    switch (type) {
        case 'BOOLEAN':
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => onChange(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span style={{ color: value ? '#10b981' : '#ef4444', fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px' }}>
                        {value ? 'TRUE' : 'FALSE'}
                    </span>
                </div>
            );
        case 'STRING':
            return (
                <input
                    type="text"
                    className={`login-input ${errClass}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter string value"
                    maxLength={500}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                />
            );
        case 'INTEGER':
            return (
                <input
                    type="number"
                    className={`login-input ${errClass}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter integer value"
                    step="1"
                    min="-2147483648"
                    max="2147483647"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                />
            );
        case 'DOUBLE':
            return (
                <input
                    type="number"
                    className={`login-input ${errClass}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter floating-point value"
                    step="any"
                    min="-1e308"
                    max="1e308"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                />
            );
        case 'JSON':
            return (
                <div>
                    <JsonEditor value={jsonStr} onChange={handleJsonChange} height="180px" />
                    {!jsonValid && (
                        <div className="field-error" style={{ marginTop: '4px' }}>
                            <i className="ri-error-warning-line"></i> Invalid JSON syntax
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
});

ValueInput.displayName = 'ValueInput';
export default ValueInput;
