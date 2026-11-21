import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  Barcode, 
  Unlock, 
  Lock, 
  CheckCircle2, 
  Flashlight, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Package,
  MapPin,
  Clock,
  Keyboard
} from 'lucide-react';
import { SwipeConfirmButton } from '../common/SwipeConfirmButton';
import './PickupWorkflowModal.css';

// ==============================================================================
// REACT COMPONENT: PickupWorkflowModal
// Field-operations multi-step pickup workflow:
//   Step 1: Scan Locker Compartment QR (actuates solenoid relay to pop open Box)
//   Step 2: Scan Laundry Bag Barcode Tag (attaches tracked tag to dirty clothes)
//   Step 3: "Swipe confirm pickup" (moves order to van transit)
// ==============================================================================
export function PickupWorkflowModal(props) {
  // Vanilla JS Analogy: Props are function arguments (function Modal(props)).
  // We extract them explicitly into local constants rather than dense destructuring.
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const order = props.order;
  const onConfirmPickup = props.onConfirmPickup;

  // Vanilla JS Analogy: useState is like declaring 'let currentStep = 1'.
  // Calling setCurrentStep(2) updates the value and instructs React to re-render the UI.
  const [currentStep, setCurrentStep] = useState(1);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [compartmentUnlocked, setCompartmentUnlocked] = useState(false);
  const [scannedBagTag, setScannedBagTag] = useState('');
  const [isActuatingRelay, setIsActuatingRelay] = useState(false);
  const [inputMethod, setInputMethod] = useState('scan'); // 'scan' | 'manual'
  const [manualTagInput, setManualTagInput] = useState('');

  // Vanilla JS Analogy: useEffect is like an event watcher (e.g. window.addEventListener).
  // With [isOpen, order] in the dependency array, it re-runs whenever the modal opens or order changes.
  useEffect(function () {
    if (isOpen) {
      setCurrentStep(1);
      setCompartmentUnlocked(false);
      setIsActuatingRelay(false);
      setFlashlightOn(false);
      setInputMethod('scan');

      let tagNumber = '8821';
      if (order && order.id) {
        const digits = order.id.replace(/\D/g, '');
        if (digits.length >= 4) {
          tagNumber = digits.substring(0, 4);
        }
      }
      const initialTag = 'BAG-' + tagNumber;
      setScannedBagTag(initialTag);
      setManualTagInput(initialTag);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) {
    return null;
  }

  // Locker & Order safe attributes
  let targetBox = '03';
  if (order.dropoff_box_number) {
    targetBox = String(order.dropoff_box_number).padStart(2, '0');
  } else if (order.compartment_number) {
    targetBox = String(order.compartment_number).padStart(2, '0');
  } else if (order.lockerNumber) {
    targetBox = String(order.lockerNumber).padStart(2, '0');
  }

  let stationName = order.stationName || `Central Mall Hub (${order.station_id || 'CMH-01'})`;
  let customerName = order.customerName || order.customer_name || 'Customer';
  let serviceType = order.serviceType || order.service_tier || 'Wash, Dry & Fold';

  // ============================================================================
  // STEP 1 HANDLER: Actuate Locker Solenoid & Scan Box QR
  // ============================================================================
  function handleScanCompartment() {
    setIsActuatingRelay(true);

    // Simulate 750ms IoT relay actuation delay
    setTimeout(function () {
      setIsActuatingRelay(false);
      setCompartmentUnlocked(true);
    }, 750);
  }

  function handleProceedToBagScan() {
    setCurrentStep(2);
  }

  // ============================================================================
  // STEP 2 HANDLER: Scan Laundry Bag Tag / Barcode & Manual Entry
  // ============================================================================
  function handleScanBagTag() {
    // Advance to Step 3: Swipe to Confirm
    setCurrentStep(3);
  }

  function handleSelectScanMode() {
    setInputMethod('scan');
  }

  function handleSelectManualMode() {
    setInputMethod('manual');
  }

  function handleManualTagChange(e) {
    const rawVal = e.target.value.toUpperCase();
    setManualTagInput(rawVal);
    setScannedBagTag(rawVal);
  }

  function handleClearManualInput() {
    setManualTagInput('');
    setScannedBagTag('');
  }

  function handleManualInputKeyDown(e) {
    if (e.key === 'Enter') {
      if (scannedBagTag && scannedBagTag.trim().length > 0) {
        handleScanBagTag();
      }
    }
  }

  function getOptionTabClass(methodName) {
    if (inputMethod === methodName) {
      return 'bag-option-tab active';
    }
    return 'bag-option-tab';
  }

  // ============================================================================
  // STEP 3 HANDLER: Swipe to Confirm Pickup
  // ============================================================================
  function handleFinalSwipeConfirm() {
    if (onConfirmPickup) {
      onConfirmPickup(order, scannedBagTag);
    }
    setCurrentStep(4);
  }

  function handleFlashlightToggle() {
    setFlashlightOn(!flashlightOn);
  }

  function getFlashlightBtnClass() {
    if (flashlightOn) {
      return 'driver-scanner-tool-btn flash-on';
    }
    return 'driver-scanner-tool-btn';
  }

  function getStepPillClass(stepNum) {
    if (currentStep >= stepNum) {
      return 'stepper-pill step-done';
    }
    return 'stepper-pill';
  }

  function getStepLineClass(stepNum) {
    if (currentStep >= stepNum) {
      return 'stepper-line line-done';
    }
    return 'stepper-line';
  }

  let displayTag = '—';
  if (scannedBagTag && scannedBagTag.trim().length > 0) {
    displayTag = scannedBagTag;
  }

  let isConfirmDisabled = false;
  let confirmBtnText = 'Confirm & Scan Tag #' + displayTag;

  if (inputMethod === 'manual') {
    if (!scannedBagTag || scannedBagTag.trim().length === 0) {
      isConfirmDisabled = true;
      confirmBtnText = 'Enter Bag Barcode to Continue';
    } else {
      confirmBtnText = 'Confirm Tag #' + displayTag;
    }
  } else {
    if (!scannedBagTag || scannedBagTag.trim().length === 0) {
      isConfirmDisabled = true;
      confirmBtnText = 'Align Barcode in Viewfinder';
    } else {
      confirmBtnText = 'Confirm & Scan Tag #' + displayTag;
    }
  }

  return (
    <div className="pickup-modal-overlay">
      <div className="pickup-modal-container">
        
        {/* ------------------------------------------------------------- */}
        {/* MODAL HEADER & PROGRESS STEPPER                               */}
        {/* ------------------------------------------------------------- */}
        <div className="pickup-modal-header">
          <div className="pickup-header-meta">
            <span className="pickup-hub-pill">
              <MapPin size={12} />
              <span>{stationName}</span>
            </span>
            <h3 className="pickup-modal-title">Box #{targetBox} Pickup</h3>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="pickup-close-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3-Step Progress Dots */}
        <div className="pickup-stepper-bar">
          <div className={getStepPillClass(1)}>
            <span className="step-num">1</span>
            <span className="step-txt">Open Box</span>
          </div>
          <div className={getStepLineClass(2)}></div>
          <div className={getStepPillClass(2)}>
            <span className="step-num">2</span>
            <span className="step-txt">Tag Bag</span>
          </div>
          <div className={getStepLineClass(3)}></div>
          <div className={getStepPillClass(3)}>
            <span className="step-num">3</span>
            <span className="step-txt">Swipe Confirm</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: SCAN LOCKER COMPARTMENT QR TO OPEN                    */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="pickup-step-content">
            <div className="step-instruction-card">
              <h4 className="instruction-heading">Scan Locker Box QR</h4>
              <p className="instruction-sub">
                Scan the QR code positioned on <strong>Compartment #{targetBox}</strong> to actuate the solenoid lock and open the door.
              </p>
            </div>

            {/* Camera Viewfinder Viewport */}
            <div className="driver-viewfinder-viewport">
              <div className="driver-viewfinder-glass">
                
                {/* Laser scan animation line */}
                {!compartmentUnlocked && !isActuatingRelay && (
                  <div className="driver-laser-beam"></div>
                )}

                {/* Viewfinder Target Reticle */}
                <div className="driver-reticle-box">
                  <div className="reticle-corner corner-tl"></div>
                  <div className="reticle-corner corner-tr"></div>
                  <div className="reticle-corner corner-bl"></div>
                  <div className="reticle-corner corner-br"></div>
                  
                  {!compartmentUnlocked && !isActuatingRelay && (
                    <div className="reticle-center-badge">
                      <QrCode size={38} className="reticle-icon-qr" />
                      <span>BOX #{targetBox} QR</span>
                    </div>
                  )}

                  {isActuatingRelay && (
                    <div className="reticle-center-badge relay-pulse">
                      <div className="relay-spinner"></div>
                      <span style={{ color: '#fb923c', fontWeight: 800 }}>Opening Locker Box #{targetBox}...</span>
                    </div>
                  )}

                  {compartmentUnlocked && (
                    <div className="reticle-center-badge unlock-success">
                      <Unlock size={44} className="unlock-pop-icon" />
                      <span style={{ color: '#34d399', fontWeight: 900 }}>DOOR POPPED OPEN!</span>
                    </div>
                  )}
                </div>

                {/* Flashlight Tool Button */}
                <div className="driver-viewport-controls">
                  <button 
                    type="button" 
                    onClick={handleFlashlightToggle}
                    className={getFlashlightBtnClass()}
                    title="Toggle Torch"
                  >
                    <Flashlight size={16} />
                  </button>
                </div>

              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pickup-step-actions">
              {!compartmentUnlocked && (
                <button 
                  type="button" 
                  onClick={handleScanCompartment}
                  disabled={isActuatingRelay}
                  className="driver-action-btn scan-btn"
                >
                  <Camera size={18} />
                  <span>Scan Compartment #{targetBox} QR</span>
                </button>
              )}

              {compartmentUnlocked && (
                <div className="unlocked-banner-action">
                  <button 
                    type="button" 
                    onClick={handleProceedToBagScan}
                    className="driver-action-btn next-btn"
                  >
                    <span>Proceed to Laundry Bag Tagging</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: SCAN LAUNDRY BAG BARCODE / TAG                        */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="pickup-step-content">
            <div className="step-instruction-card">
              <h4 className="instruction-heading">Scan Laundry Bag Barcode</h4>
              <p className="instruction-sub">
                Take the customer laundry from <strong>Box #{targetBox}</strong>, put it inside a Grab 'n Go van bag, and tag it using camera scan or manual entry.
              </p>
            </div>

            {/* Option Switcher: Choose Scan Barcode OR Manual Input */}
            <div className="bag-scan-option-pills">
              <button
                type="button"
                onClick={handleSelectScanMode}
                className={getOptionTabClass('scan')}
              >
                <Camera size={14} />
                <span>Scan Barcode</span>
              </button>
              <button
                type="button"
                onClick={handleSelectManualMode}
                className={getOptionTabClass('manual')}
              >
                <Keyboard size={14} />
                <span>Manual Input</span>
              </button>
            </div>

            {/* OPTION A: Barcode Camera Viewfinder */}
            {inputMethod === 'scan' && (
              <div className="driver-viewfinder-viewport barcode-view">
                <div className="driver-viewfinder-glass">
                  <div className="driver-laser-beam barcode-laser"></div>

                  <div className="driver-reticle-box barcode-reticle">
                    <div className="reticle-corner corner-tl"></div>
                    <div className="reticle-corner corner-tr"></div>
                    <div className="reticle-corner corner-bl"></div>
                    <div className="reticle-corner corner-br"></div>

                    <div className="reticle-center-badge">
                      <Barcode size={48} className="reticle-icon-barcode" />
                      <span className="barcode-tag-label">{displayTag}</span>
                    </div>
                  </div>

                  <div className="driver-viewport-controls">
                    <button 
                      type="button" 
                      onClick={handleFlashlightToggle}
                      className={getFlashlightBtnClass()}
                      title="Toggle Torch"
                    >
                      <Flashlight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION B: Manual Barcode Input Card */}
            {inputMethod === 'manual' && (
              <div className="manual-barcode-input-card">
                <div className="manual-input-header-row">
                  <div className="manual-input-label-meta">
                    <Keyboard size={14} color="#ea580c" />
                    <span className="manual-field-label">Bag Barcode / Tag #</span>
                  </div>
                  <span className="manual-field-hint">Type printed barcode</span>
                </div>

                <div className="manual-input-box-wrapper">
                  <Barcode size={18} className="manual-input-icon" />
                  <input
                    type="text"
                    className="manual-barcode-input"
                    placeholder="Enter Bag Barcode (e.g. BAG-8821)"
                    value={manualTagInput}
                    onChange={handleManualTagChange}
                    onKeyDown={handleManualInputKeyDown}
                    autoFocus
                  />
                  {manualTagInput.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearManualInput}
                      className="manual-clear-btn"
                      aria-label="Clear barcode input"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <p className="manual-input-hint-row">
                  Enter the alphanumeric tag code printed beneath the laundry bag barcode.
                </p>
              </div>
            )}

            {/* Scanned Tag Info Box */}
            <div className="bag-association-card">
              <div className="bag-card-header">
                <Package size={16} color="#ea580c" />
                <span>Van Tag Association</span>
              </div>
              <div className="association-pair-row">
                <div className="pair-node">
                  <span className="pair-lbl">SOURCE COMPARTMENT</span>
                  <span className="pair-val">Box #{targetBox}</span>
                </div>
                <div className="pair-arrow">→</div>
                <div className="pair-node">
                  <span className="pair-lbl">ASSIGNED BAG TAG</span>
                  <span className="pair-val highlight-tag">{displayTag}</span>
                </div>
              </div>
            </div>

            {/* Step 2 Action */}
            <div className="pickup-step-actions">
              <button 
                type="button" 
                onClick={handleScanBagTag}
                disabled={isConfirmDisabled}
                className="driver-action-btn scan-btn"
              >
                <Barcode size={18} />
                <span>{confirmBtnText}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: SWIPE CONFIRM PICKUP                                  */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="pickup-step-content">
            <div className="step-instruction-card">
              <h4 className="instruction-heading">Confirm Van Intake</h4>
              <p className="instruction-sub">
                Locker door closed. Ready to move order into van transit.
              </p>
            </div>

            {/* Order Verification Summary Card */}
            <div className="pickup-summary-manifest">
              <div className="manifest-row">
                <span className="manifest-key">Customer</span>
                <span className="manifest-val">{customerName}</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-key">Order ID</span>
                <span className="manifest-val highlight-order">{order.id}</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-key">Service Tier</span>
                <span className="manifest-val">{serviceType}</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-key">Source Locker</span>
                <span className="manifest-val">Box #{targetBox}</span>
              </div>
              <div className="manifest-row manifest-highlight-row">
                <span className="manifest-key">Laundry Bag Tag</span>
                <span className="manifest-val bag-tag-chip">{scannedBagTag}</span>
              </div>
            </div>

            {/* Interactive Swipe Button */}
            <div className="swipe-section-wrapper">
              <SwipeConfirmButton 
                onConfirm={handleFinalSwipeConfirm}
                label="Swipe confirm pickup"
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: SUCCESS CONFIRMATION                                  */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && (
          <div className="pickup-step-content success-step">
            <div className="success-badge-circle">
              <CheckCircle2 size={54} color="#10b981" />
            </div>

            <h3 className="success-title">Pickup Confirmed!</h3>
            <p className="success-sub">
              Order <strong>{order.id}</strong> from <strong>Box #{targetBox}</strong> is safely tagged as <strong>{scannedBagTag}</strong> and loaded into Van Transit.
            </p>

            <button 
              type="button" 
              onClick={onClose}
              className="driver-action-btn next-btn"
            >
              <span>Back to Route Queue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
