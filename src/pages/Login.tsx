import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomCarouselCovers } from '../carouselSets';
import './Login.css';

type AuthState = 'signin' | 'signup' | 'forgot';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const [state, setState] = useState<AuthState>('signin');
  const [columns] = useState(() => getRandomCarouselCovers());
  const navigate = useNavigate();

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        {state === 'signin' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Welcome Back</h1>
              <p className="auth-form-subtitle">Enter your information to access your account.</p>
            </div>
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" type="email" placeholder="Your Email" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="input" type="password" placeholder="Your Password" />
              </div>
              <div className="auth-remember-row">
                <label className="remember-label">
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
                <a className="forgot-link" onClick={() => setState('forgot')}>Forgot a password</a>
              </div>
              <button className="btn btn-primary" type="submit">SIGN IN</button>
            </form>
            <div className="auth-divider">or</div>
            <button className="google-btn"><GoogleIcon /> Continue with Google</button>
            <p className="auth-link">Don't Have An Account?{' '}<a onClick={() => setState('signup')}>Sign Up</a></p>
          </div>
        )}

        {state === 'signup' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Create an account</h1>
              <p className="auth-form-subtitle">Fill in the following details to get started</p>
            </div>
            <form className="auth-form" onSubmit={handleMockSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="input" type="text" placeholder="Your Username" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" type="email" placeholder="Your Email" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="input" type="password" placeholder="Your Password" />
              </div>
              <button className="btn btn-primary" type="submit">SIGN UP</button>
            </form>
            <div className="auth-divider">or</div>
            <button className="google-btn"><GoogleIcon /> Continue with Google</button>
            <p className="auth-link">Already Have An Account?{' '}<a onClick={() => setState('signin')}>Sign In</a></p>
          </div>
        )}

        {state === 'forgot' && (
          <div className="auth-form-container">
            <div className="auth-logo-small"><img src="/images/logo.png" alt="Playnist" /></div>
            <div className="auth-form-header">
              <h1 className="auth-form-title">Reset Password</h1>
              <p className="auth-form-subtitle">Enter Email and we will send link to change</p>
            </div>
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); navigate('/reset-password'); }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" type="email" placeholder="Your Email" />
              </div>
              <button className="btn btn-primary" type="submit">RESET</button>
            </form>
            <p className="auth-link"><a onClick={() => setState('signin')}>Back to Sign In</a></p>
          </div>
        )}
      </div>

      <div className="carousel-side">
        {columns.map((col, i) => (
          <div key={i} className="carousel-container">
            <div className={`carousel carousel-${i + 1}`}>
              {[...col, ...col].map((src, j) => (
                <div key={j} className="carousel-card">
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
