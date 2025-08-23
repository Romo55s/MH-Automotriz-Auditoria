# 🚗 Car Inventory App

A modern React application for automating car inventory management in agencies using barcode scanning technology.

## ✨ Features

- **🔐 Secure Authentication** - Auth0 integration for user management
- **🏢 Multi-Agency Support** - Support for multiple car agencies (Suzuki, Mazda, Toyota, Honda, Nissan)
- **📱 Barcode Scanning** - Real-time barcode scanning using device camera
- **📸 Photo Capture** - Optional vehicle photo capture during scanning
- **📊 Real-time Dashboard** - Live session statistics and scanned codes table
- **🎨 Modern UI/UX** - Clean, professional interface with glass morphism effects
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Auth0
- **Barcode Scanning**: ZXing library
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite (Create React App)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Auth0 account and application
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
   REACT_APP_AUTH0_AUDIENCE=https://your-api.com
   ```

   **To get these values:**
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Create a new application (Single Page Application)
   - Copy the Domain and Client ID
   - Set the Allowed Callback URLs to `http://localhost:3000`
   - Set the Allowed Logout URLs to `http://localhost:3000`

4. **Configure Agencies**
   
   Edit `src/data/agencies.ts` to add your agency information:
   ```typescript
   export const agencies: Agency[] = [
     {
       id: 'your-agency-id',
       name: 'Your Agency Name',
       googleSheetId: 'your-google-sheet-id',
     },
   ];
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

## 📱 Usage

### 1. Authentication
- Users sign in through Auth0
- No database required - authentication is handled by Auth0

### 2. Agency Selection
- Choose the agency you're working with from the dropdown
- Each agency can have its own configuration

### 3. Inventory Session
- Start an inventory session
- Use the device camera to scan barcodes and QR codes
- Confirm each scan with optional photo capture
- View real-time statistics and scanned codes table

### 4. Session Management
- Track session duration and scan count
- View photos taken during scanning
- Stop session when complete

## 🔧 Configuration

### Customizing Agencies

Edit `src/data/agencies.ts` to add or modify agencies:

```typescript
export const agencies: Agency[] = [
  {
    id: 'suzuki',
    name: 'Suzuki',
    googleSheetId: 'your-google-sheet-id',
  },
  // Add more agencies...
];
```

### Styling Customization

The app uses Tailwind CSS with a custom design system. Customize colors and styles in:

- `tailwind.config.js` - Tailwind configuration
- `desing-syestm.json` - Design system specifications
- `src/index.css` - Custom CSS classes

## 📁 Project Structure

```
car-inventory-app/
├── src/
│   ├── components/          # React components
│   │   ├── Login.tsx       # Authentication page
│   │   ├── AgencySelector.tsx  # Agency selection
│   │   ├── InventoryPage.tsx   # Main inventory interface
│   │   ├── BarcodeScanner.tsx  # Barcode scanning modal
│   │   ├── ConfirmationModal.tsx # Scan confirmation
│   │   └── ProtectedRoute.tsx   # Route protection
│   ├── context/            # React context
│   │   └── AppContext.tsx  # Application state management
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

## 🔒 Security Features

- **Auth0 Integration**: Secure user authentication
- **HTTPS Required**: Production deployment requires HTTPS for camera access
- **Camera Permissions**: User must grant camera access for scanning
- **Route Protection**: Protected routes require authentication
- **Data Validation**: Input validation for scanned codes

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Ensure these are set in your production environment:
- `REACT_APP_AUTH0_DOMAIN`
- `REACT_APP_AUTH0_CLIENT_ID`
- `REACT_APP_AUTH0_AUDIENCE`

### Production Considerations

- Deploy to HTTPS-enabled hosting (required for camera access)
- Set up proper Auth0 production configuration
- Configure CORS and security headers
- Test barcode scanning functionality in production environment

## 🎨 Design System

The app follows a custom design system defined in `desing-syestm.json`:

- **Color Palette**: Dark theme with white accents
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Glass morphism effects and smooth transitions
- **Layout**: Responsive grid system with proper spacing
- **Buttons**: Pill-shaped buttons with hover effects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure the app builds and runs correctly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the Auth0 documentation for authentication issues
- Review the browser console for any errors

## 🔮 Future Enhancements

- [ ] Google Sheets integration for data export
- [ ] REPUVE integration for vehicle data
- [ ] Offline support with local storage
- [ ] Multiple barcode format support
- [ ] Advanced photo editing capabilities
- [ ] Real-time collaboration features
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Integration with other inventory systems

---

**Note**: This is a frontend application focused on barcode scanning and inventory management. The app is production-ready for basic inventory scanning operations. 