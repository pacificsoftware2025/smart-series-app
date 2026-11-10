import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, ChevronDown, MapPin } from 'lucide-react';
import './MobileShell.css';

// ==============================================================================
// REACT COMPONENT: MobileShell
// Acts as the layout frame for the mobile app experience.
// It wraps around the active screen using props.children.
// ==============================================================================
export function MobileShell(props) {
  // ============================================================================
  // PROPS & CHILDREN explained in Vanilla JS:
  // In Vanilla JS: container.appendChild(screenContent)
  // In React: whatever HTML/component is placed inside <MobileShell>...</MobileShell>
  // arrives here as 'props.children'.
  // ============================================================================
  const children = props.children;
  const activeTab = props.activeTab;
  const setActiveTab = props.setActiveTab;

  const auth = useAuth();
  const user = auth.user;
  const logout = auth.logout;

  // Extract display values using explicit if statements (no ternaries)
  let userInitials = 'JD';
  let userName = 'Guest';
  let userLocation = 'Central Mall Hub';

  if (auth && auth.activeLocation) {
    userLocation = auth.activeLocation;
  } else if (user && user.location) {
    userLocation = user.location;
  }

  if (user) {
    if (user.initials) {
      userInitials = user.initials;
    }
    if (user.name) {
      userName = user.name;
    }
  }

  // Helper function: determines active tab CSS class
  function getNavTabClass(tabKey) {
    if (activeTab === tabKey) {
      return 'nav-tab-button tab-active';
    }
    return 'nav-tab-button';
  }

  return (
    <div className="shell-viewport">
      <div className="mobile-device-frame">
        
        {/* ------------------------------------------------------------- */}
        {/* STATUS BAR (Mobile Clock & Wireless Indicators)               */}
        {/* ------------------------------------------------------------- */}
        <div className="mobile-status-bar">
          <span>9:41</span>
          <div className="notch-island"></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="ble-pill">BLE ON</span>
            <span style={{ fontSize: '10px', color: 'var(--slate-500)', fontWeight: 700 }}>5G</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* HEADER BAR (Only visible if a user is logged in)              */}
        {/* ------------------------------------------------------------- */}
        {user && (
          <header className="app-header">
            <div className="header-user-row">
              <div className="user-profile-meta">
                <div className="user-avatar-circle">
                  {userInitials}
                </div>
                <div>
                  <p className="greeting-text">Good morning,</p>
                  <h2 className="user-display-name">{userName}</h2>
                </div>
              </div>

              <div className="header-action-group">
                <button className="icon-button" title="Notifications">
                  <Bell size={20} />
                  <span className="notification-dot"></span>
                </button>
                <button 
                  onClick={logout}
                  className="icon-button logout-btn"
                  title="Switch Role / Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            {/* Location Selector Bar */}
            <div className="location-selector-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="location-icon-box">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="location-label">Your Active Location</p>
                  <h3 className="location-name">{userLocation}</h3>
                </div>
              </div>
              <ChevronDown size={16} color="var(--slate-400)" />
            </div>

            {/* 2 TABS: NEARBY LOCKER | ACTIVE ORDER */}
            <div className="tab-navigation-bar">
              <button
                type="button"
                onClick={function () { setActiveTab('nearby'); }}
                className={getNavTabClass('nearby')}
              >
                NEARBY LOCKER
              </button>
              <button
                type="button"
                onClick={function () { setActiveTab('active_order'); }}
                className={getNavTabClass('active_order')}
              >
                ACTIVE ORDER
              </button>
            </div>
          </header>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MAIN BODY CONTAINER (Renders children components)            */}
        {/* ------------------------------------------------------------- */}
        <main className="shell-scroll-content">
          {children}
        </main>

      </div>
    </div>
  );
}
