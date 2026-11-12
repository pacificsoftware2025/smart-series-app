import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { WashingBillingTab } from './intake/WashingBillingTab';
import { LockerMonitoringTab } from './hardware/LockerMonitoringTab';
import './OperatorView.css';

// Initial mock table orders for the Dashboard view
const RECENT_FACILITY_ORDERS = [
  {
    orderId: 'ORD-8421',
    customerName: 'Jamie Davis',
    sourceLocker: 'Box #03 (Central Mall)',
    serviceType: 'Wash, Dry & Fold',
    dateText: 'Nov 11, 2026, 01:47 PM',
    weightKg: 5.2,
    amount: '₱337.00',
    status: 'In Wash',
  },
  {
    orderId: 'ORD-7719',
    customerName: 'Carlos Mendoza',
    sourceLocker: 'Box #07 (North Plaza)',
    serviceType: 'Wash & Dry',
    dateText: 'Nov 11, 2026, 01:12 PM',
    weightKg: 7.4,
    amount: '₱432.00',
    status: 'On the Way',
  },
  {
    orderId: 'ORD-6204',
    customerName: 'Patricia Reyes',
    sourceLocker: 'Box #11 (Greenbelt)',
    serviceType: 'Wash Only',
    dateText: 'Nov 11, 2026, 12:40 PM',
    weightKg: 3.5,
    amount: '₱140.00',
    status: 'Pending for Pickup',
  },
  {
    orderId: 'ORD-8657',
    customerName: 'Miguel Santos',
    sourceLocker: 'Box #02 (Central Mall)',
    serviceType: 'Wash & Iron',
    dateText: 'Nov 11, 2026, 12:15 PM',
    weightKg: 4.2,
    amount: '₱280.00',
    status: 'Pending for Pickup',
  },
  {
    orderId: 'ORD-5192',
    customerName: 'Roberto Tan',
    sourceLocker: 'Box #06 (Central Mall)',
    serviceType: 'Wash, Dry & Fold',
    dateText: 'Nov 11, 2026, 11:25 AM',
    weightKg: 4.9,
    amount: '₱318.50',
    status: 'Completed',
  },
  {
    orderId: 'ORD-4088',
    customerName: 'Elena Cruz',
    sourceLocker: 'Box #04 (North Plaza)',
    serviceType: 'Wash & Dry',
    dateText: 'Nov 11, 2026, 10:15 AM',
    weightKg: 3.8,
    amount: '₱234.00',
    status: 'Completed',
  },
];

