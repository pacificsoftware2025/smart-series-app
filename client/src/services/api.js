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
    const url = statusFilter 
      ? `${BASE_URL}/orders?status=${encodeURIComponent(statusFilter)}` 
      : `${BASE_URL}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
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
