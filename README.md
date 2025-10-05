# 🚗 Car Inventory App - QR Code System

A modern React application for automating car inventory management using **QR code scanning** and **complete vehicle data capture**.

## ✨ Latest Features (v2.0)

### 🎯 **QR Code System with Complete Vehicle Data**
- **📱 QR Code Scanning** - Scan QR codes containing complete vehicle information
- **📊 Complete Car Data** - Serie, Marca, Color, Ubicaciones captured and displayed
- **📝 Manual Vehicle Entry** - Full vehicle data input when QR codes are damaged
- **🏭 CSV to QR Generation** - Upload Excel/CSV files to generate vehicle QR codes
- **📍 Location-Based System** - Support for Agencies and Bodegas (warehouses)

### 🏢 **Multi-Location Support**
- **Agencies**: Suzuki, Mazda, Toyota, Honda, Nissan
- **Bodegas**: Bodega Coyote, Bodega Goyo
- **Unified System**: All locations use the same inventory process

### 📊 **Enhanced Data Management**
- **Rich Vehicle Cards** - Display Serie, Marca, Color, Ubicación with colored icons
- **Advanced Search** - Search by any vehicle field (serie, marca, color, ubicación)
- **Smart Storage** - Automatic cleanup of scan data after session completion
- **Multiple Inventories per Month** - Support for multiple inventory sessions per month with unique session IDs
- **Google Drive Integration** - Automatic backup to Google Drive with 30-day retention policy
- **File Selection Modal** - Choose specific inventory files from Google Drive with real filenames
- **Download Preservation** - Keep downloaded inventories until next month

### 🤝 **Real-Time Collaboration System (NEW v2.0)**
- **WebSocket Integration** - Real-time communication between users using WebSocket technology
- **Multi-User Sessions** - Multiple users can work on the same inventory simultaneously
- **Live Session Updates** - See when other users join/leave sessions in real-time
- **Instant Scan Sync** - All users see each other's scans immediately without page refresh
- **Real-Time Session Termination** - Sessions terminate instantly when completed by any user
- **Smart Connection Management** - Automatic reconnection and error handling
- **No More Polling** - Eliminates the need for periodic API checks
- **Enhanced User Experience** - Seamless collaboration with live notifications

### 🏗️ **Modern Component Architecture**
- **Organized Structure** - Components organized into logical folders for better maintainability
- **Namespace Imports** - Clean import system with barrel exports
- **Modular Design** - Large components broken down into smaller, focused components
- **Type Safety** - Full TypeScript support with proper type definitions
- **Performance Optimized** - Request throttling and deduplication for better performance

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom glass morphism design system
- **Authentication**: Auth0 with production-ready configuration
- **QR Code Scanning**: ZXing library with QuaggaJS fallback
- **Real-Time Communication**: WebSocket (WSS in production)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Create React App with production optimizations

## 📁 Project Structure

```
src/
├── components/                    # Organized component structure
│   ├── common/                   # Shared components
│   │   ├── display/             # UI display components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts         # Barrel exports
│   │   ├── forms/               # Form components
│   │   │   ├── Login.tsx
│   │   │   ├── AgencySelector.tsx
│   │   │   └── index.ts
│   │   └── modals/              # Modal components
│   │       ├── DownloadConfirmationModal.tsx
│   │       ├── InventoryCompletedByOtherModal.tsx
│   │       ├── ManualInputModal.tsx
│   │       └── index.ts
│   ├── inventory/               # Inventory-specific components
│   │   ├── controls/            # Scanner controls
│   │   │   ├── UnifiedScanner.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   └── ModernQRScanner.tsx
│   │   ├── display/             # Display components
│   │   │   ├── InventoryList.tsx
│   │   │   ├── ScannedCodesList.tsx
│   │   │   └── index.ts
│   │   ├── modals/              # Inventory modals
│   │   │   ├── MultipleInventorySelector.tsx
│   │   │   └── index.ts
│   │   ├── monthly/             # Monthly inventory management
│   │   │   ├── MonthlyInventoryManager.tsx
│   │   │   ├── MonthlyInventoryTable.tsx
│   │   │   └── index.ts
│   │   └── session/             # Session management
│   │       ├── InventoryPage.tsx
│   │       ├── InventoryQRPage.tsx
│   │       └── index.ts
│   └── index.ts                 # Main component exports
├── config/                      # Configuration files
│   ├── auth0-config.ts
│   └── environment.ts
├── context/                     # React contexts
│   ├── AppContext.tsx
│   └── ToastContext.tsx
├── hooks/                       # Custom hooks
│   └── useInventory.ts
├── services/                    # API services
│   └── api.ts
├── types/                       # TypeScript definitions
│   ├── index.ts
│   └── quagga.d.ts
├── utils/                       # Utility functions
│   ├── debug.ts
│   ├── localStorageManager.ts
│   └── sessionManager.ts
└── App.tsx                      # Main app component
```