// ==============================================================================
// REACT COMPONENT: OperatorView
// Modern desktop SaaS workstation layout with left navigation sidebar,
// 4-column top metrics strip, and dedicated views:
// 1. Dashboard (Overview KPI cards + Recent Orders Table)
// 2. Washing & Billing (Scale Weighing, Pricing Calculator)
// 3. Locker Monitoring (15-Box Hardware Telemetry Grid)
// ==============================================================================
export function OperatorView() {
  const auth = useAuth();
  const user = auth.user;
  const logout = auth.logout;
  const updateOrderStatus = auth.updateOrderStatus;

  // Active view: 'dashboard' | 'washing' | 'lockers'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'pending_pickup' | 'in_facility' | 'completed'

  // Metric values
  const [activeOrdersCount, setActiveOrdersCount] = useState(8);
  const [inTransitCount, setInTransitCount] = useState(4);
  const [inWashCount, setInWashCount] = useState(4);
  const [occupiedLockers, setOccupiedLockers] = useState(3);
  const [totalLockers, setTotalLockers] = useState(15);
  const [todaysRevenue, setTodaysRevenue] = useState(4250.00);
  const [processedCount, setProcessedCount] = useState(14);

  // Dynamic order counts for table tabs
  // Vanilla JS comparison: Simple for-loop counting matching items in the array
  let pendingPickupCount = 0;
  let inWashOrdersCount = 0;
  let completedCount = 0;

  for (let i = 0; i < RECENT_FACILITY_ORDERS.length; i++) {
    const orderItem = RECENT_FACILITY_ORDERS[i];
    if (orderItem.status === 'Pending for Pickup') {
      pendingPickupCount = pendingPickupCount + 1;
    }
    if (orderItem.status === 'In Wash' || orderItem.status === 'Pending Wash' || orderItem.status === 'Pending') {
      inWashOrdersCount = inWashOrdersCount + 1;
    }
    if (orderItem.status === 'Completed') {
      completedCount = completedCount + 1;
    }
  }

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
    if (status === 'In Wash') {
      return 'order-status-badge badge-purple';
    }
    if (status === 'On the Way' || status === 'In Transit') {
      return 'order-status-badge badge-blue';
    }
    if (status === 'Pending for Pickup' || status === 'Pending' || status === 'Pending Wash') {
      return 'order-status-badge badge-amber';
    }
    if (status === 'Completed') {
      return 'order-status-badge badge-green';
    }
    return 'order-status-badge badge-gray';
  }

  // Operator user profile attributes
  let operatorName = 'Elena Rostova';
  if (user && user.name) {
    operatorName = user.name;
  }

  let stationName = 'Central Hub (Station #01)';
  if (user && user.station) {
    stationName = user.station;
  }

  // Callback when a bag is confirmed and started washing
  function handleStatusChange(orderId, newStatus, extraData) {
    setInWashCount(function (prev) {
      return prev + 1;
    });

    if (extraData && extraData.finalAmountDue) {
      setTodaysRevenue(function (prev) {
        return prev + extraData.finalAmountDue;
      });
    }

    if (updateOrderStatus) {
      updateOrderStatus(orderId, newStatus, extraData);
    }
  }

  const availableLockers = totalLockers - occupiedLockers;

  // Filter recent orders
  // Vanilla JS comparison: Array.filter returns a new array with items that match our conditions
  const filteredOrders = RECENT_FACILITY_ORDERS.filter(function (order) {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = order.orderId.toLowerCase().indexOf(q) !== -1;
      const matchCust = order.customerName.toLowerCase().indexOf(q) !== -1;
      const matchLocker = order.sourceLocker.toLowerCase().indexOf(q) !== -1;
      if (!matchId && !matchCust && !matchLocker) {
        return false;
      }
    }

    if (tableFilter === 'pending_pickup') {
      if (order.status === 'Pending for Pickup') {
        return true;
      }
      return false;
    }

    if (tableFilter === 'in_facility' || tableFilter === 'in_wash') {
      if (order.status === 'In Wash' || order.status === 'Pending Wash' || order.status === 'Pending') {
        return true;
      }
      return false;
    }

    if (tableFilter === 'completed') {
      if (order.status === 'Completed') {
        return true;
      }
      return false;
    }

    return true;
  });

  return (
    <div className="operator-saas-layout">
      
      {/* --------------------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION (Matching Reference Design)             */}
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

        {/* Quick Search Field with Shortcut Indicator */}
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
            <span className="sidebar-item-pill">New</span>
          </button>

          <button
            type="button"
            onClick={function () { setActiveNav('lockers'); }}
            className={getNavLinkClass('lockers')}
          >
            <Box size={16} />
            <span>Locker Monitoring</span>
            <span className="sidebar-item-pill pill-gray">15</span>
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
      {/* RIGHT MAIN CONTENT CANVAS (Clean White & Slate Layout)          */}
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
                <span className="canvas-live-dot"></span> System Online
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
        {/* TOP METRICS SUMMARY STRIP (Matches Reference 4-Metric Card)    */}
        {/* Total Sales | Total Spend | Paid out | Returns                */}
        {/* Adapted to: Total Revenue | Active Orders | Locker Occupancy | Completed */}
        {/* ------------------------------------------------------------- */}
        <section className="top-metrics-card-strip">
          
          <div className="metric-strip-item">
            <span className="metric-strip-label">Total Revenue</span>
            <div className="metric-strip-value">
              ₱{todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <span className="metric-strip-label">Completed Today</span>
            <div className="metric-strip-value">
              {processedCount}
            </div>
          </div>

        </section>

        {/* ------------------------------------------------------------- */}
        {/* CONDITIONAL MAIN CONTENT BASED ON SELECTED SIDEBAR NAVIGATION */}
        {/* ------------------------------------------------------------- */}

        {/* VIEW 1: DASHBOARD OVERVIEW (Metric Cards & Recent Orders Table) */}
        {activeNav === 'dashboard' && (
          <div className="dashboard-view-content">
            
            {/* Middle Section: Operations Overview */}
            <div className="section-title-row">
              <div>
                <h3 className="section-main-heading">Operations</h3>
                <p className="section-sub-heading">
                  Real-time status of lockers, washing machines, and pending bags.
                </p>
              </div>
            </div>

            {/* 3 Department Cards: LOCKER STATUS | ACTIVE CYCLE | DELIVERIES */}
            <div className="metrics-triad-grid">
              
              {/* Card 1: Smart Locker Fleet (LOCKER STATUS) */}
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

              {/* Card 2: Washing Lines (ACTIVE CYCLE) */}
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

              {/* Card 3: Route Transit (DELIVERIES) */}
              <div className="triad-card">
                <div className="triad-card-top">
                  <div className="triad-badge badge-blue">
                    <span className="triad-dot dot-blue"></span>
                    <span>Van Deliveries</span>
                  </div>
                  <ArrowUpRight size={15} className="triad-arrow" />
                </div>
                <span className="triad-metric-label">DELIVERIES</span>
                <div className="triad-main-number">{inTransitCount} On the Way</div>
              </div>

            </div>

            {/* Bottom Data Table Section (Matches Reference Table Style) */}
            <div className="orders-table-card">
              
              {/* Table Subtabs */}
              <div className="table-tabs-bar">
                <div className="table-tabs-left">
                  <button
                    type="button"
                    onClick={function () { setTableFilter('all'); }}
                    className={getTableFilterClass('all')}
                  >
                    <span>All Orders ({RECENT_FACILITY_ORDERS.length})</span>
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
                    <span>In Wash ({inWashOrdersCount})</span>
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
                      return (
                        <tr key={order.orderId}>
                          <td className="cell-order-code">{order.orderId}</td>
                          <td className="cell-customer-name">{order.customerName}</td>
                          <td className="cell-station">{order.sourceLocker}</td>
                          <td className="cell-service">{order.serviceType}</td>
                          <td className="cell-date">{order.dateText}</td>
                          <td className="cell-weight">{order.weightKg} kg</td>
                          <td className="cell-amount">{order.amount}</td>
                          <td>
                            <span className={getStatusBadgeClass(order.status)}>
                              <span className="badge-dot"></span>
                              <span>{order.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      </main>

    </div>
  );
}
