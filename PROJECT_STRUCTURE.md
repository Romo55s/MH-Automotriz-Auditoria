# 🏗️ Car Inventory App - Project Structure

## 📁 Directory Organization

```
car-inventory-app/
├── src/
│   ├── components/          # React components
│   │   ├── Login.tsx       # Authentication page
│   │   ├── AgencySelector.tsx  # Agency selection
│   │   ├── InventoryPage.tsx   # Main inventory interface
│   │   ├── BarcodeScanner.tsx  # Barcode scanning modal
│   │   ├── ConfirmationModal.tsx # Scan confirmation
│   │   ├── ProtectedRoute.tsx   # Route protection
│   │   ├── Auth0ErrorBoundary.tsx # Auth0 error handling
│   │   ├── Toast.tsx            # Toast notification component
│   │   ├── LoadingSpinner.tsx   # Loading spinner component
│   │   ├── ManualInputModal.tsx # Manual barcode input modal
│   │   ├── Header.tsx           # Reusable header component
│   │   └── Footer.tsx           # Reusable footer component
│   ├── context/            # React context providers
│   │   ├── AppContext.tsx  # Application state management
│   │   └── ToastContext.tsx # Toast notification management
│   ├── hooks/              # Custom React hooks
│   │   └── useInventory.ts # Inventory state and API management
│   ├── services/           # API services
│   │   └── api.ts          # Backend API communication
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Interface definitions
│   ├── data/               # Static data
│   │   └── agencies.ts     # Agency configurations
│   ├── config/             # Configuration files
│   │   └── auth0-config.ts # Auth0 settings
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Application entry point
│   └── index.css           # Global styles with Tailwind
├── public/
│   ├── index.html          # Main HTML file
│   └── favicon.ico         # App icon
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind configuration
├── desing-syestm.json      # Design system specifications
└── README.md               # Project documentation
```

## 🔌 API Integration

### Backend Endpoints

The app is now structured to work with your specific backend endpoints:

#### `POST /api/save-scan`
- **Purpose**: Save scanned barcode to Google Sheets
- **Input**: `{ agency: "Suzuki", code: "12345678", timestamp: "ISO8601", user?: "email", photo?: "base64" }`
- **Behavior**: Saves data to agency-specific Google Sheet tab

#### `POST /api/finish-session`
- **Purpose**: Complete inventory session and trigger Python script
- **Input**: `{ agency: "Suzuki", user?: "email" }`
- **Behavior**: Reads all codes from agency tab, triggers `scraper.py`, waits for completion

#### `GET /api/session-data/{agency}`
- **Purpose**: Retrieve session data from Google Sheets
- **Input**: Agency name in URL path
- **Behavior**: Returns all scanned codes for the agency

#### `GET /api/session-status/{agency}`
- **Purpose**: Check session processing status
- **Input**: Agency name in URL path
- **Behavior**: Returns current session status

### API Service Layer

- **`src/services/api.ts`**: Centralized API communication
- **`src/hooks/useInventory.ts`**: Inventory state management with API integration
- **Error handling**: Toast notifications for success/error states
- **Loading states**: Spinners and disabled buttons during API calls

## 🎯 Key Features

### 1. **Session Management**
- Start/stop inventory sessions
- Track session duration and scan count
- Prevent multiple active sessions

### 2. **Real-time Feedback**
- Toast notifications for all actions
- Loading spinners during API calls
- Error display with dismiss functionality

### 3. **Backend Integration**
- Automatic Google Sheets saving on each scan
- Python script triggering on session completion
- REPUVE data integration ready

### 4. **User Experience**
- Responsive design with glass morphism
- Intuitive workflow: Select Agency → Start Session → Scan → Finish
- Clear visual feedback for all states

### 5. **Manual Input Support**
- 8-digit code validation for damaged barcodes
- Keyboard shortcuts (Enter key) for quick input
- Same confirmation flow as scanned codes
- Character counter and real-time validation
- **No photo capture** - Simplified workflow for faster scanning

### 6. **Reusable Components**
- **Header**: Consistent navigation with back button and user info
- **Footer**: Branded footer across all pages
- **ManualInputModal**: Specialized for 8-digit code input
- Follows design system specifications

## 🚀 Development Workflow

### Frontend Development
1. **Components**: React components with TypeScript
2. **State Management**: Custom hooks for business logic
3. **API Integration**: Service layer for backend communication
4. **UI/UX**: Tailwind CSS with custom design system

### Backend Integration
1. **API Calls**: Structured through service layer
2. **Error Handling**: Comprehensive error management
3. **Loading States**: User feedback during operations
4. **Data Flow**: Scan → Save → Process → Complete

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api.com
```

### Google Sheets Setup
- Spreadsheet: `CarInventory`
- Agency tabs: `Suzuki`, `Mazda`, `Toyota`, `Honda`, `Nissan`
- Columns: `Timestamp`, `Code`, `Status`, `Make`, `Model`, `Color`

## 📱 User Flow

1. **Authentication**: User logs in via Auth0
2. **Agency Selection**: Choose from dropdown of available agencies
3. **Session Start**: Click "Start Inventory Session"
4. **Scanning**: Use camera to scan barcodes with confirmation (no photos)
5. **Data Collection**: Each scan automatically saves to Google Sheets
6. **Session Completion**: Click "Stop Inventory" to trigger Python processing
7. **Data Processing**: Backend processes all codes through REPUVE
8. **Sheet Update**: Google Sheet updated with vehicle information

## 🎨 Design System

- **Colors**: Dark theme with white accents
- **Components**: Glass morphism effects
- **Typography**: Clean, readable fonts
- **Layout**: Responsive grid system
- **Buttons**: Pill-shaped with hover effects
- **Feedback**: Toast notifications and loading states

This structure provides a solid foundation for the full-stack Car Inventory App with clear separation of concerns, comprehensive error handling, and seamless backend integration.
