# 🏗️ Car Inventory App - Project Structure (Updated for QR System)

## 📁 Directory Organization

```
car-inventory-app/
├── src/
│   ├── components/          # React components (Updated for QR system)
│   │   ├── Login.tsx       # Authentication page
│   │   ├── AgencySelector.tsx  # Location selection (Agencies + Bodegas)
│   │   ├── InventoryPage.tsx   # Main inventory interface with QR scanning
│   │   ├── InventoryQRPage.tsx # NEW: QR code generation page
│   │   ├── MonthlyInventoryManager.tsx # Monthly inventory management
│   │   ├── BarcodeScanner.tsx  # QR code scanning modal (updated for car data)
│   │   ├── UnifiedScanner.tsx  # Unified scanning interface (updated for QR)
│   │   ├── FastBarcodeScanner.tsx # QuaggaJS fast scanner
│   │   ├── CSVUploadModal.tsx  # NEW: CSV upload and QR generation
│   │   ├── ManualInputModal.tsx # Manual vehicle data entry (updated for car data)
│   │   ├── ConfirmationModal.tsx # Scan confirmation (legacy)
│   │   ├── DeleteConfirmationModal.tsx # Delete confirmation
│   │   ├── BulkDeleteConfirmationModal.tsx # Bulk delete confirmation
│   │   ├── CompletionModal.tsx # Inventory completion modal (updated)
│   │   ├── SessionTerminatedModal.tsx # Session termination modal
│   │   ├── NewInventoryConfirmationModal.tsx # New inventory confirmation
│   │   ├── DownloadConfirmationModal.tsx # Download confirmation modal
│   │   ├── ScannedCodesList.tsx # Vehicle list with car data display (updated)
│   │   ├── LocalStorageInfo.tsx # Storage management (updated with force cleanup)
│   │   ├── ProtectedRoute.tsx   # Route protection
│   │   ├── Auth0ErrorBoundary.tsx # Auth0 error handling
│   │   ├── ProductionErrorBoundary.tsx # Production error handling
│   │   ├── Toast.tsx            # Toast notification component
│   │   ├── LoadingSpinner.tsx   # Loading spinner component
│   │   ├── Header.tsx           # Reusable header component (updated with QR button)
│   │   └── Footer.tsx           # Reusable footer component
│   ├── context/            # React context providers
│   │   ├── AppContext.tsx  # Application state management
│   │   └── ToastContext.tsx # Toast notification management
│   ├── hooks/              # Custom React hooks
│   │   └── useInventory.ts # Inventory state and API management (updated for car data)
│   ├── services/           # API services
│   │   └── api.ts          # Backend API communication (updated with QR endpoints)
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Interface definitions (updated with CarData, QRGenerationRequest)
│   ├── data/               # Static data
│   │   └── agencies.ts     # Agency configurations (updated with Bodegas)
│   ├── config/             # Configuration files
│   │   └── auth0-config.ts # Auth0 settings (production-ready)
│   ├── utils/              # Utility functions
│   │   ├── sessionManager.ts # Session storage management (updated for car data)
│   │   ├── localStorageManager.ts # Local storage management (updated for car data)
│   │   └── debug.ts        # Debug utilities
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Application entry point
│   └── index.css           # Global styles with Tailwind
├── public/
│   ├── index.html          # Main HTML file
│   ├── favicon.ico         # App icon
│   ├── manifest.json       # PWA manifest
│   ├── robots.txt          # SEO and crawling restrictions
│   ├── sw.js              # Service worker for offline functionality
│   ├── _headers           # Security headers for static hosting
│   └── [various icon files] # PWA and mobile icons
├── scripts/               # Deployment scripts
│   ├── deploy.sh          # Unix/Linux deployment script
│   └── deploy.bat         # Windows deployment script
├── package.json            # Dependencies and scripts (production-ready)
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
├── netlify.toml           # Netlify deployment configuration
├── vercel.json            # Vercel deployment configuration
├── desing-syestm.json      # Design system specifications
├── PRODUCTION_DEPLOYMENT.md # Production deployment guide
├── SCANNER_COMPARISON.md   # QR/Barcode scanner comparison (updated)
├── PROJECT_STRUCTURE.md   # This file
└── README.md               # Project documentation
```

## 🔌 API Integration (Updated for QR System)

### QR Code System Endpoints
- **`POST /api/qr/upload-csv`** - Upload CSV file and generate QR codes
- **`GET /api/qr/locations`** - Get available locations (Agencies + Bodegas)
- **`POST /api/qr/scan`** - Process scanned QR code with vehicle data
- **`GET /api/qr/download/{sessionId}`** - Download generated QR codes as ZIP

### Inventory Management (Updated for Car Data)
- **`POST /api/inventory/save-scan`** - Save scanned vehicle with complete car data
- **`POST /api/inventory/finish-session`** - Complete inventory session
- **`GET /api/inventory/monthly-inventory/{agency}/{month}/{year}`** - Get monthly inventory data
- **`GET /api/inventory/agency-inventories/{agency}`** - Get all inventories for location
- **`GET /api/inventory/check-monthly-inventory/{agency}/{month}/{year}`** - Check inventory status
- **`GET /api/inventory/check-inventory-limits/{agency}/{month}/{year}`** - Check inventory limits
- **`POST /api/inventory/check-completion`** - Check if inventory was completed

### Data Management
- **`DELETE /api/inventory/delete-scanned-entry`** - Delete single vehicle entry
- **`DELETE /api/inventory/delete-multiple`** - Bulk delete vehicle entries
- **`GET /api/inventory/inventory-data/{agency}/{month}/{year}`** - Get inventory data for download

