import React, { useState, useEffect } from 'react';
import { X, Camera, Flashlight, FastForward } from 'lucide-react';
import './CameraScannerModal.css';

// ==============================================================================
// REACT COMPONENT: CameraScannerModal
// Displays the camera viewfinder and the "Skip QR" button for testing.
// ==============================================================================
export function CameraScannerModal(props) {
  // In Vanilla JS: function arguments.
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onScanSuccess = props.onScanSuccess;
  const stationData = props.stationData;

  // ============================================================================
  // REACT STATE (useState) explained in Vanilla JS:
  // let flashlightOn = false;
  // let isScanning = true;
  // ============================================================================
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  // ============================================================================
  // REACT EFFECT (useEffect) explained in Vanilla JS:
  // In Vanilla JS, think of this like a watcher: whenever 'isOpen' changes,
  // this function runs. When the modal opens (isOpen is true), reset isScanning to true.
  // ============================================================================
  useEffect(function () {
    if (isOpen) {
      setIsScanning(true);
    }
  }, [isOpen]);

  // If the modal is closed, return null (render nothing to the DOM)
  if (!isOpen) {
    return null;
  }

  // ============================================================================
  // FUNCTION: handleSkipQR
  // Bypasses QR camera decoding and immediately triggers the onScanSuccess callback.
  // Uses selected station info if provided from NearbyLockerCard.
  // ============================================================================
  function handleSkipQR() {
    setIsScanning(false);
    let targetStationId = 'CMH-01';
    let targetStationName = 'Central Mall Hub (Level 1 East)';
    let targetBox = '03';

    if (stationData) {
      if (stationData.id) {
        targetStationId = stationData.id;
      }
      if (stationData.name) {
        targetStationName = stationData.name;
      }
      if (stationData.assignedBox) {
        targetBox = stationData.assignedBox;
      }
    }

    onScanSuccess({
      stationId: targetStationId,
      stationName: targetStationName,
      assignedBox: targetBox,
      size: 'Medium Box (Wash & Fold)',
    });
  }

  function handleFlashlightToggle() {
    setFlashlightOn(!flashlightOn);
  }

  function getFlashlightBtnClass() {
    if (flashlightOn) {
      return 'scanner-circle-btn flash-active';
    }
    return 'scanner-circle-btn';
  }

  return (
    <div className="scanner-overlay-backdrop">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP CONTROLS                                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="scanner-top-bar">
        <button 
          onClick={handleFlashlightToggle}
          className={getFlashlightBtnClass()}
          title="Toggle Flash"
        >
          <Flashlight size={20} />
        </button>

        <span className="scanner-instruction-label">
          Point at Locker QR Code
        </span>

        <button 
          onClick={onClose}
          className="scanner-circle-btn"
          title="Close Camera"
        >
          <X size={20} />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CENTER VIEWFINDER                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="scanner-viewfinder-box">
        {/* In Vanilla JS: if (isScanning) { laserElement.style.display = 'block'; } */}
        {isScanning && <div className="scanner-laser-bar"></div>}

        <div className="viewfinder-dash-border"></div>
        <div className="corner-bracket bracket-tl"></div>
        <div className="corner-bracket bracket-tr"></div>
        <div className="corner-bracket bracket-bl"></div>
        <div className="corner-bracket bracket-br"></div>

        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <Camera size={36} color="rgba(255, 255, 255, 0.4)" />
          <p className="camera-guide-text">Align the QR code inside the frame</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM TRAY WITH SKIP BUTTON (FOR TEST MODE)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="scanner-bottom-tray">
        <button
          onClick={handleSkipQR}
          className="skip-qr-test-btn"
          title="Skip scanning to test laundry preferences"
        >
          <FastForward size={16} />
          <span>Skip QR (for testing purpose only)</span>
        </button>

        <p style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
          Bypasses camera decode & connects to Station CMH-01
        </p>
      </div>

    </div>
  );
}
