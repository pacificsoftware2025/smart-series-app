import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Clock, CheckCircle2, ShieldCheck, Truck, Lock, CreditCard, Key, PackageCheck, AlertCircle } from 'lucide-react';
import inwashMachineIcon from '../../../assets/icons/inwash-machine.png';
import './ActiveOrderCard.css';

// ==============================================================================
// HELPER FUNCTIONS (Vanilla JavaScript Logic)
// In Vanilla JS, you use standard if/else statements instead of nested ternaries.
// This directly adheres to Rule 1: "A 5-line readable solution is infinitely better
// than a clever 1-line expression."
// ==============================================================================

// Determines the CSS class for each circle in the 4-step progress stepper.
function getStepCircleClass(stepNumber, activeStep, isPaid) {
  if (stepNumber === 4 && isPaid) {
    return 'stepper-node-circle circle-completed';
  }
  if (stepNumber < activeStep) {
    return 'stepper-node-circle circle-completed';
  }
  if (stepNumber === activeStep) {
    return 'stepper-node-circle circle-active';
  }
  return 'stepper-node-circle circle-pending';
}

// Determines the CSS class for the step label text.
function getStepLabelClass(stepNumber, activeStep, isPaid) {
  if (stepNumber === 4 && isPaid) {
    return 'stepper-node-label label-completed';
  }
  if (stepNumber === activeStep) {
    return 'stepper-node-label label-active';
  }
  if (stepNumber < activeStep) {
    return 'stepper-node-label label-completed';
  }
  return 'stepper-node-label label-pending';
}

// Calculates the width percentage for the timeline track fill bar.
// Spans inside the bounded container from Node 1 (0%) to Node 4 (100%).
function getTimelineProgressWidth(activeStep) {
  if (activeStep === 1) {
    return '0%';
  }
  if (activeStep === 2) {
    return '33.33%';
  }
  if (activeStep === 3) {
    return '66.67%';
  }
  if (activeStep === 4) {
    return '100%';
  }
  return '0%';
}

// Determines the track fill CSS class based on payment status.
function getTrackFillClass(activeStep, isPaid) {
  if (activeStep === 4 && isPaid) {
    return 'stepper-track-fill fill-all-completed';
  }
  return 'stepper-track-fill';
}

// Determines the headline title displayed at the top of the order card.
function getOrderHeadline(activeStep, isPaid) {
  if (activeStep === 1) {
    return 'Dropped Off in Locker';
  }
  if (activeStep === 2) {
    return 'Rider Collected Laundry';
  }
  if (activeStep === 3) {
    return 'Wash & Dry in Progress';
  }
  if (activeStep === 4) {
    if (isPaid) {
      return 'Ready for Collection';
    }
    return 'Delivered & Payment Due';
  }
  return 'Order in Progress';
}

// Determines the status badge text at the top right.
function getStatusBadgeText(activeStep, isPaid) {
  if (activeStep === 4) {
    if (isPaid) {
      return 'Ready';
    }
    return 'Payment Due';
  }
  return 'In Progress';
}

// Determines the CSS class for the status badge chip.
function getStatusBadgeClass(activeStep, isPaid) {
  if (activeStep === 4) {
    if (isPaid) {
      return 'live-status-badge badge-ready';
    }
    return 'live-status-badge badge-payment';
  }
  return 'live-status-badge badge-progress';
}

// Determines the CSS class for water temperature spec badge.
function getTemperatureBadgeClass(temp) {
  if (temp && temp.indexOf('Warm') !== -1) {
    return 'spec-badge-chip temp-warm-chip';
  }
  return 'spec-badge-chip temp-cold-chip';
}

// Determines the CSS class for fabric softener spec badge.
function getSoftenerBadgeClass(hasSoftener) {
  if (hasSoftener) {
    return 'spec-badge-chip softener-yes-chip';
  }
  return 'spec-badge-chip softener-no-chip';
}

// Determines the readable text for fabric softener.
function getFabricSoftenerText(hasSoftener) {
  if (hasSoftener) {
    return 'Softener Added';
  }
  return 'No Softener';
}

// Determines payment method button CSS class.
function getPayMethodClass(method, selectedMethod) {
  if (method === selectedMethod) {
    return 'pay-method-card selected-pay-method';
  }
  return 'pay-method-card';
}

