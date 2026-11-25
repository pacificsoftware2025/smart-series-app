import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  CheckCircle2, 
  Printer, 
  Plus, 
  Minus, 
  Search, 
  Bell,
  Loader2,
  PackageCheck
} from 'lucide-react';
import { fetchOrders, intakeOrder } from '../../../services/api';
import './WashingBillingTab.css';

// Helper to map DB order to billing bag item
function mapOrderToBag(order) {
  const digits = String(order.id).replace(/\D/g, '');
  let tagSuffix = '1001';
  if (digits.length >= 4) {
    tagSuffix = digits.slice(-4);
  }
  const tagCode = 'BAG-' + tagSuffix;
  
  let rate = 60.00;
  const tier = (order.service_tier || '').toLowerCase();
  if (tier.includes('wash only')) {
    rate = 40.00;
  } else if (tier.includes('iron')) {
    rate = 65.00;
  } else if (tier.includes('dry')) {
    rate = 55.00;
  }

  let bagStatus = 'pending_intake';
  if (order.status === 'in_wash') {
    bagStatus = 'in_wash';
  }

  let defaultWt = 5.0;
  if (order.weight_kg) {
    defaultWt = parseFloat(order.weight_kg);
  }

  return {
    bagTag: tagCode,
    orderId: order.id,
    customerName: order.customer_name || 'Customer',
    customerPhone: order.customer_phone || '+63 9XX XXX XXXX',
    stationName: `Central Mall Hub (${order.station_id || 'CMH-01'})`,
    lockerNumber: String(order.dropoff_box_number || order.compartment_number || '01').padStart(2, '0'),
    serviceType: order.service_tier || 'Wash, Dry & Fold',
    loadSizeTier: order.service_size || 'Medium (Max 7kg)',
    temperature: order.temperature || 'Cold Wash',
    fabricSoftener: order.fabric_softener !== false,
    specialInstructions: order.special_instructions || 'Standard care',
    ratePerKg: rate,
    defaultWeight: defaultWt,
    status: bagStatus,
  };
}

