import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './views/auth/LoginView';
import { MobileShell } from './components/layout/MobileShell';
import { CustomerView } from './views/customer/CustomerView';

// ==============================================================================
// REACT COMPONENT: App
// The root component of our application.
// In Vanilla JS, think of this like your main router:
// if (!user) { renderLogin(); } else { renderDashboard(); }
// ==============================================================================
export default function App() {
  const auth = useAuth();
  const user = auth.user;

  // Manages which of the 2 customer tabs is currently active:
  // 'nearby' (Nearby Locker) or 'active_order' (Active Laundry Tracker)
  const [activeTab, setActiveTab] = useState('nearby');

  // ============================================================================
  // CONDITIONAL RENDERING (Guard Clause in Vanilla JS):
  // If the user has not logged in yet, return the LoginView component.
  // ============================================================================
  if (!user) {
    return <LoginView />;
  }

  // Once a user is logged in, wrap the CustomerView inside the MobileShell layout frame.
  return (
    <MobileShell activeTab={activeTab} setActiveTab={setActiveTab}>
      <CustomerView activeTab={activeTab} setActiveTab={setActiveTab} />
    </MobileShell>
  );
}
