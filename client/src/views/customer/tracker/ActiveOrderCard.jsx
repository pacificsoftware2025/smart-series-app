import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Clock, CheckCircle2, Sparkles, ShieldAlert, Truck, Lock, CreditCard, Key } from 'lucide-react';
import './ActiveOrderCard.css';

// ==============================================================================
// HELPER FUNCTIONS (Vanilla JS Logic)
// In Vanilla JS, you use standard if/else statements instead of nested ternaries.
// This fulfills Rule 1: "A 5-line readable solution is better than a 1-line expression."
// ==============================================================================

// Determines the CSS class for each circle in the 4-step progress stepper.
function getStepCircleClass(stepNumber, activeStep, isPaid) {
  // If we are at Step 4 and already paid, Step 4 is complete.
  if (stepNumber === 4 && isPaid) {
    return 'stepper-circle step-done';
  }
  // If the step is already passed, it gets the green 'done' style.
  if (stepNumber < activeStep) {
    return 'stepper-circle step-done';
  }
  // If this step is currently in progress, it gets the orange active style.
  if (stepNumber === activeStep) {
    return 'stepper-circle step-current';
  }
  // Otherwise, it's pending (gray).
  return 'stepper-circle step-pending';
}

// Determines the CSS class for the step title text.
function getStepTitleClass(stepNumber, activeStep) {
  if (stepNumber === activeStep) {
    return 'step-title step-current-text';
  }
  return 'step-title';
}

// Determines the order headline based on current progress.
function getOrderHeadline(activeStep, isPaid) {
  if (activeStep === 1) {
    return 'Dropped Off in Locker';
  }
  if (activeStep === 2) {
    return 'Rider Collected Laundry';
  }
  if (activeStep === 3) {
    return 'Wash Day, Underway';
  }
  if (activeStep === 4) {
    if (isPaid) {
      return 'Ready for Pickup!';
    }
    return 'Delivered & Payment Due';
  }
  return 'Wash Day, Underway';
}

// Determines the in-progress status pill text without nested ternaries
function getStatusPillText(step, paid) {
  if (step === 4) {
    if (paid) {
      return 'Ready';
    }
    return 'Payment';
  }
  return 'In Progress';
}

// Determines payment method button CSS class
function getPayMethodClass(method, selected) {
  if (method === selected) {
    return 'pay-method-btn selected-method';
  }
  return 'pay-method-btn';
}

// Determines dev simulator button CSS class
function getDevStepBtnClass(stepNumber, activeStep) {
  if (stepNumber === activeStep) {
    return 'dev-state-btn active-dev-state';
  }
  return 'dev-state-btn';
}

// Determines Yes/No label for fabric softener
function getFabricSoftenerLabel(hasSoftener) {
  if (hasSoftener) {
    return 'Yes';
  }
  return 'No';
}

// Determines if step 3 sparkle icon should spin
function getStep3SparkleClass(step) {
  if (step === 3) {
    return 'animate-spin';
  }
  return '';
}

// Determines meta text for Step 4
function getStep4Meta(paid) {
  if (paid) {
    return 'Box #06';
  }
  return 'PIN on Pay';
}

