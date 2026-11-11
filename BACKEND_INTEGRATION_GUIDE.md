# BACKEND INTEGRATION & API SPECIFICATION GUIDELINE
Smart Locker & IoT Laundry Platform (Grab N Go Bar)

This document serves as the complete technical handoff and specification guideline for the Backend Developer who will build the Node.js/Express REST APIs and database models to integrate with the React Frontend (`client/`).

---

## 1. System Overview & Architecture Context

- **Frontend Technology:** React 18 + Vite (located in `client/`).
- **Backend Scaffold:** Node.js + Express (located in `server/`).
- **Core Product Flow:**
  1. Customer or Guest approaches an IoT Smart Locker kiosk or opens the web app.
  2. Scans QR code on the locker kiosk camera or selects a nearby locker hub.
  3. Configures laundry preferences (Service tier, load capacity, water temperature, fabric softener, notes).
  4. Locker solenoid lock actuates (door unlocks) to receive laundry bag.
  5. Order enters a 4-step tracked lifecycle (Drop-off -> Van Transit -> In Wash -> Ready for Pickup).
  6. Customer pays via GCash/Maya/Card upon locker return, receives 6-digit claim PIN, and unlocks the pickup compartment.

---

## 2. Recommended Database Schemas & Data Contracts

### 2.1 User Entity (`users` table / collection)
```json
{
  "id": "usr_948201",
  "name": "Maria Santos",
  "phone": "+639171234567",
  "role": "guest", // "guest" | "customer" | "rider" | "operator"
  "initials": "MS",
  "defaultLocation": "Central Mall Hub",
  "createdAt": "2026-11-10T08:30:00.000Z"
}
```
*Notes on Auth:*
- The system uses passwordless authentication via Philippine mobile numbers (`+63 9XX XXX XXXX`).
- Both registered Customers and Guests can create orders.
- Guests have `role: "guest"`, while registered accounts have `role: "customer"`.

---

### 2.2 Locker Hub Entity (`locker_stations` table)
```json
{
  "stationId": "CMH-01",
  "name": "Central Mall Hub",
  "address": "Ground Floor, Central Mall, Metro Manila",
  "latitude": 14.5547,
  "longitude": 121.0244,
  "totalCompartments": 16,
  "availableCompartments": 12,
  "status": "online" // "online" | "offline" | "maintenance"
}
```

---

### 2.3 Locker Compartment Entity (`locker_compartments` table)
```json
{
  "stationId": "CMH-01",
  "boxNumber": "03",
  "size": "medium", // "small" | "medium" | "large"
  "status": "occupied", // "available" | "reserved" | "occupied" | "maintenance"
  "currentOrderId": "ORD-8569",
  "solenoidState": "locked" // "locked" | "unlocked"
}
```

---

### 2.4 Laundry Order Entity (`orders` table)
```json
{
  "id": "ORD-8569",
  "userId": "usr_948201",
  "userName": "Maria Santos",
  "userPhone": "+639171234567",
  "stationId": "CMH-01",
  "dropoffBoxNumber": "03",
  "pickupBoxNumber": "06",
  "serviceType": "Wash & Dry", // "Wash Only" | "Wash & Dry" | "Wash, Dry & Fold"
  "loadSize": "Medium (Max 7kg)", // "Small (Max 5kg)" | "Medium (Max 7kg)" | "Large (Max 9kg)"
  "temperature": "Warm Wash", // "Cold Wash" | "Warm Wash"
  "fabricSoftener": true,
  "specialInstructions": "Please handle delicate blouse with extra care",
  "status": "dropped_off", // "dropped_off" | "rider_transit" | "in_wash" | "ready_for_pickup" | "completed"
  "weightKg": 5.2,
  "priceEstimate": 337.00,
  "finalAmountDue": 337.00,
  "isPaid": false,
  "paymentMethod": "GCash", // "GCash" | "Maya" | "Card" | null
  "claimPin": "842019", // 6-digit numeric claim PIN generated when delivered to pickup locker
  "estimatedReady": "Today, 6:30 PM",
  "createdAt": "2026-11-10T11:24:00.000Z",
  "updatedAt": "2026-11-10T11:24:00.000Z"
}
```

---

## 3. Required REST API Endpoints

### 3.1 Authentication Routes (`/api/auth`)

