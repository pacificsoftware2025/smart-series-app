import React from 'react';
import { MapPin, Box, ArrowRight, CheckCircle2, PackageCheck, Sparkles } from 'lucide-react';
import './DeliveryQueueList.css';

// ==============================================================================
// REACT COMPONENT: DeliveryQueueList
// Displays clean laundry packages loaded in the van waiting for delivery
// back to customer locker compartments.
// ==============================================================================
export function DeliveryQueueList(props) {
  const deliveries = props.deliveries;
  const onStartDelivery = props.onStartDelivery;

  // In Vanilla JS: if (!deliveries || deliveries.length === 0) renderEmpty();
  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="delivery-empty-state">
        <div className="empty-delivery-icon">
          <CheckCircle2 size={34} color="#10b981" />
        </div>
        <h3 className="empty-delivery-title">No Deliveries in Queue</h3>
        <p className="empty-delivery-desc">
          All clean laundry bags for this route have been delivered to their destination lockers.
        </p>
      </div>
    );
  }

  // Sort deliveries by nearest hub (ascending distanceKm)
  const sortedDeliveries = deliveries.slice().sort(function (a, b) {
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
    <div className="delivery-queue-container">
      <div className="delivery-header-row">
        <span className="delivery-sort-indicator">
          Destination: Sorted by Distance
        </span>
      </div>

      <div className="delivery-cards-list">
        {sortedDeliveries.map(function (delivery, index) {
          let targetPickupBox = '06';
          if (delivery.pickupBoxNumber) {
            targetPickupBox = delivery.pickupBoxNumber;
          } else if (delivery.assignedBox) {
            targetPickupBox = delivery.assignedBox;
          }

          let bagTag = 'BAG-8821';
          if (delivery.laundryBagNumber) {
            bagTag = delivery.laundryBagNumber;
          }

          let distanceText = '0.3 km away';
          if (delivery.distanceText) {
            distanceText = delivery.distanceText;
          } else if (delivery.distanceKm !== undefined) {
            distanceText = delivery.distanceKm + ' km away';
          }

          let stationName = 'Central Mall Hub';
          if (delivery.stationName) {
            stationName = delivery.stationName;
          }

          let customerName = 'Customer';
          if (delivery.customerName) {
            customerName = delivery.customerName;
          }

          let serviceType = 'Wash, Dry & Fold';
          if (delivery.serviceType) {
            serviceType = delivery.serviceType;
          }

          let weightText = '5.2 kg (Verified)';
          if (delivery.weightKg !== undefined) {
            weightText = delivery.weightKg + ' kg (Verified)';
          }

          return (
            <div key={delivery.id || index} className="delivery-order-card">
              
              {/* Card Top: Distance & Dynamic Allocation Pill */}
              <div className="delivery-card-top">
                <div className="delivery-distance-chip">
                  <MapPin size={13} />
                  <span>{distanceText}</span>
                </div>

                <div className="delivery-free-box-pill">
                  <Box size={13} />
                  <span>ANY AVAILABLE BOX</span>
                </div>
              </div>

              {/* Station & Clean Bag Tag */}
              <div className="delivery-station-block">
                <div className="clean-tag-row">
                  <span className="clean-bag-chip">{bagTag}</span>
                  <span className="clean-ready-badge">
                    <Sparkles size={11} />
                    <span>CLEAN & FOLDED</span>
                  </span>
                </div>
                <h4 className="delivery-station-title">{stationName}</h4>
              </div>

              {/* Customer & Laundry Spec Row */}
              <div className="delivery-specs-grid">
                <div className="spec-item">
                  <span className="spec-lbl">CUSTOMER</span>
                  <span className="spec-val">{customerName}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-lbl">ORDER ID</span>
                  <span className="spec-val order-id-code">{delivery.id}</span>
                </div>
                <div className="spec-item spec-full">
                  <span className="spec-lbl">SERVICE & VERIFIED WEIGHT</span>
                  <span className="spec-val highlight-service">
                    {serviceType} • {weightText}
                  </span>
                </div>
              </div>

              {/* Action Button: Deliver to Locker (Any Available Box) */}
              <button
                type="button"
                onClick={function () { onStartDelivery(delivery); }}
                className="start-delivery-btn"
              >
                <PackageCheck size={17} />
                <span>Deliver to Locker</span>
                <ArrowRight size={16} />
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
