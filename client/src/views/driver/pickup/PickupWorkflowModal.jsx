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
  Clock
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
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const order = props.order;
  const onConfirmPickup = props.onConfirmPickup;

  // Workflow steps: 1 = Scan Compartment, 2 = Scan Bag Tag, 3 = Swipe Confirm, 4 = Success
  const [currentStep, setCurrentStep] = useState(1);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [compartmentUnlocked, setCompartmentUnlocked] = useState(false);
  const [scannedBagTag, setScannedBagTag] = useState('');
  const [isActuatingRelay, setIsActuatingRelay] = useState(false);

  // Generate a realistic Grab 'n Go bag tag number based on order or random
  useEffect(function () {
    if (isOpen) {
      setCurrentStep(1);
      setCompartmentUnlocked(false);
      setIsActuatingRelay(false);
      setFlashlightOn(false);

      let tagNumber = '8821';
      if (order && order.id) {
        const digits = order.id.replace(/\D/g, '');
        if (digits.length >= 4) {
          tagNumber = digits.substring(0, 4);
        }
      }
      setScannedBagTag('BAG-' + tagNumber);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) {
    return null;
  }

  // Locker & Order safe attributes
  let targetBox = '03';
  if (order.lockerNumber) {
    targetBox = order.lockerNumber;
  } else if (order.dropoffBoxNumber) {
    targetBox = order.dropoffBoxNumber;
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
  // STEP 2 HANDLER: Scan Laundry Bag Tag / Barcode
  // ============================================================================
  function handleScanBagTag() {
    // Advance to Step 3: Swipe to Confirm
    setCurrentStep(3);
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
                      <span style={{ color: '#fb923c', fontWeight: 800 }}>Actuating Solenoid...</span>
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
                  <div className="unlocked-status-pill">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Box #{targetBox} Solenoid Open</span>
                  </div>
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
                Take the customer laundry from <strong>Box #{targetBox}</strong>, put it inside a Grab 'n Go van bag, and scan its barcode tag.
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
                    <span className="barcode-tag-label">{scannedBagTag}</span>
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
                  <span className="pair-val highlight-tag">{scannedBagTag}</span>
                </div>
              </div>
            </div>

            {/* Step 2 Action */}
            <div className="pickup-step-actions">
              <button 
                type="button" 
                onClick={handleScanBagTag}
                className="driver-action-btn scan-btn"
              >
                <Barcode size={18} />
                <span>Confirm & Scan Tag #{scannedBagTag}</span>
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

            <div className="customer-sync-badge">
              <Sparkles size={16} color="#0284c7" />
              <span>Customer tracker advanced to Stage 2 (Van Transit)</span>
            </div>

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
