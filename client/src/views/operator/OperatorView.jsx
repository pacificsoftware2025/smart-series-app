import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Box, 
  TrendingUp, 
  Activity, 
  LogOut, 
  Building2, 
  CircleDot,
  ArrowRight,
  Search,
  LayoutDashboard,
  HelpCircle,
  ChevronDown,
  ArrowUpRight,
  RotateCw,
  Plus,
  Loader2,
  Link2
} from 'lucide-react';
import { WashingBillingTab } from './intake/WashingBillingTab';
import { LockerMonitoringTab } from './hardware/LockerMonitoringTab';
import { LaundryLockerBindingTab } from './binding/LaundryLockerBindingTab';
import { fetchOrders, fetchStationCompartments } from '../../services/api';
import './OperatorView.css';

// Helper to format ISO timestamp into readable string
function formatOrderDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return dateStr;
  }
}

// Maps backend order status to clean presentation label
function formatStatusLabel(status) {
  switch (status) {
    case 'dropped_off':
      return 'Pending for Pickup';
    case 'in_transit':
      return 'In Transit';
    case 'in_wash':
      return 'In Wash';
    case 'ready_for_pickup':
      return 'Ready for Pickup';
    case 'completed':
      return 'Completed';
    default:
      return status ? status.replace(/_/g, ' ') : 'Pending';
  }
}