### 🏗️ **Component Organization Benefits**
- **Logical Grouping**: Components organized by functionality and purpose
- **Namespace Imports**: Clean imports using barrel exports (`import { Component } from './components'`)
- **Maintainability**: Easy to find and modify specific components
- **Scalability**: Structure supports future growth and new features
- **Type Safety**: Full TypeScript support with proper type definitions

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Auth0 account and application
- Backend API server running on localhost:5000
- Modern web browser with camera access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd car-inventory-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Auth0**
   
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
   REACT_APP_AUTH0_CLIENT_ID=your-client-id
   REACT_APP_AUTH0_AUDIENCE=http://localhost:5000
   REACT_APP_API_BASE_URL=http://localhost:5000
   ```

   **Important**: The `REACT_APP_AUTH0_AUDIENCE` should match your backend API identifier, typically `http://localhost:5000` for local development.

4. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

## 📚 Documentation

- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Modern component architecture and organization
- **[Multiple Inventories](docs/MULTIPLE_INVENTORIES.md)** - Multiple inventory sessions per month
- **[Collaboration System](docs/COLLABORATION_SYSTEM.md)** - Real-time multi-user collaboration
- **[Environment Setup](docs/ENVIRONMENT_SETUP.md)** - Development environment configuration
- **[Production Deployment](docs/PRODUCTION_DEPLOYMENT.md)** - Production deployment guide

## 📱 Usage

### 1. **Location Selection**
- Choose your working location (Agency or Bodega)
- Access QR code generation and inventory management
- Navigate between different locations easily

### 2. **QR Code Generation**
- Upload CSV/Excel files with vehicle data (Serie, Marca, Color, Ubicaciones)
- Generate QR codes for printing on Zebra label printers
- Download QR codes as ZIP file for printing

### 3. **Inventory Scanning**
- **QR Code Scanning**: Scan generated QR codes with complete vehicle data
- **Manual Entry**: Input complete vehicle information when QR codes are damaged
- **Legacy Support**: Still supports old 8-digit and 17-character VIN codes

### 4. **Vehicle Data Management**
- **Rich Display**: Each vehicle shows Serie, Marca, Color, Ubicación with colored icons
- **Advanced Search**: Find vehicles by any field
- **Bulk Operations**: Select and manage multiple vehicles
- **Real-time Sync**: Multi-user collaboration with live updates

### 5. **Session Management**
- **Multiple Inventories per Month**: Support for unlimited inventory sessions per month
- **Unique Session IDs**: Each inventory session has a unique identifier for precise tracking
- **Auto-cleanup**: Scan data cleaned after session completion
- **Google Drive Backup**: Automatic backup to Google Drive with 30-day retention
- **File Selection**: Choose specific inventory files from available Google Drive backups
- **Download Preservation**: Downloaded inventories kept until next month
- **Session Restoration**: Automatic recovery of interrupted sessions

## 🎯 Key Workflows

### **QR Code Generation Workflow**
1. Navigate to **Generar QR** (available in header)
2. Upload CSV/Excel with columns: Serie, Marca, Color, Ubicaciones
3. Generate and download QR codes as ZIP file
4. Print QR codes on Zebra label printer
5. Attach QR codes to vehicles