### Download & Export (Updated for Car Data)
- **`GET /api/download/inventory/{agency}/{month}/{year}/csv`** - Download CSV with complete vehicle data
- **`GET /api/download/inventory/{agency}/{month}/{year}/excel`** - Download Excel with complete vehicle data

### Validation & Cleanup
- **`GET /api/validation/monthly-summary`** - Validate monthly summary
- **`POST /api/validation/cleanup-duplicates`** - Cleanup duplicate entries
- **`POST /api/validation/cleanup-specific-duplicates`** - Cleanup specific duplicates

## 🎯 Key Features (Updated)

### 1. **QR Code Vehicle Management System**
- **Complete Vehicle Data**: Serie (VIN), Marca, Color, Ubicaciones
- **QR Code Generation**: CSV to QR code conversion with ZIP download
- **Smart Scanning**: Automatic detection of QR codes vs legacy barcodes
- **Manual Entry**: Full vehicle data input with validation
- **Rich Display**: Color-coded vehicle cards with all information

### 2. **Enhanced Location Management**
- **Agencies**: Traditional car dealerships (Suzuki, Mazda, Toyota, Honda, Nissan)
- **Bodegas**: Warehouse locations (Bodega Coyote, Bodega Goyo)
- **Unified Interface**: Same inventory process for all location types
- **Location-Specific**: Each location has its own Google Sheets tab

### 3. **Advanced Session Management (Updated)**
- **Bi-Monthly System**: 2 inventories per month per location
- **Multi-User Support**: Real-time synchronization between users
- **Auto-Cleanup**: Scan data cleaned after individual session completion
- **Session Restoration**: Automatic recovery with car data preservation
- **Download Preservation**: Keep downloaded inventories until next month

### 4. **Enhanced Data Storage System**
- **Three-Tier Storage**:
  1. **Session Storage**: Active session data (until session ends)
  2. **Local Storage (Scans)**: Backup scan data (cleaned after session completion)
  3. **Local Storage (Downloads)**: Downloaded inventories (cleaned monthly)
- **Backward Compatibility**: Supports both new QR codes and legacy barcodes
- **Data Integrity**: Comprehensive validation and error handling

### 5. **Rich Vehicle Display System**
- **Color-Coded Icons**:
  - 🏷️ **Serie**: Yellow gradient with VIN code
  - 🚗 **Marca**: Blue icon with vehicle brand  
  - 🎨 **Color**: Purple icon with vehicle color
  - 📍 **Ubicación**: Green icon with location
- **Smart Search**: Search across all vehicle fields
- **Dual Format Support**: Car data cards + legacy barcode cards

### 6. **Production-Ready Features**
- **Error Boundaries**: Graceful error handling for QR system
- **Performance Optimization**: Efficient handling of large vehicle datasets
- **Security**: Proper Auth0 configuration with API audience
- **Mobile Optimization**: Touch-friendly QR scanning interface
- **PWA Support**: Offline QR code viewing and manual entry

## 🚀 Development Workflow (Updated)

### Frontend Development
1. **QR System**: React components for QR generation and scanning
2. **Vehicle Data**: TypeScript interfaces for complete car data
3. **API Integration**: Service layer for QR and inventory endpoints
4. **Storage Management**: Local storage for car data preservation
5. **UI/UX**: Glass morphism design with color-coded vehicle displays

### Backend Integration Requirements
1. **QR Generation**: CSV parsing and QR code creation
2. **Vehicle Storage**: Google Sheets integration with car data columns
3. **Download Export**: CSV/Excel generation with complete vehicle information
4. **Location Management**: Support for Agencies and Bodegas
5. **Data Validation**: Vehicle data validation and duplicate prevention

## 📊 Data Flow (Updated for QR System)

### **QR Code Generation Flow**
```
CSV Upload → Parse Vehicle Data → Generate QR Codes → ZIP Download → Print Labels
```

### **Inventory Scanning Flow**
```
QR Scan → Parse Vehicle Data → Validate → Save to Sheets → Display in UI
Manual Entry → Vehicle Form → Validate → Save to Sheets → Display in UI
```

### **Session Management Flow**
```
Start Session → Scan Vehicles → Real-time Sync → Complete Session → Auto-cleanup → Download CSV
```

### **Storage Management Flow**
```
Scan Data: 36h backup → Cleaned after session completion
Download Data: Monthly backup → Cleaned at month start
Session Data: Active until session ends
```

## 🎨 Design System Implementation

### **Color Coding System**
- **Serie/VIN**: Yellow/Orange gradient (primary identifier)
- **Marca**: Blue (brand identification)
- **Color**: Purple (vehicle color)
- **Ubicación**: Green (location/position)
- **Legacy Codes**: White/Gray (backward compatibility)

### **Component Hierarchy**
- **Pages**: Full-screen layouts with headers/footers
- **Modals**: Overlay components with glass effects
- **Cards**: Vehicle display components with car data
- **Forms**: Input components with validation
- **Buttons**: Pill-shaped with hover animations

## 🚀 Production Deployment (Updated)

### **Environment Configuration**
```env
# Production QR System
REACT_APP_AUTH0_AUDIENCE=https://your-production-api.com
REACT_APP_API_BASE_URL=https://your-production-api.com
```

### **Backend Requirements**
- **QR Generation Service**: For CSV to QR conversion
- **Google Sheets API**: For vehicle data storage with car data columns
- **File Storage**: For QR code ZIP file generation and download
- **Authentication**: Auth0 API validation

### **Deployment Checklist**
- ✅ Backend API running with QR endpoints
- ✅ Google Sheets configured with car data columns
- ✅ Auth0 configured with correct audience
- ✅ HTTPS enabled for camera access
- ✅ File storage configured for QR ZIP downloads

This updated structure provides a comprehensive QR code-based vehicle inventory system with complete car data management, location support, and production-ready deployment capabilities.