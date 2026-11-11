import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  User, 
  Truck, 
  Lock, 
  UserPlus, 
  LogIn,
  X,
  AlertCircle 
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

  // Validation error state for each form
  const [signInError, setSignInError] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [guestError, setGuestError] = useState('');

  // Guest Modal state
  // In Vanilla JS: let isGuestModalOpen = false;
  // In React: Calling setIsGuestModalOpen(true) tells React to re-render and display the modal dialog.
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // ============================================================================
  // VALIDATION & SANITIZATION HELPERS (Vanilla JS logic)
  // - Contact numbers strictly accept integers only (0-9).
  // - Maximum length is capped at 10 digits (e.g. 9171234567).
  // ============================================================================

  // Sanitizes phone input: strictly filters out any non-digits and caps at 10 digits.
  function sanitizePhoneNumber(rawInput) {
    if (!rawInput) {
      return '';
    }
    // Replace all non-digit characters with an empty string
    const digitsOnly = rawInput.replace(/\D/g, '');
    // Limit to maximum length of 10 digits
    if (digitsOnly.length > 10) {
      return digitsOnly.slice(0, 10);
    }
    return digitsOnly;
  }

  // Validates a 10-digit Philippine mobile number
  function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return 'Please enter your mobile number';
    }
    if (phoneNumber.length !== 10) {
      return 'Mobile number must be exactly 10 digits';
    }
    if (phoneNumber.charAt(0) !== '9') {
      return 'Mobile number must start with 9 (e.g. 9171234567)';
    }
    return '';
  }

  // Input change handlers with instant sanitization
  function handleSignInPhoneChange(e) {
    const cleanDigits = sanitizePhoneNumber(e.target.value);
    setPhone(cleanDigits);
    if (signInError !== '') {
      setSignInError('');
    }
  }

  function handleSignUpPhoneChange(e) {
    const cleanDigits = sanitizePhoneNumber(e.target.value);
    setSignupPhone(cleanDigits);
    if (signUpError !== '') {
      setSignUpError('');
    }
  }

  function handleSignUpNameChange(e) {
    setSignupName(e.target.value);
    if (signUpError !== '') {
      setSignUpError('');
    }
  }

  function handleGuestPhoneChange(e) {
    const cleanDigits = sanitizePhoneNumber(e.target.value);
    setGuestPhone(cleanDigits);
    if (guestError !== '') {
      setGuestError('');
    }
  }

  function handleGuestNameChange(e) {
    setGuestName(e.target.value);
    if (guestError !== '') {
      setGuestError('');
    }
  }

  // Handles Sign-In submit with validation
  function handleSignInSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const phoneErrorMsg = validatePhoneNumber(phone);
    if (phoneErrorMsg !== '') {
      setSignInError(phoneErrorMsg);
      return;
    }
    setSignInError('');
    loginAsCustomer(phone);
  }

  // Handles Sign-Up submit with validation
  function handleSignUpSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!signupName || signupName.trim().length < 2) {
      setSignUpError('Please enter your full name (minimum 2 characters)');
      return;
    }
    const phoneErrorMsg = validatePhoneNumber(signupPhone);
    if (phoneErrorMsg !== '') {
      setSignUpError(phoneErrorMsg);
      return;
    }
    setSignUpError('');
    signupCustomer(signupName.trim(), signupPhone);
  }

  // Handles Guest Modal submit with validation
  function handleGuestModalSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!guestName || guestName.trim().length < 2) {
      setGuestError('Please enter your full name (minimum 2 characters)');
      return;
    }
    const phoneErrorMsg = validatePhoneNumber(guestPhone);
    if (phoneErrorMsg !== '') {
      setGuestError(phoneErrorMsg);
      return;
    }
    setGuestError('');
    loginAsGuest(guestName.trim(), guestPhone);
    setIsGuestModalOpen(false);
  }

  // Helper function: determines CSS class for active auth tab
  function getAuthTabClass(mode) {
    if (authMode === mode) {
      return 'auth-tab-btn active-tab';
    }
    return 'auth-tab-btn';
  }

  // Helper function: determines CSS class for phone input when an error occurs
  function getPhoneInputClass(hasError) {
    if (hasError) {
      return 'phone-input-group input-has-error';
    }
    return 'phone-input-group';
  }

  // Helper function: determines CSS class for name input wrapper when an error occurs
  function getTextInputWrapperClass(hasError) {
    if (hasError) {
      return 'single-input-wrapper input-has-error';
    }
    return 'single-input-wrapper';
  }

  // Switches between Sign In and Sign Up tabs and clears errors
  function handleTabSwitch(mode) {
    setAuthMode(mode);
    setSignInError('');
    setSignUpError('');
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
          
          {/* Hero Brand Header with Grab 'n Go Bar Logo Watermark & Gradient Fade */}
          <div className="login-hero-section">
            {/* Soft Radial Halo Glow */}
            <div className="hero-halo-glow"></div>

            {/* Faded Watermark Logo with Gradient Fade Mask */}
            <div className="hero-watermark-wrap">
              <img 
                src="https://static.wixstatic.com/media/b15e89_67ae7ed656e9491197c7bfd8fb4090f2~mv2.png" 
                alt="Grab n Go Logo Watermark" 
                className="hero-watermark-img"
              />
            </div>

            {/* Ambient Silhouettes for layered depth */}
            <svg className="hero-ambient-cards" viewBox="0 0 400 240" preserveAspectRatio="none">
              <rect x="-30" y="30" width="130" height="120" rx="26" fill="#ffffff" transform="rotate(-15)" />
              <rect x="290" y="40" width="140" height="130" rx="28" fill="#ffffff" transform="rotate(18)" />
            </svg>

            {/* Foreground Content */}
            <div className="hero-content">
              <h1 className="hero-title">Welcome Back</h1>
              <p className="hero-subtitle">
                Automated drop-off, real-time laundry tracking, & secure contact-free lockers.
              </p>
            </div>
          </div>

          {/* Main Card Container */}
          <div className="login-form-card">
            
            {/* ------------------------------------------------------------- */}
            {/* SEGMENTED AUTH TABS (Sign In vs Sign Up)                      */}
            {/* ------------------------------------------------------------- */}
            <div className="auth-tab-bar">
              <button
                type="button"
                onClick={function () { handleTabSwitch('signin'); }}
                className={getAuthTabClass('signin')}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={function () { handleTabSwitch('signup'); }}
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

                <div className={getPhoneInputClass(signInError !== '')}>
                  <div className="country-prefix">
                    <span className="country-code-text">PH</span>
                    <span className="country-code">+63</span>
                  </div>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    id="phone-input"
                    value={phone}
                    onChange={handleSignInPhoneChange}
                    placeholder="9XX XXX XXXX"
                    className="phone-field"
                    autoComplete="tel"
                    required
                  />
                </div>

                {signInError !== '' && (
                  <div className="form-error-banner">
                    <AlertCircle size={14} />
                    <span>{signInError}</span>
                  </div>
                )}

                {/* Primary Sign In Button */}
                <button type="submit" className="login-primary-btn">
                  <span>Login</span>
                  <ArrowRight size={18} />
                </button>

                {/* Quick Switch to Sign Up */}
                <p className="auth-switch-prompt">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={function () { handleTabSwitch('signup'); }} 
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
                  <div className={getTextInputWrapperClass(signUpError !== '' && (!signupName || signupName.trim().length < 2))}>
                    <input 
                      type="text"
                      id="signup-name-input"
                      value={signupName}
                      onChange={handleSignUpNameChange}
                      placeholder="e.g. Maria Santos"
                      className="text-input-field"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number Input */}
                <div className="form-group-block">
                  <label htmlFor="signup-phone-input" className="form-label">Mobile Number</label>
                  <div className={getPhoneInputClass(signUpError !== '' && (signupPhone.length !== 10 || signupPhone.charAt(0) !== '9'))}>
                    <div className="country-prefix">
                      <span className="country-code-text">PH</span>
                      <span className="country-code">+63</span>
                    </div>
                    <input 
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      id="signup-phone-input"
                      value={signupPhone}
                      onChange={handleSignUpPhoneChange}
                      placeholder="9XX XXX XXXX"
                      className="phone-field"
                      required
                    />
                  </div>
                </div>

                {signUpError !== '' && (
                  <div className="form-error-banner">
                    <AlertCircle size={14} />
                    <span>{signUpError}</span>
                  </div>
                )}

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
                    onClick={function () { handleTabSwitch('signin'); }} 
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
            {/* In Vanilla JS: button.onclick = function() { modal.style.display = 'flex'; } */}
            <button 
              type="button" 
              onClick={function () { setIsGuestModalOpen(true); }} 
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

            {/* Logistics / Rider Access Portal */}
            <button
              type="button"
              onClick={function () { auth.loginAsRider(); }}
              className="rider-action-card"
            >
              <div className="rider-card-left">
                <div className="rider-icon-circle">
                  <Truck size={17} />
                </div>
                <div className="rider-info">
                  <span className="rider-title">Van Logistics & Rider</span>
                  <span className="rider-desc">Scheduled pickup route portal</span>
                </div>
              </div>
              <ArrowRight size={16} className="guest-arrow rider-arrow" />
            </button>

          </div>

          {/* Footer Notice */}
          <div className="login-security-notice">
            <span>© 2026 www.grabngobar.store</span>
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* GUEST ACCESS MODAL (Name & Mobile Number input fields)         */}
      {/* In Vanilla JS: if (isGuestModalOpen) { append modal to body } */}
      {/* ------------------------------------------------------------- */}
      {isGuestModalOpen && (
        <div className="guest-modal-backdrop">
          <div className="guest-modal-card">
            
            {/* Modal Header */}
            <div className="guest-modal-header">
              <div className="guest-header-titles">
                <h3 className="guest-modal-title">Guest Drop-Off Access</h3>
                <p className="guest-modal-subtitle">
                  We need your name and phone number to send your locker claim PIN.
                </p>
              </div>

              <button 
                type="button" 
                onClick={function () { setIsGuestModalOpen(false); }} 
                className="guest-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Guest Input Form */}
            <form onSubmit={handleGuestModalSubmit} className="guest-modal-form">
              
              {/* Full Name Input */}
              <div className="form-group-block">
                <label htmlFor="guest-name-input" className="form-label">Full Name</label>
                <div className={getTextInputWrapperClass(guestError !== '' && (!guestName || guestName.trim().length < 2))}>
                  <input 
                    type="text"
                    id="guest-name-input"
                    value={guestName}
                    onChange={handleGuestNameChange}
                    placeholder="e.g. Maria Santos"
                    className="text-input-field"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number Input */}
              <div className="form-group-block">
                <label htmlFor="guest-phone-input" className="form-label">Mobile Number</label>
                <div className={getPhoneInputClass(guestError !== '' && (guestPhone.length !== 10 || guestPhone.charAt(0) !== '9'))}>
                  <div className="country-prefix">
                    <span className="country-code-text">PH</span>
                    <span className="country-code">+63</span>
                  </div>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    id="guest-phone-input"
                    value={guestPhone}
                    onChange={handleGuestPhoneChange}
                    placeholder="9XX XXX XXXX"
                    className="phone-field"
                    required
                  />
                </div>
              </div>

              {guestError !== '' && (
                <div className="form-error-banner">
                  <AlertCircle size={14} />
                  <span>{guestError}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button type="submit" className="login-primary-btn">
                <span>Proceed as Guest</span>
                <ArrowRight size={18} />
              </button>

              {/* Cancel Button */}
              <button 
                type="button" 
                onClick={function () { setIsGuestModalOpen(false); }} 
                className="guest-modal-cancel-btn"
              >
                Cancel
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
