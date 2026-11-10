import React, { useState } from 'react';
import { X, Lock, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import './ServicePreferenceModal.css';

// ==============================================================================
// REACT COMPONENT: ServicePreferenceModal
// This modal opens after a customer scans a locker QR code.
// It collects their laundry preferences and simulates unlocking the locker door.
// ==============================================================================
export function ServicePreferenceModal(props) {
  // In Vanilla JS: function arguments (params).
  // In React: 'props' is an object containing all inputs passed by the parent.
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const stationData = props.stationData;
  const onCompleteOrder = props.onCompleteOrder;

  // In Vanilla JS: if (!isOpen) return; (Don't render anything if modal is closed)
  if (!isOpen) {
    return null;
  }

  // ============================================================================
  // ZERO GUESSWORK EXTRACTION (Rule 3 in GEMINI.md)
  // Instead of chaining guesswork fallbacks like 'stationData?.assignedBox || 03',
  // we explicitly verify and extract the exact fields upfront.
  // ============================================================================
  const stationId = stationData ? stationData.stationId : 'CMH-01';
  const assignedBox = stationData ? stationData.assignedBox : '03';

  // ============================================================================
  // REACT STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let selectedService = 'Wash, Dry & Fold';
  //   let specialInstructions = '';
  // In React:
  //   Controlled inputs bind input.value to state, and update state via onchange.
  // ============================================================================
  const [selectedService, setSelectedService] = useState('Wash, Dry & Fold');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [temperature, setTemperature] = useState('Cold Wash');
  const [fabricSoftener, setFabricSoftener] = useState(true);
  
  // UI states for the locker door unlocking simulation
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);

  // ============================================================================
  // EVENT HANDLER: handleSaveAndUnlockClick
  // In Vanilla JS: button.addEventListener('click', () => { ... })
  // ============================================================================
  function handleSaveAndUnlockClick() {
    setIsUnlocking(true); // Shows the spinner button ("Actuating Solenoid Relay...")

    // Simulate physical solenoid relay trigger (1.2 seconds)
    setTimeout(function () {
      setIsUnlocking(false);
      setUnlockedSuccess(true); // Shows the green success view ("Locker Box #03 Unlocked!")

      // After 1.5 seconds, notify the parent component that the order is complete
      setTimeout(function () {
        onCompleteOrder({
          lockerNumber: assignedBox,
          serviceType: selectedService,
          specialInstructions: specialInstructions ? specialInstructions : 'Standard care',
          temperature: temperature,
          fabricSoftener: fabricSoftener,
        });
      }, 1500);
    }, 1200);
  }

  return (
    <div className="pref-modal-backdrop">
      <div className="pref-modal-card">
        
        {/* ------------------------------------------------------------- */}
        {/* MODAL HEADER                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="pref-modal-header">
          <div>
            <div className="connected-pill">
              <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--emerald-500)' }}></span>
              Connected: {stationId}
            </div>
            <h3 className="modal-main-title">
              Select Laundry Service & Drop Off
            </h3>
            <p className="modal-assigned-box-sub">
              Assigned Locker: <strong style={{ color: 'var(--slate-800)' }}>Box #{assignedBox}</strong> (Medium Compartment)
            </p>
          </div>

          <button 
            onClick={onClose}
            disabled={isUnlocking || unlockedSuccess}
            className="icon-button"
            title="Close"
          >
            <X size={20} color="var(--slate-400)" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONDITIONAL CONTENT: Success State vs Selection Form          */}
        {/* In Vanilla JS: if (unlockedSuccess) { renderSuccess() } else { ... } */}
        {/* ------------------------------------------------------------- */}
        {unlockedSuccess ? (
          <div className="unlock-success-panel">
            <div className="success-icon-box">
              <Lock size={32} />
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--slate-900)' }}>
              Locker Box #{assignedBox} Unlocked!
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', maxWidth: '280px', margin: '0 auto' }}>
              Please insert your laundry bag inside and shut the door firmly. Door will automatically secure upon closure.
            </p>
            <div style={{ paddingTop: '0.5rem' }}>
              <span className="brand-pill">
                Redirecting to Active Order Tracker...
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* 1. SELECT LAUNDRY SERVICE (Dropdown) */}
            <div className="form-field-group">
              <label className="field-label-text">
                Select Laundry Service
              </label>

              <div className="select-wrapper">
                {/* Controlled select in React: value is linked to state, onChange updates state */}
                <select
                  value={selectedService}
                  onChange={function (event) { setSelectedService(event.target.value); }}
                  className="service-custom-dropdown"
                >
                  <option value="Wash Only">Wash Only (₱40/kg base)</option>
                  <option value="Wash & Dry">Wash & Dry (₱55/kg base)</option>
                  <option value="Wash, Dry & Fold">Wash, Dry & Fold (₱65/kg base - Recommended)</option>
                </select>
                <div className="select-caret-icon">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>

              <div className="selected-service-info-pill">
                <span style={{ fontWeight: 600 }}>Selected: {selectedService}</span>
                <span style={{ fontSize: '10px', backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Weighed at shop
                </span>
              </div>
            </div>

            {/* Quick Preferences: Temp & Softener */}
            <div className="toggles-2col-grid">
              <div>
                <label className="field-label-text" style={{ fontSize: '11px', marginBottom: '4px' }}>Water Temp</label>
                <div className="temp-toggle-box">
                  <button
                    type="button"
                    onClick={function () { setTemperature('Cold Wash'); }}
                    className={`temp-btn ${temperature === 'Cold Wash' ? 'temp-active' : ''}`}
                  >
                    Cold
                  </button>
                  <button
                    type="button"
                    onClick={function () { setTemperature('Warm Wash'); }}
                    className={`temp-btn ${temperature === 'Warm Wash' ? 'temp-active' : ''}`}
                  >
                    Warm
                  </button>
                </div>
              </div>

              <div>
                <label className="field-label-text" style={{ fontSize: '11px', marginBottom: '4px' }}>Fabric Softener</label>
                <button
                  type="button"
                  onClick={function () { setFabricSoftener(!fabricSoftener); }}
                  className={`softener-btn ${fabricSoftener ? 'softener-active' : ''}`}
                >
                  <Sparkles size={14} />
                  <span>{fabricSoftener ? 'Included (Yes)' : 'No Softener'}</span>
                </button>
              </div>
            </div>

            {/* 2. SPECIAL INSTRUCTIONS INPUT FIELD */}
            <div className="form-field-group">
              <label className="field-label-text">
                Special Instructions
              </label>
              {/* Controlled textarea: in Vanilla JS, textarea.addEventListener('input', (e) => value = e.target.value) */}
              <textarea
                rows={3}
                value={specialInstructions}
                onChange={function (event) { setSpecialInstructions(event.target.value); }}
                placeholder="Special instructions (e.g. delicate fabrics, separate whites, baby hypoallergenic detergent)..."
                className="special-notes-textarea"
              />
            </div>

            {/* Pricing Disclaimer */}
            <div className="weigh-disclaimer-notice">
              <AlertCircle size={16} color="var(--brand-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>No payment due right now. Final invoice will be calculated and sent after verified scale weighing at the central shop.</span>
            </div>

            {/* 3. BUTTON SAVE PREFERENCE AND UNLOCK LOCKER */}
            <button
              onClick={handleSaveAndUnlockClick}
              disabled={isUnlocking}
              className="save-unlock-primary-btn"
            >
              {isUnlocking ? (
                <span>Actuating Solenoid Relay...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Save Preference & Unlock Locker</span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
