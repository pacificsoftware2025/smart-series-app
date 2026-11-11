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

  // Global State for the active locker station/location
  const [activeLocation, setActiveLocation] = useState('Central Mall Hub');

  // Logs in as a guest (optionally with Name & Phone provided via Guest Modal)
  // In Vanilla JS: window.appState.user = { name, initials, phone, role: 'guest' };
  function loginAsGuest(guestName, guestPhone) {
    let nameToUse = 'Guest User';
    if (guestName && guestName.trim().length > 0) {
      nameToUse = guestName.trim();
    }

    let phoneToUse = '9XX XXX XXXX';
    if (guestPhone && guestPhone.trim().length > 0) {
      phoneToUse = guestPhone.trim();
    }

    let initials = 'GU';
    const parts = nameToUse.split(' ');
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (nameToUse.length >= 2) {
      initials = nameToUse.substring(0, 2).toUpperCase();
    }

    setUser({
      name: nameToUse,
      initials: initials,
      phone: phoneToUse,
      role: ROLES.GUEST,
      location: 'Central Mall Hub',
    });
  }

  // Logs in as verified customer Jamie Davis (or with phone provided from Sign-In)
  function loginAsCustomer(customerPhone) {
    let phoneToUse = '917 000 0000';
    if (customerPhone && customerPhone.trim().length > 0) {
      phoneToUse = customerPhone.trim();
    }

    setUser({
      name: 'Jamie Davis',
      initials: 'JD',
      phone: phoneToUse,
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

    let customerName = 'New Customer';
    if (name && name.trim().length > 0) {
      customerName = name.trim();
    }

    let customerPhone = '917 000 0000';
    if (phone && phone.trim().length > 0) {
      customerPhone = phone.trim();
    }

    setUser({
      name: customerName,
      initials: customerInitials,
      phone: customerPhone,
      role: ROLES.CUSTOMER,
      location: 'Central Mall Hub',
    });
  }

  // Resets user state back to null (triggers App.jsx to show LoginView)
  function logout() {
    setUser(null);
    setActiveOrder(null);
  }

  // Logs in as Delivery Driver / Field Ops Route Rider
  function loginAsRider(riderName, vanPlate) {
    let nameToUse = 'Marco Valdes';
    if (riderName && riderName.trim().length > 0) {
      nameToUse = riderName.trim();
    }

    let vanToUse = 'Van #04 (Route Metro)';
    if (vanPlate && vanPlate.trim().length > 0) {
      vanToUse = vanPlate.trim();
    }

    setUser({
      name: nameToUse,
      initials: 'MV',
      phone: '918 555 7788',
      role: ROLES.RIDER,
      van: vanToUse,
      location: 'Metro Central Route',
    });
  }

  // Updates active order status and attaches laundry bag, locker, and delivery claim fields
  function updateOrderStatus(orderId, newStatus, extraData) {
    if (!activeOrder) {
      return;
    }
    const updated = Object.assign({}, activeOrder, { status: newStatus });
    if (extraData) {
      if (extraData.laundryBagNumber) {
        updated.laundryBagNumber = extraData.laundryBagNumber;
      }
      if (extraData.lockerNumber) {
        updated.lockerNumber = extraData.lockerNumber;
      }
      if (extraData.pickupBoxNumber) {
        updated.pickupBoxNumber = extraData.pickupBoxNumber;
      }
      if (extraData.claimPin) {
        updated.claimPin = extraData.claimPin;
      }
      if (extraData.weightKg) {
        updated.weightKg = extraData.weightKg;
      }
      if (extraData.isPaid !== undefined) {
        updated.isPaid = extraData.isPaid;
      }
    }
    setActiveOrder(updated);
  }

  // Creates an active order after the customer unlocks a locker
  function createOrder(orderData) {
    let size = 'Medium (Max 7kg)';
    if (orderData && orderData.loadSize) {
      size = orderData.loadSize;
    }

    let estimatedKg = 5.2;
    let estimatedPrice = 337.00;

    if (size.indexOf('Small') !== -1) {
      estimatedKg = 4.0;
      estimatedPrice = 260.00;
    } else if (size.indexOf('Large') !== -1) {
      estimatedKg = 8.5;
      estimatedPrice = 552.00;
    }

    let lockerNumber = '03';
    if (orderData && orderData.lockerNumber) {
      lockerNumber = orderData.lockerNumber;
    }

    let serviceType = 'Wash, Dry & Fold';
    if (orderData && orderData.serviceType) {
      serviceType = orderData.serviceType;
    }

    let specialInstructions = 'None';
    if (orderData && orderData.specialInstructions) {
      specialInstructions = orderData.specialInstructions;
    }

    let temperature = 'Cold Wash';
    if (orderData && orderData.temperature) {
      temperature = orderData.temperature;
    }

    let fabricSoftener = true;
    if (orderData && orderData.fabricSoftener !== undefined) {
      fabricSoftener = orderData.fabricSoftener;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);

    const newOrder = {
      id: 'ORD-' + randomId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'in_wash',
      lockerNumber: lockerNumber,
      serviceType: serviceType,
      loadSize: size,
      specialInstructions: specialInstructions,
      temperature: temperature,
      fabricSoftener: fabricSoftener,
      estimatedReady: 'Today, 6:30 PM',
      weightKg: estimatedKg,
      priceEstimate: estimatedPrice,
    };
    setActiveOrder(newOrder);
  }

  // The 'value' object holds all variables & functions we want to share with other components.
  const contextValue = {
    user: user,
    activeOrder: activeOrder,
    activeLocation: activeLocation,
    setActiveLocation: setActiveLocation,
    loginAsGuest: loginAsGuest,
    loginAsCustomer: loginAsCustomer,
    signupCustomer: signupCustomer,
    loginAsRider: loginAsRider,
    updateOrderStatus: updateOrderStatus,
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
