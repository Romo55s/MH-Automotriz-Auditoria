# 🚗 Car Inventory App - QR Code System

A modern React application for automating car inventory management using **QR code scanning** and **complete vehicle data capture**.

## ✨ New Features (Latest Update)

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
- **Download Preservation** - Keep downloaded inventories until next month

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom glass morphism design system
- **Authentication**: Auth0 with production-ready configuration
- **QR Code Scanning**: ZXing library with QuaggaJS fallback
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Create React App with production optimizations

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
- **2 Inventories per Month**: Support for bi-monthly inventory cycles
- **Auto-cleanup**: Scan data cleaned after session completion
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
- **`GET /api/download/inventory/{agency}/{month}/{year}/csv`** - Download CSV with car data
- **`GET /api/download/inventory/{agency}/{month}/{year}/excel`** - Download Excel with car data

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
2. **Local Storage (Scans)**: Backup scan data (36 hours, cleaned after session)
3. **Local Storage (Downloads)**: Downloaded inventories (until next month)
4. **Google Sheets**: Permanent storage (until download/export)

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

## 📄 License

This project is licensed under the MIT License.

---

**Latest Update**: Complete migration from barcode system to QR code system with full vehicle data capture, location-based management, and enhanced user experience.