// ==============================================================================
// REACT COMPONENT: OperatorView
// Modern enterprise SaaS workstation connected live to PostgreSQL:
// 1. Dashboard (Live cloud KPI cards + Real Orders Table)
// 2. Washing & Billing (Scale Weighing, Live Database Update)
// 3. Locker Monitoring (16-Box Live Hardware Telemetry Grid)
// ==============================================================================
export function OperatorView() {
  const auth = useAuth();
  const user = auth.user;
  const logout = auth.logout;
  const updateOrderStatus = auth.updateOrderStatus;

  // Active view: 'dashboard' | 'washing' | 'lockers'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'pending_pickup' | 'in_wash' | 'completed'

  // Live state from API
  const [ordersList, setOrdersList] = useState([]);
  const [compartmentsList, setCompartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Poll live orders and telemetry
  const loadDashboardData = useCallback(async function () {
    try {
      const [orders, comps] = await Promise.all([
        fetchOrders(),
        fetchStationCompartments('CMH-01'),
      ]);

      if (Array.isArray(orders)) {
        setOrdersList(orders);
      }
      if (Array.isArray(comps)) {
        setCompartmentsList(comps);
      }
    } catch (err) {
      console.warn('[OperatorView] Error syncing dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Dynamic order counts from live database
  let pendingPickupCount = 0;
  let inTransitCount = 0;
  let inWashCount = 0;
  let completedCount = 0;
  let totalRevenue = 0;

  for (let i = 0; i < ordersList.length; i++) {
    const o = ordersList[i];
    if (o.status === 'dropped_off') pendingPickupCount++;
    if (o.status === 'in_transit') inTransitCount++;
    if (o.status === 'in_wash') inWashCount++;
    if (o.status === 'completed') completedCount++;
    if (o.amount) {
      totalRevenue += parseFloat(o.amount) || 0;
    }
  }

  const activeOrdersCount = ordersList.filter(o => o.status !== 'completed').length;
  const totalLockers = compartmentsList.length || 16;
  const occupiedLockers = compartmentsList.filter(c => c.status === 'occupied').length;

  // Helper functions: replaces ternary operators with readable if/else blocks
  function getNavLinkClass(navId) {
    if (activeNav === navId) {
      return 'sidebar-nav-item active';
    }
    return 'sidebar-nav-item';
  }

  function getTableFilterClass(filterName) {
    if (tableFilter === filterName) {
      return 'table-tab-btn active';
    }
    return 'table-tab-btn';
  }

  function getStatusBadgeClass(status) {
    if (status === 'in_wash') {
      return 'order-status-badge badge-purple';
    }
    if (status === 'in_transit') {
      return 'order-status-badge badge-blue';
    }
    if (status === 'dropped_off') {
      return 'order-status-badge badge-amber';
    }
    if (status === 'ready_for_pickup') {
      return 'order-status-badge badge-orange';
    }
    if (status === 'completed') {
      return 'order-status-badge badge-green';
    }
    return 'order-status-badge badge-gray';
  }

  // Operator user profile attributes
  let operatorName = 'Elena Rostova';
  if (user && user.name) {
    operatorName = user.name;
  }

  let stationName = 'Central Mall Hub (Bay CMH-01)';
  if (user && user.station) {
    stationName = user.station;
  }

  // Callback when a bag is confirmed and started washing
  function handleStatusChange(orderId, newStatus, extraData) {
    loadDashboardData();
    if (updateOrderStatus) {
      updateOrderStatus(orderId, newStatus, extraData);
    }
  }

  // Filter recent orders based on search & tab
  const filteredOrders = ordersList.filter(function (order) {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = order.id ? order.id.toLowerCase().indexOf(q) !== -1 : false;
      const matchCust = order.customer_name ? order.customer_name.toLowerCase().indexOf(q) !== -1 : false;
      const boxStr = String(order.dropoff_box_number || order.compartment_number || '');
      const matchBox = boxStr.indexOf(q) !== -1;
      if (!matchId && !matchCust && !matchBox) {
        return false;
      }
    }

    if (tableFilter === 'pending_pickup') {
      return order.status === 'dropped_off';
    }

    if (tableFilter === 'in_wash') {
      return order.status === 'in_wash';
    }

    if (tableFilter === 'completed') {
      return order.status === 'completed';
    }

    return true;
  });

  return (
    <div className="operator-saas-layout">
      
      {/* --------------------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION                                         */}
      {/* --------------------------------------------------------------- */}
      <aside className="operator-left-sidebar">
        
        {/* Top: User Profile Card */}
        <div className="sidebar-profile-card">
          <div className="sidebar-avatar-wrap">
            <span className="sidebar-avatar-text">ER</span>
          </div>
          <div className="sidebar-profile-info">
            <span className="sidebar-user-name">{operatorName}</span>
            <span className="sidebar-user-station">elena@grabngobar.store</span>
          </div>
          <div className="sidebar-user-chevron">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Quick Search Field */}
        <div className="sidebar-search-box">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value); }}
            placeholder="Search orders, tags..."
            className="sidebar-search-input"
          />
          <span className="sidebar-search-shortcut">/</span>
        </div>

        {/* Main Navigation Links */}
        <nav className="sidebar-nav-list">
          
          <button
            type="button"
            onClick={function () { setActiveNav('dashboard'); }}
            className={getNavLinkClass('dashboard')}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={function () { setActiveNav('washing'); }}
            className={getNavLinkClass('washing')}
          >
            <RotateCw size={16} />
            <span>Washing & Billing</span>
            {inWashCount > 0 && <span className="sidebar-item-pill">{inWashCount}</span>}
          </button>

          <button
            type="button"
            onClick={function () { setActiveNav('lockers'); }}
            className={getNavLinkClass('lockers')}
          >
            <Box size={16} />
            <span>Locker Monitoring</span>
            <span className="sidebar-item-pill pill-gray">{totalLockers}</span>
          </button>

          <button
            type="button"
            onClick={function () { setActiveNav('binding'); }}
            className={getNavLinkClass('binding')}
          >
            <Link2 size={16} />
            <span>Laundry Locker Binding</span>
          </button>

        </nav>

        {/* Bottom Pinned Footer: Help & Exit */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-item">
            <HelpCircle size={15} />
            <span>Help & Guides</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="sidebar-logout-btn"
          >
            <LogOut size={15} />
            <span>Exit Portal</span>
          </button>
        </div>

      </aside>

      {/* --------------------------------------------------------------- */}
      {/* RIGHT MAIN CONTENT CANVAS                                       */}
      {/* --------------------------------------------------------------- */}
      <main className="operator-main-canvas">
        
        {/* Top Header Row with Station Identity & Quick Actions */}
        <header className="canvas-header-row">
          <div className="canvas-header-left">
            <div className="canvas-hub-icon">
              <Building2 size={18} color="#ea580c" />
            </div>
            <div className="canvas-title-group">
              <h2 className="canvas-station-title">{stationName}</h2>
              <span className="canvas-telemetry-status">
                <span className="canvas-live-dot"></span> PostgreSQL Live
              </span>
            </div>
          </div>

          <div className="canvas-header-actions">
            <button
              type="button"
              onClick={function () { setActiveNav('washing'); }}
              className="canvas-action-pill-btn"
            >
              <Plus size={14} />
              <span>New Order (F2)</span>
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* TOP METRICS SUMMARY STRIP (Live Database Calculations)        */}
        {/* ------------------------------------------------------------- */}
        <section className="top-metrics-card-strip">
          
          <div className="metric-strip-item">
            <span className="metric-strip-label">Total Revenue</span>
            <div className="metric-strip-value">
              ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="metric-strip-item">
            <span className="metric-strip-label">Active Orders</span>
            <div className="metric-strip-value">
              {activeOrdersCount}
            </div>
          </div>

          <div className="metric-strip-item">
            <span className="metric-strip-label">Locker Occupancy</span>
            <div className="metric-strip-value">
              {occupiedLockers} of {totalLockers}
            </div>
          </div>

          <div className="metric-strip-item item-last">
            <span className="metric-strip-label">Completed Orders</span>
            <div className="metric-strip-value">
              {completedCount}
            </div>
          </div>

        </section>

        {/* ------------------------------------------------------------- */}
        {/* CONDITIONAL MAIN CONTENT BASED ON SELECTED SIDEBAR NAVIGATION */}
        {/* ------------------------------------------------------------- */}

        {/* VIEW 1: DASHBOARD OVERVIEW (Metric Cards & Live Orders Table) */}
        {activeNav === 'dashboard' && (
          <div className="dashboard-view-content">
            
            {/* Middle Section: Operations Overview */}
            <div className="section-title-row">
              <div>
                <h3 className="section-main-heading">Operations</h3>
                <p className="section-sub-heading">
                  Real-time status of lockers, washing lines, and van transit from PostgreSQL.
                </p>
              </div>
            </div>

            {/* 3 Department Cards: LOCKER STATUS | ACTIVE CYCLE | DELIVERIES */}
            <div className="metrics-triad-grid">
              
              {/* Card 1: Smart Locker Fleet */}
              <div 
                className="triad-card"
                onClick={function () { setActiveNav('lockers'); }}
                title="Click to open Locker Monitoring"
              >
                <div className="triad-card-top">
                  <div className="triad-badge badge-green">
                    <span className="triad-dot dot-green"></span>
                    <span>Central Mall Lockers</span>
                  </div>
                  <ArrowUpRight size={15} className="triad-arrow" />
                </div>
                <span className="triad-metric-label">LOCKER STATUS</span>
                <div className="triad-main-number">{occupiedLockers} Occupied</div>
              </div>

              {/* Card 2: Washing Lines */}
              <div 
                className="triad-card"
                onClick={function () { setActiveNav('washing'); }}
                title="Click to open Washing & Billing Workbench"
              >
                <div className="triad-card-top">
                  <div className="triad-badge badge-orange">
                    <span className="triad-dot dot-orange"></span>
                    <span>Washing & Drying</span>
                  </div>
                  <ArrowUpRight size={15} className="triad-arrow" />
                </div>
                <span className="triad-metric-label">ACTIVE CYCLE</span>
                <div className="triad-main-number">{inWashCount} Bags</div>
              </div>

              {/* Card 3: Route Transit */}
              <div className="triad-card">
                <div className="triad-card-top">
                  <div className="triad-badge badge-blue">
                    <span className="triad-dot dot-blue"></span>
                    <span>Van Deliveries</span>
                  </div>
                  <ArrowUpRight size={15} className="triad-arrow" />
                </div>
                <span className="triad-metric-label">DELIVERIES</span>
                <div className="triad-main-number">{inTransitCount} In Transit</div>
              </div>

            </div>

            {/* Bottom Data Table Section */}
            <div className="orders-table-card">
              
              {/* Table Subtabs */}
              <div className="table-tabs-bar">
                <div className="table-tabs-left">
                  <button
                    type="button"
                    onClick={function () { setTableFilter('all'); }}
                    className={getTableFilterClass('all')}
                  >
                    <span>All Orders ({ordersList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={function () { setTableFilter('pending_pickup'); }}
                    className={getTableFilterClass('pending_pickup')}
                  >
                    <span>Pending for Pickup ({pendingPickupCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={function () { setTableFilter('in_wash'); }}
                    className={getTableFilterClass('in_wash')}
                  >
                    <span>In Wash ({inWashCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={function () { setTableFilter('completed'); }}
                    className={getTableFilterClass('completed')}
                  >
                    <span>Completed ({completedCount})</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="table-responsive-wrapper">
                {isLoading && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="relay-spinner" />
                    <span>Loading live orders from database...</span>
                  </div>
                )}

                {!isLoading && filteredOrders.length === 0 && (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontWeight: 600, color: '#0f172a' }}>No orders found</p>
                    <p style={{ fontSize: '0.8125rem' }}>No orders currently match the selected view.</p>
                  </div>
                )}

                {!isLoading && filteredOrders.length > 0 && (
                  <table className="facility-data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Locker / Station</th>
                        <th>Service Package</th>
                        <th>Date / Time</th>
                        <th>Weight</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(function (order) {
                        const boxNum = order.dropoff_box_number || order.compartment_number || '—';
                        const weightDisplay = order.weight_kg ? `${order.weight_kg} kg` : 'Pending';
                        const amountDisplay = order.amount ? `₱${parseFloat(order.amount).toFixed(2)}` : 'Pending';

                        return (
                          <tr key={order.id}>
                            <td className="cell-order-code">{order.id}</td>
                            <td className="cell-customer-name">{order.customer_name || 'Customer'}</td>
                            <td className="cell-station">Box #{boxNum} ({order.station_id || 'CMH-01'})</td>
                            <td className="cell-service">{order.service_tier || 'Wash, Dry & Fold'}</td>
                            <td className="cell-date">{formatOrderDate(order.created_at)}</td>
                            <td className="cell-weight">{weightDisplay}</td>
                            <td className="cell-amount">{amountDisplay}</td>
                            <td>
                              <span className={getStatusBadgeClass(order.status)}>
                                <span className="badge-dot"></span>
                                <span>{formatStatusLabel(order.status)}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: WASHING & BILLING WORKBENCH */}
        {activeNav === 'washing' && (
          <WashingBillingTab onStatusChange={handleStatusChange} />
        )}

        {/* VIEW 3: LOCKER MONITORING HARDWARE GRID */}
        {activeNav === 'lockers' && (
          <LockerMonitoringTab />
        )}

        {/* VIEW 4: LAUNDRY LOCKER BINDING & PROVISIONING */}
        {activeNav === 'binding' && (
          <LaundryLockerBindingTab 
            onNavigateToMonitoring={function (targetStationId) {
              setActiveNav('lockers');
            }}
          />
        )}

      </main>

    </div>
  );
}
