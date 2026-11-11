import React, { useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  QrCode, 
  ArrowUpRight, 
  Box, 
  Compass, 
  Plus, 
  Minus, 
  RotateCcw,
  Navigation
} from 'lucide-react';
import './NearbyLockerCard.css';

// ==============================================================================
// NEARBY STATIONS CATALOG
// Static data for smart locker stations in the vicinity
// ==============================================================================
const NEARBY_STATIONS = [
  {
    id: 'CMH-01',
    name: 'Central Mall Hub',
    subInfo: 'Open 24 hours · Level 1, east entrance',
    distance: '0.4 km away',
    availability: '4 small, 2 large available',
    assignedBox: '03',
  },
  {
    id: 'ACH-02',
    name: 'Ayala Commercial Kiosk',
    subInfo: 'Open 6 AM - 11 PM · Ground floor lobby',
    distance: '0.6 km away',
    availability: '3 small, 3 medium available',
    assignedBox: '05',
  },
];

// Helper function: returns active station object based on ID
function getActiveStation(stationId) {
  if (stationId === 'ACH-02') {
    return NEARBY_STATIONS[1];
  }
  return NEARBY_STATIONS[0];
}

// Helper function: determines pin icon circle CSS class
function getPinCircleClass(stationId, activeId) {
  if (stationId === activeId) {
    return 'pin-icon-circle pin-active';
  }
  return 'pin-icon-circle pin-inactive';
}

