# ☣️ MedWaste Guard (BioTrack Healthcare Systems)

> **Full-Stack Hospital Bio-Medical Waste Monitoring, Hardware IoT Telemetry & Regulatory Compliance Platform** adhering to Central Pollution Control Board (CPCB 2016) and WHO Biohazard Segregation Guidelines.

---

## 🌟 Key Features & Modules

### 1. 📊 Executive Biohazard Analytics Dashboard
- **Live KPI Metrics**: Real-time tracking of active on-site waste, total bags tracked, CBWTF treated/incinerated volume, and CPCB Compliance Index.
- **4 Biomedical Waste Categories**:
  - 🟡 **Yellow (Infectious & Anatomical)**: Soiled dressings, anatomical tissue, pharma & cytotoxic kits (Incineration / Deep Burial).
  - 🔴 **Red (Contaminated Plastics)**: IV bottles, catheters, plastic tubing, syringes without needles (Autoclaving & Recycling).
  - ⚪ **White (Waste Sharps)**: Scalpels, surgical blades, hypodermic needles in puncture-proof containers (Dry Heat & Shredding).
  - 🔵 **Blue (Glass & Metallic Implants)**: Medicine ampoules, broken lab slides, orthopedic metal pins (Chemical Disinfection).
- **Ward Generation Ranking**: Real-time generation volume across Operating Theater, ICU, Emergency, Pathology Lab, Oncology, and General Wards.
- **Chain-of-Custody Pipeline**: Real-time status progression (`Logged` → `Central Holding Bay` → `In Transit` → `Disposed & Treated`).

### 2. 🏷️ Waste Bag Registry & Management (Full CRUD)
- Real-time search across Tag IDs, handlers, and ward locations.
- Category pills filter, department filter, and status dropdowns.
- Inline status state transitions.
- Edit record modal, delete confirmation safeguards.
- **Printable Barcode Label Modal**: Generates official hospital biohazard tags with stylized barcodes, timestamps, and handling warnings.

### 3. 🔐 Clinical Role-Based Authentication
- Clinical staff login portal with credential validation and session persistence.
- **1-Click Demo Role Switcher**:
  - 👩‍⚕️ **Nurse Sarah Jenkins** (`nurse@stjude.org`) — Clinical Staff / Nurse
  - 👨‍🔬 **Officer Marcus Cole** (`officer@stjude.org`) — Biohazard Safety Officer
  - 🚚 **Robert Langdon** (`driver@cbwtf.org`) — CBWTF Transport Custodian
  - 🩺 **Dr. Aaron Patel** (`admin@stjude.org`) — Chief Medical Superintendent
- Guest Inspector entrance option.

### 4. ⚡ Hardware & IoT Operations Console (`/hardware`)
- **Digital Biohazard Weighing Scale**:
  - Connected via COM3 serial port (9600 Baud).
  - Real-time digital LED weight display.
  - **Tare / Zero Scale (0.00 kg)** button.
  - Interactive load cell simulator slider.
- **⚡ Direct Hardware Scale Sync**: Inside the "Log Waste Bag" form, clicking **"⚡ Read Hardware Scale"** automatically queries the electronic scale and fills the weight input without manual entry.
- **Zebra Laser Barcode Scanner**: Ingests physical scans and displays live feed of recently scanned tags.
- **Smart Biohazard Bin Sensors**: Ultrasonic depth transducer fill gauge (`68%`), remote **Lid Lock / Unlock** actuator, and UV-C sterilization cycle indicator.
- **CBWTF Vehicle GPS Telemetry**: Real-time truck transit speed and GPS coordinates.
- **Machine-to-Machine (M2M) IoT API**: Microcontrollers (ESP32, Arduino, Raspberry Pi) can push sensor data directly via `POST /api/hardware/scale` and `POST /api/hardware/scan`.

### 5. 🚚 CBWTF Pickup & Chain-of-Custody Manifests
- Centralized tracking for Common Bio-medical Waste Treatment Facility manifests.
- Consignment records showing manifest serials, vehicle registration numbers, authorized driver details, batch weights, and linked waste bags.
- "Dispatch New Manifest" scheduler with dynamic batch weight calculation.