// ==============================================================================
// REACT COMPONENT: ActiveOrderCard
// Think of this component as a JavaScript function that takes data (props)
// and returns the HTML layout to display on screen.
// ==============================================================================
export function ActiveOrderCard(props) {
  // Props are function arguments passed by the parent component (CustomerView).
  const onSwitchToDropoff = props.onSwitchToDropoff;

  // useAuth() connects to our global user state.
  const auth = useAuth();
  const activeOrder = auth.activeOrder;

  // ============================================================================
  // REACT STATE (useState) explained in Vanilla JS:
  // In Vanilla JS: let currentStep = 3;
  // In React: calling setCurrentStep(newVal) updates the value AND tells React
  // to re-run this function to automatically re-render the HTML on screen.
  // ============================================================================
  const [currentStep, setCurrentStep] = useState(3); // 1 = Dropped, 2 = Rider, 3 = Wash, 4 = Deliver/Pay
  const [selectedPayment, setSelectedPayment] = useState('GCash'); // Currently selected payment method
  const [isPaid, setIsPaid] = useState(false); // Tracks if Step 4 has been paid

  // In Vanilla JS: if (!activeOrder) { container.innerHTML = '...'; return; }
  // In React: if no active order exists, we return the Empty State HTML early.
  if (!activeOrder) {
    return (
      <div className="empty-order-card">
        <div className="empty-icon-bubble">
          <Clock size={28} />
        </div>
        <div>
          <h3 className="empty-title">No Active Laundry Order</h3>
          <p className="empty-desc">
            You don't have any clothes in wash right now. Head over to the Nearby Locker tab to drop off your laundry!
          </p>
        </div>
        {/* In React, onClick={fn} behaves like button.onclick = fn in Vanilla JS */}
        <button onClick={onSwitchToDropoff} className="empty-action-btn">
          Go to Nearby Locker →
        </button>
      </div>
    );
  }

  // Event handler for paying the invoice at Step 4.
  function handlePayAndUnlockClick() {
    setIsPaid(true); // Updates isPaid state to true, causing the screen to show the PIN box
  }

  // Event handler for simulating manual locker door opening after payment.
  function handleOpenLockerDoorClick() {
    alert("⚡ Solenoid Relay Actuated! Locker Box #06 is now OPEN. Please retrieve your clean laundry.");
  }

  return (
    <div className="active-order-wrapper">
      <div className="active-order-main-card">
        
        {/* ------------------------------------------------------------- */}
        {/* DEV STAGE SIMULATOR (Quick buttons to preview all 4 steps)     */}
        {/* ------------------------------------------------------------- */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '4px' }}>
            🧪 Dev Stage Simulator (Click to preview each step):
          </p>
          <div className="dev-state-switcher">
            <button
              onClick={() => { setCurrentStep(1); setIsPaid(false); }}
              className={getDevStepBtnClass(1, currentStep)}
            >
              1. Dropped Off
            </button>
            <button
              onClick={() => { setCurrentStep(2); setIsPaid(false); }}
              className={getDevStepBtnClass(2, currentStep)}
            >
              2. Rider Pickup
            </button>
            <button
              onClick={() => { setCurrentStep(3); setIsPaid(false); }}
              className={getDevStepBtnClass(3, currentStep)}
            >
              3. In Wash
            </button>
            <button
              onClick={() => { setCurrentStep(4); setIsPaid(false); }}
              className={getDevStepBtnClass(4, currentStep)}
            >
              4. Deliver & Pay
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ORDER HEADLINE ROW                                            */}
        {/* ------------------------------------------------------------- */}
        <div className="order-headline-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="order-id-badge">
                Order #{activeOrder.id}
              </span>
              <span className="order-timestamp-text">
                {activeOrder.createdAt}
              </span>
            </div>

            <h3 className="order-card-title">
              {getOrderHeadline(currentStep, isPaid)}
            </h3>

            <p className="est-ready-line">
              <Clock size={14} color="var(--brand-orange)" />
              Est. Ready: <strong>{activeOrder.estimatedReady}</strong>
            </p>
          </div>

          <span className="in-progress-pill">
            {getStatusPillText(currentStep, isPaid)}
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4-STEP PROGRESSION STEPPER                                    */}
        {/* 1. Dropped Off > 2. Rider Pickup > 3. In Wash > 4. Deliver/Pay */}
        {/* ------------------------------------------------------------- */}
        <div className="order-stepper-grid-4">
          
          {/* Step 1: Dropped Off */}
          <div>
            <div className={getStepCircleClass(1, currentStep, isPaid)}>
              {currentStep > 1 && <CheckCircle2 size={14} />}
              {currentStep === 1 && '1'}
            </div>
            <p className={getStepTitleClass(1, currentStep)}>Dropped Off</p>
            <p className="step-meta">Locker #{activeOrder.lockerNumber}</p>
          </div>

          {/* Step 2: Rider Pickup */}
          <div>
            <div className={getStepCircleClass(2, currentStep, isPaid)}>
              {currentStep > 2 && <CheckCircle2 size={14} />}
              {currentStep <= 2 && <Truck size={12} />}
            </div>
            <p className={getStepTitleClass(2, currentStep)}>Rider Pickup</p>
            <p className="step-meta">Van In Transit</p>
          </div>

          {/* Step 3: In Wash */}
          <div>
            <div className={getStepCircleClass(3, currentStep, isPaid)}>
              {currentStep > 3 && <CheckCircle2 size={14} />}
              {currentStep <= 3 && (
                <Sparkles size={12} className={getStep3SparkleClass(currentStep)} />
              )}
            </div>
            <p className={getStepTitleClass(3, currentStep)}>In Wash</p>
            <p className="step-meta">Central Hub</p>
          </div>

          {/* Step 4: Delivery & Payment */}
          <div>
            <div className={getStepCircleClass(4, currentStep, isPaid)}>
              {isPaid && <CheckCircle2 size={14} />}
              {!isPaid && '4'}
            </div>
            <p className={getStepTitleClass(4, currentStep)}>Delivery & Pay</p>
            <p className="step-meta">{getStep4Meta(isPaid)}</p>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* ORDER DETAILS TRAY                                            */}
        {/* ------------------------------------------------------------- */}
        <div className="order-details-tray">
          <div className="detail-row">
            <span>Service Selected:</span>
            <span className="detail-value">{activeOrder.serviceType}</span>
          </div>
          <div className="detail-row">
            <span>Load Size:</span>
            <span className="detail-value">{activeOrder.loadSize}</span>
          </div>
          <div className="detail-row">
            <span>Water Temperature:</span>
            <span className="detail-value">{activeOrder.temperature}</span>
          </div>
          <div className="detail-row">
            <span>Fabric Softener:</span>
            <span className="detail-value" style={{ color: 'var(--emerald-600)' }}>
              {getFabricSoftenerLabel(activeOrder.fabricSoftener)}
            </span>
          </div>
          <div className="detail-row" style={{ paddingTop: '4px', borderTop: '1px solid var(--slate-200)' }}>
            <span>Special Notes:</span>
            <span style={{ fontStyle: 'italic', maxWidth: '200px', textAlign: 'right' }}>
              "{activeOrder.specialInstructions}"
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONDITIONAL RENDERING (Like an if/else in Vanilla JS)         */}
        {/* Stages 1, 2, 3: Explain why locker door is safely locked       */}
        {/* ------------------------------------------------------------- */}
        {currentStep < 4 && (
          <div className="safeguard-locked-box">
            <ShieldAlert size={18} color="var(--amber-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p className="safeguard-heading">
                {currentStep === 1 && `Locker Box #${activeOrder.lockerNumber} is Secured`}
                {currentStep === 2 && 'Collected by Driver Alex (Van #4)'}
                {currentStep === 3 && 'Washing & Folding at Central Facility'}
              </p>
              <p className="safeguard-desc">
                {currentStep === 1 && 'Your clothes are safely inside the locker waiting for the van rider to collect for the morning route.'}
                {currentStep === 2 && 'Your bag is loaded in the van and en route to the central facility for intake weighing.'}
                {currentStep === 3 && 'Your garments are currently in the wash and dry cycle. Locker unlock will re-enable once the clean laundry is returned to the locker.'}
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 4: DELIVERY & PAYMENT INVOICE (Before user pays)        */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && !isPaid && (
          <div className="billing-payment-card">
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--brand-orange)' }}>
                Clean Laundry Delivered to Box #06
              </span>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '2px' }}>
                Weighed & Invoiced Total
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                5.2 kg Standard care @ ₱60/kg + Fabric Softener
              </p>
            </div>

            <div className="billing-total-row">
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-600)' }}>Total Due:</span>
              <span className="billing-total-amount">₱337.00</span>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-selector">
              <button
                type="button"
                onClick={() => setSelectedPayment('GCash')}
                className={getPayMethodClass('GCash', selectedPayment)}
              >
                GCash
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayment('Maya')}
                className={getPayMethodClass('Maya', selectedPayment)}
              >
                Maya
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayment('Card')}
                className={getPayMethodClass('Card', selectedPayment)}
              >
                Credit Card
              </button>
            </div>

            <button
              onClick={handlePayAndUnlockClick}
              className="pay-unlock-cta-btn"
            >
              <CreditCard size={16} />
              <span>Pay ₱337.00 to Unlock Pickup Box #06</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 4 AFTER PAYMENT: CLAIM SCREEN WITH 6-DIGIT PIN          */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && isPaid && (
          <div className="claim-pin-box">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--emerald-100)', color: 'var(--emerald-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Key size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--emerald-800)' }}>
                Payment Received! Pick Up at Box #06
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--emerald-700)' }}>
                Enter this 6-digit PIN on the locker kiosk or tap to unlock:
              </p>
            </div>

            <div className="pin-digits-row">
              <div className="pin-digit-cell">8</div>
              <div className="pin-digit-cell">4</div>
              <div className="pin-digit-cell">2</div>
              <div className="pin-digit-cell">0</div>
              <div className="pin-digit-cell">1</div>
              <div className="pin-digit-cell">9</div>
            </div>

            <button
              onClick={handleOpenLockerDoorClick}
              className="pay-unlock-cta-btn"
              style={{ background: 'var(--emerald-600)' }}
            >
              <Lock size={16} />
              <span>Tap to Open Locker Box #06 Now</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
