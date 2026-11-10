# Smart Locker Web App (Smart Series Platform)

A full-stack, mobile-first web application designed for IoT Smart Locker & Laundry automation with Role-Based Access Control (RBAC).

---

## 🏛️ Project Architecture

```text
smart-locker/
├── client/                                # FRONTEND: React + Vite (Mobile-First UI)
│   ├── public/                            # Static assets (PWA icons, logos)
│   └── src/
│       ├── assets/                        # Design assets (icons, images)
│       ├── components/
│       │   ├── common/                    # Reusable UI primitives (Button, Modal, Card, Badge)
│       │   ├── layout/                    # Mobile container, TopHeader, BottomNav
│       │   └── guards/                    # RBAC Route Guards (RoleRouteGuard, AuthGuard)
│       ├── constants/                     # System constants (roles.js, orderStatus.js)
│       ├── context/                       # Global state (AuthContext, RoleContext)
│       ├── hooks/                         # Custom hooks (useAuth, useRole, useLocker)
│       ├── routes/                        # Central router configuration
│       ├── services/                      # API client layer (apiClient.js)
│       ├── utils/                         # Helpers (currency, date formatters)
│       └── views/                         # Role-Segregated Views (MVC):
│           ├── auth/                      # Login & Role switcher
│           ├── customer/                  # 1. End-User (Drop-off, Tracker, Billing)
│           ├── driver/                    # 2. Van Driver (Pickup, Delivery, Scanner)
│           └── operator/                  # 3. Shop Operator (Intake, Hardware, Inventory)
│
└── server/                                # BACKEND: Node.js + Express (MVC Pattern)
    └── src/
        ├── config/                        # Database & environment configurations
        ├── controllers/                   # Business logic (auth, locker, laundry orders)
        ├── middlewares/                   # RBAC & authentication guards
        ├── models/                        # Data models (User, Machine, Compartment, Order)
        ├── routes/                        # API routes
        ├── services/                      # IoT relay and notification handlers
        └── utils/                         # Standardized responses & error logging
```

---

## 👥 Supported RBAC Roles

1. **End-User (Customer)**: Drop-off dirty laundry, track wash progress, pay invoice, and unlock pickup locker with PIN.
2. **Delivery Driver (Field Ops)**: Batch unlock dirty laundry from lockers, deliver clean clothes via continuous scan & pop.
3. **Operator (Facility / Control Room)**: Intake weighing station, hardware locker matrix monitoring, and tag inventory management.