### 6. 🛡️ Regulatory Compliance & Incident Audit
- Safety incident tracking for needle-stick injuries, bag punctures, and chemical spills with severity classifications and corrective actions.
- Official CPCB Schedule I statutory guidelines summary cards.
- Form VI Biomedical Waste Transfer Manifest generation with print capability.

### 7. 📱 Mobile Access via Scannable QR Code
- Built-in **"Share QR"** button in Navbar renders an interactive scannable QR code.
- Point any mobile phone camera at the screen while on the same Wi-Fi to load the full application on mobile or tablet instantly.

---

## 🏗️ Project Architecture

```
med-waste-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # Resilient dual-mode database manager
│   │   ├── models/WasteRecord.js     # Mongoose waste record schema
│   │   ├── models/PickupRequest.js   # Mongoose pickup manifest schema
│   │   ├── models/Incident.js        # Mongoose safety incident schema
│   │   ├── controllers/              # REST controllers for waste, auth, hardware, pickups, incidents
│   │   ├── routes/                   # Express route handlers
│   │   ├── seeds/seedData.js         # Baseline clinical hospital dataset
│   │   ├── services/storageService.js# Dual-mode Mongoose & JSON persistence engine
│   │   └── server.js                 # Express server configuration
│   ├── data/db_store.json            # Persistent local data store
│   ├── package.json
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top navigation, status, QR share & user profile
│   │   │   ├── DashboardView.jsx     # KPIs, category breakdown, ward chart & pipeline
│   │   │   ├── WasteRegistryView.jsx # Filterable table, search, status updater
│   │   │   ├── PickupManifestView.jsx# CBWTF dispatch manifests
│   │   │   ├── ComplianceView.jsx    # Incident log, CPCB guidelines, manifest print
│   │   │   ├── HardwareHubView.jsx   # Digital weigh scale, barcode scanner, IoT sensors
│   │   │   ├── LoginPage.jsx         # Clinical authentication & 1-click role switcher
│   │   │   ├── WasteLogModal.jsx     # Bag creation with "Read Scale" auto-fill
│   │   │   ├── PickupScheduleModal.jsx
│   │   │   ├── IncidentModal.jsx
│   │   │   ├── BarcodeBadgeModal.jsx # Printable physical bag label with barcode
│   │   │   ├── ShareQRModal.jsx      # Mobile QR code sharing
│   │   │   └── Toast.jsx             # Notification toast alerts
│   │   ├── App.jsx                   # Central application orchestration
│   │   └── main.jsx
│   ├── vite.config.js                # Tailwind v4, allowedHosts & API proxy
│   └── package.json
├── package.json                      # Root unified scripts
├── run-all.js                        # Zero-dependency dual-process runner
├── start.bat                         # 1-Click Windows launcher
└── README.md                         # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Launch Everything with 1 Command:
From the project root:
```bash
npm start
```
*(Or double-click `start.bat` on Windows)*

This concurrently boots:
- **Backend Server** on `http://localhost:5000`
- **Frontend App** on `http://localhost:5173`
- **Mobile Wi-Fi** on `http://10.239.245.72:5173`

---

## 📡 Physical Hardware & IoT Endpoints (M2M)

### Push Live Scale Weight (from ESP32 / Arduino / Digital Scale):
```bash
curl -X POST http://localhost:5000/api/hardware/scale \
  -H "Content-Type: application/json" \
  -d '{"weightKg": 4.85, "deviceId": "SCALE-01"}'
```

### Push Barcode Scan (from USB/Bluetooth Scanner):
```bash
curl -X POST http://localhost:5000/api/hardware/scan \
  -H "Content-Type: application/json" \
  -d '{"tagId": "MW-2026-1002", "category": "Red"}'
```

### Tare / Zero the Scale:
```bash
curl -X POST http://localhost:5000/api/hardware/calibrate
```

---

## 🔒 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Nurse / Clinical Staff** | `nurse@stjude.org` | `password123` |
| **Biohazard Safety Officer** | `officer@stjude.org` | `password123` |
| **CBWTF Transport Driver** | `driver@cbwtf.org` | `password123` |
| **Medical Superintendent** | `admin@stjude.org` | `password123` |

*(You can also click any of the 1-Click Role Login buttons on the login screen!)
