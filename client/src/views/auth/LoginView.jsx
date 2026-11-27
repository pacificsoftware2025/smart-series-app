import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Truck, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import kioskIllustration from '../../assets/images/smartbox-kiosk-illustration.jpg';
import './LoginView.css';

// ==============================================================================
// REACT COMPONENT: LoginView
// Split-Screen Layout with Operator/Rider Role Toggle and Smartbox Kiosk Visual
// Operator authentication wired to Backend API endpoints (/register, /login, /me)
// Strictly zero ternary operators and zero emojis.
// ==============================================================================
export function LoginView() {
  const auth = useAuth();
  const loginOperatorWithApi = auth.loginOperatorWithApi;
  const registerOperatorWithApi = auth.registerOperatorWithApi;
  const loginRiderWithApi = auth.loginRiderWithApi;
  const registerRiderWithApi = auth.registerRiderWithApi;

  // Active role selector: 'operator' | 'rider'
  // useState acts like `let selectedRole = 'operator'` in Vanilla JS,
  // re-rendering the form automatically when the user switches portals.
  const [selectedRole, setSelectedRole] = useState('operator');

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');

  // Form Fields
  const [email, setEmail] = useState('juan@smartlocker.ph');
  const [password, setPassword] = useState('yourPassword123');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+639171234567');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role toggle handlers
  function handleSelectOperatorRole() {
    setSelectedRole('operator');
    setErrorMsg('');
    if (email === 'marco@grabngobar.store') {
      setEmail('juan@smartlocker.ph');
      setPassword('yourPassword123');
    }
  }

  function handleSelectRiderRole() {
    setSelectedRole('rider');
    setErrorMsg('');
    if (email === 'juan@smartlocker.ph' || email === 'elena@grabngobar.store') {
      setEmail('marco@grabngobar.store');
      setPassword('rider2026');
    }
  }

  // Submit Handler
  async function handleSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!email || email.trim() === '') {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (!password || password.trim() === '') {
      setErrorMsg('Please enter your password');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName || fullName.trim().length < 2) {
        setErrorMsg('Please enter your full name');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }
    }

    setErrorMsg('');

    // Operator Authentication: Real Backend API endpoints (/api/auth/login & /api/auth/register)
    if (selectedRole === 'operator') {
      setIsSubmitting(true);
      try {
        if (authMode === 'signin') {
          await loginOperatorWithApi(email.trim(), password);
        } else {
          let phoneToSubmit = '+639171234567';
          if (phone && phone.trim() !== '') {
            phoneToSubmit = phone.trim();
          }
          await registerOperatorWithApi({
            name: fullName.trim(),
            email: email.trim(),
            phone: phoneToSubmit,
            password: password,
          });
        }
      } catch (err) {
        let msg = 'Authentication failed';
        if (err && err.message) {
          msg = err.message;
        }
        setErrorMsg(msg);
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      return;
    }

    // Rider Authentication: Real Backend API endpoints (/api/auth/rider/login & /api/auth/rider/register)
    setIsSubmitting(true);
    try {
      if (authMode === 'signin') {
        await loginRiderWithApi(email.trim(), password);
      } else {
        let riderPhone = '';
        if (phone && phone.trim() !== '') {
          riderPhone = phone.trim();
        }
        let riderVehicle = '';
        if (vehiclePlate && vehiclePlate.trim() !== '') {
          riderVehicle = vehiclePlate.trim();
        }
        await registerRiderWithApi({
          name: fullName.trim(),
          email: email.trim(),
          phone: riderPhone,
          password: password,
          vehiclePlate: riderVehicle,
        });
      }
    } catch (err) {
      let riderErrMsg = 'Rider authentication failed';
      if (err && err.message) {
        riderErrMsg = err.message;
      }
      setErrorMsg(riderErrMsg);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  }

  // Helper functions replacing ternary operators
  function getRoleButtonClass(role) {
    if (selectedRole === role) {
      return 'ref-role-btn active';
    }
    return 'ref-role-btn';
  }

  function getHeadingGreeting() {
    if (authMode === 'signup') {
      return 'Create,';
    }
    return 'Holla,';
  }

  function getHeadingTitle() {
    if (authMode === 'signup') {
      return 'New Account';
    }
    return 'Welcome Back';
  }

  function getSubheadingText() {
    if (authMode === 'signup') {
      return 'Hey, register your operations account to begin';
    }
    return 'Hey, welcome back to your special place';
  }

  function getSubmitButtonText() {
    if (isSubmitting) {
      if (authMode === 'signup') {
        return 'Creating Account...';
      }
      return 'Signing In...';
    }
    if (authMode === 'signup') {
      return 'Sign Up';
    }
    return 'Sign In';
  }

  return (
    <div className="ref-auth-page-wrapper">
      
      {/* Centered Modern Dual-Panel Card */}
      <div className="ref-auth-split-card">

        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: INTERACTIVE FORM & ROLE SELECTOR                 */}
        {/* ------------------------------------------------------------- */}
        <div className="ref-form-column">

          {/* Top Brand Logo with Safety Orange Pill */}
          <div className="ref-brand-row">
            <span className="ref-brand-icon-pill"></span>
            <span className="ref-brand-name">Grab 'n Go Bar</span>
          </div>

          {/* Large Editorial Headline */}
          <div className="ref-headline-group">
            <h1 className="ref-heading-greeting">{getHeadingGreeting()}</h1>
            <h2 className="ref-heading-title">{getHeadingTitle()}</h2>
            <p className="ref-subheading">{getSubheadingText()}</p>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* 2 BUTTONS APPEAR FIRST BEFORE THE INPUT FIELDS              */}
          {/* ----------------------------------------------------------- */}
          <div className="ref-role-selector-wrap">
            <span className="ref-role-hint">Select Portal Access:</span>
            <div className="ref-role-buttons-row">
              <button
                type="button"
                onClick={handleSelectOperatorRole}
                className={getRoleButtonClass('operator')}
              >
                <Building2 size={16} />
                <span>Operator</span>
              </button>

              <button
                type="button"
                onClick={handleSelectRiderRole}
                className={getRoleButtonClass('rider')}
              >
                <Truck size={16} />
                <span>Rider</span>
              </button>
            </div>
          </div>

          {/* Error Message Alert Banner */}
          {errorMsg !== '' && (
            <div className="ref-error-banner">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="ref-inputs-form">
            
            {/* Sign Up Full Name Field */}
            {authMode === 'signup' && (
              <div className="ref-input-group">
                <input
                  type="text"
                  value={fullName}
                  onChange={function (e) { setFullName(e.target.value); }}
                  placeholder="Full Name (e.g. Juan Dela Cruz)"
                  className="ref-text-input"
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div className="ref-input-group">
              <input
                type="email"
                value={email}
                onChange={function (e) { setEmail(e.target.value); }}
                placeholder="Work email address"
                className="ref-text-input"
                autoComplete="email"
                required
              />
            </div>

            {/* Sign Up: Phone Number Field (for both Operator and Rider) */}
            {authMode === 'signup' && (
              <div className="ref-input-group">
                <input
                  type="tel"
                  value={phone}
                  onChange={function (e) { setPhone(e.target.value); }}
                  placeholder="Phone number (+639171234567)"
                  className="ref-text-input"
                />
              </div>
            )}

            {/* Rider Sign Up: Assigned Van / Vehicle Plate Field */}
            {authMode === 'signup' && selectedRole === 'rider' && (
              <div className="ref-input-group">
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={function (e) { setVehiclePlate(e.target.value); }}
                  placeholder="Van / Vehicle Plate (e.g. Van #04 or ABC-1234)"
                  className="ref-text-input"
                />
              </div>
            )}

            {/* Password Field */}
            <div className="ref-input-group">
              <input
                type="password"
                value={password}
                onChange={function (e) { setPassword(e.target.value); }}
                placeholder="Password"
                className="ref-text-input"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Sign Up Confirm Password Field */}
            {authMode === 'signup' && (
              <div className="ref-input-group">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={function (e) { setConfirmPassword(e.target.value); }}
                  placeholder="Confirm Password"
                  className="ref-text-input"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {/* Remember Me & Forgot Password Row */}
            {authMode === 'signin' && (
              <div className="ref-options-row">
                <label className="ref-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={function (e) { setRememberMe(e.target.checked); }}
                    className="ref-checkbox"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={function () {
                    alert('Password recovery: Contact system administrator at admin@grabngobar.store');
                  }}
                  className="ref-forgot-btn"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Main Action Button in Brand Safety Orange */}
            <button 
              type="submit" 
              className="ref-submit-btn" 
              disabled={isSubmitting}
            >
              <span className="ref-submit-btn-inner">
                {isSubmitting && <Loader2 size={16} className="ref-spin" />}
                <span>{getSubmitButtonText()}</span>
              </span>
            </button>

            {/* Bottom Toggle Between Sign In and Sign Up */}
            <div className="ref-switch-mode-row">
              {authMode === 'signin' && (
                <p className="ref-switch-text">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={function () { setAuthMode('signup'); setErrorMsg(''); }}
                    className="ref-switch-link"
                  >
                    Sign Up
                  </button>
                </p>
              )}

              {authMode === 'signup' && (
                <p className="ref-switch-text">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={function () { setAuthMode('signin'); setErrorMsg(''); }}
                    className="ref-switch-link"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>

          </form>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: OFFICIAL SMARTBOX LAUNDRY LOCKER KIOSK PHOTO    */}
        {/* ------------------------------------------------------------- */}
        <div className="ref-artwork-column">
          <div className="ref-artwork-card">
            <img 
              src={kioskIllustration} 
              alt="Grab 'n Go Smartbox Smart Laundry Locker Kiosk" 
              className="ref-artwork-photo"
            />
          </div>
        </div>

      </div>

    </div>
  );
}

export default LoginView;