#### `POST /api/auth/guest`
Handles quick guest drop-off registration without permanent passwords.
- **Request Body:**
  ```json
  {
    "name": "Alex Morgan",
    "phone": "917 123 4567"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "usr_guest_102",
      "name": "Alex Morgan",
      "initials": "AM",
      "phone": "+639171234567",
      "role": "guest",
      "location": "Central Mall Hub"
    }
  }
  ```

#### `POST /api/auth/signin`
Sign in with mobile number.
- **Request Body:**
  ```json
  {
    "phone": "917 000 0000"
  }
  ```
- **Response (200 OK):** User object and JWT token.

#### `POST /api/auth/signup`
Creates a new customer account.
- **Request Body:**
  ```json
  {
    "name": "Jamie Davis",
    "phone": "917 555 1234"
  }
  ```
- **Response (201 Created):** User object with `role: "customer"` and JWT token.

*Phone Validation Contract Across All Auth Routes:*
- The frontend enforces strict phone validation: **numbers only (`0-9`)** and **maximum 10 digits** (e.g., `9171234567`, excluding the PH country code `+63`).
- Backend controllers should sanitize or validate with `phone.replace(/\D/g, '').slice(0, 10)` to match.

---

### 3.2 Locker & Hardware Routes (`/api/lockers`)

#### `GET /api/lockers/nearby?lat=14.5547&lng=121.0244`
Returns locker stations in proximity with compartment availability.
- **Response (200 OK):**
  ```json
  {
    "stations": [
      {
        "stationId": "CMH-01",
        "name": "Central Mall Hub",
        "subInfo": "Open 24 hours · Level 1, east entrance",
        "distance": "0.4 km away",
        "availability": "4 small, 2 large available",
        "assignedBox": "03",
        "isOnline": true
      },
      {
        "stationId": "ACH-02",
        "name": "Ayala Commercial Kiosk",
        "subInfo": "Open 6 AM - 11 PM · Ground floor lobby",
        "distance": "0.6 km away",
        "availability": "3 small, 3 medium available",
        "assignedBox": "05",
        "isOnline": true
      }
    ]
  }
  ```

#### `POST /api/lockers/:stationId/reserve`
Reserves an available compartment for drop-off and triggers door unlock.
- **Request Body:**
  ```json
  {
    "requiredSize": "medium",
    "userId": "usr_948201"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "stationId": "CMH-01",
    "assignedBox": "03",
    "doorUnlocked": true,
    "unlockExpirySeconds": 180
  }
  ```

---

### 3.3 Laundry Orders Routes (`/api/orders`)

#### `POST /api/orders`
Creates a new laundry order after the customer confirms preferences and closes the door.
- **Request Body:**
  ```json
  {
    "stationId": "CMH-01",
    "stationName": "Central Mall Hub",
    "lockerNumber": "03",
    "serviceType": "Wash & Dry",
    "loadSize": "Medium (Max 7kg)",
    "temperature": "Warm Wash",
    "fabricSoftener": false,
    "specialInstructions": "Special notes here"
  }
  ```
- **Response (201 Created):** Full Order object (matches Section 2.4 schema).

#### `GET /api/orders/active`
Fetches the current logged-in customer's active order. Used by the Active Order Tracker page (`ActiveOrderCard.jsx`).
- **Response (200 OK):** Full Order object or `null` if no active order exists.

#### `POST /api/orders/:id/pay`
Processes payment (GCash / Maya / Credit Card) and issues the 6-digit claim PIN.
- **Request Body:**
  ```json
  {
    "paymentMethod": "GCash",
    "amountPaid": 337.00
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "orderId": "ORD-8569",
    "isPaid": true,
    "pickupLockerBox": "06",
    "claimPin": "842019"
  }
  ```

