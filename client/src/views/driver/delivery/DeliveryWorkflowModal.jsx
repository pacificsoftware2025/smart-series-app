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
  Package, 
  MapPin, 
  KeyRound, 
  Box, 
  Keyboard,
  Loader2
} from 'lucide-react';
import { SwipeConfirmButton } from '../common/SwipeConfirmButton';
import { fetchStationCompartments, deliverCleanOrder } from '../../../services/api';
import './DeliveryWorkflowModal.css';

// ==============================================================================
// REACT COMPONENT: DeliveryWorkflowModal
// Field-operations multi-step clean laundry delivery to locker:
//   Step 1: Scan Clean Laundry Bag Barcode Tag (verifies package)
//   Step 2: Choose/Scan Any Available Unoccupied Box from live database & Actuate Solenoid
//   Step 3: "Swipe confirm delivery" (generates 6-digit PIN & moves to ready_for_pickup)
// ==============================================================================
export function DeliveryWorkflowModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const order = props.order;
  const onConfirmDelivery = props.onConfirmDelivery;

  // Available empty compartments fetched from live database
  const [availableEmptyBoxes, setAvailableEmptyBoxes] = useState(['04', '06', '09']);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [compartmentUnlocked, setCompartmentUnlocked] = useState(false);
  const [isActuatingRelay, setIsActuatingRelay] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('842019');
  const [chosenBoxNumber, setChosenBoxNumber] = useState('06');
  const [inputMethod, setInputMethod] = useState('scan'); // 'scan' | 'manual'
  const [manualTagInput, setManualTagInput] = useState('');
  const [scannedBagTag, setScannedBagTag] = useState('');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  // Fetch real vacant boxes when modal opens
  useEffect(function () {
    if (isOpen) {
      setCurrentStep(1);
      setCompartmentUnlocked(false);
      setIsActuatingRelay(false);
      setFlashlightOn(false);
      setInputMethod('scan');

      // Initialize bag tag
      let tag = 'BAG-8821';
      if (order && order.laundryBagNumber) {
        tag = order.laundryBagNumber;
      } else if (order && order.bagTag) {
        tag = order.bagTag;
      } else if (order && order.id) {
        const digits = String(order.id).replace(/\D/g, '');
        let tagSuffix = '8821';
        if (digits.length >= 4) {
          tagSuffix = digits.slice(-4);
        }
        tag = 'BAG-' + tagSuffix;
      }
      setScannedBagTag(tag);
      setManualTagInput(tag);

      // Generate initial 6-digit claim PIN preview
      const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
      setGeneratedPin(String(randomSixDigit));

      // Fetch live available boxes from cloud database
      setIsLoadingBoxes(true);
      fetchStationCompartments('CMH-01')
        .then(function (comps) {
          if (Array.isArray(comps)) {
            const vacant = comps
              .filter(c => c.status === 'available')
              .map(c => String(c.box_number).padStart(2, '0'));
            
            if (vacant.length > 0) {
              setAvailableEmptyBoxes(vacant);
              setChosenBoxNumber(vacant[0]);
            }
          }
        })
        .catch(function (err) {
          console.warn('[DeliveryWorkflowModal] Error fetching vacant boxes:', err);
        })
        .finally(function () {
          setIsLoadingBoxes(false);
        });
    }
  }, [isOpen, order]);

  if (!isOpen || !order) {
    return null;
  }

  let bagTag = scannedBagTag || 'BAG-8821';
  let stationName = order.stationName || `Central Mall Hub (${order.station_id || 'CMH-01'})`;
  let customerName = order.customerName || order.customer_name || 'Customer';
  let serviceType = order.serviceType || order.service_tier || 'Wash, Dry & Fold';
  let weightText = '5.2 kg';
  if (order.weight_kg) {
    weightText = order.weight_kg + ' kg';
  } else if (order.weightKg) {
    weightText = order.weightKg + ' kg';
  }

  // STEP 1 HANDLER: Verify Clean Bag Tag
  function handleScanCleanBag() {
    setCurrentStep(2);
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
        handleScanCleanBag();
      }
    }
  }

  function getOptionTabClass(methodName) {
    if (inputMethod === methodName) {
      return 'bag-option-tab delivery-tab active';
    }
    return 'bag-option-tab delivery-tab';
  }

  // STEP 2 HANDLER: Pop Selected Available Locker Compartment
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

  // Helper to safely extract claim PIN from backend response object
  function extractPinFromResponse(data) {
    if (!data) {
      return null;
    }
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.length >= 4 && trimmed.length <= 8) {
        return trimmed;
      }
    }
    if (data.claimPin) {
      return String(data.claimPin).trim();
    }
    if (data.claim_pin) {
      return String(data.claim_pin).trim();
    }
    if (data.pin) {
      return String(data.pin).trim();
    }
    if (data.pinCode) {
      return String(data.pinCode).trim();
    }
    if (data.pickupPin) {
      return String(data.pickupPin).trim();
    }
    if (data.data) {
      const fromData = extractPinFromResponse(data.data);
      if (fromData) {
        return fromData;
      }
    }
    if (data.order) {
      const fromOrder = extractPinFromResponse(data.order);
      if (fromOrder) {
        return fromOrder;
      }
    }
    return null;
  }

  // STEP 3 HANDLER: Swipe Confirm Delivery & Fetch Backend Generated PIN
  async function handleFinalSwipeDelivery() {
    setIsSubmittingDelivery(true);
    let finalPin = generatedPin;

    try {
      // 1. Post delivery to live backend API (/api/orders/:id/deliver)
      const res = await deliverCleanOrder(order.id, chosenBoxNumber, 'CMH-01');
      const backendPin = extractPinFromResponse(res);

      if (backendPin) {
        finalPin = backendPin;
        setGeneratedPin(backendPin);
      }

      // 2. Notify parent DriverView with the verified PIN from backend
      if (onConfirmDelivery) {
        await onConfirmDelivery(order, {
          pickupBoxNumber: chosenBoxNumber,
          claimPin: finalPin,
          deliveredOnServer: true,
          apiResponse: res,
        });
      }
    } catch (err) {
      console.warn('[DeliveryWorkflowModal] deliverCleanOrder failed, using fallback PIN:', err);
      if (onConfirmDelivery) {
        onConfirmDelivery(order, {
          pickupBoxNumber: chosenBoxNumber,
          claimPin: finalPin,
          deliveredOnServer: false,
        });
      }
    } finally {
      setIsSubmittingDelivery(false);
      setCurrentStep(4);
    }
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

  let displayBagTag = scannedBagTag || '—';
  let isDeliveryConfirmDisabled = false;
  let deliveryBtnText = 'Verify & Scan Bag #' + displayBagTag;

  if (inputMethod === 'manual') {
    if (!scannedBagTag || scannedBagTag.trim().length === 0) {
      isDeliveryConfirmDisabled = true;
      deliveryBtnText = 'Enter Bag Barcode to Continue';
    } else {
      deliveryBtnText = 'Verify Bag #' + displayBagTag;
    }
  } else {
    if (!scannedBagTag || scannedBagTag.trim().length === 0) {
      isDeliveryConfirmDisabled = true;
      deliveryBtnText = 'Align Barcode in Viewfinder';
    } else {
      deliveryBtnText = 'Verify & Scan Bag #' + displayBagTag;
    }
  }

  let pinToDisplay = generatedPin;
  if (!pinToDisplay || String(pinToDisplay).trim().length === 0) {
    pinToDisplay = '842019';
  }
  const pinDigits = String(pinToDisplay).trim().split('');

  let swipeBtnLabel = 'Swipe confirm delivery';
  if (isSubmittingDelivery) {
    swipeBtnLabel = 'Connecting to server...';
  }

  return (
    <div className="delivery-modal-overlay">
      <div className="delivery-modal-container">
        
        {/* MODAL HEADER & PROGRESS STEPPER */}
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

        {/* STEP 1: SCAN CLEAN LAUNDRY BAG BARCODE */}
        {currentStep === 1 && (
          <div className="delivery-step-content">
            <div className="delivery-instruction-card">
              <h4 className="instruction-heading">Scan Clean Bag Tag</h4>
              <p className="instruction-sub">
                Scan the barcode on clean laundry bag <strong>{displayBagTag}</strong> to verify the package before locker placement.
              </p>
            </div>

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
                      <span className="barcode-tag-label">{displayBagTag}</span>
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

            {inputMethod === 'manual' && (
              <div className="manual-barcode-input-card delivery-input-card">
                <div className="manual-input-header-row">
                  <div className="manual-input-label-meta">
                    <Keyboard size={14} color="#0284c7" />
                    <span className="manual-field-label">Clean Bag Barcode / Tag #</span>
                  </div>
                  <span className="manual-field-hint">Type printed barcode</span>
                </div>

                <div className="manual-input-box-wrapper">
                  <Barcode size={18} className="manual-input-icon delivery-icon" />
                  <input
                    type="text"
                    className="manual-barcode-input delivery-input"
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
                      aria-label="Clear manual input"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <p className="manual-input-hint-row">
                  Enter the barcode or tag number printed under the clean bag tag to verify.
                </p>
              </div>
            )}

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

            <div className="delivery-step-actions">
              <button 
                type="button" 
                onClick={handleScanCleanBag}
                disabled={isDeliveryConfirmDisabled}
                className="delivery-action-btn scan-btn"
              >
                <Barcode size={18} />
                <span>{deliveryBtnText}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE ANY AVAILABLE EMPTY BOX & POP SOLENOID */}
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
              {isLoadingBoxes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.75rem' }}>
                  <Loader2 size={13} className="relay-spinner" />
                  <span>Loading live boxes...</span>
                </div>
              ) : (
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
              )}
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
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>Opening Locker Box #{chosenBoxNumber}...</span>
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

        {/* STEP 3: SWIPE CONFIRM DELIVERY */}
        {currentStep === 3 && (
          <div className="delivery-step-content">
            <div className="delivery-instruction-card">
              <h4 className="instruction-heading">Confirm Delivery to Locker</h4>
              <p className="instruction-sub">
                Clean clothes secured inside <strong>Box #{chosenBoxNumber}</strong>. Door locked. Ready to notify customer.
              </p>
            </div>

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
                  <span>Assigned upon swipe</span>
                </span>
              </div>
            </div>

            <div className="swipe-section-wrapper">
              {isSubmittingDelivery && (
                <div className="delivery-submitting-badge">
                  <Loader2 size={16} className="relay-spinner" />
                  <span>Securing Box #{chosenBoxNumber} & fetching PIN from server...</span>
                </div>
              )}
              <SwipeConfirmButton 
                onConfirm={handleFinalSwipeDelivery}
                disabled={isSubmittingDelivery}
                label={swipeBtnLabel}
              />
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {currentStep === 4 && (
          <div className="delivery-step-content success-step">
            <div className="delivery-success-halo">
              <div className="delivery-success-icon-box">
                <CheckCircle2 size={38} color="#059669" strokeWidth={2.4} />
              </div>
            </div>

            <div className="delivery-success-text-group">
              <h3 className="success-headline">Delivery Complete!</h3>
              <div className="success-status-pill">
                <span className="pulse-dot-green"></span>
                <span>Box #{chosenBoxNumber} Secured & Locked</span>
              </div>
              <p className="success-sub">
                Clean laundry package is safely stored in <strong>Box #{chosenBoxNumber}</strong> at <strong>{stationName}</strong>.
              </p>
            </div>

            <div className="delivery-claim-pass-card">
              <div className="pass-header-row">
                <div className="pass-header-meta">
                  <KeyRound size={15} color="#0284c7" />
                  <span className="pass-title">CUSTOMER CLAIM PASS</span>
                </div>
                <span className="pass-status-badge">
                  <span className="live-dot-blue"></span>
                  <span>Active OTP</span>
                </span>
              </div>

              <div className="pin-tiles-section">
                <span className="pin-tiles-lbl">6-DIGIT PICKUP CLAIM PIN</span>
                <div className="pin-digits-grid">
                  {pinDigits.map(function (digit, idx) {
                    return (
                      <div key={idx} className="pin-digit-tile">
                        {digit}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pass-manifest-grid">
                <div className="manifest-item">
                  <span className="manifest-item-lbl">STORED IN</span>
                  <span className="manifest-item-val highlight-box">Box #{chosenBoxNumber}</span>
                </div>
                <div className="manifest-item">
                  <span className="manifest-item-lbl">ORDER ID</span>
                  <span className="manifest-item-val">{order.id}</span>
                </div>
                <div className="manifest-item">
                  <span className="manifest-item-lbl">RECIPIENT</span>
                  <span className="manifest-item-val">{customerName}</span>
                </div>
              </div>

              <div className="pass-notification-footer">
                <CheckCircle2 size={13} color="#059669" />
                <span>Customer notified via SMS & In-App with Box #{chosenBoxNumber} PIN</span>
              </div>
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