### **Inventory Scanning Workflow**
1. Select location and start inventory session
2. Scan QR codes or use manual entry for complete vehicle data
3. View real-time vehicle cards with all information
4. Complete session and download CSV/Excel with full vehicle data
5. System automatically cleans up scan data for next inventory

### **Manual Entry Workflow**
1. Click "Entrada Manual" when QR codes are damaged
2. Enter complete vehicle information:
   - **Serie**: 17-character alphanumeric VIN
   - **Marca**: Vehicle brand (Toyota, Honda, etc.)
   - **Color**: Vehicle color (Blanco, Azul, etc.)
   - **Ubicaciones**: Vehicle location (Lote A-1, etc.)
3. System validates and saves to same location as QR scanned vehicles

## 🔧 API Integration

### QR Code System Endpoints
- **`POST /api/qr/upload-csv`** - Upload CSV and generate QR codes
- **`GET /api/qr/locations`** - Get available locations
- **`POST /api/qr/scan`** - Process scanned QR code data
- **`GET /api/qr/download/{sessionId}`** - Download QR codes ZIP

### Inventory Management Endpoints
- **`POST /api/inventory/save-scan`** - Save scanned vehicle (with car data)
- **`POST /api/inventory/finish-session`** - Complete inventory session
- **`GET /api/inventory/monthly-inventory/{agency}/{month}/{year}`** - Get monthly data
- **`GET /api/inventory/check-monthly-inventory/{agency}/{month}/{year}`** - Check status
- **`GET /api/inventory/check-inventory-limits/{agency}/{month}/{year}`** - Check limits

### Download & Export
- **`GET /api/download/inventory/{agency}/{month}/{year}/csv`** - Download most recent CSV with car data
- **`GET /api/download/inventory/{agency}/{month}/{year}/excel`** - Download most recent Excel with car data
- **`GET /api/download/inventory/{agency}/{month}/{year}/csv/{sessionId}`** - Download specific inventory by session ID
- **`GET /api/download/inventory/{agency}/{month}/{year}/excel/{sessionId}`** - Download specific Excel by session ID

## 📊 Data Structure

### **Vehicle Data (CarData)**
```typescript
interface CarData {
  serie: string;      // 17-character VIN
  marca: string;      // Vehicle brand
  color: string;      // Vehicle color
  ubicaciones: string; // Vehicle location
}
```

### **QR Code Structure**
```json
{
  "serie": "1HGCM82633A123456",
  "marca": "Honda",
  "color": "Blanco", 
  "ubicaciones": "Lote A-1",
  "location": "Bodega Coyote",
  "timestamp": "2025-09-18T07:03:36.585Z",
  "type": "car_inventory"
}
```

### **Scanned Code Structure**
```typescript
interface ScannedCode {
  id: string;
  code: string;          // VIN or legacy barcode
  timestamp: Date;
  confirmed: boolean;
  user: string;
  carData?: CarData;     // Complete vehicle information
}
```

### **Monthly Inventory Structure**
```typescript
interface MonthlyInventory {
  id: string;
  agencyId: string;
  month: string;         // Format: "MM"
  year: number;
  monthName: string;     // e.g., "January 2024"
  status: 'Active' | 'Completed' | 'Paused';
  createdAt: Date;
  createdBy: string;
  totalScans: number;
  sessionId?: string;    // Unique session identifier for multiple inventories
  lastUpdated?: Date;
}
```

## 🎨 Design System

The app follows a custom dark theme design system with:

- **Glass Morphism**: Transparent cards with blur effects
- **Color Coding**: Different colored icons for vehicle data fields
- **Responsive Layout**: Mobile-first design with desktop optimization
- **Smooth Animations**: Hover effects and transitions
- **Consistent Typography**: Uppercase headers with proper spacing

## 🔒 Security & Performance

