import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NearbyLockerCard } from './dropoff/NearbyLockerCard';
import { CameraScannerModal } from './dropoff/CameraScannerModal';
import { ServicePreferenceModal } from './dropoff/ServicePreferenceModal';
import { ActiveOrderCard } from './tracker/ActiveOrderCard';

// ==============================================================================
// REACT COMPONENT: CustomerView
// This is the parent container for the Customer Experience.
// It coordinates the two tabs: NEARBY LOCKER and ACTIVE ORDER.
// ==============================================================================
export function CustomerView(props) {
  // In Vanilla JS: function arguments.
  // We extract activeTab and setActiveTab passed down from MobileShell.
  const activeTab = props.activeTab;
  const setActiveTab = props.setActiveTab;

  // useAuth() gives us access to our global createOrder() function.
  const auth = useAuth();
  const createOrder = auth.createOrder;

  // ============================================================================
  // REACT STATE (useState) explained in Vanilla JS:
  // In Vanilla JS:
  //   let isScannerOpen = false;
  //   let isPreferenceModalOpen = false;
  //   let scannedStationData = null;
  // In React:
  //   We use useState() so that whenever we change these values, React
  //   automatically shows or hides the modals on the screen.
  // ============================================================================
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [scannedStationData, setScannedStationData] = useState(null);

  // ============================================================================
  // CALLBACK FUNCTION: handleScanSuccess
  // In Vanilla JS: A standard callback function.
  // When CameraScannerModal completes scanning, it calls this function with data.
  // ============================================================================
  function handleScanSuccess(stationData) {
    setIsScannerOpen(false); // Closes camera modal
    setScannedStationData(stationData); // Saves the scanned locker data in state
    setIsPreferenceModalOpen(true); // Opens the Service Preference modal
  }

  // ============================================================================
  // CALLBACK FUNCTION: handleCompleteOrder
  // When the user clicks "Save Preference & Unlock Locker" in the modal:
  // ============================================================================
  function handleCompleteOrder(orderData) {
    setIsPreferenceModalOpen(false); // Closes the preference modal
    createOrder(orderData); // Creates the new active order in global state
    setActiveTab('active_order'); // Automatically switches the screen to the ACTIVE ORDER tab!
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* CONDITIONAL RENDERING (Like if/else in Vanilla JS):            */}
      {/* If activeTab is 'nearby', show the NearbyLockerCard.          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'nearby' && (
        <NearbyLockerCard onOpenScanner={function () { setIsScannerOpen(true); }} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* If activeTab is 'active_order', show the ActiveOrderCard.     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'active_order' && (
        <ActiveOrderCard onSwitchToDropoff={function () { setActiveTab('nearby'); }} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* Step 1: Camera Scanner Modal                                  */}
      {/* isOpen controls whether this modal is visible or hidden.      */}
      {/* ------------------------------------------------------------- */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={function () { setIsScannerOpen(false); }}
        onScanSuccess={handleScanSuccess}
      />

      {/* ------------------------------------------------------------- */}
      {/* Step 2: Service Preference Dropdown & Special Notes Modal     */}
      {/* ------------------------------------------------------------- */}
      <ServicePreferenceModal
        isOpen={isPreferenceModalOpen}
        onClose={function () { setIsPreferenceModalOpen(false); }}
        stationData={scannedStationData}
        onCompleteOrder={handleCompleteOrder}
      />
    </div>
  );
}
