import { ENV } from '../config/env';

const BASE_URL = ENV.apiBaseUrl;

/**
 * Fetches all 16 live compartments and telemetry for a station.
 */
export async function fetchStationCompartments(stationId = ENV.stationId) {
  try {
    const res = await fetch(`${BASE_URL}/stations/${stationId}/compartments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.compartments || [];
  } catch (err) {
    console.warn('[API] Failed to fetch compartments:', err);
    return [];
  }
}

/**
 * Fetches orders list, optionally filtered by status ('dropped_off', 'in_transit', 'in_wash', 'ready_for_pickup', 'completed').
 */
export async function fetchOrders(statusFilter) {
  try {
    let url = `${BASE_URL}/orders`;
    if (statusFilter) {
      url = `${BASE_URL}/orders?status=${encodeURIComponent(statusFilter)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json && json.data) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.warn('[API] Failed to fetch orders:', err);
    return [];
  }
}

/**
 * Driver collects dirty laundry from locker.
 */
export async function collectOrder(orderId) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Facility operator weighs and calculates bill.
 */
export async function intakeOrder(orderId, weightKg, amount) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weightKg, amount }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Fetches station compartment availability counts by size.
 */
export async function fetchStationAvailability(stationId = ENV.stationId) {
  try {
    const res = await fetch(`${BASE_URL}/stations/${stationId}/availability`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.availability || [];
  } catch (err) {
    console.warn('[API] Failed to fetch availability:', err);
    return [];
  }
}

/**
 * Customer drops off laundry bags into a locker compartment.
 */
export async function createDropoffOrder(data) {
  const res = await fetch(`${BASE_URL}/orders/dropoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Driver delivers clean laundry into a vacant locker box.
 * Method: POST (or PATCH)
 * Route: /api/orders/:id/deliver
 * Example: /api/orders/ORD-23737/deliver
 * Headers: Content-Type: application/json
 */
export async function deliverCleanOrder(orderId, boxNumber, stationId = ENV.stationId) {
  const payload = {
    stationId: stationId,
    boxNumber: boxNumber,
    pickupBoxNumber: boxNumber,
    compartmentNumber: boxNumber,
  };

  const endpoint = `${BASE_URL}/orders/${encodeURIComponent(orderId)}/deliver`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 405) {
      // Fallback to PATCH if POST is not accepted by the endpoint
      const patchRes = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!patchRes.ok) {
        throw new Error(`HTTP ${patchRes.status}`);
      }
      return await patchRes.json();
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[API] deliverCleanOrder failed:', err);
    throw err;
  }
}

// ==============================================================================
// LAUNDRY LOCKER BINDING & PAIRING HANDSHAKE API
// ==============================================================================

/**
 * Operator sends a remote pairing request to an unprovisioned kiosk hardware terminal.
 * Route: POST /api/stations/pair-request
 * Body: { stationId, stationName, address, branchTag }
 */
export async function sendPairingRequest(params) {
  const res = await fetch(`${BASE_URL}/stations/pair-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stationId: params.stationId,
      stationName: params.stationName,
      address: params.address,
      branchTag: params.branchTag,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP ${res.status} Failed to send pairing request`);
  }
  return await res.json();
}

/**
 * Checks or polls the pairing status for a given station ID.
 * Route: GET /api/stations/:stationId/pairing-status
 */
export async function fetchPairingStatus(stationId) {
  const normId = encodeURIComponent(String(stationId).trim().toUpperCase());
  const res = await fetch(`${BASE_URL}/stations/${normId}/pairing-status`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP ${res.status} Failed to fetch pairing status`);
  }
  return await res.json();
}

/**
 * Confirms pairing handshake when kiosk technician taps Approve.
 * Route: POST /api/stations/pair-confirm
 * Body: { stationId, pairingCode }
 */
export async function confirmPairing(stationId, pairingCode) {
  const res = await fetch(`${BASE_URL}/stations/pair-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stationId: stationId,
      pairingCode: pairingCode,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP ${res.status} Failed to confirm pairing`);
  }
  return await res.json();
}

/**
 * Fetches all registered fleet locker stations for Operator views.
 * Route: GET /api/stations
 */
export async function fetchLockerStations() {
  try {
    const res = await fetch(`${BASE_URL}/stations`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} Failed to fetch locker stations`);
    }
    const json = await res.json();
    if (json.stations) {
      return json.stations;
    }
    return [];
  } catch (err) {
    console.warn('[API] fetchLockerStations error:', err);
    return [];
  }
}

// ==============================================================================
// OPERATOR AUTHENTICATION SERVICES (Endpoints 1, 2, 3)
// ==============================================================================

/**
 * 2. Login Endpoint (Operator Authentication)
 * Route: POST /api/auth/login
 * Body: { email, password }
 * Response: { success: true, message: "Login successful", operator, token }
 */
export async function loginOperator(email, password) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch (parseErr) {
    data = {};
  }

  if (!res.ok) {
    let errorMsg = 'Invalid email or password';
    if (data && data.message) {
      errorMsg = data.message;
    } else {
      errorMsg = 'HTTP ' + res.status + ' Login failed';
    }
    throw new Error(errorMsg);
  }

  if (data && data.token) {
    localStorage.setItem('sll_operator_token', data.token);
    if (data.operator) {
      localStorage.setItem('sll_operator_profile', JSON.stringify(data.operator));
    }
  }
  return data;
}

/**
 * 1. Sign Up Endpoint (Operator Registration)
 * Route: POST /api/auth/register
 * Body: { name, email, phone, password }
 * Response: { success: true, message: "Operator registered successfully", operator, token }
 */
export async function registerOperator(params) {
  const name = params.name;
  const email = params.email;
  const phone = params.phone;
  const password = params.password;

  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        phone: phone,
        password: password,
      }),
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch (parseErr) {
    data = {};
  }

  if (!res.ok) {
    let errorMsg = 'Registration failed';
    if (data && data.message) {
      errorMsg = data.message;
    } else {
      errorMsg = 'HTTP ' + res.status + ' Registration failed';
    }
    throw new Error(errorMsg);
  }

  if (data && data.token) {
    localStorage.setItem('sll_operator_token', data.token);
    if (data.operator) {
      localStorage.setItem('sll_operator_profile', JSON.stringify(data.operator));
    }
  }
  return data;
}

/**
 * 3. Check Session / Current User Profile
 * Route: GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Response: { success: true, operator: { ... } }
 */
export async function fetchCurrentOperatorProfile(tokenOverride) {
  let token = tokenOverride;
  if (!token) {
    token = localStorage.getItem('sll_operator_token');
  }
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (data && data.operator) {
      return data.operator;
    }
    return null;
  } catch (err) {
    console.warn('[API] Failed to fetch operator session:', err);
    return null;
  }
}

/**
 * Fetches all registered operators for central management views.
 * Route: GET /api/auth/operators
 */
export async function fetchAllOperators() {
  try {
    const res = await fetch(`${BASE_URL}/auth/operators`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (data && data.operators) {
      return data.operators;
    }
    return [];
  } catch (err) {
    console.warn('[API] Failed to fetch operators list:', err);
    return [];
  }
}

// Named Aliases
export const loginOperatorApi = loginOperator;
export const registerOperatorApi = registerOperator;
export const fetchCurrentOperatorApi = fetchCurrentOperatorProfile;