// ==============================================================================
// REACT COMPONENT: NearbyLockerCard
// Displays the interactive minimap (zoomable & draggable) with multiple nearby
// locker stations, availability counters, and the drop-off scanner trigger.
// ==============================================================================
export function NearbyLockerCard(props) {
  // In Vanilla JS: function argument 'onOpenScanner'.
  // In React: passed down from CustomerView as props.onOpenScanner.
  const onOpenScanner = props.onOpenScanner;

  // useAuth() to synchronize the selected active station with the top navigation header
  const auth = useAuth();

  // ============================================================================
  // LOCAL STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let zoom = 1.0;
  //   let pan = { x: 0, y: 0 };
  //   let selectedStationId = 'CMH-01';
  // In React:
  //   Calling state setters tells React to automatically re-render the view.
  // ============================================================================
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null); // null = no locker clicked initially
  const [hoveredStationId, setHoveredStationId] = useState(null); // tracks locker pin mouse hover
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Currently active station data
  const activeStation = getActiveStation(selectedStationId);

  // ----------------------------------------------------------------------------
  // STATION SELECTION HANDLER
  // ----------------------------------------------------------------------------
  function handleSelectStation(station, e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setSelectedStationId(station.id);
    if (auth && auth.setActiveLocation) {
      auth.setActiveLocation(station.name);
    }
  }

  // ----------------------------------------------------------------------------
  // MAP ZOOM HANDLERS
  // ----------------------------------------------------------------------------
  function handleZoomIn(e) {
    e.stopPropagation();
    setZoom(function (prevZoom) {
      const next = prevZoom + 0.35;
      if (next > 2.5) {
        return 2.5;
      }
      return parseFloat(next.toFixed(2));
    });
  }

  function handleZoomOut(e) {
    e.stopPropagation();
    setZoom(function (prevZoom) {
      const next = prevZoom - 0.35;
      if (next < 0.85) {
        return 0.85;
      }
      return parseFloat(next.toFixed(2));
    });
  }

  function handleResetView(e) {
    e.stopPropagation();
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }

  // ----------------------------------------------------------------------------
  // MOUSE DRAG HANDLERS (Pan)
  // ----------------------------------------------------------------------------
  function handleMouseDown(e) {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // ----------------------------------------------------------------------------
  // TOUCH DRAG HANDLERS (Mobile Phones)
  // ----------------------------------------------------------------------------
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    }
  }

  function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY,
    });
  }

  function handleTouchEnd() {
    setIsDragging(false);
  }

  // Wheel zoom handler
  function handleWheel(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(function (prev) { return Math.min(prev + 0.15, 2.5); });
    } else {
      setZoom(function (prev) { return Math.max(prev - 0.15, 0.85); });
    }
  }

  // External Navigation Trigger
  function handleOpenNavigationClick(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(activeStation.name + ' Makati'), '_blank');
  }

  // Trigger Scanner Modal with the currently selected station data
  function handleScanClick() {
    if (onOpenScanner) {
      onOpenScanner(activeStation);
    }
  }

  function getMapContainerClass() {
    if (isDragging) {
      return 'map-visual-container dragging';
    }
    return 'map-visual-container';
  }

  return (
    <div className="nearby-section-container">
      
      {/* ------------------------------------------------------------- */}
      {/* SECTION HEADER                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="section-headline-bar">
        <span>Nearby Smart Locker</span>
        <span className="distance-subtag">{activeStation.distance}</span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN STATION PREVIEW CARD                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="station-preview-card">
        
        {/* =========================================================== */}
        {/* INTERACTIVE MINIMAP CONTAINER (Zoomable + Draggable)        */}
        {/* =========================================================== */}
        <div 
          className={getMapContainerClass()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Zoomable & Pannable Vector Layer */}
          <div 
            className="map-transform-layer"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* Rich Vector Street & Landmark Map */}
            <svg 
              className="vector-map-bg" 
              viewBox="0 0 600 300" 
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Base terrain */}
              <rect width="600" height="300" fill="#f8fafc" />

              {/* Green Park / Public Plaza Zone */}
              <rect x="60" y="40" width="130" height="90" rx="12" fill="#dcfce7" />
              <text x="75" y="75" fill="#15803d" fontSize="10" fontWeight="700">Park Plaza</text>

              {/* Water Canal / Pasig River Spur */}
              <path 
                d="M-20,250 C120,240 220,270 380,245 C480,230 550,260 620,250" 
                fill="none" 
                stroke="#e0f2fe" 
                strokeWidth="28" 
                strokeLinecap="round"
              />

              {/* City Blocks (Buildings) */}
              <rect x="230" y="30" width="90" height="70" rx="8" fill="#e2e8f0" />
              <rect x="80" y="170" width="110" height="60" rx="8" fill="#e2e8f0" />
              <rect x="450" y="140" width="110" height="80" rx="8" fill="#e2e8f0" />

              {/* Secondary Streets */}
              <path d="M-20,80 L620,80" stroke="#ffffff" strokeWidth="12" />
              <path d="M-20,200 L620,200" stroke="#ffffff" strokeWidth="12" />
              <path d="M110,-20 L110,320" stroke="#ffffff" strokeWidth="12" />
              <path d="M470,-20 L470,320" stroke="#ffffff" strokeWidth="12" />

              {/* Primary Major Avenues */}
              <path d="M-20,135 L620,145" stroke="#cbd5e1" strokeWidth="20" strokeLinecap="round" />
              <path d="M-20,135 L620,145" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
              
              <path d="M280,-20 L310,320" stroke="#cbd5e1" strokeWidth="22" strokeLinecap="round" />
              <path d="M280,-20 L310,320" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" />

              {/* Street Names */}
              <text x="330" y="132" fill="#64748b" fontSize="9" fontWeight="700" letterSpacing="0.05em">
                AYALA AVENUE
              </text>
              <text x="210" y="270" fill="#94a3b8" fontSize="8" fontWeight="600">
                MAKATI AVE
              </text>
            </svg>

            {/* --------------------------------------------------------- */}
            {/* PIN 1: Central Mall Hub (Positioned at 50%, 50%)          */}
            {/* --------------------------------------------------------- */}
            <div 
              onClick={function (e) { handleSelectStation(NEARBY_STATIONS[0], e); }}
              onMouseEnter={function () { setHoveredStationId('CMH-01'); }}
              onMouseLeave={function () { setHoveredStationId(null); }}
              className="map-pin-anchor"
              style={{ top: '50%', left: '50%' }}
              title="Central Mall Hub"
            >
              {selectedStationId === 'CMH-01' && <div className="pin-radar-ring"></div>}
              
              <div className={getPinCircleClass('CMH-01', selectedStationId)}>
                <Box size={15} />
              </div>
              
              {/* Clicked State: Shows Name AND Available Large/Small */}
              {selectedStationId === 'CMH-01' && (
                <div className="mall-name-pill pill-selected">
                  <span className="pill-station-title">Central Mall Hub</span>
                  <span className="pill-station-avail">4 small, 2 large available</span>
                </div>
              )}

              {/* Hover-Only State: Shows Locker Name on mouse hover */}
              {hoveredStationId === 'CMH-01' && selectedStationId !== 'CMH-01' && (
                <div className="mall-name-pill pill-hovered">
                  <span className="pill-station-title">Central Mall Hub</span>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* PIN 2: Ayala Commercial Kiosk (Positioned at 28%, 68%)    */}
            {/* --------------------------------------------------------- */}
            <div 
              onClick={function (e) { handleSelectStation(NEARBY_STATIONS[1], e); }}
              onMouseEnter={function () { setHoveredStationId('ACH-02'); }}
              onMouseLeave={function () { setHoveredStationId(null); }}
              className="map-pin-anchor"
              style={{ top: '28%', left: '68%' }}
              title="Ayala Commercial Kiosk"
            >
              {selectedStationId === 'ACH-02' && <div className="pin-radar-ring"></div>}
              
              <div className={getPinCircleClass('ACH-02', selectedStationId)}>
                <Box size={15} />
              </div>
              
              {/* Clicked State: Shows Name AND Available Large/Small */}
              {selectedStationId === 'ACH-02' && (
                <div className="mall-name-pill pill-selected">
                  <span className="pill-station-title">Ayala Commercial Kiosk</span>
                  <span className="pill-station-avail">3 small, 3 medium available</span>
                </div>
              )}

              {/* Hover-Only State: Shows Locker Name on mouse hover */}
              {hoveredStationId === 'ACH-02' && selectedStationId !== 'ACH-02' && (
                <div className="mall-name-pill pill-hovered">
                  <span className="pill-station-title">Ayala Commercial Kiosk</span>
                </div>
              )}
            </div>

          </div>

          {/* District Tag (Fixed Overlay) */}
          <div className="city-district-badge">
            <Navigation size={10} className="district-icon" />
            <span>Makati City · Metro Manila</span>
          </div>

          {/* Interactive Zoom Controls (Fixed Overlay) */}
          <div className="map-zoom-controls">
            <button 
              type="button" 
              onClick={handleZoomIn} 
              className="zoom-btn"
              title="Zoom In"
            >
              <Plus size={14} />
            </button>
            <button 
              type="button" 
              onClick={handleZoomOut} 
              className="zoom-btn"
              title="Zoom Out"
            >
              <Minus size={14} />
            </button>
            <button 
              type="button" 
              onClick={handleResetView} 
              className="zoom-btn reset-btn"
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
            <span className="zoom-level-pill">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Dedicated "Open Navigation" Button (Fixed Overlay) */}
          <button 
            type="button"
            onClick={handleOpenNavigationClick}
            className="open-nav-floater"
            title="Open in Google Maps / Navigation"
          >
            <Compass size={13} />
            <span>Open Navigation</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STATION DETAILS                                               */}
        {/* ------------------------------------------------------------- */}
        <div className="station-card-body">
          
          {/* Station Title Row */}
          <div className="station-title-row">
            <div>
              <h3 className="station-main-title">{activeStation.name}</h3>
              <p className="station-sub-info">{activeStation.subInfo}</p>
            </div>
            <button 
              type="button"
              onClick={handleOpenNavigationClick}
              className="icon-button"
              title="Navigate to Locker in Google Maps"
            >
              <ArrowUpRight size={18} color="var(--slate-500)" />
            </button>
          </div>

          {/* Locker Box Availability Indicator */}
          <div className="availability-status-pill">
            <div className="availability-inner">
              <div className="avail-icon-box">
                <Box size={14} />
              </div>
              <span>{activeStation.availability}</span>
            </div>
            <span className="live-green-dot"></span>
          </div>

          {/* Primary Action Button: Opens Camera Scanner */}
          <button
            type="button"
            onClick={handleScanClick}
            className="scan-drop-cta-btn"
          >
            <div className="btn-left-icon-group">
              <div className="qr-icon-plate">
                <QrCode size={18} color="#ffffff" />
              </div>
              <span>Tap to Scan Locker QR Code & Drop Off</span>
            </div>
            <ArrowUpRight size={18} color="#ffffff" />
          </button>
        </div>

      </div>
    </div>
  );
}
