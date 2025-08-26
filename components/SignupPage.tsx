import React, { useState } from "react";
import { API_BASE } from "../api";

const SignupPage = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      setError('Names must use English letters only');
      return;
    }
    if (password !== verifyPassword || password.length < 8) {
      setError('Passwords must match and be at least 8 characters');
      return;
    }
    setError('');
    const res = await fetch(`${API_BASE}/api/register/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, password, verifyPassword })
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Registration successful</h1>
          <p>You can now close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="verifyPassword">Verify Password</label>
            <input id="verifyPassword" type="password" value={verifyPassword} onChange={e => setVerifyPassword(e.target.value)} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Register</button>
        </form>
      </div>
    </div>
  );
};



export default SignupPage;

