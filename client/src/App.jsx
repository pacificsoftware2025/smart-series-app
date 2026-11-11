import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { ROLES } from './constants/roles';
import { LoginView } from './views/auth/LoginView';
import { MobileShell } from './components/layout/MobileShell';
import { CustomerView } from './views/customer/CustomerView';
import { DriverView } from './views/driver/DriverView';

// ==============================================================================
// REACT COMPONENT: App
// The root component of our application with RBAC role dispatching.
// In Vanilla JS:
//   if (!user) renderLogin();
//   else if (user.role === 'rider') renderDriverView();
//   else renderCustomerView();
// ==============================================================================
export default function App() {
  const auth = useAuth();
  const user = auth.user;

  // Manages which of the 2 customer tabs is currently active:
  // 'nearby' (Nearby Locker) or 'active_order' (Active Laundry Tracker)
  const [activeTab, setActiveTab] = useState('nearby');

  // Guard Clause: If not logged in, render LoginView
  if (!user) {
    return <LoginView />;
  }

  // RBAC Driver Route: If user has RIDER role, render dedicated field portal
  if (user.role === ROLES.RIDER) {
    return <DriverView />;
  }

  // Customer / Guest Route: Wrapped inside standard MobileShell frame
  return (
    <MobileShell activeTab={activeTab} setActiveTab={setActiveTab}>
      <CustomerView activeTab={activeTab} setActiveTab={setActiveTab} />
    </MobileShell>
  );
}
