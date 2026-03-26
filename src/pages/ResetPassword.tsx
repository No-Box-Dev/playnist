import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPw) { setError('Please fill in both fields'); return; }
    if (password !== confirmPw) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await resetPassword(token, password);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-logo">
          <img src="/images/logo.png" alt="Playnist" />
        </div>
        <h1 className="reset-title">Reset Password</h1>
        <p className="reset-subtitle">Enter your new password</p>
        <form style={{ width: '100%' }} onSubmit={handleSubmit}>
          <div className="form-group" style={{ width: '100%', marginBottom: 16 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>New Password</label>
            <div className="password-field">
              <input className="input" type={showPw1 ? 'text' : 'password'} placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="password-toggle" onClick={() => setShowPw1(!showPw1)}>&#x1F441;</button>
            </div>
          </div>
          <div className="form-group" style={{ width: '100%', marginBottom: 16 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Repeat Password</label>
            <div className="password-field">
              <input className="input" type={showPw2 ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              <button type="button" className="password-toggle" onClick={() => setShowPw2(!showPw2)}>&#x1F441;</button>
            </div>
          </div>
          {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>CHANGE</button>
        </form>
        <div className="reset-back">
          <Link to="/">Back to Sign In</Link>
        </div>
      </div>

      {showSuccess && (
        <div className="success-popup show">
          <div className="success-content">
            <div className="success-header">
              <span>PASSWORD RESET</span>
              <button className="close-x" onClick={() => setShowSuccess(false)}>&times;</button>
            </div>
            <div className="success-body">
              <div style={{ fontSize: 48 }}>&#x2705;</div>
              <h3>Successful</h3>
              <p>Your password has been changed successfully</p>
              <div className="success-buttons">
                <button className="btn btn-primary" onClick={() => navigate('/')}>LOGIN</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
