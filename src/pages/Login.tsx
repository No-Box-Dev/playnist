import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomCarouselCovers } from '../carouselSets';
import { signin, signup, setToken, forgotPassword } from '../api';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import './Login.css';

type AuthState = 'welcome' | 'signin' | 'signup' | 'forgot';
type SignupStep = 'email' | 'password' | 'username';

interface FormData {
  signupEmail: string;
  signupPassword: string;
  signupUsername: string;
  signupBio: string;
  agreedToTerms: boolean;
  signinEmail: string;
  signinPassword: string;
}

const INITIAL_FORM: FormData = {
  signupEmail: '',
  signupPassword: '',
  signupUsername: '',
  signupBio: '',
  agreedToTerms: false,
  signinEmail: '',
  signinPassword: '',
};

export default function Login() {
  const [state, setState] = useState<AuthState>('welcome');
  const [columns] = useState(() => getRandomCarouselCovers());
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState('');

  const update = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.signinEmail || !form.signinPassword) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const result = await signin(form.signinEmail, form.signinPassword);
      setToken(result.token);
      const user = result.user as User;
      setUser(user);
      navigate(user.onboarding_step < 3 ? '/onboarding' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleSignupNext = async () => {
    setError('');
    if (signupStep === 'email') {
      if (!form.signupEmail) { setError('Please enter your email'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.signupEmail)) { setError('Please enter a valid email address'); return; }
      setSignupStep('password');
    } else if (signupStep === 'password') {
      if (!form.signupPassword) { setError('Please enter a password'); return; }
      if (form.signupPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
      setSignupStep('username');
    } else {
      if (!form.signupUsername) { setError('Please choose a username'); return; }
      if (!form.agreedToTerms) { setError('Please agree to Terms of Service'); return; }
      try {
        const result = await signup(form.signupEmail, form.signupPassword, form.signupUsername, form.signupBio);
        setToken(result.token);
        const user = result.user as User;
        setUser(user);
        navigate('/onboarding');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed');
      }
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const email = (e.currentTarget as HTMLFormElement).elements.namedItem('resetEmail') as HTMLInputElement;
    if (!email?.value) { setError('Please enter your email'); return; }
    try {
      await forgotPassword(email.value);
      setError('');
      alert('If an account exists, a reset link has been sent.');
    } catch { /* silent */ }
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
                <label className="form-label" htmlFor="signin-email">Email</label>
                <input id="signin-email" className="input" type="email" placeholder="Type Email" value={form.signinEmail} onChange={(e) => update('signinEmail', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signin-password">Your password</label>
                <input id="signin-password" className="input" type="password" placeholder="Type Password" value={form.signinPassword} onChange={(e) => update('signinPassword', e.target.value)} />
              </div>
              <div className="auth-remember-row">
                <label className="remember-label"><input type="checkbox" id="remember-me" /> Remember me</label>
                <button type="button" className="forgot-link" onClick={() => setState('forgot')}>Forgot a password</button>
              </div>
              {error && <div className="field-error" role="alert">{error}</div>}
              <button className="btn btn-gray auth-submit" type="submit">SIGN IN</button>
            </form>
            <p className="auth-link">Don't Have An Account? <button type="button" className="auth-link-btn" onClick={goToSignup}>Sign Up</button></p>
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
              <button className={`signup-tab ${signupStep === 'password' ? 'active' : signupStep === 'username' ? 'done' : ''}`} disabled={!form.signupEmail} onClick={() => form.signupEmail && setSignupStep('password')}>Password</button>
              <button className={`signup-tab ${signupStep === 'username' ? 'active' : ''}`} disabled={!form.signupEmail || !form.signupPassword} onClick={() => form.signupEmail && form.signupPassword && setSignupStep('username')}>Username</button>
            </div>
            <div className="auth-form" style={{ gap: 16 }}>
              {signupStep === 'email' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">Email</label>
                  <input id="signup-email" className="input" type="email" placeholder="Your Email" value={form.signupEmail} onChange={(e) => update('signupEmail', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSignupNext()} />
                </div>
              )}
              {signupStep === 'password' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-email-ro">Email</label>
                    <input id="signup-email-ro" className="input" type="email" value={form.signupEmail} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-password">Your password</label>
                    <input id="signup-password" className="input" type="password" placeholder="Type Password" value={form.signupPassword} onChange={(e) => update('signupPassword', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSignupNext()} />
                  </div>
                </>
              )}
              {signupStep === 'username' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="input input--readonly">{form.signupEmail}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input input--readonly">{'•'.repeat(form.signupPassword.length)}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-username">Username</label>
                    <input id="signup-username" className="input" type="text" placeholder="Your Username" value={form.signupUsername} onChange={(e) => update('signupUsername', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-bio">Profile bio</label>
                    <textarea id="signup-bio" className="input signup-bio" placeholder="Optional bio" value={form.signupBio} onChange={(e) => update('signupBio', e.target.value)} rows={3} />
                  </div>
                  <label className="terms-label">
                    <input type="checkbox" id="agree-terms" checked={form.agreedToTerms} onChange={(e) => update('agreedToTerms', e.target.checked)} />
                    {' '}Agree to <a className="terms-link" href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  </label>
                </>
              )}
              {error && <div className="field-error" role="alert">{error}</div>}
              <button className="btn btn-gray auth-submit" onClick={handleSignupNext} type="button">
                {signupStep === 'username' ? 'SIGN UP' : 'NEXT'}
              </button>
            </div>
            <p className="auth-link">Already Have An Account? <button type="button" className="auth-link-btn" onClick={goToSignin}>Sign In</button></p>
          </div>
        )}

        {state === 'forgot' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Reset Password</h1>
              <p className="auth-form-subtitle">Enter Email and we will send link to change</p>
            </div>
            <form className="auth-form" onSubmit={handleForgot}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email</label>
                <input id="reset-email" name="resetEmail" className="input" type="email" placeholder="Your Email" />
              </div>
              {error && <div className="field-error" role="alert">{error}</div>}
              <button className="btn btn-gray auth-submit" type="submit">RESET</button>
            </form>
            <p className="auth-link"><button type="button" className="auth-link-btn" onClick={goToSignin}>Back to Sign In</button></p>
          </div>
        )}
      </div>

      <div className="cover-grid-side">
        {columns.map((col, i) => (
          <div key={i} className="cover-grid-column">
            <div className={`cover-grid-scroll cover-grid-scroll-${i + 1}`}>
              {[...col, ...col].map((src, j) => (
                <div key={`${src}-${j}`} className="cover-grid-card">
                  <img src={src} alt="Game cover" onLoad={(e) => e.currentTarget.classList.add('loaded')} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