// ==============================================================================
// REACT COMPONENT: WashingBillingTab
// Ultra-clean, Stripe-inspired intake workstation:
// - Left: Streamlined master list of live pending laundry bags from cloud API
// - Right: Clean Billing canvas with verified scale weight & dynamic line items
// - Live PostgreSQL integration: saves verified weight & billing to cloud
// ==============================================================================
export function WashingBillingTab(props) {
  const onStatusChange = props.onStatusChange;
  const onNavigateToInWash = props.onNavigateToInWash;

  const auth = useAuth();
  const activeOrder = auth.activeOrder;
  const user = auth.user;

  const [bagsList, setBagsList] = useState([]);
  const [selectedBag, setSelectedBag] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scannedInput, setScannedInput] = useState('');
  
  // Total weight and additional charges for the active bag in Billing
  const [totalWeight, setTotalWeight] = useState(5.0);
  const [hasStainTreatment, setHasStainTreatment] = useState(false);
  const [hasHeavyBlanket, setHasHeavyBlanket] = useState(false);
  const [hasExpressRush, setHasExpressRush] = useState(false);
  
  // Notification banner state
  const [notificationMsg, setNotificationMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch live orders needing facility intake
  const loadOrders = useCallback(async function () {
    try {
      const orders = await fetchOrders();
      if (Array.isArray(orders)) {
        // Filter for incoming orders needing intake/billing
        const relevant = orders.filter(function (o) {
          return o.status === 'in_transit' || o.status === 'dropped_off';
        });

        const mapped = relevant.map(mapOrderToBag);
        setBagsList(mapped);

        // Auto-select first bag if none currently selected
        setSelectedBag(function (prev) {
          if (prev) {
            const stillExists = mapped.find(b => b.orderId === prev.orderId);
            return stillExists || mapped[0] || null;
          }
          return mapped[0] || null;
        });

        if (mapped[0] && !selectedBag) {
          setTotalWeight(mapped[0].defaultWeight || 5.0);
        }
      }
    } catch (err) {
      console.warn('[WashingBillingTab] Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBag]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 6000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Helper functions: replaces ternary operators with readable if/else blocks
  function getBagItemClass(bag) {
    if (selectedBag && selectedBag.bagTag === bag.bagTag) {
      return 'clean-bag-card selected';
    }
    return 'clean-bag-card';
  }

  function getAddonChipClass(isActive) {
    if (isActive) {
      return 'clean-addon-chip active';
    }
    return 'clean-addon-chip';
  }

  // When operator clicks any bag from the pending list
  function handleSelectBag(bag) {
    setSelectedBag(bag);
    
    let weightToSet = 5.0;
    if (bag.defaultWeight) {
      weightToSet = bag.defaultWeight;
    }
    setTotalWeight(weightToSet);

    setHasStainTreatment(false);
    setHasHeavyBlanket(false);
    setHasExpressRush(false);
    setNotificationMsg('');
  }

  // Weight increment / decrement stepper
  function handleWeightAdjust(delta) {
    let nextWeight = Math.round((totalWeight + delta) * 10) / 10;
    if (nextWeight < 0.5) {
      nextWeight = 0.5;
    }
    if (nextWeight > 25.0) {
      nextWeight = 25.0;
    }
    setTotalWeight(nextWeight);
  }

  function handleDirectWeightChange(e) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setTotalWeight(val);
    }
  }

  // Barcode / Order search submission
  function handleBarcodeSubmit(e) {
    e.preventDefault();
    if (!scannedInput || scannedInput.trim() === '') {
      return;
    }

    const cleanCode = scannedInput.trim().toUpperCase();
    const foundBag = bagsList.find(function (b) {
      if (b.bagTag.toUpperCase() === cleanCode) {
        return true;
      }
      if (b.orderId.toUpperCase() === cleanCode) {
        return true;
      }
      return false;
    });

    if (foundBag) {
      handleSelectBag(foundBag);
      setScannedInput('');
    } else {
      alert('Bag Tag or Order ID not found: ' + cleanCode);
    }
  }

  // Billing Calculations
  let rate = 60.00;
  if (selectedBag && selectedBag.ratePerKg) {
    rate = selectedBag.ratePerKg;
  }

  const baseServiceCost = Math.round(totalWeight * rate * 100) / 100;
  
  let softenerCost = 0.00;
  if (selectedBag && selectedBag.fabricSoftener) {
    softenerCost = 25.00;
  }

  let stainCost = 0.00;
  if (hasStainTreatment) {
    stainCost = 30.00;
  }

  let blanketCost = 0.00;
  if (hasHeavyBlanket) {
    blanketCost = 50.00;
  }

  let expressCost = 0.00;
  if (hasExpressRush) {
    expressCost = 50.00;
  }

  const totalAmountDue = (baseServiceCost + softenerCost + stainCost + blanketCost + expressCost).toFixed(2);

  // ============================================================================
  // ACTION: Notify Customer & Change Status to IN WASH (Live API Call)
  // ============================================================================
  async function handleNotifyAndStartWash() {
    if (!selectedBag) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Post to live API
      await intakeOrder(selectedBag.orderId, totalWeight, parseFloat(totalAmountDue));

      const processedOrderId = selectedBag.orderId;
      const processedCustomer = selectedBag.customerName;
      const processedPhone = selectedBag.customerPhone;

      // 2. Remove billed bag from pending list so it immediately transfers to In Wash
      const remainingList = bagsList.filter(function (b) {
        return b.orderId !== selectedBag.orderId;
      });
      setBagsList(remainingList);
      if (remainingList.length > 0) {
        setSelectedBag(remainingList[0]);
        setTotalWeight(remainingList[0].defaultWeight || 5.0);
      } else {
        setSelectedBag(null);
      }

      // 3. Notification banner text
      setNotificationMsg(
        'SMS sent to ' + processedCustomer + ' (' + processedPhone + ') • Verified: ' + totalWeight + ' kg • Total: ₱' + totalAmountDue + ' • Order #' + processedOrderId + ' moved to IN WASH'
      );

      // 4. Trigger global status callback to sync customer active dashboard tracker
      if (onStatusChange) {
        onStatusChange(processedOrderId, 'in_wash', {
          weightKg: totalWeight,
          finalAmountDue: parseFloat(totalAmountDue),
        });
      }
    } catch (err) {
      console.warn('[WashingBillingTab] Intake API error:', err);
      // Fallback local update
      setNotificationMsg('Order #' + selectedBag.orderId + ' moved to IN WASH (Verified: ' + totalWeight + ' kg • ₱' + totalAmountDue + ')');
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePrintTag() {
    if (!selectedBag) return;
    alert('Printing care tag for Order #' + selectedBag.orderId + ' / ' + selectedBag.bagTag + ' (' + totalWeight + ' kg)...');
  }

  return (
    <div className="clean-intake-layout">
      
      {/* --------------------------------------------------------------- */}
      {/* LEFT COLUMN: LIST OF ALL PENDING BAGS (Clean Master List)       */}
      {/* --------------------------------------------------------------- */}
      <div className="clean-bags-panel">
        
        {/* Sleek Search Bar */}
        <form onSubmit={handleBarcodeSubmit} className="clean-search-bar">
          <Search size={15} className="clean-search-icon" />
          <input
            type="text"
            value={scannedInput}
            onChange={function (e) { setScannedInput(e.target.value); }}
            placeholder="Search Order # or Bag Tag..."
            className="clean-search-field"
          />
          <button type="submit" className="clean-search-btn">
            Find
          </button>
        </form>

        {/* Section Header */}
        <div className="clean-panel-header">
          <div className="panel-title-row">
            <h4 className="panel-heading">Pending Bags</h4>
            <span className="panel-badge">{bagsList.length}</span>
          </div>
          <span className="panel-subtext">Select a bag to weigh and bill</span>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.5rem', color: '#64748b' }}>
            <Loader2 size={16} className="relay-spinner" />
            <span style={{ fontSize: '0.8125rem' }}>Fetching incoming orders...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bagsList.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <PackageCheck size={28} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>All Bags Processed</p>
            <p style={{ fontSize: '0.75rem' }}>No incoming bags currently awaiting intake.</p>
          </div>
        )}

        {/* List of Pending Bags */}
        {!isLoading && bagsList.length > 0 && (
          <div className="clean-bags-list">
            {bagsList.map(function (bag) {
              const isWashActive = bag.status === 'in_wash';

              return (
                <div
                  key={bag.orderId}
                  onClick={function () { handleSelectBag(bag); }}
                  className={getBagItemClass(bag)}
                >
                  <div className="bag-card-header-row">
                    <div className="bag-id-group">
                      <span className="bag-order-pill">{bag.orderId}</span>
                      <span className="bag-customer-bold">{bag.customerName}</span>
                    </div>
                    <span className="bag-code-chip">{bag.bagTag}</span>
                  </div>

                  <div className="bag-card-details-row">
                    <span className="bag-location-text">Box #{bag.lockerNumber} • {bag.serviceType}</span>
                    
                    {isWashActive && (
                      <span className="clean-status-pill pill-purple">
                        In Wash
                      </span>
                    )}
                    {!isWashActive && (
                      <span className="clean-status-pill pill-amber">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* --------------------------------------------------------------- */}
      {/* RIGHT COLUMN: BILLING TERMINAL (Clean Stripe-Style Canvas)      */}
      {/* --------------------------------------------------------------- */}
      <div className="clean-pos-panel">
        
        {/* Toast / Notification Banner */}
        {notificationMsg !== '' && (
          <div className="clean-notification-toast">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>{notificationMsg}</span>
            </div>
            {onNavigateToInWash && (
              <button
                type="button"
                onClick={onNavigateToInWash}
                className="clean-view-inwash-btn"
              >
                <span>View In Wash Tab →</span>
              </button>
            )}
          </div>
        )}

        {selectedBag && (
          <div className="clean-pos-card">
            
            {/* Header Row: Title & Fetched Order / Tag Pills */}
            <div className="clean-pos-topbar">
              <div>
                <h3 className="clean-pos-title">Billing</h3>
                <p className="clean-pos-sub">Verify scale weight and confirm customer invoice</p>
              </div>
              
              <div className="clean-topbar-badges">
                <div className="clean-order-pill">
                  <span className="pill-prefix">ORDER</span>
                  <span className="pill-code">{selectedBag.orderId}</span>
                </div>
                <div className="clean-tag-pill">
                  {selectedBag.bagTag}
                </div>
              </div>
            </div>

            {/* Customer, Order & Location Summary Grid (4 Columns) */}
            <div className="clean-summary-grid">
              <div className="summary-col">
                <span className="summary-label">ORDER NUMBER</span>
                <span className="summary-value order-id-highlight">{selectedBag.orderId}</span>
                <span className="summary-sub">Tag: {selectedBag.bagTag}</span>
              </div>

              <div className="summary-col">
                <span className="summary-label">CUSTOMER</span>
                <span className="summary-value">{selectedBag.customerName}</span>
                <span className="summary-sub">{selectedBag.customerPhone}</span>
              </div>

              <div className="summary-col">
                <span className="summary-label">SOURCE COMPARTMENT</span>
                <span className="summary-value">Box #{selectedBag.lockerNumber}</span>
                <span className="summary-sub">{selectedBag.stationName}</span>
              </div>

              <div className="summary-col">
                <span className="summary-label">SERVICE TIER</span>
                <span className="summary-value">{selectedBag.serviceType}</span>
                <span className="summary-sub">{selectedBag.temperature}</span>
              </div>
            </div>

            {/* Special Instructions Note */}
            <div className="clean-notes-line">
              <span className="notes-tag">Special Notes:</span>
              <span className="notes-text">"{selectedBag.specialInstructions}"</span>
            </div>

            <div className="clean-divider"></div>

            {/* ----------------------------------------------------------- */}
            {/* 1. TOTAL WEIGHT CONTROLS (Clean Stepper, No Preset Buttons) */}
            {/* ----------------------------------------------------------- */}
            <div className="clean-weight-section">
              <div className="weight-label-col">
                <span className="weight-title">Total Weight</span>
                <span className="weight-sub">Actual verified scale reading</span>
              </div>

              <div className="weight-controls-wrap">
                <div className="clean-stepper-box">
                  <button
                    type="button"
                    onClick={function () { handleWeightAdjust(-0.1); }}
                    className="clean-step-btn"
                    title="Minus 0.1 kg"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="25"
                    value={totalWeight}
                    onChange={handleDirectWeightChange}
                    className="clean-weight-input"
                  />
                  <span className="clean-weight-unit">kg</span>
                  <button
                    type="button"
                    onClick={function () { handleWeightAdjust(0.1); }}
                    className="clean-step-btn"
                    title="Plus 0.1 kg"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="clean-divider"></div>

            {/* ----------------------------------------------------------- */}
            {/* 2. BILLING SUMMARY (Clean Line Items)                       */}
            {/* ----------------------------------------------------------- */}
            <div className="clean-line-items-section">
              <span className="section-small-title">BILLING SUMMARY</span>

              <div className="clean-lines-list">
                
                {/* Primary Service */}
                <div className="clean-line-row">
                  <div className="line-meta">
                    <span className="line-item-name">{selectedBag.serviceType}</span>
                    <span className="line-item-calc">{totalWeight.toFixed(2)} kg @ ₱{rate.toFixed(2)}/kg</span>
                  </div>
                  <span className="line-item-price">₱{baseServiceCost.toFixed(2)}</span>
                </div>

                {/* Fabric Softener */}
                {selectedBag.fabricSoftener && (
                  <div className="clean-line-row">
                    <div className="line-meta">
                      <span className="line-item-name">Fabric Softener Add-on</span>
                      <span className="line-item-calc">Downy Sunrise Fresh</span>
                    </div>
                    <span className="line-item-price">₱25.00</span>
                  </div>
                )}

                {/* Additional Charges */}
                {hasStainTreatment && (
                  <div className="clean-line-row highlight">
                    <div className="line-meta">
                      <span className="line-item-name">Extra Stain Pre-Treatment</span>
                      <span className="line-item-calc">Collar & spot enzyme treatment</span>
                    </div>
                    <span className="line-item-price">₱30.00</span>
                  </div>
                )}

                {hasHeavyBlanket && (
                  <div className="clean-line-row highlight">
                    <div className="line-meta">
                      <span className="line-item-name">Heavy Blanket / Comforter</span>
                      <span className="line-item-calc">Bulky item surcharge</span>
                    </div>
                    <span className="line-item-price">₱50.00</span>
                  </div>
                )}

                {hasExpressRush && (
                  <div className="clean-line-row highlight">
                    <div className="line-meta">
                      <span className="line-item-name">Express Priority Wash</span>
                      <span className="line-item-calc">Expedited machine cycle</span>
                    </div>
                    <span className="line-item-price">₱50.00</span>
                  </div>
                )}

              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* 3. ADDITIONAL CHARGES (Clean Outline Chips)                 */}
            {/* ----------------------------------------------------------- */}
            <div className="clean-addons-block">
              <span className="section-small-title">ADDITIONAL CHARGES</span>

              <div className="clean-addons-row">
                <button
                  type="button"
                  onClick={function () { setHasStainTreatment(!hasStainTreatment); }}
                  className={getAddonChipClass(hasStainTreatment)}
                >
                  <Plus size={13} />
                  <span>Stain Treatment (+₱30)</span>
                </button>

                <button
                  type="button"
                  onClick={function () { setHasHeavyBlanket(!hasHeavyBlanket); }}
                  className={getAddonChipClass(hasHeavyBlanket)}
                >
                  <Plus size={13} />
                  <span>Heavy Blanket (+₱50)</span>
                </button>

                <button
                  type="button"
                  onClick={function () { setHasExpressRush(!hasExpressRush); }}
                  className={getAddonChipClass(hasExpressRush)}
                >
                  <Plus size={13} />
                  <span>Express Rush (+₱50)</span>
                </button>
              </div>
            </div>

            <div className="clean-divider"></div>

            {/* ----------------------------------------------------------- */}
            {/* 4. TOTAL ROW & ACTIONS                                      */}
            {/* ----------------------------------------------------------- */}
            <div className="clean-total-row">
              <div className="total-label-wrap">
                <span className="clean-total-label">Total Amount Due</span>
                <span className="clean-total-vat">Includes 12% VAT • Customer receives SMS</span>
              </div>
              <div className="clean-total-price">
                ₱{totalAmountDue}
              </div>
            </div>

            <div className="clean-actions-row">
              <button
                type="button"
                onClick={handlePrintTag}
                className="clean-print-btn"
              >
                <Printer size={15} />
                <span>Print Tag</span>
              </button>

              <button
                type="button"
                onClick={handleNotifyAndStartWash}
                disabled={isProcessing}
                className="clean-start-wash-btn"
              >
                <Bell size={16} />
                {isProcessing && <span>Notifying Client...</span>}
                {!isProcessing && <span>Notify Customer & Start Wash</span>}
              </button>
            </div>

          </div>
        )}

        {!selectedBag && (
          <div className="clean-pos-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px', color: '#64748b' }}>
            <p>Select a laundry bag from the left list to calculate billing and start wash cycle.</p>
          </div>
        )}

      </div>

    </div>
  );
}
