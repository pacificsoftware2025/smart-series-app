import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Truck, 
  MapPin, 
  RotateCcw, 
  LogOut, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  Clock,
  Box,
  PackageCheck
} from 'lucide-react';
import { PickupQueueList } from './pickup/PickupQueueList';
import { PickupWorkflowModal } from './pickup/PickupWorkflowModal';
import { DeliveryQueueList } from './delivery/DeliveryQueueList';
import { DeliveryWorkflowModal } from './delivery/DeliveryWorkflowModal';
import './DriverView.css';

// Initial default route drop-offs for testing
const INITIAL_MOCK_PENDING = [
  {
    id: 'ORD-8421',
    distanceKm: 0.3,
    distanceText: '0.3 km away',
    stationName: 'Central Mall Hub (Level 1 East)',
    lockerNumber: '03',
    customerName: 'Jamie Davis',
    serviceType: 'Wash, Dry & Fold',
    loadSize: 'Medium (5.2kg)',
    droppedTime: 'Dropped 18m ago',
    status: 'dropped_off',
  },
  {
    id: 'ORD-7719',
    distanceKm: 1.2,
    distanceText: '1.2 km away',
    stationName: 'North Plaza Hub (Tower B Ground)',
    lockerNumber: '07',
    customerName: 'Carlos Mendoza',
    serviceType: 'Wash & Dry',
    loadSize: 'Large (7.8kg)',
    droppedTime: 'Dropped 35m ago',
    status: 'dropped_off',
  },
  {
    id: 'ORD-6204',
    distanceKm: 3.5,
    distanceText: '3.5 km away',
    stationName: 'Greenbelt Transit Hub (Bay 4)',
    lockerNumber: '11',
    customerName: 'Patricia Reyes',
    serviceType: 'Wash Only',
    loadSize: 'Small (3.5kg)',
    droppedTime: 'Dropped 1h ago',
    status: 'dropped_off',
  },
];

// Initial default clean laundry return packages in the van (Any available box allocated at destination)
const INITIAL_MOCK_DELIVERIES = [
  {
    id: 'ORD-5192',
    distanceKm: 0.3,
    distanceText: '0.3 km away',
    stationName: 'Central Mall Hub (Level 1 East)',
    laundryBagNumber: 'BAG-6910',
    customerName: 'Roberto Tan',
    serviceType: 'Wash, Dry & Fold',
    weightKg: 4.9,
    status: 'in_wash',
  },
  {
    id: 'ORD-4088',
    distanceKm: 1.2,
    distanceText: '1.2 km away',
    stationName: 'North Plaza Hub (Tower B Ground)',
    laundryBagNumber: 'BAG-5512',
    customerName: 'Elena Cruz',
    serviceType: 'Wash & Dry',
    weightKg: 3.8,
    status: 'in_wash',
  },
];

