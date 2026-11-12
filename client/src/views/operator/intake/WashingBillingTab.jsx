import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  CheckCircle2, 
  Printer, 
  Plus, 
  Minus, 
  Search, 
  Bell
} from 'lucide-react';
import './WashingBillingTab.css';

// Default list of incoming bags arrived from drivers
const INITIAL_INCOMING_BAGS = [
  {
    bagTag: 'BAG-6204',
    orderId: 'ORD-6204',
    customerName: 'Patricia Reyes',
    customerPhone: '+63 918 555 7788',
    stationName: 'Greenbelt Transit Hub (Bay 4)',
    lockerNumber: '11',
    serviceType: 'Wash Only',
    loadSizeTier: 'Small (Max 5kg)',
    temperature: 'Cold Wash',
    fabricSoftener: false,
    specialInstructions: 'Delicate fabrics, please separate whites',
    ratePerKg: 40.00,
    defaultWeight: 3.5,
    status: 'pending_intake', // 'pending_intake' | 'in_wash'
  },
  {
    bagTag: 'BAG-8821',
    orderId: 'ORD-8421',
    customerName: 'Jamie Davis',
    customerPhone: '+63 917 000 0000',
    stationName: 'Central Mall Hub (Level 1 East)',
    lockerNumber: '03',
    serviceType: 'Wash, Dry & Fold',
    loadSizeTier: 'Medium (Max 7kg)',
    temperature: 'Cold Wash',
    fabricSoftener: true,
    specialInstructions: 'Standard care, gentle fold',
    ratePerKg: 60.00,
    defaultWeight: 5.2,
    status: 'pending_intake',
  },
  {
    bagTag: 'BAG-7719',
    orderId: 'ORD-7719',
    customerName: 'Carlos Mendoza',
    customerPhone: '+63 915 222 3344',
    stationName: 'North Plaza Hub (Tower B)',
    lockerNumber: '07',
    serviceType: 'Wash & Dry',
    loadSizeTier: 'Large (Max 9kg)',
    temperature: 'Warm Wash',
    fabricSoftener: true,
    specialInstructions: 'Gym wear, active fresh cycle',
    ratePerKg: 55.00,
    defaultWeight: 7.4,
    status: 'pending_intake',
  },
];

