import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomCarouselCovers } from '../carouselSets';
import { signin, signup, setToken } from '../api';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import './Login.css';

type AuthState = 'welcome' | 'signin' | 'signup' | 'forgot';
type SignupStep = 'email' | 'password' | 'username';

export default function Login() {
  const [state, setState] = useState<AuthState>('welcome');
  const [columns] = useState(() => getRandomCarouselCovers());
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Signup multi-step
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Signin
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // Errors
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signinEmail || !signinPassword) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const result = await signin(signinEmail, signinPassword);
      setToken(result.token);
      setUser(result.user as User);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleSignupNext = async () => {
    setError('');
    if (signupStep === 'email') {
      if (!signupEmail) { setError('Please enter your email'); return; }
      setSignupStep('password');
    } else if (signupStep === 'password') {
      if (!signupPassword) { setError('Please enter a password'); return; }
      setSignupStep('username');
    } else {
      if (!signupUsername) { setError('Please choose a username'); return; }
      if (!agreedToTerms) { setError('Please agree to Terms of Service'); return; }
      try {
        const result = await signup(signupEmail, signupPassword, signupUsername, signupBio);
        setToken(result.token);
        setUser(result.user as User);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed');
      }
    }
  };

  const goToSignup = () => { setState('signup'); setSignupStep('email'); setError(''); };
  const goToSignin = () => { setState('signin'); setError(''); };

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        {state === 'welcome' && (
          <div className="auth-welcome">
            <div className="auth-welcome-logo"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-welcome-bottom">
              <div className="auth-tagline">your game library<br />reimagined.</div>
              <div className="auth-buttons">
                <button className="btn btn-primary" onClick={goToSignup}>SIGN UP</button>
                <button className="btn btn-outline" onClick={goToSignin}>SIGN IN</button>
              </div>
            </div>
          </div>
        )}

        {state === 'signin' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Welcome back</h1>
              <p className="auth-form-subtitle">Enter your information to access your accounts</p>
            </div>
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" type="email" placeholder="Type Email" value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Your password</label>
                <input className="input" type="password" placeholder="Type Password" value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)} />
              </div>
              <div className="auth-remember-row">
                <label className="remember-label"><input type="checkbox" /> Remember me</label>
                <a className="forgot-link" onClick={() => setState('forgot')}>Forgot a password</a>
              </div>
              {error && <div className="field-error">{error}</div>}
              <button className="btn btn-gray auth-submit" type="submit">SIGN IN</button>
            </form>
            <p className="auth-link">Don't Have An Account? <a onClick={goToSignup}>Sign Up</a></p>
          </div>
        )}

        {state === 'signup' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Create an account</h1>
              <p className="auth-form-subtitle">Fill in the following details to get started</p>
            </div>
            <div className="signup-avatar-wrap">
              <div className="signup-avatar-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#999"/></svg>
              </div>
              <div className="signup-avatar-edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white"/></svg>
              </div>
            </div>
            <div className="signup-tabs">
              <button className={`signup-tab ${signupStep === 'email' ? 'active' : 'done'}`} onClick={() => setSignupStep('email')}>Email</button>
              <button className={`signup-tab ${signupStep === 'password' ? 'active' : signupStep === 'username' ? 'done' : ''}`} onClick={() => signupEmail && setSignupStep('password')}>Password</button>
              <button className={`signup-tab ${signupStep === 'username' ? 'active' : ''}`} onClick={() => signupEmail && signupPassword && setSignupStep('username')}>Username</button>
            </div>
            <div className="auth-form" style={{ gap: 16 }}>
              {signupStep === 'email' && (
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" type="email" placeholder="Your Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSignupNext()} />
                </div>
              )}
              {signupStep === 'password' && (
                <>
                  <div className="form-group"><label className="form-label">Email</label><input className="input" type="email" value={signupEmail} readOnly /></div>
                  <div className="form-group"><label className="form-label">Your password</label><input className="input" type="password" placeholder="Type Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSignupNext()} /></div>
                </>
              )}
              {signupStep === 'username' && (
                <>
                  <div className="form-group"><label className="form-label">Email</label><input className="input" type="email" value={signupEmail} readOnly /></div>
                  <div className="form-group"><label className="form-label">Your password</label><input className="input" type="password" value={signupPassword} readOnly /></div>
                  <div className="form-group"><label className="form-label">Username</label><input className="input" type="text" placeholder="Your Username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Profile bio</label><textarea className="input signup-bio" placeholder="Optional bio" value={signupBio} onChange={(e) => setSignupBio(e.target.value)} rows={3} /></div>
                  <label className="terms-label"><input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} /> Agree to <a className="terms-link" href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a></label>
                </>
              )}
              {error && <div className="field-error">{error}</div>}
              <button className="btn btn-gray auth-submit" onClick={handleSignupNext} type="button">SIGN UP</button>
            </div>
            <p className="auth-link">Already Have An Account? <a onClick={goToSignin}>Sign In</a></p>
          </div>
        )}

        {state === 'forgot' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Reset Password</h1>
              <p className="auth-form-subtitle">Enter Email and we will send link to change</p>
            </div>
            <form className="auth-form" onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const email = (e.currentTarget.elements.namedItem('resetEmail') as HTMLInputElement)?.value;
              if (!email) { setError('Please enter your email'); return; }
              try {
                const { forgotPassword } = await import('../api');
                await forgotPassword(email);
                setError('');
                alert('If an account exists, a reset link has been sent.');
              } catch { /* silent */ }
            }}>
              <div className="form-group"><label className="form-label">Email</label><input name="resetEmail" className="input" type="email" placeholder="Your Email" /></div>
              {error && <div className="field-error">{error}</div>}
              <button className="btn btn-gray auth-submit" type="submit">RESET</button>
            </form>
            <p className="auth-link"><a onClick={goToSignin}>Back to Sign In</a></p>
          </div>
        )}
      </div>

      <div className="cover-grid-side">
        {columns.map((col, i) => (
          <div key={i} className="cover-grid-column">
            <div className={`cover-grid-scroll cover-grid-scroll-${i + 1}`}>
              {[...col, ...col].map((src, j) => (
                <div key={j} className="cover-grid-card">
                  <img src={src} alt="Game" onLoad={(e) => e.currentTarget.classList.add('loaded')} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
