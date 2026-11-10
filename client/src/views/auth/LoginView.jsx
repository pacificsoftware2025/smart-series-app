import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  User, 
  Truck, 
  Lock, 
  Box, 
  UserPlus, 
  LogIn 
} from 'lucide-react';
import './LoginView.css';

// ==============================================================================
// REACT COMPONENT: LoginView
// Modern mobile-first login & registration portal with phone authentication,
// new user signup, and guest mode.
// ==============================================================================
export function LoginView() {
  const auth = useAuth();
  const loginAsGuest = auth.loginAsGuest;
  const loginAsCustomer = auth.loginAsCustomer;
  const signupCustomer = auth.signupCustomer;

  // ============================================================================
  // LOCAL STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let authMode = 'signin'; // or 'signup'
  //   function switchTab(mode) { authMode = mode; render(); }
  // In React:
  //   Calling setAuthMode('signup') triggers React to re-render the matching form.
  // ============================================================================
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'

  // Input fields state
  const [phone, setPhone] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  // Handles Sign-In submit
  function handleSignInSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    loginAsCustomer();
  }

  // Handles Sign-Up submit
  function handleSignUpSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    let nameToUse = 'New Customer';
    if (signupName && signupName.trim().length > 0) {
      nameToUse = signupName.trim();
    }

    let phoneToUse = '917 000 0000';
    if (signupPhone && signupPhone.trim().length > 0) {
      phoneToUse = signupPhone.trim();
    }

    signupCustomer(nameToUse, phoneToUse);
  }

  // Helper function: determines CSS class for active auth tab
  function getAuthTabClass(mode) {
    if (authMode === mode) {
      return 'auth-tab-btn active-tab';
    }
    return 'auth-tab-btn';
  }

  return (
    <div className="login-viewport">
      <div className="login-mobile-frame">
        
        {/* Top Mobile Status Bar */}
        <div className="login-status-bar">
          <span className="status-time">9:41</span>
          <div className="notch-island"></div>
          <div className="status-indicators">
            <span className="telemetry-pill">
              <span className="pulse-dot"></span> BLE ON
            </span>
            <span className="network-pill">5G</span>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="login-scroll-body">
          
          {/* Hero Visual & Branding */}
          <div className="login-hero-section">
            <div className="hero-emblem-wrap">
              <div className="hero-emblem-glow"></div>
              <div className="hero-emblem-box">
                <Box size={28} className="hero-icon" />
              </div>
            </div>
            
            <h1 className="hero-title">Smart Locker</h1>
            <p className="hero-subtitle">
              Automated drop-off, real-time laundry tracking, & secure contact-free lockers.
            </p>
          </div>

          {/* Main Card Container */}
          <div className="login-form-card">
            
            {/* ------------------------------------------------------------- */}
            {/* SEGMENTED AUTH TABS (Sign In vs Sign Up)                      */}
            {/* ------------------------------------------------------------- */}
            <div className="auth-tab-bar">
              <button
                type="button"
                onClick={function () { setAuthMode('signin'); }}
                className={getAuthTabClass('signin')}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={function () { setAuthMode('signup'); }}
                className={getAuthTabClass('signup')}
              >
                <UserPlus size={14} />
                <span>Sign Up</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: SIGN IN FORM                                           */}
            {/* ------------------------------------------------------------- */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="login-form">
                <div className="form-label-row">
                  <label htmlFor="phone-input" className="form-label">Mobile Number</label>
                </div>

                <div className="phone-input-group">
                  <div className="country-prefix">
                    <span className="country-flag">🇵🇭</span>
                    <span className="country-code">+63</span>
                  </div>
                  <input 
                    type="tel"
                    id="phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9XX XXX XXXX"
                    className="phone-field"
                    autoComplete="tel"
                    required
                  />
                </div>

                {/* Primary Sign In Button */}
                <button type="submit" className="login-primary-btn">
                  <span>Sign In to Locker</span>
                  <ArrowRight size={18} />
                </button>

                {/* Quick Switch to Sign Up */}
                <p className="auth-switch-prompt">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('signup')} 
                    className="auth-switch-link"
                  >
                    Create one here
                  </button>
                </p>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: SIGN UP FORM                                           */}
            {/* ------------------------------------------------------------- */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="login-form">
                
                {/* Full Name Input */}
                <div className="form-group-block">
                  <label htmlFor="signup-name-input" className="form-label">Full Name</label>
                  <div className="single-input-wrapper">
                    <input 
                      type="text"
                      id="signup-name-input"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="text-input-field"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number Input */}
                <div className="form-group-block">
                  <label htmlFor="signup-phone-input" className="form-label">Mobile Number</label>
                  <div className="phone-input-group">
                    <div className="country-prefix">
                      <span className="country-flag">🇵🇭</span>
                      <span className="country-code">+63</span>
                    </div>
                    <input 
                      type="tel"
                      id="signup-phone-input"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="9XX XXX XXXX"
                      className="phone-field"
                      required
                    />
                  </div>
                </div>

                {/* Primary Sign Up Button */}
                <button type="submit" className="login-primary-btn">
                  <span>Create Account & Continue</span>
                  <ArrowRight size={18} />
                </button>

                {/* Quick Switch to Sign In */}
                <p className="auth-switch-prompt">
                  Already registered?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('signin')} 
                    className="auth-switch-link"
                  >
                    Sign in to your account
                  </button>
                </p>
              </form>
            )}

            {/* Clean Divider */}
            <div className="divider-row">
              <span className="divider-line"></span>
              <span className="divider-label">OR</span>
              <span className="divider-line"></span>
            </div>

            {/* Guest Action Card */}
            <button 
              type="button" 
              onClick={loginAsGuest} 
              className="guest-action-card"
            >
              <div className="guest-card-left">
                <div className="guest-icon-circle">
                  <User size={18} />
                </div>
                <div className="guest-info">
                  <span className="guest-title">Continue as Guest</span>
                  <span className="guest-desc">Quick drop-off without registering</span>
                </div>
              </div>
              <ArrowRight size={16} className="guest-arrow" />
            </button>

            {/* Logistics / Rider Access (Locked) */}
            <div className="rider-card-disabled">
              <div className="rider-card-left">
                <div className="rider-icon-circle">
                  <Truck size={17} />
                </div>
                <div className="rider-info">
                  <span className="rider-title">Van Logistics & Rider</span>
                  <span className="rider-desc">Scheduled pickup route portal</span>
                </div>
              </div>
              <div className="locked-badge">
                <Lock size={11} />
                <span>Locked</span>
              </div>
            </div>

          </div>

          {/* Footer Notice */}
          <div className="login-security-notice">
            <span>© 2026 www.grabngobar.store</span>
          </div>

        </div>

      </div>
    </div>
  );
}