// ==============================================================================
// REACT COMPONENT: WashingBillingTab
// Ultra-clean, Stripe-inspired intake workstation:
// - Left: Streamlined master list of pending laundry bags with live Order IDs
// - Right: Clean Billing canvas with verified scale weight & dynamic line items
// ==============================================================================
export function WashingBillingTab(props) {
  const onStatusChange = props.onStatusChange;

  const auth = useAuth();
  const activeOrder = auth.activeOrder;
  const user = auth.user;

  // Initialize bags list, integrating live activeOrder if present
  const [bagsList, setBagsList] = useState(function () {
    if (activeOrder && activeOrder.id) {
      let custName = 'Jamie Davis';
      if (user && user.name) {
        custName = user.name;
      }
      let bagTagCode = 'BAG-8821';
      if (activeOrder.laundryBagNumber) {
        bagTagCode = activeOrder.laundryBagNumber;
      }
      let boxNum = '03';
      if (activeOrder.lockerNumber) {
        boxNum = activeOrder.lockerNumber;
      }
      let service = 'Wash, Dry & Fold';
      if (activeOrder.serviceType) {
        service = activeOrder.serviceType;
      }
      let loadSize = 'Medium (Max 7kg)';
      if (activeOrder.loadSize) {
        loadSize = activeOrder.loadSize;
      }
      let temp = 'Cold Wash';
      if (activeOrder.temperature) {
        temp = activeOrder.temperature;
      }
      let softener = true;
      if (activeOrder.fabricSoftener !== undefined) {
        softener = activeOrder.fabricSoftener;
      }
      let notes = 'Standard care';
      if (activeOrder.specialInstructions) {
        notes = activeOrder.specialInstructions;
      }
      let weight = 5.2;
      if (activeOrder.weightKg) {
        weight = activeOrder.weightKg;
      }

      const liveBag = {
        bagTag: bagTagCode,
        orderId: activeOrder.id,
        customerName: custName,
        customerPhone: '+63 917 000 0000',
        stationName: 'Central Mall Hub (Level 1 East)',
        lockerNumber: boxNum,
        serviceType: service,
        loadSizeTier: loadSize,
        temperature: temp,
        fabricSoftener: softener,
        specialInstructions: notes,
        ratePerKg: 60.00,
        defaultWeight: weight,
        status: 'pending_intake',
      };
      return [liveBag, INITIAL_INCOMING_BAGS[0], INITIAL_INCOMING_BAGS[2]];
    }
    return INITIAL_INCOMING_BAGS;
  });

  const [selectedBag, setSelectedBag] = useState(function () {
    if (activeOrder && activeOrder.id) {
      let custName = 'Jamie Davis';
      if (user && user.name) {
        custName = user.name;
      }
      let bagTagCode = 'BAG-8821';
      if (activeOrder.laundryBagNumber) {
        bagTagCode = activeOrder.laundryBagNumber;
      }
      let boxNum = '03';
      if (activeOrder.lockerNumber) {
        boxNum = activeOrder.lockerNumber;
      }
      let service = 'Wash, Dry & Fold';
      if (activeOrder.serviceType) {
        service = activeOrder.serviceType;
      }
      let loadSize = 'Medium (Max 7kg)';
      if (activeOrder.loadSize) {
        loadSize = activeOrder.loadSize;
      }
      let temp = 'Cold Wash';
      if (activeOrder.temperature) {
        temp = activeOrder.temperature;
      }
      let softener = true;
      if (activeOrder.fabricSoftener !== undefined) {
        softener = activeOrder.fabricSoftener;
      }
      let notes = 'Standard care';
      if (activeOrder.specialInstructions) {
        notes = activeOrder.specialInstructions;
      }
      let weight = 5.2;
      if (activeOrder.weightKg) {
        weight = activeOrder.weightKg;
      }

      return {
        bagTag: bagTagCode,
        orderId: activeOrder.id,
        customerName: custName,
        customerPhone: '+63 917 000 0000',
        stationName: 'Central Mall Hub (Level 1 East)',
        lockerNumber: boxNum,
        serviceType: service,
        loadSizeTier: loadSize,
        temperature: temp,
        fabricSoftener: softener,
        specialInstructions: notes,
        ratePerKg: 60.00,
        defaultWeight: weight,
        status: 'pending_intake',
      };
    }
    return INITIAL_INCOMING_BAGS[0];
  });

  const [scannedInput, setScannedInput] = useState('');
  
  // Total weight and additional charges for the active bag in Billing
  const [totalWeight, setTotalWeight] = useState(function () {
    if (selectedBag && selectedBag.defaultWeight) {
      return selectedBag.defaultWeight;
    }
    return 5.2;
  });

  const [hasStainTreatment, setHasStainTreatment] = useState(false);
  const [hasHeavyBlanket, setHasHeavyBlanket] = useState(false);
  const [hasExpressRush, setHasExpressRush] = useState(false);
  
  // Notification banner state
  const [notificationMsg, setNotificationMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    
    let weightToSet = 5.2;
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

  // Billing Calculations (Vanilla JS math)
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
  // ACTION: Notify Customer & Change Status to IN WASH
  // ============================================================================
  function handleNotifyAndStartWash() {
    if (!selectedBag) {
      return;
    }

    setIsProcessing(true);

    setTimeout(function () {
      setIsProcessing(false);

      // Update local bag state to 'in_wash'
      const updatedList = bagsList.map(function (b) {
        if (b.bagTag === selectedBag.bagTag) {
          return Object.assign({}, b, {
            status: 'in_wash',
            verifiedWeight: totalWeight,
            finalTotal: totalAmountDue,
          });
        }
        return b;
      });
      setBagsList(updatedList);

      // Notification banner text
      setNotificationMsg(
        'SMS sent to ' + selectedBag.customerName + ' (' + selectedBag.customerPhone + ') • ' +
        'Verified: ' + totalWeight + ' kg • Total: ₱' + totalAmountDue + ' • ' +
        'Order #' + selectedBag.orderId + ' moved to IN WASH'
      );

      // Trigger global status callback to sync customer active dashboard tracker
      if (onStatusChange) {
        onStatusChange(selectedBag.orderId, 'in_wash', {
          weightKg: totalWeight,
          finalAmountDue: parseFloat(totalAmountDue),
        });
      }
    }, 600);
  }

  function handlePrintTag() {
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

        {/* List of Pending Bags */}
        <div className="clean-bags-list">
          {bagsList.map(function (bag) {
            const isWashActive = bag.status === 'in_wash';

            return (
              <div
                key={bag.bagTag}
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

      </div>

      {/* --------------------------------------------------------------- */}
      {/* RIGHT COLUMN: BILLING TERMINAL (Clean Stripe-Style Canvas)      */}
      {/* --------------------------------------------------------------- */}
      <div className="clean-pos-panel">
        
        {/* Toast / Notification Banner */}
        {notificationMsg !== '' && (
          <div className="clean-notification-toast">
            <CheckCircle2 size={16} color="#059669" />
            <span>{notificationMsg}</span>
          </div>
        )}

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

      </div>

    </div>
  );
}
