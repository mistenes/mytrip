import React, { useState } from "react";
import { Role } from "../types";

const LoginPage = ({ onLogin }: { onLogin: (role: Role) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'adminpass') {
      onLogin('admin');
    } else if (username === 'organizer' && password === 'orgpass') {
      onLogin('organizer');
    } else if (username === 'traveler' && password === 'travelpass') {
      onLogin('traveler');
    } else {
      setError('Érvénytelen felhasználónév vagy jelszó.');
    }
  };
    
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Mytrip</h1>
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
         <div className="mock-credentials">
            <h4>Demó belépési adatok:</h4>
            <p><b>Admin:</b> admin / adminpass</p>
            <p><b>Szervező:</b> organizer / orgpass</p>
            <p><b>Utazó:</b> traveler / travelpass</p>
        </div>
      </div>
    </div>
  );
};


export default LoginPage;

