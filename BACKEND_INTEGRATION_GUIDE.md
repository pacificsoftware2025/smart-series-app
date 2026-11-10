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

- `GET /api/rider/pickup-queue`: Compartments with laundry bags ready for driver collection.
- `PATCH /api/rider/orders/:id/collect`: Driver opens drop-off box and scans bag into van (advances order to Stage 2: `rider_transit`).
- `PATCH /api/rider/orders/:id/facility-intake`: Central laundry facility logs verified weight (advances order to Stage 3: `in_wash`).
- `PATCH /api/rider/orders/:id/deliver-locker`: Driver places clean laundry in locker (advances order to Stage 4: `ready_for_pickup` with generated PIN).

---

## 4. Frontend Integration Points (Where to Plug In API Calls)

The React client is architected so that the backend developer only needs to modify centralized service functions in `client/src/context/AuthContext.jsx`. The UI views will react automatically.

| Frontend Location | Current Mock Logic | Target Backend API Call |
| :--- | :--- | :--- |
| `client/src/context/AuthContext.jsx` -> `loginAsGuest(name, phone)` | Local `useState` | `POST /api/auth/guest` |
| `client/src/context/AuthContext.jsx` -> `signupCustomer(name, phone)` | Local `useState` | `POST /api/auth/signup` |
| `client/src/context/AuthContext.jsx` -> `loginAsCustomer()` | Hardcoded Jamie Davis | `POST /api/auth/signin` |
| `client/src/context/AuthContext.jsx` -> `createOrder(orderData)` | Local memory calculation | `POST /api/orders` |
| `client/src/views/customer/dropoff/NearbyLockerCard.jsx` | Static `NEARBY_STATIONS` list | `GET /api/lockers/nearby` |
| `client/src/views/customer/tracker/ActiveOrderCard.jsx` | Local step simulation | `GET /api/orders/active` & `POST /api/orders/:id/pay` |

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