#### `POST /api/orders/:id/unlock-claim`
Actuates the solenoid relay to open the pickup locker compartment (Box #06).
- **Request Body:**
  ```json
  {
    "pin": "842019"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "unlockedBox": "06",
    "message": "Compartment unlocked"
  }
  ```

---

### 3.4 Driver & Van Logistics Routes (`/api/rider`)
For the route driver collecting and returning laundry bags.

#### `GET /api/rider/pickup-queue`
Returns all compartments containing dirty laundry bags waiting for van collection, sorted from nearest to farthest.
- **Response Body (`200 OK`):**
  ```json
  [
    {
      "id": "ORD-8421",
      "distanceKm": 0.3,
      "distanceText": "0.3 km away",
      "stationName": "Central Mall Hub (Level 1 East)",
      "lockerNumber": "03",
      "customerName": "Jamie Davis",
      "serviceType": "Wash, Dry & Fold",
      "loadSize": "Medium (5.2kg)",
      "droppedTime": "Dropped 18m ago",
      "status": "dropped_off"
    },
    {
      "id": "ORD-7719",
      "distanceKm": 1.2,
      "distanceText": "1.2 km away",
      "stationName": "North Plaza Hub (Tower B Ground)",
      "lockerNumber": "07",
      "customerName": "Carlos Mendoza",
      "serviceType": "Wash & Dry",
      "loadSize": "Large (7.8kg)",
      "droppedTime": "Dropped 35m ago",
      "status": "dropped_off"
    }
  ]
  ```

#### `POST /api/lockers/:id/unlock-dropoff`
Actuates the IoT solenoid relay on the drop-off compartment (e.g. Box #03) so the driver can retrieve the customer's dirty laundry bag.
- **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "lockerBox": "03",
    "status": "unlocked",
    "message": "Solenoid actuated: compartment opened for driver pickup"
  }
  ```

#### `PATCH /api/rider/orders/:id/collect`
Triggered when the driver completes the **"Swipe confirm pickup"** gesture. Links the assigned laundry bag barcode tag to the order and advances status to Stage 2 (`rider_transit`).
- **Request Body:**
  ```json
  {
    "lockerNumber": "03",
    "laundryBagNumber": "BAG-8821"
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "orderId": "ORD-8421",
    "status": "rider_transit",
    "lockerNumber": "03",
    "laundryBagNumber": "BAG-8821",
    "collectedAt": "2026-11-11T10:45:00.000Z",
    "message": "Order moved to van transit"
  }
  ```

#### `GET /api/rider/delivery-queue`
Returns all clean laundry packages currently loaded in the van waiting for locker return, sorted by destination station distance.
- **Response Body (`200 OK`):**
  ```json
  [
    {
      "id": "ORD-5192",
      "distanceKm": 0.3,
      "distanceText": "0.3 km away",
      "stationName": "Central Mall Hub (Level 1 East)",
      "pickupBoxNumber": "06",
      "laundryBagNumber": "BAG-6910",
      "customerName": "Roberto Tan",
      "serviceType": "Wash, Dry & Fold",
      "weightKg": 4.9,
      "status": "in_wash"
    }
  ]
  ```

#### `POST /api/lockers/:id/unlock-return`
Actuates the IoT solenoid relay on an empty return compartment (e.g. Box #06) so the driver can place the clean, folded laundry bag inside.
- **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "lockerBox": "06",
    "status": "unlocked",
    "message": "Solenoid actuated: compartment opened for clean laundry delivery"
  }
  ```

#### `PATCH /api/rider/orders/:id/facility-intake`
Central laundry facility logs verified scale weight (advances order to Stage 3: `in_wash`).
- **Request Body:**
  ```json
  {
    "weightKg": 5.2
  }
  ```

#### `PATCH /api/rider/orders/:id/deliver-locker`
Triggered when the driver completes the **"Swipe confirm delivery"** gesture. Places clean laundry into whichever unoccupied compartment (e.g. Box #06) was chosen/scanned by the driver at the locker station, advances order to Stage 4 (`ready_for_pickup`), and generates the customer's 6-digit claim PIN.
- **Request Body:**
  ```json
  {
    "pickupBoxNumber": "06"
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "orderId": "ORD-8421",
    "status": "ready_for_pickup",
    "pickupBoxNumber": "06",
    "claimPin": "842019",
    "deliveredAt": "2026-11-11T11:35:00.000Z",
    "message": "Clean laundry delivered to locker. Customer claim PIN generated."
  }
  ```

---

## 4. Frontend Integration Points (Where to Plug In API Calls)

The React client is architected so that the backend developer only needs to modify centralized service functions in `client/src/context/AuthContext.jsx`. The UI views will react automatically.

| Frontend Location | Current Mock Logic | Target Backend API Call |
| :--- | :--- | :--- |
| `client/src/context/AuthContext.jsx` -> `loginAsGuest(name, phone)` | Local `useState` | `POST /api/auth/guest` |
| `client/src/context/AuthContext.jsx` -> `signupCustomer(name, phone)` | Local `useState` | `POST /api/auth/signup` |
| `client/src/context/AuthContext.jsx` -> `loginAsCustomer()` | Hardcoded Jamie Davis | `POST /api/auth/signin` |
| `client/src/context/AuthContext.jsx` -> `loginAsRider(name, van)` | Hardcoded Marco Valdes | `POST /api/auth/rider` |
| `client/src/context/AuthContext.jsx` -> `createOrder(orderData)` | Local memory calculation | `POST /api/orders` |
| `client/src/views/customer/dropoff/NearbyLockerCard.jsx` | Static `NEARBY_STATIONS` list | `GET /api/lockers/nearby` |
| `client/src/views/customer/tracker/ActiveOrderCard.jsx` | Local step simulation | `GET /api/orders/active` & `POST /api/orders/:id/pay` |
| `client/src/views/driver/DriverView.jsx` -> Tab 1 | Static `INITIAL_MOCK_PENDING` | `GET /api/rider/pickup-queue` |
| `client/src/views/driver/pickup/PickupWorkflowModal.jsx` -> Step 1 | Simulated 750ms timeout | `POST /api/lockers/:id/unlock-dropoff` |
| `client/src/views/driver/pickup/PickupWorkflowModal.jsx` -> Step 3 | Swipe slider callback | `PATCH /api/rider/orders/:id/collect` |
| `client/src/views/driver/DriverView.jsx` -> Tab 2 | Static `INITIAL_MOCK_DELIVERIES` | `GET /api/rider/delivery-queue` |
| `client/src/views/driver/delivery/DeliveryWorkflowModal.jsx` -> Step 2 | Simulated 750ms timeout | `POST /api/lockers/:id/unlock-return` |
| `client/src/views/driver/delivery/DeliveryWorkflowModal.jsx` -> Step 3 | Swipe slider callback | `PATCH /api/rider/orders/:id/deliver-locker` |

### 4.1 Stage 4: Locker Delivery Complete & Bill Breakdown Mapping

When an order reaches Stage 4 (`ready_for_pickup`), `ActiveOrderCard.jsx` expects the following fields from the `activeOrder` JSON:

| UI Element in Card | Frontend Field Read | Backend JSON Field | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Locker Box Number** | `activeOrder.pickupBoxNumber` | `pickupBoxNumber` | `"06"` | The compartment where clean clothes were placed |
| **Verified Weight** | `activeOrder.weightKg` | `weightKg` | `5.2` | Scale weight verified at laundry facility |
| **Service Name** | `activeOrder.serviceType` | `serviceType` | `"Wash & Dry"` | Selected wash tier |
| **Softener Care** | `activeOrder.fabricSoftener` | `fabricSoftener` | `true` | Boolean flag; renders softener row if true |
| **Total Amount Due** | `activeOrder.priceEstimate` | `finalAmountDue` or `priceEstimate` | `337.00` | Total bill in Philippine Pesos (PHP) |
| **Payment Status** | `isPaid` state | `isPaid` | `false` -> `true` | Switches from bill invoice to claim PIN view |
| **Claim PIN** | `activeOrder.claimPin` | `claimPin` | `"842019"` | 6-digit PIN used at locker kiosk touch screen |

The frontend helper `getBillBreakdown(order)` automatically handles rate-per-kg math and conditional line items, so the backend only needs to return standard numbers and booleans.

### 4.2 Stage 1 -> Stage 2: Driver Pickup to Customer UI Transition Mapping

When the driver executes **"Swipe confirm pickup"** via `PATCH /api/rider/orders/:id/collect`:
1. The order status updates from `dropped_off` to `rider_transit`.
2. The backend stores the assigned `laundryBagNumber` and source `lockerNumber`.
3. In the Customer UI (`ActiveOrderCard.jsx`), this automatically advances the timeline tracker:
   - **Progress Bar**: Moves from 0% (Node 1: Dropped Off) to 33.33% (Node 2: Van Transit).
   - **Context Banner**: Switches from *Locker Box Secured* to *Collected by Route Driver*.
   - **Bag Tracking**: Displays the assigned `laundryBagNumber` and confirms the bag is in transit to the central facility.

---

## 5. Development Setup & CORS Configuration

In `server/src/server.js`, configure CORS to permit requests from the Vite development server:

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());

// Enable CORS for Vite frontend running on port 5173
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Smart Locker Backend running on port ${PORT}`);
});
```

In `client/.env`, configure the API base URL:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Code Style & Rules Reminder (GEMINI.md)

- Use explicit, descriptive property names matching this document.
- Zero-guesswork policy: keep exact object keys consistent between backend responses and frontend consumption.
- Maintain error response standard: `{ "success": false, "message": "Detailed error explanation" }`.
