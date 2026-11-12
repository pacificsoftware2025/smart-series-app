import React, { useState } from 'react';
import { 
  Box, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Clock, 
  User, 
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import './LockerMonitoringTab.css';

// Initial 15-Box Smart Locker Hardware Telemetry data
const INITIAL_LOCKERS = [
  {
    boxNumber: '01',
    size: 'Small',
    status: 'available', // 'available' | 'occupied'
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '02',
    size: 'Medium',
    status: 'occupied',
    orderId: 'ORD-8421',
    customerName: 'Carlos Mendoza',
    customerPhone: '+63 915 222 3344',
    droppedTime: 'Dropped 18m ago',
    serviceType: 'Wash, Dry & Fold',
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: false,
  },
  {
    boxNumber: '03',
    size: 'Medium',
    status: 'occupied',
    orderId: 'ORD-8657',
    customerName: 'Jamie Davis',
    customerPhone: '+63 917 000 0000',
    droppedTime: 'Dropped 35m ago',
    serviceType: 'Wash, Dry & Fold',
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: false,
  },
  {
    boxNumber: '04',
    size: 'Large',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '05',
    size: 'Small',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '06',
    size: 'Medium',
    status: 'occupied',
    orderId: 'ORD-5192',
    customerName: 'Roberto Tan',
    customerPhone: '+63 918 444 8822',
    droppedTime: 'Delivered 25m ago',
    serviceType: 'Wash, Dry & Fold',
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '07',
    size: 'Large',
    status: 'occupied',
    orderId: 'ORD-7719',
    customerName: 'Patricia Reyes',
    customerPhone: '+63 918 555 7788',
    droppedTime: 'Dropped 1h ago',
    serviceType: 'Wash Only',
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: false,
  },
  {
    boxNumber: '08',
    size: 'Small',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '09',
    size: 'Medium',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '10',
    size: 'Medium',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '11',
    size: 'Large',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '12',
    size: 'Small',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '13',
    size: 'Medium',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '14',
    size: 'Small',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
  {
    boxNumber: '15',
    size: 'Large',
    status: 'available',
    orderId: null,
    customerName: null,
    customerPhone: null,
    droppedTime: null,
    serviceType: null,
    solenoidLocked: true,
    doorClosed: true,
    sensorClean: true,
  },
];

// ==============================================================================
// REACT COMPONENT: LockerMonitoringTab
// Enterprise-grade, Stripe-inspired locker monitoring workstation:
// - Top KPI summary telemetry metrics
// - Filter and search controls
// - Clean, modern compartment cards with inline door status & controls
// - Interactive locker inspection drawer
// ==============================================================================
export function LockerMonitoringTab() {
  const [lockersList, setLockersList] = useState(INITIAL_LOCKERS);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'available' | 'occupied'
  const [searchQuery, setSearchQuery] = useState('');
  const [actuatingBox, setActuatingBox] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  // Helper functions: replaces ternary operators with readable if/else blocks
  function getFilterBtnClass(filterName) {
    if (activeFilter === filterName) {
      return 'locker-filter-pill active';
    }
    return 'locker-filter-pill';
  }

  function getCardClass(box) {
    let base = 'modern-locker-card';
    if (box.status === 'available') {
      base = base + ' card-available';
    }
    if (box.status === 'occupied') {
      base = base + ' card-occupied';
    }
    if (!box.doorClosed) {
      base = base + ' door-is-open';
    }
    if (selectedBox && selectedBox.boxNumber === box.boxNumber) {
      base = base + ' selected';
    }
    return base;
  }

  function getSizeBadgeClass(size) {
    if (size === 'Large') {
      return 'size-badge size-large';
    }
    if (size === 'Medium') {
      return 'size-badge size-medium';
    }
    return 'size-badge size-small';
  }

  // Filter and search logic
  const filteredLockers = lockersList.filter(function (box) {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = ('box #' + box.boxNumber).toLowerCase().indexOf(q) !== -1 || box.boxNumber.indexOf(q) !== -1;
      let matchOrder = false;
      if (box.orderId && box.orderId.toLowerCase().indexOf(q) !== -1) {
        matchOrder = true;
      }
      let matchCust = false;
      if (box.customerName && box.customerName.toLowerCase().indexOf(q) !== -1) {
        matchCust = true;
      }
      if (!matchNum && !matchOrder && !matchCust) {
        return false;
      }
    }

    if (activeFilter === 'available') {
      if (box.status === 'available') {
        return true;
      }
      return false;
    }

    if (activeFilter === 'occupied') {
      if (box.status === 'occupied') {
        return true;
      }
      return false;
    }

    return true;
  });

  // Calculate live counts
  let availableCount = 0;
  let occupiedCount = 0;
  let openDoorCount = 0;

  for (let i = 0; i < lockersList.length; i = i + 1) {
    if (lockersList[i].status === 'available') {
      availableCount = availableCount + 1;
    } else {
      occupiedCount = occupiedCount + 1;
    }
    if (!lockersList[i].doorClosed) {
      openDoorCount = openDoorCount + 1;
    }
  }

  const totalLockers = lockersList.length;
  const occupancyPercent = Math.round((occupiedCount / totalLockers) * 100);

  // Remote Door Unlock Trigger (operator assistance)
  function handleRemoteUnlock(e, boxNumber) {
    e.stopPropagation();
    setActuatingBox(boxNumber);

    setTimeout(function () {
      setLockersList(function (prev) {
        return prev.map(function (box) {
          if (box.boxNumber === boxNumber) {
            return Object.assign({}, box, {
              solenoidLocked: false,
              doorClosed: false,
            });
          }
          return box;
        });
      });
      setActuatingBox(null);
    }, 800);
  }

  // Remote Door Lock Trigger
  function handleRelock(e, boxNumber) {
    e.stopPropagation();
    setLockersList(function (prev) {
      return prev.map(function (box) {
        if (box.boxNumber === boxNumber) {
          return Object.assign({}, box, {
            solenoidLocked: true,
            doorClosed: true,
          });
        }
        return box;
      });
    });
  }

  function handleRefreshClick() {
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  function handleSelectLocker(box) {
    if (selectedBox && selectedBox.boxNumber === box.boxNumber) {
      setSelectedBox(null);
    } else {
      setSelectedBox(box);
    }
  }

  return (
    <div className="locker-monitoring-container">
      
      {/* --------------------------------------------------------------- */}
      {/* 1. TOP METRICS STRIP                                            */}
      {/* --------------------------------------------------------------- */}
      <div className="locker-kpi-strip">
        <div className="kpi-strip-item">
          <span className="kpi-strip-label">AVAILABLE LOCKERS</span>
          <div className="kpi-strip-value text-green">
            {availableCount} <span className="kpi-total">/ {totalLockers}</span>
          </div>
          <span className="kpi-strip-sub">Ready for customer drop-off</span>
        </div>

        <div className="kpi-strip-item">
          <span className="kpi-strip-label">OCCUPIED LOCKERS</span>
          <div className="kpi-strip-value text-amber">
            {occupiedCount} <span className="kpi-total">({occupancyPercent}%)</span>
          </div>
          <span className="kpi-strip-sub">Active drop-offs awaiting pickup</span>
        </div>

        <div className="kpi-strip-item item-last">
          <span className="kpi-strip-label">DOOR STATUS</span>
          <div className="kpi-strip-value">
            {openDoorCount === 0 && (
              <span className="kpi-closed-text">All Closed</span>
            )}
            {openDoorCount > 0 && (
              <span className="kpi-open-text">{openDoorCount} Open</span>
            )}
          </div>
          <span className="kpi-strip-sub">
            {openDoorCount === 0 && 'All 15 compartments secured'}
            {openDoorCount > 0 && 'Compartment door open'}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 2. FILTER & SEARCH TOOLBAR (Directly above the Compartment Grid)*/}
      {/* --------------------------------------------------------------- */}
      <div className="telemetry-control-bar">
        {/* Left: Filter Pills */}
        <div className="filter-pills-group">
          <button
            type="button"
            onClick={function () { setActiveFilter('all'); }}
            className={getFilterBtnClass('all')}
          >
            <span>All 15</span>
          </button>
          <button
            type="button"
            onClick={function () { setActiveFilter('available'); }}
            className={getFilterBtnClass('available')}
          >
            <span className="dot-green"></span>
            <span>Available ({availableCount})</span>
          </button>
          <button
            type="button"
            onClick={function () { setActiveFilter('occupied'); }}
            className={getFilterBtnClass('occupied')}
          >
            <span className="dot-amber"></span>
            <span>Occupied ({occupiedCount})</span>
          </button>
        </div>

        {/* Right: Quick Search & Refresh */}
        <div className="telemetry-actions-row">
          <div className="telemetry-search-wrap">
            <Search size={14} className="telemetry-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={function (e) { setSearchQuery(e.target.value); }}
              placeholder="Search Box # or Order..."
              className="telemetry-search-input"
            />
          </div>

          <button
            type="button"
            onClick={handleRefreshClick}
            className="refresh-telemetry-btn"
            title="Refresh locker status"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 3. REDESIGNED COMPARTMENTS GRID (15 Minimalist Cards)            */}
      {/* --------------------------------------------------------------- */}
      <div className="lockers-hardware-grid">
        {filteredLockers.map(function (box) {
          const isActuating = actuatingBox === box.boxNumber;
          const isAvailable = box.status === 'available';
          const isOccupied = box.status === 'occupied';

          return (
            <div 
              key={box.boxNumber} 
              className={getCardClass(box)}
              onClick={function () { handleSelectLocker(box); }}
            >
              
              {/* Card Header: Box Number, Size Tag & Door State */}
              <div className="box-card-topbar">
                <div className="box-id-group">
                  <span className="box-badge-pill">#{box.boxNumber}</span>
                  <span className={getSizeBadgeClass(box.size)}>{box.size}</span>
                </div>

                {/* Minimalist Door Status Indicator */}
                <div className="box-door-indicator">
                  {box.doorClosed && (
                    <span className="door-chip chip-closed" title="Door closed and secured">
                      <Lock size={10} />
                      <span>Closed</span>
                    </span>
                  )}
                  {!box.doorClosed && (
                    <span className="door-chip chip-open" title="Door is open">
                      <Unlock size={10} />
                      <span>Open</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body: Dynamic Status Presentation */}
              <div className="box-card-content">
                
                {/* AVAILABLE STATUS */}
                {isAvailable && (
                  <div className="avail-info-wrap">
                    <div className="avail-status-line">
                      <span className="avail-green-dot"></span>
                      <span className="avail-heading">Ready for Drop-off</span>
                    </div>
                    <span className="avail-sub-label">Clean & Ready</span>
                  </div>
                )}

                {/* OCCUPIED STATUS */}
                {isOccupied && (
                  <div className="occupied-info-wrap">
                    <div className="occupied-order-row">
                      <span className="occupied-order-id">{box.orderId}</span>
                      <span className="occupied-time-tag">
                        <Clock size={10} />
                        <span>{box.droppedTime}</span>
                      </span>
                    </div>
                    <div className="occupied-customer-row">
                      <User size={12} className="cust-icon" />
                      <span className="cust-name">{box.customerName}</span>
                    </div>
                    <div className="occupied-service-line">
                      {box.serviceType}
                    </div>
                  </div>
                )}

              </div>

              {/* Card Footer: Subtle Compact Action */}
              <div className="box-card-footer">
                {box.doorClosed && (
                  <button
                    type="button"
                    onClick={function (e) { handleRemoteUnlock(e, box.boxNumber); }}
                    disabled={isActuating}
                    className="btn-door-action btn-open"
                    title="Click to open locker door"
                  >
                    <Unlock size={12} />
                    {isActuating && <span>Opening...</span>}
                    {!isActuating && <span>Open Door</span>}
                  </button>
                )}

                {!box.doorClosed && (
                  <button
                    type="button"
                    onClick={function (e) { handleRelock(e, box.boxNumber); }}
                    className="btn-door-action btn-lock"
                    title="Click to lock locker door"
                  >
                    <Lock size={12} />
                    <span>Lock Door</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 4. INTERACTIVE LOCKER INSPECTION DRAWER (When locker is clicked) */}
      {/* --------------------------------------------------------------- */}
      {selectedBox && (
        <div className="locker-inspector-overlay" onClick={function () { setSelectedBox(null); }}>
          <div className="locker-inspector-card" onClick={function (e) { e.stopPropagation(); }}>
            
            <div className="inspector-header">
              <div className="inspector-title-group">
                <h4 className="inspector-title">Locker #{selectedBox.boxNumber} Details</h4>
                <span className={getSizeBadgeClass(selectedBox.size)}>
                  {selectedBox.size} Compartment
                </span>
              </div>
              <button 
                type="button" 
                onClick={function () { setSelectedBox(null); }}
                className="inspector-close-btn"
              >
                <X size={16} />
              </button>
            </div>

            <div className="inspector-body">
              
              {/* Telemetry Row */}
              <div className="inspector-row-grid">
                <div className="inspector-col">
                  <span className="col-label">DOOR SENSOR</span>
                  <span className="col-value">
                    {selectedBox.doorClosed && (
                      <span className="text-red font-bold">Closed & Latched</span>
                    )}
                    {!selectedBox.doorClosed && (
                      <span className="text-green font-bold">Open</span>
                    )}
                  </span>
                </div>

                <div className="inspector-col">
                  <span className="col-label">COMPARTMENT STATUS</span>
                  <span className="col-value">
                    {selectedBox.status === 'available' && (
                      <span className="text-green font-bold">Ready for Drop-off</span>
                    )}
                    {selectedBox.status === 'occupied' && (
                      <span className="text-amber font-bold">Occupied</span>
                    )}
                  </span>
                </div>

                <div className="inspector-col">
                  <span className="col-label">LOCATION HUB</span>
                  <span className="col-value">Central Mall Hub (Bay CMH-01)</span>
                </div>
              </div>

              {/* Occupant Info if Occupied */}
              {selectedBox.status === 'occupied' && (
                <div className="inspector-occupied-details">
                  <div className="details-heading">Active Occupant</div>
                  <div className="details-list">
                    <div className="detail-item">
                      <span className="item-label">Order Number:</span>
                      <span className="item-value monospace font-bold text-sky">{selectedBox.orderId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">Customer Name:</span>
                      <span className="item-value">{selectedBox.customerName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">Contact:</span>
                      <span className="item-value">{selectedBox.customerPhone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">Service Package:</span>
                      <span className="item-value">{selectedBox.serviceType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">Drop-off Time:</span>
                      <span className="item-value">{selectedBox.droppedTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Info if Available */}
              {selectedBox.status === 'available' && (
                <div className="inspector-avail-details">
                  <CheckCircle2 size={24} color="#059669" />
                  <div>
                    <h5 className="avail-detail-title">Locker Ready For Customers</h5>
                    <p className="avail-detail-desc">
                      Compartment has been UV-C sanitized and is ready to accept bags from nearby customers.
                    </p>
                  </div>
                </div>
              )}

            </div>

            <div className="inspector-footer">
              {selectedBox.doorClosed && (
                <button
                  type="button"
                  onClick={function (e) { handleRemoteUnlock(e, selectedBox.boxNumber); }}
                  className="inspector-action-btn btn-open"
                >
                  <Unlock size={14} />
                  <span>Remote Open Locker #{selectedBox.boxNumber}</span>
                </button>
              )}
              {!selectedBox.doorClosed && (
                <button
                  type="button"
                  onClick={function (e) { handleRelock(e, selectedBox.boxNumber); }}
                  className="inspector-action-btn btn-lock"
                >
                  <Lock size={14} />
                  <span>Lock Locker #{selectedBox.boxNumber}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