// ==============================================================================
// REACT COMPONENT: DriverView
// Mobile-first field operations portal for route van drivers.
// Structured around two actionable route tasks:
//   Tab 1: PICKUPS (Dirty clothes from locker boxes into van)
//   Tab 2: DELIVERIES (Clean clothes from van into locker boxes)
// ==============================================================================
export function DriverView() {
  const auth = useAuth();
  const user = auth.user;
  const logout = auth.logout;
  const activeOrder = auth.activeOrder;
  const updateOrderStatus = auth.updateOrderStatus;

  // Active Tab: 'pickups' or 'deliveries'
  const [activeDriverTab, setActiveDriverTab] = useState('pickups');
  const [completedCount, setCompletedCount] = useState(14);

  // Pending Pickups Queue
  const [pendingOrders, setPendingOrders] = useState(function () {
    // If there is an active order in AuthContext in 'dropped_off' state, merge it
    if (activeOrder && activeOrder.status === 'dropped_off') {
      const merged = INITIAL_MOCK_PENDING.slice();
      let activeCustomerName = 'Jamie Davis';
      if (user && user.name) {
        activeCustomerName = user.name;
      }
      let activeLockerBox = '03';
      if (activeOrder.lockerNumber) {
        activeLockerBox = activeOrder.lockerNumber;
      }
      let activeService = 'Wash, Dry & Fold';
      if (activeOrder.serviceType) {
        activeService = activeOrder.serviceType;
      }
      let activeLoad = 'Medium (5.2kg)';
      if (activeOrder.loadSize) {
        activeLoad = activeOrder.loadSize;
      }

      merged[0] = Object.assign({}, merged[0], {
        id: activeOrder.id,
        lockerNumber: activeLockerBox,
        serviceType: activeService,
        customerName: activeCustomerName,
        loadSize: activeLoad,
      });
      return merged;
    }
    return INITIAL_MOCK_PENDING;
  });

  // Clean Deliveries Queue
  const [deliveryOrders, setDeliveryOrders] = useState(function () {
    // If active order is in 'in_wash' or 'rider_transit', integrate as a delivery
    if (activeOrder && (activeOrder.status === 'in_wash' || activeOrder.status === 'rider_transit')) {
      const mergedDeliveries = INITIAL_MOCK_DELIVERIES.slice();
      let activeCust = 'Jamie Davis';
      if (user && user.name) {
        activeCust = user.name;
      }
      let activeBag = 'BAG-8821';
      if (activeOrder.laundryBagNumber) {
        activeBag = activeOrder.laundryBagNumber;
      }

      mergedDeliveries.unshift({
        id: activeOrder.id,
        distanceKm: 0.3,
        distanceText: '0.3 km away',
        stationName: 'Central Mall Hub (Level 1 East)',
        pickupBoxNumber: '06',
        laundryBagNumber: activeBag,
        customerName: activeCust,
        serviceType: activeOrder.serviceType || 'Wash, Dry & Fold',
        weightKg: activeOrder.weightKg || 5.2,
        status: 'in_wash',
      });
      return mergedDeliveries;
    }
    return INITIAL_MOCK_DELIVERIES;
  });

  // Workflow Modal States
  const [selectedPickupOrder, setSelectedPickupOrder] = useState(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);

  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // Driver Profile Display Values
  let driverName = 'Marco Valdes';
  let vanName = 'Van #04 (Route Metro)';
  let driverInitials = 'MV';

  if (user) {
    if (user.name) {
      driverName = user.name;
    }
    if (user.van) {
      vanName = user.van;
    }
    if (user.initials) {
      driverInitials = user.initials;
    }
  }

  // ============================================================================
  // HANDLERS: Pickup Workflow
  // ============================================================================
  function handleStartPickup(order) {
    setSelectedPickupOrder(order);
    setIsPickupModalOpen(true);
  }

  function handleClosePickupModal() {
    setIsPickupModalOpen(false);
    setSelectedPickupOrder(null);
  }

  function handleConfirmPickup(order, bagTag) {
    let lockerBox = '03';
    if (order.lockerNumber) {
      lockerBox = order.lockerNumber;
    }

    // 1. Remove from Pending Orders list
    const remainingPending = pendingOrders.filter(function (item) {
      return item.id !== order.id;
    });
    setPendingOrders(remainingPending);

    // 2. Add as clean delivery in van (ready for return)
    const newDelivery = {
      id: order.id,
      distanceKm: order.distanceKm || 0.3,
      distanceText: order.distanceText || '0.3 km away',
      stationName: order.stationName || 'Central Mall Hub',
      pickupBoxNumber: '06',
      laundryBagNumber: bagTag,
      customerName: order.customerName || 'Customer',
      serviceType: order.serviceType || 'Wash, Dry & Fold',
      weightKg: 5.2,
      status: 'in_wash',
    };
    setDeliveryOrders([newDelivery, ...deliveryOrders]);

    // 3. Sync customer status
    if (updateOrderStatus && activeOrder && activeOrder.id === order.id) {
      updateOrderStatus(order.id, 'rider_transit', {
        lockerNumber: lockerBox,
        laundryBagNumber: bagTag,
      });
    }
  }

  // ============================================================================
  // HANDLERS: Delivery Workflow (Returning clean clothes to locker)
  // ============================================================================
  function handleStartDelivery(delivery) {
    setSelectedDeliveryOrder(delivery);
    setIsDeliveryModalOpen(true);
  }

  function handleCloseDeliveryModal() {
    setIsDeliveryModalOpen(false);
    setSelectedDeliveryOrder(null);
  }

  function handleConfirmDelivery(order, deliveryData) {
    let returnBox = '06';
    if (deliveryData && deliveryData.pickupBoxNumber) {
      returnBox = deliveryData.pickupBoxNumber;
    }

    let claimPin = '842019';
    if (deliveryData && deliveryData.claimPin) {
      claimPin = deliveryData.claimPin;
    }

    // 1. Remove from Delivery Queue
    const remainingDeliveries = deliveryOrders.filter(function (item) {
      return item.id !== order.id;
    });
    setDeliveryOrders(remainingDeliveries);
    setCompletedCount(completedCount + 1);

    // 2. Advance customer active order to Stage 4 (ready_for_pickup)
    if (updateOrderStatus && activeOrder && activeOrder.id === order.id) {
      updateOrderStatus(order.id, 'ready_for_pickup', {
        pickupBoxNumber: returnBox,
        claimPin: claimPin,
        isPaid: false,
      });
    }
  }

  function handleResetRoute() {
    setPendingOrders(INITIAL_MOCK_PENDING);
    setDeliveryOrders(INITIAL_MOCK_DELIVERIES);
    setCompletedCount(14);
  }

  function getDriverTabClass(tabKey) {
    if (activeDriverTab === tabKey) {
      return 'driver-nav-tab tab-active';
    }
    return 'driver-nav-tab';
  }

  return (
    <div className="driver-viewport">
      <div className="driver-device-frame">
        
        {/* ------------------------------------------------------------- */}
        {/* STATUS BAR (9:41, Notch, BLE, 5G, GPS Online)                 */}
        {/* ------------------------------------------------------------- */}
        <div className="driver-status-bar">
          <span className="status-clock">9:41</span>
          <div className="notch-island"></div>
          <div className="status-chips">
            <span className="gps-live-chip">GPS ON</span>
            <span className="network-speed">5G</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DRIVER PROFILE HEADER                                         */}
        {/* ------------------------------------------------------------- */}
        <header className="driver-app-header">
          <div className="driver-header-top">
            <div className="driver-avatar-group">
              <div className="driver-avatar">
                {driverInitials}
              </div>
              <div className="driver-meta">
                <div className="driver-duty-badge">
                  <span className="duty-dot"></span>
                  <span>ON DUTY</span>
                </div>
                <h2 className="driver-name">{driverName}</h2>
                <span className="driver-van">{vanName}</span>
              </div>
            </div>

            <div className="driver-actions">
              <button 
                type="button"
                onClick={handleResetRoute}
                className="driver-icon-btn"
                title="Reset Route Tasks"
              >
                <RefreshCw size={17} />
              </button>
              <button 
                type="button"
                onClick={logout}
                className="driver-icon-btn logout-accent"
                title="Exit Driver Portal / Switch Role"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>

          {/* Route Overview Metrics Bar */}
          <div className="driver-metrics-strip">
            <div className="metric-box">
              <span className="metric-num num-amber">{pendingOrders.length}</span>
              <span className="metric-lbl">Pending Pickups</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-num num-blue">{deliveryOrders.length}</span>
              <span className="metric-lbl">Deliveries Due</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-num num-green">{completedCount}</span>
              <span className="metric-lbl">Completed</span>
            </div>
          </div>

          {/* Segmented Navigation Tabs: PICKUPS vs DELIVERIES */}
          <div className="driver-tab-navigation">
            <button
              type="button"
              onClick={function () { setActiveDriverTab('pickups'); }}
              className={getDriverTabClass('pickups')}
            >
              <Box size={15} />
              <span>PICKUPS ({pendingOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={function () { setActiveDriverTab('deliveries'); }}
              className={getDriverTabClass('deliveries')}
            >
              <Truck size={15} />
              <span>DELIVERIES ({deliveryOrders.length})</span>
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* MAIN BODY (Scrollable Queue)                                  */}
        {/* ------------------------------------------------------------- */}
        <main className="driver-scroll-body">
          
          {/* TAB 1: PICKUP ROUTE (Locker -> Van) */}
          {activeDriverTab === 'pickups' && (
            <PickupQueueList 
              orders={pendingOrders}
              onStartPickup={handleStartPickup}
            />
          )}

          {/* TAB 2: DELIVERY ROUTE (Van -> Locker) */}
          {activeDriverTab === 'deliveries' && (
            <DeliveryQueueList 
              deliveries={deliveryOrders}
              onStartDelivery={handleStartDelivery}
            />
          )}

        </main>

        {/* ------------------------------------------------------------- */}
        {/* MODAL 1: PICKUP WORKFLOW (Arrive -> Scan QR -> Tag -> Swipe)  */}
        {/* ------------------------------------------------------------- */}
        <PickupWorkflowModal 
          isOpen={isPickupModalOpen}
          onClose={handleClosePickupModal}
          order={selectedPickupOrder}
          onConfirmPickup={handleConfirmPickup}
        />

        {/* ------------------------------------------------------------- */}
        {/* MODAL 2: DELIVERY WORKFLOW (Verify Bag -> Pop Box -> Swipe)   */}
        {/* ------------------------------------------------------------- */}
        <DeliveryWorkflowModal 
          isOpen={isDeliveryModalOpen}
          onClose={handleCloseDeliveryModal}
          order={selectedDeliveryOrder}
          onConfirmDelivery={handleConfirmDelivery}
        />

      </div>
    </div>
  );
}
