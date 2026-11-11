import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  Barcode, 
  Unlock, 
  CheckCircle2, 
  Flashlight, 
  ArrowRight, 
  Sparkles,
  Package,
  MapPin,
  KeyRound,
  Box
} from 'lucide-react';
import { SwipeConfirmButton } from '../common/SwipeConfirmButton';
import './DeliveryWorkflowModal.css';

// ==============================================================================
// REACT COMPONENT: DeliveryWorkflowModal
// Field-operations multi-step clean laundry delivery to locker:
//   Step 1: Scan Clean Laundry Bag Barcode Tag (verifies package)
//   Step 2: Choose/Scan Any Available Unoccupied Box & Actuate Solenoid
//   Step 3: "Swipe confirm delivery" (generates 6-digit PIN & moves to ready_for_pickup)
// ==============================================================================
export function DeliveryWorkflowModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const order = props.order;
  const onConfirmDelivery = props.onConfirmDelivery;

  // Available empty compartments at the destination locker kiosk
  const availableEmptyBoxes = ['04', '06', '09'];

  // Workflow steps: 1 = Scan Clean Bag, 2 = Pop Any Available Box, 3 = Swipe Confirm, 4 = Success
  const [currentStep, setCurrentStep] = useState(1);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [compartmentUnlocked, setCompartmentUnlocked] = useState(false);
  const [isActuatingRelay, setIsActuatingRelay] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('842019');
  const [chosenBoxNumber, setChosenBoxNumber] = useState('06');

  useEffect(function () {
    if (isOpen) {
      setCurrentStep(1);
      setCompartmentUnlocked(false);
      setIsActuatingRelay(false);
      setFlashlightOn(false);

      // Default to an available unoccupied box (e.g. 06 or 04)
      if (order && order.pickupBoxNumber) {
        setChosenBoxNumber(order.pickupBoxNumber);
      } else {
        setChosenBoxNumber('06');
      }

      // 6-digit random claim PIN
      const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
      setGeneratedPin(String(randomSixDigit));
    }
  }, [isOpen, order]);

  if (!isOpen || !order) {
    return null;
  }

  let bagTag = 'BAG-8821';
  if (order.laundryBagNumber) {
    bagTag = order.laundryBagNumber;
  }

  let stationName = 'Central Mall Hub';
  if (order.stationName) {
    stationName = order.stationName;
  }

  let customerName = 'Customer';
  if (order.customerName) {
    customerName = order.customerName;
  }

  let serviceType = 'Wash, Dry & Fold';
  if (order.serviceType) {
    serviceType = order.serviceType;
  }

  let weightText = '5.2 kg';
  if (order.weightKg !== undefined) {
    weightText = order.weightKg + ' kg';
  }

  // ============================================================================
  // STEP 1 HANDLER: Verify Clean Bag Tag
  // ============================================================================
  function handleScanCleanBag() {
    setCurrentStep(2);
  }

  // ============================================================================
  // STEP 2 HANDLER: Pop Selected Available Locker Compartment
  // ============================================================================
  function handlePopLockerBox() {
    setIsActuatingRelay(true);

    setTimeout(function () {
      setIsActuatingRelay(false);
      setCompartmentUnlocked(true);
    }, 750);
  }

  function handleProceedToSwipe() {
    setCurrentStep(3);
  }

  // ============================================================================
  // STEP 3 HANDLER: Swipe Confirm Delivery
  // ============================================================================
  function handleFinalSwipeDelivery() {
    if (onConfirmDelivery) {
      onConfirmDelivery(order, {
        pickupBoxNumber: chosenBoxNumber,
        claimPin: generatedPin,
      });
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
      return 'delivery-stepper-pill step-done';
    }
    return 'delivery-stepper-pill';
  }

  function getStepLineClass(stepNum) {
    if (currentStep >= stepNum) {
      return 'delivery-stepper-line line-done';
    }
    return 'delivery-stepper-line';
  }

  function getBoxSelectBtnClass(boxNum) {
    if (chosenBoxNumber === boxNum) {
      return 'free-box-select-btn box-selected';
    }
    return 'free-box-select-btn';
  }

  return (
    <div className="delivery-modal-overlay">
      <div className="delivery-modal-container">
        
        {/* ------------------------------------------------------------- */}
        {/* MODAL HEADER & PROGRESS STEPPER                               */}
        {/* ------------------------------------------------------------- */}
        <div className="delivery-modal-header">
          <div className="delivery-header-meta">
            <span className="delivery-hub-pill">
              <MapPin size={12} />
              <span>{stationName}</span>
            </span>
            <h3 className="delivery-modal-title">Deliver Clean Laundry</h3>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="delivery-close-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3-Step Progress Dots */}
        <div className="delivery-stepper-bar">
          <div className={getStepPillClass(1)}>
            <span className="step-num">1</span>
            <span className="step-txt">Verify Bag</span>
          </div>
          <div className={getStepLineClass(2)}></div>
          <div className={getStepPillClass(2)}>
            <span className="step-num">2</span>
            <span className="step-txt">Choose Box</span>
          </div>
          <div className={getStepLineClass(3)}></div>
          <div className={getStepPillClass(3)}>
            <span className="step-num">3</span>
            <span className="step-txt">Confirm</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: SCAN CLEAN LAUNDRY BAG BARCODE                        */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="delivery-step-content">
            <div className="delivery-instruction-card">
              <h4 className="instruction-heading">Scan Clean Bag Tag</h4>
              <p className="instruction-sub">
                Scan the barcode on clean laundry bag <strong>{bagTag}</strong> to verify the package before locker placement.
              </p>
            </div>

            {/* Barcode Camera Viewfinder */}
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
                    <span className="barcode-tag-label">{bagTag}</span>
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

            {/* Order Match Details */}
            <div className="delivery-order-match-box">
              <div className="match-title-row">
                <Package size={16} color="#0284c7" />
                <span>Verified Package Match</span>
              </div>
              <div className="match-grid">
                <div>
                  <span className="match-lbl">CUSTOMER</span>
                  <span className="match-val">{customerName}</span>
                </div>
                <div>
                  <span className="match-lbl">ORDER ID</span>
                  <span className="match-val">{order.id}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="match-lbl">SERVICE & WEIGHT</span>
                  <span className="match-val highlight-val">{serviceType} • {weightText}</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="delivery-step-actions">
              <button 
                type="button" 
                onClick={handleScanCleanBag}
                className="delivery-action-btn scan-btn"
              >
                <Barcode size={18} />
                <span>Verify & Scan Bag #{bagTag}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: CHOOSE ANY AVAILABLE EMPTY BOX & POP SOLENOID         */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="delivery-step-content">
            <div className="delivery-instruction-card">
              <h4 className="instruction-heading">Choose Any Available Box</h4>
              <p className="instruction-sub">
                Select or scan any unoccupied locker compartment at <strong>{stationName}</strong> to store this clean laundry.
              </p>
            </div>

            {/* Unoccupied Box Selection Pills */}
            <div className="free-boxes-selector-bar">
              <span className="free-boxes-label">Available Empty Boxes:</span>
              <div className="free-boxes-pills">
                {availableEmptyBoxes.map(function (boxNum) {
                  return (
                    <button
                      key={boxNum}
                      type="button"
                      onClick={function () { setChosenBoxNumber(boxNum); }}
                      className={getBoxSelectBtnClass(boxNum)}
                      disabled={compartmentUnlocked}
                    >
                      <Box size={13} />
                      <span>Box #{boxNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera Viewfinder */}
            <div className="driver-viewfinder-viewport">
              <div className="driver-viewfinder-glass">
                
                {!compartmentUnlocked && !isActuatingRelay && (
                  <div className="driver-laser-beam"></div>
                )}

                <div className="driver-reticle-box">
                  <div className="reticle-corner corner-tl"></div>
                  <div className="reticle-corner corner-tr"></div>
                  <div className="reticle-corner corner-bl"></div>
                  <div className="reticle-corner corner-br"></div>

                  {!compartmentUnlocked && !isActuatingRelay && (
                    <div className="reticle-center-badge">
                      <QrCode size={38} className="reticle-icon-qr" />
                      <span>BOX #{chosenBoxNumber} QR</span>
                    </div>
                  )}

                  {isActuatingRelay && (
                    <div className="reticle-center-badge relay-pulse">
                      <div className="relay-spinner"></div>
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>Actuating Solenoid...</span>
                    </div>
                  )}

                  {compartmentUnlocked && (
                    <div className="reticle-center-badge unlock-success">
                      <Unlock size={44} className="unlock-pop-icon" />
                      <span style={{ color: '#34d399', fontWeight: 900 }}>BOX #{chosenBoxNumber} OPENED!</span>
                    </div>
                  )}
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

            {/* Actions */}
            <div className="delivery-step-actions">
              {!compartmentUnlocked && (
                <button 
                  type="button" 
                  onClick={handlePopLockerBox}
                  disabled={isActuatingRelay}
                  className="delivery-action-btn scan-btn"
                >
                  <Camera size={18} />
                  <span>Pop Unoccupied Box #{chosenBoxNumber}</span>
                </button>
              )}

              {compartmentUnlocked && (
                <div className="unlocked-banner-action">
                  <div className="unlocked-status-pill">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Box #{chosenBoxNumber} Open • Place Bag & Close Door</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleProceedToSwipe}
                    className="delivery-action-btn next-btn"
                  >
                    <span>Proceed to Swipe Confirmation</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: SWIPE CONFIRM DELIVERY                                */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="delivery-step-content">
            <div className="delivery-instruction-card">
              <h4 className="instruction-heading">Confirm Delivery to Locker</h4>
              <p className="instruction-sub">
                Clean clothes secured inside <strong>Box #{chosenBoxNumber}</strong>. Door locked. Ready to notify customer.
              </p>
            </div>

            {/* Delivery Manifest Summary */}
            <div className="delivery-summary-manifest">
              <div className="manifest-row">
                <span className="manifest-key">Customer</span>
                <span className="manifest-val">{customerName}</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-key">Order Code</span>
                <span className="manifest-val highlight-order">{order.id}</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-key">Assigned Compartment</span>
                <span className="manifest-val" style={{ color: '#0284c7', fontWeight: 800 }}>
                  Box #{chosenBoxNumber} (Allocated)
                </span>
              </div>
              <div className="manifest-row">
                <span className="manifest-key">Delivered Bag Tag</span>
                <span className="manifest-val">{bagTag}</span>
              </div>
              <div className="manifest-row manifest-highlight-row">
                <span className="manifest-key">Generated Claim PIN</span>
                <span className="manifest-val pin-preview-chip">
                  <KeyRound size={13} />
                  <span>{generatedPin}</span>
                </span>
              </div>
            </div>

            {/* Interactive Swipe Button */}
            <div className="swipe-section-wrapper">
              <SwipeConfirmButton 
                onConfirm={handleFinalSwipeDelivery}
                label="Swipe confirm delivery"
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: SUCCESS CONFIRMATION                                  */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && (
          <div className="delivery-step-content success-step">
            <div className="success-badge-circle">
              <CheckCircle2 size={54} color="#10b981" />
            </div>

            <h3 className="success-title">Delivery Complete!</h3>
            <p className="success-sub">
              Clean laundry package safely stored in <strong>Box #{chosenBoxNumber}</strong> at <strong>{stationName}</strong>.
            </p>

            <div className="pin-generated-card">
              <span className="pin-card-lbl">Customer 6-Digit Claim PIN</span>
              <h2 className="pin-card-digits">{generatedPin}</h2>
              <span className="pin-card-note">Customer notified with Locker Box #{chosenBoxNumber}</span>
            </div>

            <div className="customer-sync-badge">
              <Sparkles size={16} color="#0284c7" />
              <span>Customer tracker advanced to Stage 4 (Box #{chosenBoxNumber})</span>
            </div>

            <button 
              type="button" 
              onClick={onClose}
              className="delivery-action-btn next-btn"
            >
              <span>Back to Delivery Queue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
