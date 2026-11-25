import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Link2,
  Radio,
  Cpu,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  sendPairingRequest,
  fetchPairingStatus,
  fetchStationCompartments,
  fetchLockerStations
} from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import './LaundryLockerBindingTab.css';

// ==============================================================================
// REACT COMPONENT: LaundryLockerBindingTab
// Enterprise SaaS Kiosk Hardware Provisioning & Station Binding Workbench:
// - Remote pairing request from Central Office to unprovisioned kiosk hardware
// - Live hardware telemetry inspection
// - Branch assignment & PostgreSQL fleet registration
// - Strictly zero emojis across all UI states and feedback messages
// ==============================================================================
export function LaundryLockerBindingTab({ onNavigateToMonitoring }) {
  const auth = useAuth();
  const user = auth?.user;
  const operatorId = user?.id || user?.operatorId || null;
  const operatorName = user?.name || 'Operator';

  // Machine ID input (e.g. SLL-12901 or SLL-61209)
  const [stationIdInput, setStationIdInput] = useState('');
  const [stationName, setStationName] = useState('');
  const [address, setAddress] = useState('');
  const [branchTag, setBranchTag] = useState('Pasay Metro');

  // Telemetry inspection state
  const [inspectedStation, setInspectedStation] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState(null);

  // Pairing transmission state: 'IDLE' | 'PENDING' | 'SUCCESS' | 'EXPIRED'
  const [pairingState, setPairingState] = useState('IDLE');
  const [pairingCode, setPairingCode] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [pairingError, setPairingError] = useState(null);

  // Registered Fleet List state
  const [fleetStations, setFleetStations] = useState([]);
  const [fleetSearch, setFleetSearch] = useState('');
  const [isLoadingFleet, setIsLoadingFleet] = useState(true);

  const pollIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // 1. Load registered fleet stations on mount
  const loadFleet = useCallback(async () => {
    setIsLoadingFleet(true);
    try {
      const stations = await fetchLockerStations(operatorId);
      if (Array.isArray(stations)) {
        setFleetStations(stations);
      }
    } catch (err) {
      console.warn('[Binding] Error loading fleet stations:', err);
    } finally {
      setIsLoadingFleet(false);
    }
  }, [operatorId]);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  // Clean up polling intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Helper: Validates Machine / Hardware Locker ID format
  function validateMachineId(id) {
    if (!id || !id.trim()) {
      return 'Please enter a Machine ID (e.g. SLL-12901 or CMH-01).';
    }
    const clean = id.trim();
    if (clean.includes('@') || clean.includes(' ') || clean.includes('.')) {
      return 'Invalid Machine ID format. Must be an alphanumeric hardware code (e.g. SLL-12901 or CMH-01), not an email address or sentence.';
    }
    const regex = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;
    if (!regex.test(clean) || clean.length < 3 || clean.length > 25) {
      return 'Invalid Machine ID format. Must contain 3-25 alphanumeric characters and hyphens only (e.g. SLL-12901, CMH-01).';
    }
    return null;
  }

  // 2. Query/Inspect Station Telemetry
  async function handleInspectStation() {
    const cleanId = stationIdInput.trim().toUpperCase();
    const formatError = validateMachineId(cleanId);
    if (formatError) {
      setInspectError(formatError);
      setInspectedStation(null);
      return;
    }

    setIsInspecting(true);
    setInspectError(null);
    setPairingState('IDLE');

    try {
      const [statusRes, comps] = await Promise.all([
        fetchPairingStatus(cleanId),
        fetchStationCompartments(cleanId),
      ]);
      
      // Strict Verification: If terminal does not exist in the database, reject
      if (statusRes.exists === false || statusRes.bindingStatus === 'UNREGISTERED') {
        setInspectedStation(null);
        setInspectError(`Machine ID "${cleanId}" was not found in the fleet. Please ensure the physical kiosk is powered on and configured with this ID.`);
        return;
      }

      // Real physical door count from database compartments table
      const realDoors = (Array.isArray(comps) && comps.length > 0)
        ? comps.length
        : (Number(statusRes.total_compartments) || Number(statusRes.totalDoors) || 16);

      setInspectedStation({
        stationId: cleanId,
        bindingStatus: statusRes.bindingStatus || statusRes.binding_status || 'UNBOUND',
        stationName: statusRes.stationName || statusRes.name || `Station ${cleanId}`,
        address: statusRes.address || 'Pending Provisioning',
        totalDoors: realDoors,
        motherboardPort: '/dev/ttyS3 (9600 Baud)',
        firmware: 'SmartLocker Android Kiosk v1.0',
      });

      if (statusRes.stationName || statusRes.name) {
        setStationName(statusRes.stationName || statusRes.name);
      } else {
        setStationName(`Locker Depot ${cleanId}`);
      }

      if (statusRes.address) {
        setAddress(statusRes.address);
      }
    } catch (err) {
      setInspectedStation(null);
      setInspectError(err.message || `Failed to verify hardware terminal "${cleanId}".`);
    } finally {
      setIsInspecting(false);
    }
  }

  // 3. Initiate Remote Pairing Handshake
  async function handleInitiateBinding() {
    let cleanId = stationIdInput.trim().toUpperCase();
    if (inspectedStation && inspectedStation.stationId) {
      cleanId = inspectedStation.stationId.trim().toUpperCase();
    }
    const formatError = validateMachineId(cleanId);
    if (formatError) {
      setPairingError(formatError);
      return;
    }

    let nameToUse = 'Station ' + cleanId;
    if (inspectedStation && inspectedStation.stationName) {
      nameToUse = inspectedStation.stationName;
    } else if (stationName && stationName.trim()) {
      nameToUse = stationName.trim();
    }

    let addressToUse = 'Level 1 Main Entrance';
    if (inspectedStation && inspectedStation.address) {
      addressToUse = inspectedStation.address;
    } else if (address && address.trim()) {
      addressToUse = address.trim();
    }

    setIsSendingRequest(true);
    setPairingError(null);

    try {
      const res = await sendPairingRequest({
        stationId: cleanId,
        stationName: nameToUse,
        address: addressToUse,
        branchTag: branchTag,
        totalDoors: (inspectedStation && inspectedStation.totalDoors) || 4,
        operatorId: operatorId || 1,
        operatorName: operatorName || 'Carlos Test',
      });

      const assignedCode = res.data?.pairing_code || '849201';
      setPairingCode(assignedCode);
      setPairingState('PENDING');
      setCountdown(60);

      // Start 60-second countdown
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPairingState('EXPIRED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling pairing status every 2.5 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetchPairingStatus(cleanId);
          if (pollRes.bindingStatus === 'BOUND_ACTIVE') {
            clearInterval(pollIntervalRef.current);
            clearInterval(countdownIntervalRef.current);
            setPairingState('SUCCESS');
            loadFleet();
          }
        } catch (pollErr) {
          console.warn('[Binding] Polling error:', pollErr);
        }
      }, 2500);

    } catch (err) {
      setPairingError(err.message || 'Failed to transmit pairing request.');
      setPairingState('IDLE');
    } finally {
      setIsSendingRequest(false);
    }
  }

  // Filtered fleet list
  const filteredFleet = fleetStations.filter((s) => {
    if (!fleetSearch.trim()) return true;
    const q = fleetSearch.toLowerCase();
    return (
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="binding-container">
      
      {/* HEADER */}
      <div className="binding-header">
        <div>
          <h2 className="binding-header-title">Laundry Locker Binding</h2>
          <p className="binding-header-sub">
            Remote IoT Station Provisioning, Hardware Authorization, and Fleet Management
          </p>
        </div>

        <button
          type="button"
          onClick={loadFleet}
          className="binding-btn-secondary"
          disabled={isLoadingFleet}
        >
          <RefreshCw size={14} className={isLoadingFleet ? 'animate-spin' : ''} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="binding-grid">
        
        {/* ============================================================= */}
        {/* COLUMN 1: PAIR & BIND MACHINE WORKBENCH                       */}
        {/* ============================================================= */}
        <div className="binding-card">
          <h3 className="binding-card-title">
            <Radio size={16} color="#ea580c" />
            <span>Hardware Terminal Pairing Workbench</span>
          </h3>

          {/* Machine ID Lookup */}
          <div className="binding-form-group">
            <label className="binding-label">Machine / Hardware Locker ID</label>
            <div className="binding-input-row">
              <input
                type="text"
                value={stationIdInput}
                onChange={(e) => setStationIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. SLL-12901 or SLL-61209"
                className="binding-input"
              />
              <button
                type="button"
                onClick={handleInspectStation}
                className="binding-btn-secondary"
                disabled={isInspecting}
              >
                {isInspecting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Querying...</span>
                  </>
                ) : (
                  <span>Query Machine</span>
                )}
              </button>
            </div>
            {inspectError && (
              <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                {inspectError}
              </span>
            )}
          </div>

          {/* Live Hardware Telemetry Preview Card */}
          {inspectedStation && (
            <div className="binding-preview-card">
              <div className="binding-preview-header">
                <span className="binding-preview-title">Detected Terminal Specification</span>
                <span
                  className={
                    inspectedStation.bindingStatus === 'BOUND_ACTIVE'
                      ? 'binding-badge binding-badge-emerald'
                      : 'binding-badge binding-badge-amber'
                  }
                >
                  {inspectedStation.bindingStatus === 'BOUND_ACTIVE'
                    ? 'BOUND ACTIVE'
                    : 'UNPROVISIONED / SETUP REQUIRED'}
                </span>
              </div>

              <div className="binding-telemetry-grid">
                <div className="binding-telemetry-item">
                  <span className="binding-telemetry-label">Terminal ID</span>
                  <span className="binding-telemetry-val">{inspectedStation.stationId}</span>
                </div>
                <div className="binding-telemetry-item">
                  <span className="binding-telemetry-label">Capacity Connected</span>
                  <span className="binding-telemetry-val">{inspectedStation.totalDoors} Doors</span>
                </div>
                <div className="binding-telemetry-item">
                  <span className="binding-telemetry-label">Motherboard Serial</span>
                  <span className="binding-telemetry-val">{inspectedStation.motherboardPort}</span>
                </div>
                <div className="binding-telemetry-item">
                  <span className="binding-telemetry-label">Kiosk Software</span>
                  <span className="binding-telemetry-val">{inspectedStation.firmware}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Action Button & Pairing Banner */}
          {pairingState === 'PENDING' ? (
            <div className="binding-pending-banner">
              <div className="binding-pending-top">
                <Loader2 size={16} className="animate-spin" color="#b45309" />
                <span className="binding-pending-title">
                  Pairing Request Transmitted (Code: {pairingCode})
                </span>
              </div>
              <p className="binding-pending-text">
                Waiting for technician on-site physical confirmation on kiosk touchscreen...
                (Time remaining: {countdown}s)
              </p>
            </div>
          ) : pairingState === 'SUCCESS' ? (
            <div className="binding-success-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#15803d" />
                <span className="binding-success-title">
                  Terminal Successfully Bound and Activated
                </span>
              </div>
              <p className="binding-success-text">
                Station {inspectedStation?.stationId} has accepted pairing. Configuration saved to cloud database and kiosk storage.
              </p>
              {onNavigateToMonitoring && (
                <button
                  type="button"
                  onClick={() => onNavigateToMonitoring(inspectedStation?.stationId)}
                  className="binding-btn-secondary"
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  <span>Go to Locker Monitoring →</span>
                </button>
              )}
            </div>
          ) : pairingState === 'EXPIRED' ? (
            <div className="binding-pending-banner" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
              <div className="binding-pending-top">
                <AlertTriangle size={16} color="#dc2626" />
                <span className="binding-pending-title" style={{ color: '#991b1b' }}>
                  Pairing Request Timed Out (60s)
                </span>
              </div>
              <p className="binding-pending-text" style={{ color: '#b91c1c' }}>
                The physical kiosk did not confirm in time. Please ensure the machine in on-site is online and retry.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInitiateBinding}
              className="binding-btn-primary"
              disabled={isSendingRequest || !stationIdInput.trim()}
            >
              {isSendingRequest ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transmitting Pairing Signal...</span>
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  <span>Send Pairing Request to Hardware Terminal</span>
                </>
              )}
            </button>
          )}

          {pairingError && (
            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
              {pairingError}
            </span>
          )}
        </div>

        {/* ============================================================= */}
        {/* COLUMN 2: REGISTERED LOCKER FLEET DIRECTORY                   */}
        {/* ============================================================= */}
        <div className="binding-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="binding-card-title">
              <Building2 size={16} color="#0f172a" />
              <span>Registered Locker Fleet</span>
            </h3>
            <span className="binding-badge binding-badge-sky">
              {fleetStations.length} Terminals
            </span>
          </div>

          {/* Search box */}
          <div className="fleet-search-box">
            <Search size={14} className="fleet-search-icon" />
            <input
              type="text"
              value={fleetSearch}
              onChange={(e) => setFleetSearch(e.target.value)}
              placeholder="Search by code, branch, or city..."
              className="fleet-search-input"
            />
          </div>

          {/* Stations list */}
          <div className="fleet-list">
            {isLoadingFleet ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                Loading fleet terminals...
              </div>
            ) : filteredFleet.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No registered locker terminals found.
              </div>
            ) : (
              filteredFleet.map((st) => (
                <div key={st.id} className="fleet-station-card">
                  <div className="fleet-station-top">
                    <span className="fleet-station-code">{st.id}</span>
                    <span
                      className={
                        st.binding_status === 'BOUND_ACTIVE'
                          ? 'binding-badge binding-badge-emerald'
                          : 'binding-badge binding-badge-amber'
                      }
                    >
                      {st.binding_status === 'BOUND_ACTIVE' ? 'BOUND ACTIVE' : 'UNBOUND'}
                    </span>
                  </div>

                  <span className="fleet-station-name">{st.name || 'Unnamed Depot'}</span>

                  <div className="fleet-station-meta">
                    <span>{st.total_compartments || 16} Compartments</span>
                    {onNavigateToMonitoring && (
                      <button
                        type="button"
                        onClick={() => onNavigateToMonitoring(st.id)}
                        className="fleet-link-btn"
                      >
                        <span>View Doors</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
