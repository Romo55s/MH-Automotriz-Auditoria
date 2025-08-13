# 🚗 Car Inventory App

A full-stack React application for automating car inventory in agencies using barcode scanning and REPUVE integration.

## ✨ Features

- **🔐 Secure Authentication** - Auth0 integration for user management
- **🏢 Multi-Agency Support** - Support for multiple car agencies (Suzuki, Mazda, Toyota, etc.)
- **📱 Barcode Scanning** - Real-time barcode scanning using device camera
- **📸 Photo Capture** - Optional vehicle photo capture during scanning
- **📊 Real-time Dashboard** - Live session statistics and scanned codes table
- **📋 Google Sheets Integration** - Export scanned data to Google Sheets
- **🔄 REPUVE Integration** - Python script integration for vehicle data retrieval

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Auth0
- **Barcode Scanning**: ZXing library
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Create React App

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Auth0 account and application
- Google Sheets API credentials (for production)

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
- Choose the agency you're working with
- Each agency has its own Google Sheet for data storage

### 3. Inventory Session
- Start an inventory session
- Use the device camera to scan barcodes
- Confirm each scan with optional photo capture
- View real-time statistics and scanned codes

### 4. Data Export
- On "Stop Inventory", data is sent to Google Sheets
- Python script is triggered to get REPUVE data
- Sheet is updated with complete vehicle information

## 🔧 Configuration

### Customizing Agencies

Edit `src/data/agencies.ts` to add or modify agencies:

```typescript
export const agencies: Agency[] = [
  {
    id: 'suzuki',
    name: 'Suzuki',
    googleSheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  },
  // Add more agencies...
];
```

### Styling Customization

The app uses Tailwind CSS. Customize colors and styles in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#your-primary-color',
        },
      },
    },
  },
};
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Authentication page
│   ├── AgencySelector.tsx  # Agency selection
│   ├── InventoryPage.tsx   # Main inventory interface
│   ├── BarcodeScanner.tsx  # Barcode scanning modal
│   └── ConfirmationModal.tsx # Scan confirmation
├── context/            # React context
│   └── AppContext.tsx  # Application state management
├── types/              # TypeScript type definitions
│   └── index.ts        # Interface definitions
├── data/               # Static data
│   └── agencies.ts     # Agency configurations
├── config/             # Configuration files
│   └── auth0-config.ts # Auth0 settings
├── App.tsx             # Main application component
└── index.css           # Global styles with Tailwind
```

## 🔒 Security Features

- **Auth0 Integration**: Secure user authentication
- **HTTPS Required**: Production deployment requires HTTPS
- **Camera Permissions**: User must grant camera access for scanning
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

### Google Sheets Integration

For production, you'll need to:
1. Set up Google Sheets API
2. Create service account credentials
3. Share your sheets with the service account
4. Implement the backend API for sheet operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the Auth0 documentation for authentication issues
- Review the Google Sheets API documentation for integration help

## 🔮 Future Enhancements

- [ ] Offline support with local storage
- [ ] Multiple barcode format support
- [ ] Advanced photo editing
- [ ] Real-time collaboration
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Integration with other inventory systems

---

**Note**: This is a frontend application. The Google Sheets integration and REPUVE data retrieval require backend implementation or serverless functions. 