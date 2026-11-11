import React from 'react';
import { MapPin, Clock, ArrowRight, ShieldCheck, Box } from 'lucide-react';
import './PickupQueueList.css';

// ==============================================================================
// REACT COMPONENT: PickupQueueList
// Displays all locker compartments waiting for driver collection,
// sorted strictly from NEAREST to FARTHEST.
// ==============================================================================
export function PickupQueueList(props) {
  const orders = props.orders;
  const onStartPickup = props.onStartPickup;

  // In Vanilla JS: if (!orders || orders.length === 0) renderEmpty();
  if (!orders || orders.length === 0) {
    return (
      <div className="pickup-empty-state">
        <div className="empty-icon-circle">
          <ShieldCheck size={32} color="#10b981" />
        </div>
        <h3 className="empty-title">All Pickups Collected</h3>
        <p className="empty-desc">
          There are no pending drop-offs waiting for van collection in this sector.
        </p>
      </div>
    );
  }

  // Sort orders nearest to farthest (ascending distanceKm)
  // Vanilla JS Array.prototype.sort with comparison function
  const sortedOrders = orders.slice().sort(function (a, b) {
    let distA = 999;
    if (a.distanceKm !== undefined) {
      distA = a.distanceKm;
    }
    let distB = 999;
    if (b.distanceKm !== undefined) {
      distB = b.distanceKm;
    }
    return distA - distB;
  });

  return (
    <div className="pickup-queue-container">
      <div className="queue-header-row">
        <span className="queue-sort-indicator">
          Sorted: Nearest to Farthest
        </span>
      </div>

      <div className="pickup-cards-list">
        {sortedOrders.map(function (order, index) {
          let boxNumber = '03';
          if (order.lockerNumber) {
            boxNumber = order.lockerNumber;
          } else if (order.dropoffBoxNumber) {
            boxNumber = order.dropoffBoxNumber;
          }

          let distanceText = '0.3 km away';
          if (order.distanceText) {
            distanceText = order.distanceText;
          } else if (order.distanceKm !== undefined) {
            distanceText = order.distanceKm + ' km away';
          }

          let hubName = 'Central Mall Hub';
          if (order.stationName) {
            hubName = order.stationName;
          }

          let customerName = 'Customer';
          if (order.customerName) {
            customerName = order.customerName;
          }

          let serviceType = 'Wash, Dry & Fold';
          if (order.serviceType) {
            serviceType = order.serviceType;
          }

          let loadSize = 'Medium (5.2kg)';
          if (order.loadSize) {
            loadSize = order.loadSize;
          }

          let droppedTime = 'Dropped 18m ago';
          if (order.droppedTime) {
            droppedTime = order.droppedTime;
          }

          return (
            <div key={order.id || index} className="pickup-order-card">
              
              {/* Card Top: Distance & Compartment Badge */}
              <div className="pickup-card-top">
                <div className="distance-chip">
                  <MapPin size={13} />
                  <span>{distanceText}</span>
                </div>

                <div className="box-badge-pill">
                  <Box size={14} />
                  <span>BOX #{boxNumber}</span>
                </div>
              </div>

              {/* Station & Location Name */}
              <div className="pickup-station-info">
                <h4 className="pickup-station-name">{hubName}</h4>
                <div className="pickup-time-row">
                  <Clock size={12} />
                  <span>{droppedTime}</span>
                </div>
              </div>

              {/* Customer & Laundry Spec Row */}
              <div className="pickup-details-grid">
                <div className="detail-item">
                  <span className="detail-label">CUSTOMER</span>
                  <span className="detail-value">{customerName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ORDER ID</span>
                  <span className="detail-value order-code">{order.id}</span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">SERVICE & LOAD</span>
                  <span className="detail-value service-highlight">
                    {serviceType} • {loadSize}
                  </span>
                </div>
              </div>

              {/* Action Button: Arrive & Open Box */}
              <button
                type="button"
                onClick={function () { onStartPickup(order); }}
                className="arrive-pickup-btn"
              >
                <span>Arrive & Open Box #{boxNumber}</span>
                <ArrowRight size={16} />
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