// Determines developer simulator button CSS class.
function getDevStepBtnClass(stepNumber, activeStep) {
  if (stepNumber === activeStep) {
    return 'dev-sim-btn dev-sim-active';
  }
  return 'dev-sim-btn';
}

// Formats a numeric price into a 2-decimal string.
function formatPrice(amount) {
  if (typeof amount === 'number') {
    return amount.toFixed(2);
  }
  return '337.00';
}

// Checks if special instructions are provided.
function hasValidInstructions(notes) {
  if (!notes) {
    return false;
  }
  if (notes.trim() === '') {
    return false;
  }
  if (notes.trim().toLowerCase() === 'none') {
    return false;
  }
  return true;
}

// Computes itemized billing breakdown for Step 4 invoice
function getBillBreakdown(order) {
  let total = 337.00;
  if (order && order.priceEstimate) {
    total = order.priceEstimate;
  }

  let weight = 5.2;
  if (order && order.weightKg) {
    weight = order.weightKg;
  }

  let serviceName = 'Wash & Dry';
  if (order && order.serviceType) {
    serviceName = order.serviceType;
  }

  let hasSoftener = false;
  if (order && order.fabricSoftener) {
    hasSoftener = true;
  }

  let softenerFee = 0.00;
  if (hasSoftener) {
    softenerFee = 25.00;
  }

  // Base service cost is total minus softener fee
  let baseServiceCost = total - softenerFee;
  if (baseServiceCost < 0) {
    baseServiceCost = total;
  }

  let ratePerKg = (baseServiceCost / weight).toFixed(2);

  return {
    serviceName: serviceName,
    weight: weight,
    ratePerKg: ratePerKg,
    baseServiceCost: baseServiceCost.toFixed(2),
    hasSoftener: hasSoftener,
    softenerFee: softenerFee.toFixed(2),
    totalAmount: total.toFixed(2),
  };
}

