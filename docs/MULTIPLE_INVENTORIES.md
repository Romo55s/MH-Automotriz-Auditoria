# 📊 Multiple Inventories per Month - Implementation Guide

## 🎯 Overview

The Car Inventory App now supports **multiple inventory sessions per month** with unique session IDs, Google Drive integration, and automatic backup management. This allows for unlimited inventory cycles within a single month while maintaining data integrity and proper backup procedures.

## ✨ Key Features

### **Multiple Inventory Sessions**
- **Unlimited Sessions**: No limit on the number of inventory sessions per month
- **Unique Session IDs**: Each session gets a unique identifier (e.g., `sess_1758654024132`)
- **Independent Tracking**: Each session is tracked separately with its own data
- **Session-Specific Downloads**: Download specific inventory by session ID

### **Google Drive Integration**
- **Automatic Backup**: First download triggers automatic Google Drive backup
- **30-Day Retention**: Backups are automatically deleted after 30 days
- **Smart File Selection**: Users can choose from multiple available inventory files
- **Real Filename Preservation**: Downloads use actual Google Drive filenames
- **Data Cleanup**: Google Sheets data is cleared after first download

### **Enhanced Data Management**
- **Session-Specific Files**: Each inventory creates its own backup file
- **Precise Downloads**: Download exact inventory by session ID
- **Fallback Support**: Download most recent inventory if session ID not specified
- **Backward Compatibility**: Works with existing single-inventory workflows

## 🔄 Workflow

### **First Inventory of the Month**
1. **Start Session**: User starts new inventory session
2. **Scan Vehicles**: Scan QR codes and collect vehicle data
3. **Complete Session**: Finish inventory session
4. **First Download**: 
   - Downloads from Google Sheets
   - Automatically backs up to Google Drive
   - Clears data from Google Sheets
   - File: `Agency_September_2025_sess_1758654024132.csv`

### **Subsequent Inventories**
1. **Start New Session**: User starts another inventory session
2. **Scan Vehicles**: Collect new vehicle data
3. **Complete Session**: Finish new inventory session
4. **Download Specific**:
   - Downloads from Google Drive backup
   - Uses specific session ID
   - File: `Agency_September_2025_sess_1758654100261.csv`

## 🛠️ Technical Implementation

### **API Endpoints**

#### **Google Drive Integration**
```http
GET /api/download/stored-files/{agency}           # Get all stored files for agency
GET /api/download/stored-file/{fileId}            # Download specific file by Google Drive ID
```

#### **Download Specific Inventory by Session ID**
```http
GET /api/download/inventory/{agency}/{month}/{year}/csv/{sessionId}
GET /api/download/inventory/{agency}/{month}/{year}/excel/{sessionId}
```

#### **Download Most Recent Inventory (Fallback)**
```http
GET /api/download/inventory/{agency}/{month}/{year}/csv
GET /api/download/inventory/{agency}/{month}/{year}/excel
```

### **Data Structures**

#### **Monthly Inventory with Session ID**
```typescript
interface MonthlyInventory {
  id: string;
  agencyId: string;
  month: string;         // Format: "MM"
  year: number;
  monthName: string;     // e.g., "September 2025"
  status: 'Active' | 'Completed' | 'Paused';
  createdAt: Date;
  createdBy: string;
  totalScans: number;
  sessionId?: string;    // Unique session identifier
  lastUpdated?: Date;
}
```

#### **Download Inventory Data**
```typescript
interface DownloadInventoryData {
  monthName: string;
  year: number;
  totalScans: number;
  createdBy: string;
  sessionId?: string;    // Session ID for specific downloads
  scannedCodes?: ScannedCode[];
}
```

### **Frontend Implementation**

#### **Google Drive File Selection**
```typescript
const handleSelectInventoryFromSelector = async (fileId: string) => {
  try {
    // Get stored files to find the correct filename
    const { getStoredFiles } = await import('../services/api');
    const storedFiles = await getStoredFiles(selectedAgency?.name || '');
    
    // Find the file that matches this fileId
    const matchingFile = storedFiles.files?.find((file: any) => file.id === fileId);
    const filename = matchingFile?.name || `inventory_${fileId.slice(-8)}.csv`;
    
    // Download with correct filename
    const blob = await downloadStoredFile(fileId);
    
    // Create download link with real filename
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading specific inventory:', error);
  }
};
```

