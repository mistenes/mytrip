import React, { useState } from 'react';
import { API_BASE } from '../api';
import '../styles/report-problem.css';

const ProblemReportButton = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(`${API_BASE}/api/report-problem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      setOpen(false);
      setName('');
      setEmail('');
      setMessage('');
      alert('Köszönjük a visszajelzést!');
    } catch (err) {
      console.error('Report send failed', err);
      alert('Hiba történt a küldés során.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className="report-problem-button" onClick={() => setOpen(true)} aria-label="Hiba jelentése">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
      {open && (
        <div className="report-modal-overlay" onClick={() => setOpen(false)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <h2>Hiba jelentése</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="reportName">Név</label>
                <input id="reportName" type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="reportEmail">Email</label>
                <input id="reportEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="reportMessage">Üzenet</label>
                <textarea id="reportMessage" value={message} onChange={e => setMessage(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Mégse</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>Küldés</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProblemReportButton;
