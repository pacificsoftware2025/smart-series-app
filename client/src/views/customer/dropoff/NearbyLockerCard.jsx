import React, { useState, useRef } from 'react';
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
// REACT COMPONENT: NearbyLockerCard
// Displays the interactive minimap (zoomable & draggable) for the nearby locker,
// locker compartment availability, and the camera scanner trigger button.
// ==============================================================================
export function NearbyLockerCard(props) {
  // In Vanilla JS: function argument 'onOpenScanner'.
  // In React: passed down from CustomerView as props.onOpenScanner.
  const onOpenScanner = props.onOpenScanner;

  // ============================================================================
  // LOCAL STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let zoom = 1.0;
  //   let pan = { x: 0, y: 0 };
  //   function updateTransform() {
  //     mapInner.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  //   }
  // In React:
  //   React re-renders the component and applies inline styles automatically.
  // ============================================================================
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // ----------------------------------------------------------------------------
  // MAP ZOOM HANDLERS
  // ----------------------------------------------------------------------------
  function handleZoomIn(e) {
    e.stopPropagation();
    setZoom((prevZoom) => {
      const next = prevZoom + 0.35;
      if (next > 2.5) {
        return 2.5;
      }
      return parseFloat(next.toFixed(2));
    });
  }

  function handleZoomOut(e) {
    e.stopPropagation();
    setZoom((prevZoom) => {
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
    // Only allow left click dragging
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
  // TOUCH DRAG HANDLERS (For Mobile Phones)
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
      setZoom((prev) => Math.min(prev + 0.15, 2.5));
    } else {
      setZoom((prev) => Math.max(prev - 0.15, 0.85));
    }
  }

  // ----------------------------------------------------------------------------
  // OPEN EXTERNAL NAVIGATION
  // Only called when the user explicitly clicks "Open Navigation"
  // ----------------------------------------------------------------------------
  function handleOpenNavigationClick(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    window.open('https://www.google.com/maps/search/?api=1&query=Central+Mall+Makati', '_blank');
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
        <span className="distance-subtag">0.4 km away</span>
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
              <rect x="350" y="40" width="100" height="60" rx="8" fill="#e2e8f0" />
              <rect x="80" y="170" width="110" height="60" rx="8" fill="#e2e8f0" />
              <rect x="440" y="140" width="110" height="80" rx="8" fill="#e2e8f0" />

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
              <text x="370" y="70" fill="#94a3b8" fontSize="8" fontWeight="600">
                Commercial Hub
              </text>

              {/* Central Mall Complex Footprint */}
              <rect 
                x="250" 
                y="105" 
                width="120" 
                height="80" 
                rx="14" 
                fill="#ffedd5" 
                stroke="#fed7aa" 
                strokeWidth="2" 
              />
            </svg>

            {/* Destination Pin on Central Mall */}
            <div className="map-pin-anchor">
              {/* Radar pulse wave effect */}
              <div className="pin-radar-ring"></div>
              
              <div className="pin-icon-circle">
                <Box size={16} />
              </div>
              
              <span className="mall-name-pill">
                Central Mall Hub
              </span>
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
          {/* Only this triggers external map redirection! */}
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
          <div className="station-title-row">
            <div>
              <h3 className="station-main-title">Central Mall Hub</h3>
              <p className="station-sub-info">Open 24 hours · Level 1, east entrance</p>
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
              <span>4 small, 2 large available</span>
            </div>
            <span className="live-green-dot"></span>
          </div>

          {/* Primary Action Button: Opens Camera Scanner */}
          {/* Updated text: Removed "At the locker?" */}
          <button
            type="button"
            onClick={onOpenScanner}
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
