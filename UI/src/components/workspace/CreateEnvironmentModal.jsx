import React, { useState } from 'react';

const CreateEnvironmentModal = ({ onClose, onSubmit }) => {
    const [newEnvName, setNewEnvName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(newEnvName);
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
            <div className="modal-content glass-card" style={{ background: 'linear-gradient(180deg, rgba(20,10,40,0.95), rgba(10,5,20,0.98))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '400px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#fff', fontFamily: '"Outfit", sans-serif' }}>New Environment</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                        <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px' }}>
                        <label className="form-label">Environment Name</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                autoFocus
                                type="text"
                                value={newEnvName}
                                onChange={(e) => setNewEnvName(e.target.value)}
                                placeholder="e.g. QA, UAT, Sandbox"
                                className="login-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!newEnvName.trim()}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEnvironmentModal;
