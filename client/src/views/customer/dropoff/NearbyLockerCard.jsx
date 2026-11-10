import React from 'react';
import { QrCode, ArrowUpRight, Box, Compass } from 'lucide-react';
import './NearbyLockerCard.css';

// ==============================================================================
// REACT COMPONENT: NearbyLockerCard
// Displays the nearby locker station card with map preview, directions,
// and the main CTA button to open the camera scanner.
// ==============================================================================
export function NearbyLockerCard(props) {
  // In Vanilla JS: function argument 'onOpenScanner'.
  // In React: passed down from CustomerView as props.onOpenScanner.
  const onOpenScanner = props.onOpenScanner;

  // In Vanilla JS: Opens an external link in a new browser tab.
  function handleOpenNavigationClick() {
    window.open('https://www.google.com/maps/search/?api=1&query=Central+Mall+Makati', '_blank');
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
        
        {/* Interactive Map Graphic (Tap to open Google Maps) */}
        <div 
          onClick={handleOpenNavigationClick}
          className="map-visual-container"
          title="Tap to open navigation in Google Maps"
        >
          {/* Vector Map SVG Graphic */}
          <svg className="vector-map-bg" viewBox="0 0 400 160" preserveAspectRatio="none">
            <rect width="400" height="160" fill="#f1f5f9" />
            <path d="M-20,40 L420,130" stroke="#e2e8f0" strokeWidth="16" />
            <path d="M120,-20 L260,180" stroke="#e2e8f0" strokeWidth="20" />
            <path d="M220,-20 L320,180" stroke="#e2e8f0" strokeWidth="12" />
            <path d="M-20,110 L420,30" stroke="#ffffff" strokeWidth="8" />
          </svg>

          {/* District Tag */}
          <div className="city-district-badge">
            Makati City
          </div>

          {/* Destination Pin */}
          <div className="map-pin-anchor">
            <div className="pin-icon-circle">
              <Box size={16} />
            </div>
            <span className="mall-name-pill">
              Central Mall
            </span>
          </div>

          {/* Open Nav Floater */}
          <div className="open-nav-floater">
            <Compass size={12} />
            <span>Open Navigation</span>
            <ArrowUpRight size={12} />
          </div>
        </div>

        {/* Station Details */}
        <div className="station-card-body">
          <div className="station-title-row">
            <div>
              <h3 className="station-main-title">Central Mall Hub</h3>
              <p className="station-sub-info">Open 24 hours · Level 1, east entrance</p>
            </div>
            <button 
              onClick={handleOpenNavigationClick}
              className="icon-button"
              title="Navigate to Locker"
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
          <button
            onClick={onOpenScanner}
            className="scan-drop-cta-btn"
          >
            <div className="btn-left-icon-group">
              <div className="qr-icon-plate">
                <QrCode size={18} color="#ffffff" />
              </div>
              <span>At the Locker? Tap to Scan Locker QR Code & Drop Off</span>
            </div>
            <ArrowUpRight size={18} color="#ffffff" />
          </button>
        </div>

      </div>
    </div>
  );
}
