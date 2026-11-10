import React, { createContext, useContext, useState } from 'react';
import { ROLES } from '../constants/roles';

// ==============================================================================
// REACT CONTEXT explained in Vanilla JS:
// In Vanilla JS:
//   window.appState = { user: null, activeOrder: null };
// The problem in Vanilla JS: updating window.appState doesn't automatically
// re-render the DOM unless you manually call render() everywhere.
//
// In React:
//   createContext() creates a shared data store. Any component that calls
//   useAuth() will automatically re-render whenever this data updates!
// ==============================================================================
const AuthContext = createContext();

export function AuthProvider(props) {
  // props.children represents all child components wrapped inside <AuthProvider>
  const children = props.children;

  // Global State for the logged-in user (null = not logged in)
  const [user, setUser] = useState(null);

  // Global State for the active laundry order (null = no order currently)
  const [activeOrder, setActiveOrder] = useState(null);

  // Logs in as a guest
  function loginAsGuest() {
    setUser({
      name: 'Guest User',
      initials: 'GU',
      role: ROLES.GUEST,
      location: 'Central Mall Hub',
    });
  }

  // Logs in as verified customer Jamie Davis
  function loginAsCustomer() {
    setUser({
      name: 'Jamie Davis',
      initials: 'JD',
      role: ROLES.CUSTOMER,
      location: 'Central Mall Hub',
    });
  }

  // ============================================================================
  // SIGN UP NEW CUSTOMER explained in Vanilla JS:
  // In Vanilla JS:
  //   window.appState.user = { name, initials, role: 'customer' };
  //   updateHeaderDOM();
  // In React:
  //   Calling setUser(...) causes all components listening to AuthContext to re-render.
  // ============================================================================
  function signupCustomer(name, phone) {
    let customerInitials = 'NC';
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        customerInitials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        customerInitials = parts[0].substring(0, 2).toUpperCase();
      }
    }

    setUser({
      name: name && name.trim().length > 0 ? name.trim() : 'New Customer',
      initials: customerInitials,
      phone: phone ? phone : '917 000 0000',
      role: ROLES.CUSTOMER,
      location: 'Central Mall Hub',
    });
  }

  // Resets user state back to null (triggers App.jsx to show LoginView)
  function logout() {
    setUser(null);
    setActiveOrder(null);
  }

  // Creates an active order after the customer unlocks a locker
  function createOrder(orderData) {
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'in_wash',
      lockerNumber: orderData.lockerNumber ? orderData.lockerNumber : '03',
      serviceType: orderData.serviceType ? orderData.serviceType : 'Wash, Dry & Fold',
      specialInstructions: orderData.specialInstructions ? orderData.specialInstructions : 'None',
      temperature: orderData.temperature ? orderData.temperature : 'Cold Wash',
      fabricSoftener: orderData.fabricSoftener !== undefined ? orderData.fabricSoftener : true,
      estimatedReady: 'Today, 6:30 PM',
      weightKg: 5.2,
      priceEstimate: 337.00,
    };
    setActiveOrder(newOrder);
  }

  // The 'value' object holds all variables & functions we want to share with other components.
  const contextValue = {
    user: user,
    activeOrder: activeOrder,
    loginAsGuest: loginAsGuest,
    loginAsCustomer: loginAsCustomer,
    signupCustomer: signupCustomer,
    logout: logout,
    createOrder: createOrder,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook helper so components can simply write: const auth = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