#### **API Service with Google Drive Support**
```typescript
// Get stored files for an agency (Google Drive files)
export const getStoredFiles = async (agency: string) => {
  const encodedAgency = encodeURIComponent(agency);
  const response = await apiRequest(`/api/download/stored-files/${encodedAgency}`);
  return response;
};

// Download specific file by ID
export const downloadStoredFile = async (fileId: string) => {
  const url = buildApiUrl(`/api/download/stored-file/${fileId}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
};
```

## 📱 User Interface

### **Inventory Management Page**
- **Multiple Inventory Cards**: Each completed inventory shows as a separate card
- **Session ID Display**: Shows unique session identifier for each inventory
- **Download Button**: Header button to trigger file selection modal
- **Status Indicators**: Clear status for each inventory session

### **Multiple Inventory Selector Modal**
- **File List**: Shows all available inventory files from Google Drive
- **Real Filenames**: Displays actual Google Drive filenames
- **File Details**: Shows creation date, size, and session information
- **Smart Selection**: Users can choose specific inventory to download

### **Download Confirmation Modal**
- **Session Information**: Displays session ID when available
- **Smart Messaging**: Explains automatic backup process
- **File Naming**: Shows expected filename with session ID

### **File Naming Convention**
```
Google Drive Format: 2025-09-25_Jac_September_2025_8ced4e1e.csv
Legacy Format:      Agency_September_2025_sess_1758654024132.csv
```

## 🔧 Configuration

### **Environment Variables**
No additional environment variables are required. The system uses existing Google Drive configuration from the backend.

### **Backend Requirements**
- Google Drive API integration
- Session ID generation and tracking
- Automatic backup on first download
- 30-day retention policy implementation

## 🚀 Usage Examples

### **Example 1: Multiple Inventories in September**
```
Session 1: sess_1758654024132 (3 vehicles)
Session 2: sess_1758654100261 (2 vehicles)
Session 3: sess_1758654200000 (5 vehicles)

Downloads:
- Agency_September_2025_sess_1758654024132.csv (3 vehicles)
- Agency_September_2025_sess_1758654100261.csv (2 vehicles)
- Agency_September_2025_sess_1758654200000.csv (5 vehicles)
```

### **Example 2: Fallback Download**
```
If no session ID is provided:
- Downloads most recent inventory
- Uses standard endpoint
- File: Agency_September_2025.csv
```

## 🔍 Error Handling

### **Common Error Scenarios**
1. **Session ID Not Found**: Falls back to most recent inventory
2. **Google Drive Backup Failed**: Shows warning but allows download
3. **Network Issues**: Retry mechanism with user feedback
4. **Invalid Session ID**: Clear error message with fallback option

### **Error Messages**
- **Success**: "File downloaded successfully and backed up automatically to Google Drive"
- **Warning**: "File downloaded but backup failed. Please contact support"
- **Error**: "Download failed. Please try again"

## 📊 Benefits

### **For Users**
- **Flexibility**: Unlimited inventory sessions per month
- **Precision**: Download specific inventory sessions
- **Reliability**: Automatic backup and data protection
- **Simplicity**: Same interface, enhanced functionality

### **For Administrators**
- **Data Integrity**: Each inventory is tracked separately
- **Backup Management**: Automatic Google Drive integration
- **Storage Optimization**: 30-day retention policy
- **Audit Trail**: Complete session tracking with unique IDs

## 🔮 Future Enhancements

### **Planned Features**
- **Bulk Download**: Download multiple inventories at once
- **Session Comparison**: Compare data between sessions
- **Advanced Filtering**: Filter inventories by date, user, or status
- **Export Options**: Additional export formats (PDF, JSON)

### **Potential Improvements**
- **Session Templates**: Pre-configured session settings
- **Automated Scheduling**: Scheduled inventory sessions
- **Advanced Analytics**: Session performance metrics
- **Integration APIs**: Third-party system integration

## 📚 Related Documentation

- **[Project Structure](./PROJECT_STRUCTURE.md)** - Complete project architecture
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Configuration guide
- **[Production Deployment](./PRODUCTION_DEPLOYMENT.md)** - Deployment instructions
- **[QR System Migration](./QR_SYSTEM_MIGRATION.md)** - QR code system details

## 🤝 Support

For questions or issues related to multiple inventories:

1. **Check Console Logs**: Look for session ID and endpoint information
2. **Verify Backend**: Ensure Google Drive integration is working
3. **Test Fallback**: Try downloading without session ID
4. **Contact Support**: Provide session ID and error details

---

**Last Updated**: September 2025 - Multiple inventories per month with Google Drive integration
