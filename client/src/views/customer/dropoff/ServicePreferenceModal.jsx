import React, { useState } from 'react';
import { 
  X, 
  Unlock, 
  CheckCircle2, 
  Scale, 
  Check, 
  Box,
  ArrowRight
} from 'lucide-react';
import { LAUNDRY_SERVICES } from '../../../constants/roles';
import './ServicePreferenceModal.css';

// ==============================================================================
// REACT COMPONENT: ServicePreferenceModal
// Configures laundry preferences (service tier, temperature, fabric softener,
// care instructions) and simulates locker door solenoid actuation.
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

  // Zero-guesswork data extraction using explicit if statements
  let stationId = 'CMH-01';
  if (stationData && stationData.stationId) {
    stationId = stationData.stationId;
  }

  let assignedBox = '03';
  if (stationData && stationData.assignedBox) {
    assignedBox = stationData.assignedBox;
  }

  // ============================================================================
  // LOCAL STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let selectedService = 'Wash, Dry & Fold';
  //   let temperature = 'Cold Wash';
  //   let fabricSoftener = true;
  // In React:
  //   State drives the UI. Updating state causes React to re-render the view.
  // ============================================================================
  const [selectedService, setSelectedService] = useState('Wash, Dry & Fold');
  const [loadSize, setLoadSize] = useState('Medium (Max 7kg)');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [temperature, setTemperature] = useState('Cold Wash'); // 'Cold Wash' | 'Warm Wash'
  const [fabricSoftener, setFabricSoftener] = useState(true); // true = Yes, false = No
  
  // Solenoid door actuation simulation states
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);

  // Laundry load sizes (Small max 5kg, Medium max 7kg, Large max 9kg)
  const LOAD_SIZES = [
    { id: 'Small (Max 5kg)', label: 'Small', maxKg: 'Max 5kg' },
    { id: 'Medium (Max 7kg)', label: 'Medium', maxKg: 'Max 7kg' },
    { id: 'Large (Max 9kg)', label: 'Large', maxKg: 'Max 9kg' },
  ];

  // Helper functions: replaces ternary classNames with readable if/else blocks
  function getServiceTileClass(serviceLabel) {
    if (selectedService === serviceLabel) {
      return 'service-tile selected';
    }
    return 'service-tile';
  }

  function getRadioCircleClass(serviceLabel) {
    if (selectedService === serviceLabel) {
      return 'radio-circle active';
    }
    return 'radio-circle';
  }

  function getSizeCardClass(sizeId) {
    if (loadSize === sizeId) {
      return 'size-card-btn active';
    }
    return 'size-card-btn';
  }

  function getTempBtnClass(type) {
    if (type === 'cold') {
      if (temperature === 'Cold Wash') {
        return 'temp-btn cold active';
      }
      return 'temp-btn cold';
    }
    if (temperature === 'Warm Wash') {
      return 'temp-btn warm active';
    }
    return 'temp-btn warm';
  }

  function getSoftenerBtnClass(isYes) {
    if (isYes) {
      if (fabricSoftener === true) {
        return 'softener-btn yes active';
      }
      return 'softener-btn yes';
    }
    if (fabricSoftener === false) {
      return 'softener-btn no active';
    }
    return 'softener-btn no';
  }

  // ============================================================================
  // EVENT HANDLER: handleSaveAndUnlockClick
  // In Vanilla JS: button.addEventListener('click', () => { ... })
  // Simulates solenoid relay trigger and displays the open door confirmation.
  // ============================================================================
  function handleSaveAndUnlockClick() {
    setIsUnlocking(true); // Shows spinner state

    // Simulates physical solenoid relay trigger (1.2 seconds)
    setTimeout(function () {
      setIsUnlocking(false);
      setUnlockedSuccess(true); // Shows unlocked success panel and waits for user confirmation
    }, 1200);
  }

  // ============================================================================
  // EVENT HANDLER: handleConfirmClosedAndRedirect
  // Explicitly triggered when user clicks "I've Closed the Locker Door"
  // ============================================================================
  function handleConfirmClosedAndRedirect() {
    let instructions = 'Standard care';
    if (specialInstructions && specialInstructions.trim().length > 0) {
      instructions = specialInstructions.trim();
    }

    onCompleteOrder({
      lockerNumber: assignedBox,
      serviceType: selectedService,
      loadSize: loadSize,
      specialInstructions: instructions,
      temperature: temperature,
      fabricSoftener: fabricSoftener,
    });
  }

  return (
    <div className="pref-modal-backdrop">
      <div className="pref-modal-card">
        
        {/* ------------------------------------------------------------- */}
        {/* MODAL HEADER                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="pref-modal-header">
          <div className="header-meta-col">
            <div className="header-badges-row">
              <span className="station-code-pill">
                <span className="live-pulse-dot"></span> {stationId}
              </span>
              <span className="locker-assigned-pill">
                <Box size={12} /> Box #{assignedBox} (Medium)
              </span>
            </div>
            
            <h3 className="modal-main-title">Select Service & Drop Off</h3>
            <p className="modal-sub-info">
              Configure wash preferences before door unlocks.
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            disabled={isUnlocking || unlockedSuccess}
            className="pref-close-btn"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONTENT BODY: Success State vs Configuration Form             */}
        {/* ------------------------------------------------------------- */}
        {unlockedSuccess && (
          <div className="unlock-success-panel">
            <div className="success-icon-box">
              <Unlock size={32} />
            </div>
            
            <h4 className="success-headline">Locker Box #{assignedBox} Is Open!</h4>
            
            <p className="success-instruction">
              Please insert your laundry bag inside and shut the locker door firmly until it latches.
            </p>

            <button
              type="button"
              onClick={handleConfirmClosedAndRedirect}
              className="confirm-closed-btn"
            >
              <span>I've Closed the Locker Door · View Order Tracker</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {!unlockedSuccess && (
          <div className="pref-form-body">
            
            {/* 1. INTERACTIVE SERVICE TILES */}
            <div className="pref-section-block">
              <div className="section-label-row">
                <label className="pref-label">Laundry Service Tier</label>
                <span className="weighed-shop-tag">Weighed at Laundry Shop</span>
              </div>

              <div className="service-cards-stack">
                {LAUNDRY_SERVICES.map(function (service) {
                  return (
                    <div
                      key={service.id}
                      onClick={function () { setSelectedService(service.label); }}
                      className={getServiceTileClass(service.label)}
                    >
                      <div className="service-tile-left">
                        <div className={getRadioCircleClass(service.label)}>
                          {selectedService === service.label && (
                            <Check size={12} color="#ffffff" strokeWidth={3} />
                          )}
                        </div>
                        <div className="service-tile-info">
                          <span className="service-tile-name">{service.label}</span>
                          <span className="service-tile-desc">{service.description}</span>
                        </div>
                      </div>

                      <div className="service-tile-price">
                        <span className="price-amount">{service.basePrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SELECT LAUNDRY SERVICE SIZE (Small / Medium / Large) */}
            <div className="pref-section-block">
              <label className="pref-label">Select Laundry Service Size</label>
              <div className="size-cards-grid">
                {LOAD_SIZES.map(function (size) {
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={function () { setLoadSize(size.id); }}
                      className={getSizeCardClass(size.id)}
                    >
                      <span className="size-card-label">{size.label}</span>
                      <span className="size-card-kg">{size.maxKg}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. WASH OPTIONS (Temp & Softener with Custom Colors) */}
            <div className="wash-options-2col">
              
              {/* Water Temperature Segmented Control: Cold = Blue, Warm = Warmer Color */}
              <div className="option-col">
                <label className="pref-label">Water Temperature</label>
                <div className="option-segmented-group">
                  <button
                    type="button"
                    onClick={function () { setTemperature('Cold Wash'); }}
                    className={getTempBtnClass('cold')}
                  >
                    Cold
                  </button>
                  <button
                    type="button"
                    onClick={function () { setTemperature('Warm Wash'); }}
                    className={getTempBtnClass('warm')}
                  >
                    Warm
                  </button>
                </div>
              </div>

              {/* Fabric Softener Segmented Control: Yes = Green, No = Red */}
              <div className="option-col">
                <label className="pref-label">Fabric Softener</label>
                <div className="option-segmented-group">
                  <button
                    type="button"
                    onClick={function () { setFabricSoftener(true); }}
                    className={getSoftenerBtnClass(true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={function () { setFabricSoftener(false); }}
                    className={getSoftenerBtnClass(false)}
                  >
                    No
                  </button>
                </div>
              </div>

            </div>

            {/* 3. SPECIAL INSTRUCTIONS TEXTAREA (Suggestions removed) */}
            <div className="pref-section-block">
              <label className="pref-label">Special Instructions</label>
              
              <textarea
                rows={3}
                value={specialInstructions}
                onChange={function (event) { setSpecialInstructions(event.target.value); }}
                placeholder="Special instructions (e.g. delicate fabrics, separate whites, baby hypoallergenic detergent)..."
                className="pref-textarea"
              />
            </div>

            {/* 4. REASSURING PRICING & WEIGHING NOTICE */}
            <div className="pricing-reassurance-card">
              <div className="reassurance-icon">
                <Scale size={18} />
              </div>
              <div className="reassurance-text">
                <span className="reassurance-title">No payment due right now</span>
                <span className="reassurance-sub">
                  Final invoice will be calculated and sent after verified scale weighing at the laundry shop.
                </span>
              </div>
            </div>

            {/* 5. PRIMARY BUTTON: SAVE & UNLOCK SOLENOID */}
            <button
              type="button"
              onClick={handleSaveAndUnlockClick}
              disabled={isUnlocking}
              className="unlock-solenoid-btn"
            >
              {isUnlocking && (
                <div className="btn-unlocking-state">
                  <div className="button-spinner"></div>
                  <span>Actuating Solenoid Relay Box #{assignedBox}...</span>
                </div>
              )}
              {!isUnlocking && (
                <div className="btn-idle-state">
                  <Unlock size={17} />
                  <span>Save Preference & Unlock Locker</span>
                </div>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
