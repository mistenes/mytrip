import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api";
import "../styles/login.css";

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Érvénytelen felhasználónév vagy jelszó.' }));
        setError(data.message || 'Érvénytelen felhasználónév vagy jelszó.');
      } else {
        const data = await res.json();
        onLogin(data);
      }
    } catch {
      setError('Bejelentkezés sikertelen.');
    }
  };
    
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>myTrip</h1>
        <p>Kérjük, jelentkezzen be a folytatáshoz</p>
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="username">Felhasználónév</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Jelszó</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Bejelentkezés</button>
        </form>
         
      </div>
    </div>
  );
};


export default LoginPage;

