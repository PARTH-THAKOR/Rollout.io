// ═══════════════════════════════════════════════════════════
//  Core Flag — Shared Constants, Utilities & Validation
// ═══════════════════════════════════════════════════════════

// ─── Flag Types & Operators ─────────────────────────────────
export const FLAG_TYPES = ['BOOLEAN', 'STRING', 'INTEGER', 'DOUBLE', 'JSON'];
export const OPERATORS = ['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'CONTAINS', 'GT', 'GTE', 'LT', 'LTE'];
export const MULTI_VALUE_OPERATORS = ['IN', 'NOT_IN'];

export const INITIAL_FORM_STATE = {
    key: '', displayName: '', type: 'BOOLEAN', value: true,
    description: '', rolloutPercentage: '', targetingRules: []
};

export const newRule = () => ({ attribute: '', operator: 'EQUALS', value: '', values: [], _tempInput: '' });

export const SELECT_ARROW_BG = `rgba(255, 255, 255, 0.05) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 16px top 50%`;
export const OPTION_BG = { background: '#120924' };

export const OP_SYMBOLS = {
    EQUALS: '=', NOT_EQUALS: '≠', IN: '∈', NOT_IN: '∉',
    CONTAINS: '⊃', GT: '>', GTE: '≥', LT: '<', LTE: '≤'
};

export const TYPE_BADGE = {
    Boolean: 'badge-boolean', String: 'badge-string',
    Integer: 'badge-integer', Double: 'badge-double',
    Multivariate: 'badge-multivariate', JSON: 'badge-json',
    Json: 'badge-json',
};

// ─── Utilities ──────────────────────────────────────────────

export const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 0) return 'Just now';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatRuleChip = (rule) => {
    const sym = OP_SYMBOLS[rule.operator] || rule.operator;
    const val = rule.values?.length > 0
        ? `[${rule.values.join(', ')}]`
        : String(rule.value ?? '');
    return `${rule.attribute} ${sym} ${val}`;
};

// ─── Validation ─────────────────────────────────────────────

const KEY_PATTERN = /^[a-z0-9_]+$/;
const NAME_PATTERN = /^[a-zA-Z0-9\s\-]+$/;

/**
 * Sanitize key input: lowercase, alphanumeric + underscore only.
 */
export const sanitizeKey = (value) => value.toLowerCase().replace(/[^a-z0-9_]/g, '');

/**
 * Validate a single form field. Returns error string or empty string.
 */
export const validateField = (name, value, type) => {
    switch (name) {
        case 'key': {
            const v = (value || '').trim();
            if (!v) return '';
            if (v.length < 3) return `Min 3 characters (${v.length}/3)`;
            if (v.length > 50) return 'Max 50 characters exceeded';
            if (!KEY_PATTERN.test(v)) return 'Only lowercase letters, numbers, and underscores';
            return '';
        }
        case 'displayName': {
            const v = (value || '').trim();
            if (!v) return '';
            if (v.length > 50) return 'Max 50 characters exceeded';
            if (!NAME_PATTERN.test(v)) return 'No special characters allowed';
            return '';
        }
        case 'description':
            if ((value || '').length > 200) return `${(value || '').length}/200 — limit exceeded`;
            return '';
        case 'value':
            if (type === 'STRING') {
                const v = String(value || '').trim();
                if (!v) return 'String value is required';
                if (v.length > 500) return `Max 500 characters (${v.length}/500)`;
            }
            if (type === 'INTEGER') {
                if (value === '') return 'Must be a valid integer';
                const num = Number(value);
                if (!Number.isInteger(num)) return 'Must be a valid integer';
                if (num < -2147483648 || num > 2147483647) return 'Value exceeds 32-bit integer limits';
            }
            if (type === 'DOUBLE') {
                if (value === '') return 'Must be a valid number';
                const num = Number(value);
                if (isNaN(num)) return 'Must be a valid number';
                if (num < -1e308 || num > 1e308) return 'Value exceeds safe limits';
            }
            // JSON validation is handled externally via jsonValid flag
            return '';
        default:
            return '';
    }
};

/**
 * Validate entire form data. Returns { fieldName: errorMessage } object.
 */
export const validateFormData = (formData) => {
    const errors = {};
    ['key', 'displayName', 'description'].forEach(f => {
        const err = validateField(f, formData[f]);
        if (err) errors[f] = err;
    });
    const valErr = validateField('value', formData.value, formData.type);
    if (valErr) errors.value = valErr;
    return errors;
};

/**
 * Check if the form is valid for submission.
 */
export const checkFormValid = (formData, errors) => {
    if (!formData.key.trim() || formData.key.trim().length < 3) return false;
    if (!formData.displayName.trim()) return false;
    if (Object.values(errors).some(Boolean)) return false;
    if (formData.type === 'STRING' && String(formData.value).trim() === '') return false;
    if (formData.type === 'INTEGER' && (formData.value === '' || isNaN(parseInt(formData.value, 10)))) return false;
    if (formData.type === 'DOUBLE' && (formData.value === '' || isNaN(parseFloat(formData.value)))) return false;
    // JSON validity is checked separately via jsonContent state in the form component
    if (formData.type === 'JSON') return true;
    return true;
};
