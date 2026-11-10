import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import './LoginView.css';

// ==============================================================================
// REACT COMPONENT: LoginView
// The first screen where a user selects their login role:
// Guest, Customer (Jamie Davis), or Rider (Disabled).
// ==============================================================================
export function LoginView() {
  // ============================================================================
  // CONTEXT HOOK (useAuth) explained in Vanilla JS:
  // In Vanilla JS, think of this like reading from a global object:
  //   const auth = window.appAuth;
  // It gives us loginAsGuest() and loginAsCustomer() functions.
  // ============================================================================
  const auth = useAuth();
  const loginAsGuest = auth.loginAsGuest;
  const loginAsCustomer = auth.loginAsCustomer;

  return (
    <div className="login-viewport">
      <div className="login-mobile-frame">
        
        {/* ------------------------------------------------------------- */}
        {/* STATUS BAR (Mobile Shell Aesthetic)                           */}
        {/* ------------------------------------------------------------- */}
        <div className="login-status-bar">
          <span>9:41</span>
          <div className="notch-island"></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="ble-pill">BLE ON</span>
            <span style={{ fontSize: '10px', color: 'var(--slate-500)', fontWeight: 700 }}>5G</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONTENT BODY                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="login-content-body">
          
          {/* Brand Heading */}
          <div className="login-brand-header">
            <h1 className="login-app-title">
              Drop Off, Wash, & Pick Up.
            </h1>
            <p className="login-app-subtitle">
              Select your access role to continue to the smart locker system.
            </p>
          </div>

          {/* Role Selection Stack */}
          <div className="login-options-stack">
            <p className="login-section-caption">Select Your Account</p>

            {/* 1. Continue as Guest */}
            {/* In React: onClick={loginAsGuest} passes the function reference */}
            <button onClick={loginAsGuest} className="login-role-card">
              <div className="role-card-lead">
                <div className="role-icon-plate">
                  <User size={20} />
                </div>
                <div className="role-text-col">
                  <span className="role-primary-title">Continue as Guest</span>
                  <span className="role-secondary-sub">Quick explore & drop off</span>
                </div>
              </div>
              <ArrowRight size={16} color="var(--slate-400)" />
            </button>

            {/* 2. Login as Customer (Primary Suki) */}
            <button onClick={loginAsCustomer} className="login-role-card customer-active-card">
              <div className="role-card-lead">
                <div className="role-icon-plate">
                  <ShieldCheck size={20} />
                </div>
                <div className="role-text-col">
                  <span className="role-primary-title">Login as Customer</span>
                  <span className="role-secondary-sub">Jamie Davis · Verified Customer</span>
                </div>
              </div>
              <ArrowRight size={16} color="#ffffff" />
            </button>

            {/* 3. Login as Rider (Disabled) */}
            <button disabled className="login-role-card disabled-role-card">
              <div className="role-card-lead">
                <div className="role-icon-plate">
                  <Truck size={20} />
                </div>
                <div className="role-text-col">
                  <span className="role-primary-title">Login as Rider</span>
                  <span className="role-secondary-sub">Van delivery & collection</span>
                </div>
              </div>
              <span className="disabled-tag-pill">Disabled</span>
            </button>
          </div>

        </div>

        {/* Vertical balance spacer (Footer removed as requested) */}
        <div style={{ height: '24px' }}></div>

      </div>
    </div>
  );
}