// ==============================================================================
// REACT COMPONENT: ActiveOrderCard
// In Vanilla JS: A function that takes data and returns an HTML string / DOM tree.
// In React: When state changes via setState(), React calls this function again
// to re-compute and update only the modified DOM elements.
// ==============================================================================
export function ActiveOrderCard(props) {
  // Props are function arguments passed by the parent component (CustomerView).
  const onSwitchToDropoff = props.onSwitchToDropoff;

  // useAuth() connects to our global user and order state in AuthContext.
  const auth = useAuth();
  const activeOrder = auth.activeOrder;

  // ============================================================================
  // REACT STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let currentStep = 1;
  //   let selectedPayment = 'GCash';
  //   let isPaid = false;
  // In React:
  //   Calling setCurrentStep(newStep) updates the variable AND instructs React
  //   to re-render this component automatically.
  // ============================================================================
  const [currentStep, setCurrentStep] = useState(1); // 1 = Dropped, 2 = Transit, 3 = Wash, 4 = Ready/Pay
  const [selectedPayment, setSelectedPayment] = useState('GCash'); // Currently selected payment method
  const [isPaid, setIsPaid] = useState(false); // Tracks if Step 4 invoice has been paid

  // In Vanilla JS: if (!activeOrder) { container.innerHTML = '...'; return; }
  // In React: if no active order exists, we return the Empty State view early.
  if (!activeOrder) {
    return (
      <div className="empty-tracker-card">
        <div className="empty-tracker-icon">
          <Clock size={32} />
        </div>
        <div className="empty-tracker-content">
          <h3 className="empty-tracker-title">No Active Laundry Order</h3>
          <p className="empty-tracker-desc">
            You don't have any clothes in wash right now. Head over to the Nearby Locker tab to drop off your laundry bag.
          </p>
        </div>
        <button onClick={onSwitchToDropoff} className="empty-tracker-btn">
          Go to Nearby Locker
        </button>
      </div>
    );
  }

  // Event handler for paying the invoice at Step 4.
  function handlePayAndUnlockClick() {
    setIsPaid(true); // Switches isPaid to true, triggering React to show the PIN claim pass.
  }

  // Event handler for simulating manual locker door opening after payment.
  function handleOpenLockerDoorClick() {
    alert("Solenoid Relay Actuated: Locker Box #06 is now UNLOCKED. Please retrieve your clean laundry.");
  }

  // Determine price and weight values from verified order data
  let displayPrice = '337.00';
  if (activeOrder.priceEstimate) {
    displayPrice = formatPrice(activeOrder.priceEstimate);
  }

  let displayWeight = '5.2';
  if (activeOrder.weightKg) {
    displayWeight = activeOrder.weightKg;
  }

  // Calculate itemized bill breakdown for Step 4 invoice
  const bill = getBillBreakdown(activeOrder);

  // Check if special instructions exist
  const showSpecialNotes = hasValidInstructions(activeOrder.specialInstructions);

  return (
    <div className="active-tracker-container">
      
      {/* ------------------------------------------------------------- */}
      {/* DEV STAGE SIMULATOR (Subtle Developer Toolbar at the Top)     */}
      {/* ------------------------------------------------------------- */}
      <div className="dev-simulator-bar">
        <div className="dev-simulator-label">
          <span>Simulation Preview:</span>
        </div>
        <div className="dev-simulator-buttons">
          <button
            type="button"
            onClick={function () { setCurrentStep(1); setIsPaid(false); }}
            className={getDevStepBtnClass(1, currentStep)}
          >
            1. Dropped
          </button>
          <button
            type="button"
            onClick={function () { setCurrentStep(2); setIsPaid(false); }}
            className={getDevStepBtnClass(2, currentStep)}
          >
            2. Transit
          </button>
          <button
            type="button"
            onClick={function () { setCurrentStep(3); setIsPaid(false); }}
            className={getDevStepBtnClass(3, currentStep)}
          >
            3. In Wash
          </button>
          <button
            type="button"
            onClick={function () { setCurrentStep(4); setIsPaid(false); }}
            className={getDevStepBtnClass(4, currentStep)}
          >
            4. Ready
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HERO STATUS PASS (Clean, Elevated Consumer Ticket Card)       */}
      {/* ------------------------------------------------------------- */}
      <div className="order-ticket-card">
        
        {/* Header Row: Order ID, Timestamp & Live Pulsing Badge */}
        <div className="order-ticket-header">
          <div className="order-reference-group">
            <span className="order-ticket-id">
              Order #{activeOrder.id}
            </span>
            <span className="order-ticket-time">
              {activeOrder.createdAt}
            </span>
          </div>

          <div className={getStatusBadgeClass(currentStep, isPaid)}>
            <span className="live-pulse-dot"></span>
            <span>{getStatusBadgeText(currentStep, isPaid)}</span>
          </div>
        </div>

        {/* Headline & ETA Banner */}
        <div className="order-ticket-headline-block">
          <h2 className="order-ticket-title">
            {getOrderHeadline(currentStep, isPaid)}
          </h2>
          <div className="order-ticket-eta">
            <Clock size={14} className="eta-icon" />
            <span>Est. Ready: <strong>{activeOrder.estimatedReady}</strong></span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONNECTED 4-STEP TIMELINE TRACK                               */}
        {/* ------------------------------------------------------------- */}
        <div className="stepper-timeline-wrapper">
          
          {/* Bounded Track Container: Spans exactly from Center of Node 1 to Center of Node 4 */}
          <div className="stepper-track-container">
            {/* The fill bar lives INSIDE with overflow:hidden so it CANNOT overlap or shoot out */}
            <div
              className={getTrackFillClass(currentStep, isPaid)}
              style={{ width: getTimelineProgressWidth(currentStep) }}
            ></div>
          </div>

          {/* 4 Node Steps */}
          <div className="stepper-nodes-row">
            
            {/* Step 1: Drop Off */}
            <div className="stepper-node-item">
              <div className={getStepCircleClass(1, currentStep, isPaid)}>
                {currentStep > 1 && <CheckCircle2 size={14} />}
                {currentStep === 1 && '1'}
              </div>
              <span className={getStepLabelClass(1, currentStep, isPaid)}>Drop Off</span>
              <span className="stepper-node-sub">Box #{activeOrder.lockerNumber}</span>
            </div>

            {/* Step 2: Rider Transit */}
            <div className="stepper-node-item">
              <div className={getStepCircleClass(2, currentStep, isPaid)}>
                {currentStep > 2 && <CheckCircle2 size={14} />}
                {currentStep === 2 && <Truck size={13} />}
                {currentStep < 2 && <Truck size={13} />}
              </div>
              <span className={getStepLabelClass(2, currentStep, isPaid)}>Transit</span>
              <span className="stepper-node-sub">Van Route</span>
            </div>

            {/* Step 3: In Wash */}
            <div className="stepper-node-item">
              <div className={getStepCircleClass(3, currentStep, isPaid)}>
                {currentStep > 3 && <CheckCircle2 size={14} />}
                {currentStep <= 3 && (
                  <img 
                    src={inwashMachineIcon} 
                    alt="In Wash" 
                    className="inwash-stepper-icon" 
                  />
                )}
              </div>
              <span className={getStepLabelClass(3, currentStep, isPaid)}>In Wash</span>
              <span className="stepper-node-sub">Central Hub</span>
            </div>

            {/* Step 4: Deliver & Pay */}
            <div className="stepper-node-item">
              <div className={getStepCircleClass(4, currentStep, isPaid)}>
                {isPaid && <CheckCircle2 size={14} />}
                {!isPaid && <Key size={13} />}
              </div>
              <span className={getStepLabelClass(4, currentStep, isPaid)}>Ready</span>
              <span className="stepper-node-sub">Box #06</span>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* IOT STAGE SAFEGUARD & LIVE HARDWARE STATUS CARD               */}
        {/* Shown during Stages 1, 2, and 3 to reassure customer          */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="stage-context-box">
            <div className="stage-context-icon icon-amber">
              <ShieldCheck size={18} />
            </div>
            <div className="stage-context-body">
              <h4 className="stage-context-title">Locker Box #{activeOrder.lockerNumber} Secured</h4>
              <p className="stage-context-desc">
                Your clothes are safely locked inside compartment #{activeOrder.lockerNumber}. Our route driver will collect your laundry bag for the intake route shortly.
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="stage-context-box">
            <div className="stage-context-icon icon-blue">
              <Truck size={18} />
            </div>
            <div className="stage-context-body">
              <h4 className="stage-context-title">Collected by Route Driver</h4>
              <p className="stage-context-desc">
                Driver Alex has collected your laundry bag in Van #4 and is en route to Central Laundry Hub for precision weighing and fabric sorting.
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="stage-context-box">
            <div className="stage-context-icon icon-purple">
              <img 
                src={inwashMachineIcon} 
                alt="Washing Cycle" 
                className="inwash-context-icon" 
              />
            </div>
            <div className="stage-context-body">
              <h4 className="stage-context-title">Washing & Folding Cycle Active</h4>
              <p className="stage-context-desc">
                Your garments are currently undergoing wash, dry, and professional folding according to your custom preferences at Central Laundry Hub.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ORDER SPECIFICATIONS & PREFERENCES CARD                       */}
        {/* ------------------------------------------------------------- */}
        <div className="order-specs-card">
          <div className="specs-card-header">
            <h4 className="specs-card-title">Order Specifications</h4>
            <span className="specs-hub-tag">Central Hub</span>
          </div>

          <div className="specs-grid-2">
            <div className="spec-item">
              <span className="spec-label">Service Type:</span>
              <span className="spec-value-strong">{activeOrder.serviceType}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Load Size:</span>
              <span className="spec-value-strong">{activeOrder.loadSize}</span>
            </div>
          </div>

          {/* Preferences Badges Row */}
          <div className="specs-badges-row">
            <span className={getTemperatureBadgeClass(activeOrder.temperature)}>
              {activeOrder.temperature}
            </span>
            <span className={getSoftenerBadgeClass(activeOrder.fabricSoftener)}>
              {getFabricSoftenerText(activeOrder.fabricSoftener)}
            </span>
            <span className="spec-badge-chip est-weight-chip">
              Est. {displayWeight} kg
            </span>
          </div>

          {/* Special Instructions Note (Shown only when present) */}
          {showSpecialNotes && (
            <div className="specs-note-callout">
              <span className="notes-label">Special Notes:</span>
              <span className="notes-content">"{activeOrder.specialInstructions}"</span>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STAGE 4: DELIVERY COMPLETE & PAYMENT INVOICE (Before Payment)  */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && !isPaid && (
          <div className="checkout-invoice-card">
            <div className="invoice-header">
              <div className="invoice-tag">Locker Delivery Complete</div>
              <h4 className="invoice-title">Clean Laundry Ready at Box #06</h4>
              <p className="invoice-subtext">
                Intake weight verified at {bill.weight} kg • Professional Care Package
              </p>
            </div>

            {/* Itemized Billing Breakdown Box */}
            <div className="invoice-breakdown-box">
              <div className="breakdown-header">
                <span className="breakdown-header-title">Itemized Billing Breakdown</span>
                <span className="breakdown-tag">Verified Rate</span>
              </div>

              <div className="breakdown-rows-list">
                {/* Line 1: Primary Laundry Service */}
                <div className="breakdown-row">
                  <div className="breakdown-item-info">
                    <span className="breakdown-item-name">{bill.serviceName}</span>
                    <span className="breakdown-item-sub">
                      {bill.weight} kg verified @ ₱{bill.ratePerKg}/kg
                    </span>
                  </div>
                  <span className="breakdown-item-amount">₱{bill.baseServiceCost}</span>
                </div>

                {/* Line 2: Fabric Softener (Rendered only if customer selected softener) */}
                {bill.hasSoftener && (
                  <div className="breakdown-row">
                    <div className="breakdown-item-info">
                      <span className="breakdown-item-name">Fabric Softener Care</span>
                      <span className="breakdown-item-sub">Downy Sunrise Fresh • Add-on</span>
                    </div>
                    <span className="breakdown-item-amount">₱{bill.softenerFee}</span>
                  </div>
                )}

                {/* Line 3: Smart Locker Box UV Sanitization */}
                <div className="breakdown-row">
                  <div className="breakdown-item-info">
                    <span className="breakdown-item-name">Smart Locker Storage</span>
                    <span className="breakdown-item-sub">Box #06 • UV-C Sanitized Compartment</span>
                  </div>
                  <span className="breakdown-free-badge">FREE</span>
                </div>
              </div>

              {/* Total Summary Row */}
              <div className="invoice-total-row">
                <div className="invoice-total-meta">
                  <span className="invoice-total-label">Total Amount Due</span>
                  <span className="invoice-total-sub">Includes 12% VAT & Terminal Fees</span>
                </div>
                <span className="invoice-total-amount">₱{bill.totalAmount}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-section">
              <span className="payment-section-title">Select Payment Method</span>
              <div className="payment-options-grid">
                <button
                  type="button"
                  onClick={function () { setSelectedPayment('GCash'); }}
                  className={getPayMethodClass('GCash', selectedPayment)}
                >
                  <span className="pay-method-name">GCash</span>
                </button>
                <button
                  type="button"
                  onClick={function () { setSelectedPayment('Maya'); }}
                  className={getPayMethodClass('Maya', selectedPayment)}
                >
                  <span className="pay-method-name">Maya</span>
                </button>
                <button
                  type="button"
                  onClick={function () { setSelectedPayment('Card'); }}
                  className={getPayMethodClass('Card', selectedPayment)}
                >
                  <span className="pay-method-name">Card</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayAndUnlockClick}
              className="pay-checkout-cta-btn"
            >
              <CreditCard size={18} />
              <span>Pay ₱{bill.totalAmount} & Unlock Box #06</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 4: POST-PAYMENT CLAIM PASS WITH 6-DIGIT PIN             */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && isPaid && (
          <div className="claim-pickup-pass">
            <div className="claim-success-icon">
              <PackageCheck size={28} />
            </div>

            <div className="claim-text-center">
              <h3 className="claim-pass-title">Payment Confirmed</h3>
              <p className="claim-pass-subtitle">
                Your fresh, folded laundry is waiting in <strong>Locker Box #06</strong>
              </p>
            </div>

            {/* Monospace 6-Digit PIN Display */}
            <div className="claim-pin-wrapper">
              <span className="claim-pin-label">Locker Touchscreen PIN</span>
              <div className="claim-digits-grid">
                <div className="digit-card">8</div>
                <div className="digit-card">4</div>
                <div className="digit-card">2</div>
                <div className="digit-card">0</div>
                <div className="digit-card">1</div>
                <div className="digit-card">9</div>
              </div>
              <span className="claim-pin-help">
                Enter PIN on the locker kiosk or tap below to unlock directly
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenLockerDoorClick}
              className="unlock-now-cta-btn"
            >
              <Lock size={18} />
              <span>Tap to Open Locker Box #06 Now</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
