import React, { useState, useEffect, useCallback } from 'react';
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
  PackageCheck,
  Loader2
} from 'lucide-react';
import { PickupQueueList } from './pickup/PickupQueueList';
import { PickupWorkflowModal } from './pickup/PickupWorkflowModal';
import { DeliveryQueueList } from './delivery/DeliveryQueueList';
import { DeliveryWorkflowModal } from './delivery/DeliveryWorkflowModal';
import { fetchOrders, collectOrder, deliverCleanOrder } from '../../services/api';
import './DriverView.css';

// Helper to format timestamps into relative time
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Dropped recently';
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Dropped just now';
  if (diffMins < 60) return `Dropped ${diffMins}m ago`;
  if (diffHours < 24) return `Dropped ${diffHours}h ago`;
  return past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Maps backend order to Pickup card
function mapPendingOrder(o) {
  return {
    id: o.id,
    distanceKm: 0.3,
    distanceText: '0.3 km away',
    stationName: `Central Mall Hub (${o.station_id || 'CMH-01'})`,
    lockerNumber: String(o.dropoff_box_number || o.compartment_number || '01').padStart(2, '0'),
    customerName: o.customer_name || 'Customer',
    serviceType: o.service_tier || 'Wash, Dry & Fold',
    loadSize: o.service_size || 'Medium (7kg)',
    droppedTime: formatRelativeTime(o.created_at),
    status: o.status,
  };
}

// Maps backend order to Delivery card
function mapDeliveryOrder(o) {
  const digits = String(o.id).replace(/\D/g, '');
  let tagSuffix = '8821';
  if (digits.length >= 4) {
    tagSuffix = digits.slice(-4);
  }
  const tagCode = 'BAG-' + tagSuffix;

  let finalWeight = 5.2;
  if (o.weight_kg) {
    finalWeight = parseFloat(o.weight_kg);
  }

  return {
    id: o.id,
    distanceKm: 0.3,
    distanceText: '0.3 km away',
    stationName: `Central Mall Hub (${o.station_id || 'CMH-01'})`,
    laundryBagNumber: tagCode,
    customerName: o.customer_name || 'Customer',
    serviceType: o.service_tier || 'Wash, Dry & Fold',
    weightKg: finalWeight,
    status: o.status,
  };
}

// ==============================================================================
// REACT COMPONENT: DriverView
// Mobile-first field operations portal for route van drivers.
// Structured around two actionable live cloud route tasks:
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
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Live route queues
  const [pendingOrders, setPendingOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);

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

  // Load live tasks from cloud database
  const loadRouteData = useCallback(async function () {
    try {
      const allOrders = await fetchOrders();
      if (Array.isArray(allOrders)) {
        // 1. Pickups: orders with status 'dropped_off' (dirty laundry in locker)
        const droppedOff = allOrders.filter(o => o.status === 'dropped_off');
        setPendingOrders(droppedOff.map(mapPendingOrder));

        // 2. Deliveries: orders with status 'in_wash' or 'in_transit' returning clean
        const toDeliver = allOrders.filter(o => o.status === 'in_wash');
        setDeliveryOrders(toDeliver.map(mapDeliveryOrder));

        // 3. Completed count
        const completed = allOrders.filter(o => o.status === 'completed');
        setCompletedCount(completed.length);
      }
    } catch (err) {
      console.warn('[DriverView] Error fetching route queues:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRouteData();
    const interval = setInterval(loadRouteData, 5000);
    return () => clearInterval(interval);
  }, [loadRouteData]);

  // ============================================================================
  // HANDLERS: Pickup Workflow (Dirty Clothes Collection)
  // ============================================================================
  function handleStartPickup(order) {
    setSelectedPickupOrder(order);
    setIsPickupModalOpen(true);
  }

  function handleClosePickupModal() {
    setIsPickupModalOpen(false);
    setSelectedPickupOrder(null);
  }

  async function handleConfirmPickup(order, bagTag) {
    try {
      // 1. Post collection to live backend
      await collectOrder(order.id);

      // 2. Refresh local queues
      loadRouteData();

      // 3. Sync customer status
      if (updateOrderStatus && activeOrder && activeOrder.id === order.id) {
        updateOrderStatus(order.id, 'rider_transit', {
          lockerNumber: order.lockerNumber,
          laundryBagNumber: bagTag,
        });
      }
    } catch (err) {
      console.warn('[DriverView] Collect order error:', err);
      // Fallback local update
      setPendingOrders(prev => prev.filter(item => item.id !== order.id));
    }
  }

  // ============================================================================
  // HANDLERS: Delivery Workflow (Clean Clothes Return to Locker)
  // ============================================================================
  function handleStartDelivery(delivery) {
    setSelectedDeliveryOrder(delivery);
    setIsDeliveryModalOpen(true);
  }

  function handleCloseDeliveryModal() {
    setIsDeliveryModalOpen(false);
    setSelectedDeliveryOrder(null);
  }

  async function handleConfirmDelivery(order, deliveryData) {
    let returnBox = '06';
    if (deliveryData && deliveryData.pickupBoxNumber) {
      returnBox = deliveryData.pickupBoxNumber;
    }

    let finalPin = '842019';
    if (deliveryData && deliveryData.claimPin) {
      finalPin = deliveryData.claimPin;
    }

    try {
      // 1. Post delivery to live backend if not already executed by modal
      if (!deliveryData || !deliveryData.deliveredOnServer) {
        await deliverCleanOrder(order.id, returnBox, 'CMH-01');
      }

      // 2. Refresh live queues from cloud database
      loadRouteData();

      // 3. Advance customer active order to ready_for_pickup
      if (updateOrderStatus && activeOrder && activeOrder.id === order.id) {
        updateOrderStatus(order.id, 'ready_for_pickup', {
          pickupBoxNumber: returnBox,
          claimPin: finalPin,
          isPaid: false,
        });
      }
    } catch (err) {
      console.warn('[DriverView] Deliver order error:', err);
      setDeliveryOrders(function (prev) {
        return prev.filter(function (item) {
          return item.id !== order.id;
        });
      });
      setCompletedCount(function (prev) {
        return prev + 1;
      });
    }
  }

  function handleResetRoute() {
    loadRouteData();
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
        
        {/* STATUS BAR */}
        <div className="driver-status-bar">
          <span className="status-clock">9:41</span>
          <div className="notch-island"></div>
          <div className="status-chips">
            <span className="gps-live-chip">GPS ON</span>
            <span className="network-speed">5G</span>
          </div>
        </div>

        {/* DRIVER PROFILE HEADER */}
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
                title="Sync Live Route Tasks"
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

        {/* MAIN BODY */}
        <main className="driver-scroll-body">
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: '#64748b' }}>
              <Loader2 size={18} className="relay-spinner" />
              <span style={{ fontSize: '0.875rem' }}>Syncing route tasks from database...</span>
            </div>
          )}

          {!isLoading && (
            <>
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
            </>
          )}
        </main>

        {/* MODAL 1: PICKUP WORKFLOW */}
        <PickupWorkflowModal 
          isOpen={isPickupModalOpen}
          onClose={handleClosePickupModal}
          order={selectedPickupOrder}
          onConfirmPickup={handleConfirmPickup}
        />

        {/* MODAL 2: DELIVERY WORKFLOW */}
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