- **Auth0 Integration**: Secure user authentication with proper audience configuration
- **Route Protection**: All inventory pages require authentication
- **Data Validation**: Client-side validation for all vehicle data inputs
- **Error Boundaries**: Graceful error handling in production
- **Performance Optimization**: Virtualized lists for large datasets

## 📱 Mobile Optimization

- **Responsive Design**: Works perfectly on mobile devices
- **Touch-Friendly**: Large buttons and touch targets
- **Camera Access**: Optimized camera scanning for mobile
- **PWA Support**: Install as mobile app
- **Offline Capability**: Service worker for offline functionality

## 🚀 Deployment

### Environment Variables
```env
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=http://localhost:5000  # Your backend API URL
REACT_APP_API_BASE_URL=http://localhost:5000    # Your backend API URL
```

### Build Commands
```bash
# Development
npm start

# Production build
npm run build

# Deploy (requires backend running)
npm run deploy
```

## 🔮 System Architecture

### **Frontend → Backend → Google Sheets**
```
QR Generation: CSV Upload → QR Codes → Print → Attach to Vehicles
Inventory Scan: QR Scan → Vehicle Data → Google Sheets → CSV Download
Manual Entry: Form Input → Vehicle Data → Google Sheets → CSV Download
```

### **Data Flow**
```
Vehicle Data → QR Code → Scan → Validate → Store → Display → Export
```

### **Storage Layers**
1. **Session Storage**: Active session data (until session ends)
2. **Google Sheets**: Primary storage (until first download)
3. **Google Drive**: Automatic backup with 30-day retention (after first download)
4. **Local Storage (Scans)**: Backup scan data (36 hours, cleaned after session)
5. **Local Storage (Downloads)**: Downloaded inventories (until next month)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code patterns and design system
4. Test all functionality with both QR codes and manual entry
5. Ensure mobile responsiveness
6. Submit a pull request

## 📚 Documentation

For detailed information about the project, please refer to the documentation in the `docs/` folder:

### 📖 **Core Documentation**
- **[📁 Documentation Index](./docs/README.md)** - Complete documentation overview and navigation
- **[🏗️ Project Structure](./docs/PROJECT_STRUCTURE.md)** - Detailed project architecture and file organization
- **[🔄 QR System Migration](./docs/QR_SYSTEM_MIGRATION.md)** - Complete migration guide from barcode to QR code system
- **[📊 Multiple Inventories](./docs/MULTIPLE_INVENTORIES.md)** - Multiple inventories per month with Google Drive integration

### ⚙️ **Setup & Configuration**
- **[🌍 Environment Setup](./docs/ENVIRONMENT_SETUP.md)** - Environment variables and API configuration guide
- **[🐛 Debug Setup](./docs/DEBUG_SETUP.md)** - Development debugging tools and techniques

### 🚀 **Deployment & Production**
- **[📦 Production Deployment](./docs/PRODUCTION_DEPLOYMENT.md)** - Production deployment guide and best practices

### 🔍 **Technical Comparisons**
- **[📊 Scanner Comparison](./docs/SCANNER_COMPARISON.md)** - Barcode vs QR code scanning system comparison

### 🔗 **Quick Links**
- **New Developer?** Start with [Project Structure](./docs/PROJECT_STRUCTURE.md) and [Environment Setup](./docs/ENVIRONMENT_SETUP.md)
- **Deploying?** Check [Production Deployment](./docs/PRODUCTION_DEPLOYMENT.md) and [Environment Setup](./docs/ENVIRONMENT_SETUP.md)
- **Understanding the System?** Read [QR System Migration](./docs/QR_SYSTEM_MIGRATION.md) and [Scanner Comparison](./docs/SCANNER_COMPARISON.md)
- **Advanced Features?** Explore [Multiple Inventories](./docs/MULTIPLE_INVENTORIES.md) for Google Drive integration

## 📄 License

This project is licensed under the MIT License.

---

**Latest Update**: Complete migration from barcode system to QR code system with full vehicle data capture, location-based management, multiple inventories per month support, Google Drive integration with automatic backup, and enhanced user experience.