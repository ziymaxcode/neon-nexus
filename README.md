# Neon Nexus - Cyber Cafe Manager

A modern, cyberpunk-themed management system for cyber cafes and gaming lounges. Built with React, Vite, Tailwind CSS, Electron, and Capacitor, this application can run as a web app, a standalone Windows desktop application (`.exe`), or a native Android app (`.apk`).

## 🌟 Features

*   **📊 Command Center (Dashboard):** Real-time overview of active sessions, today's revenue, total revenue, and active members.
*   **🎮 Gaming Grid:** Manage PC, PS5, and Xbox stations. Start, stop, and monitor active gaming sessions with automatic time-based billing.
*   **🧾 Billing System:** Generate comprehensive bills including gaming time charges and cafe menu items. Supports discounts and multiple payment methods.
*   **🍔 Cafe Menu:** Manage snacks, beverages, and food items with custom pricing and emojis.
*   **👥 Member Management:** Track regular customers, manage membership plans (Basic, Silver, Gold), and monitor expiry dates.
*   **📜 Transaction History:** Detailed logs of all past transactions and revenue.
*   **💾 Data Backup & Restore:** Export your entire database to a local `.sqlite` file and restore it anytime. Includes a "Danger Zone" to completely wipe local data.

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, Tailwind CSS, Lucide React (Icons)
*   **Desktop Packaging:** Electron, electron-builder
*   **Mobile Packaging:** Capacitor
*   **Database/Storage:** Browser `localStorage` with `sql.js` for SQLite backups

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Android Studio](https://developer.android.com/studio) (Only required if you want to build the Android `.apk`)

### Installation

1. Extract the project files to a folder.
2. Open your terminal in the project folder.
3. Install the dependencies:
   ```bash
   npm install
   ```

## 💻 Running & Building the App

### 1. Web Version
To run the app in your standard web browser for development:
```bash
npm run dev
```

### 2. Desktop App (Windows .exe / Mac / Linux)
To test the desktop app locally without building the installer:
```bash
npm run electron:dev
```

To build the standalone executable installer (e.g., `.exe` for Windows):
```bash
npm run electron:build
```
*The built installer will be located in the `dist-electron` folder.*

### 3. Android App (.apk)
To sync your web assets to the Android project:
```bash
npm run android:sync
```

To open the project in Android Studio (where you can build the APK):
```bash
npx cap open android
```
*In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your app.*

## 📂 Data Management

By default, Neon Nexus stores all data locally on the device using standard web storage (`localStorage`). 

**To move data between devices (e.g., from PC to Android):**
1. Go to the **Data Backup** tab in the app.
2. Click **Export Backup** to download a `.sqlite` file.
3. Transfer this file to your other device.
4. Open the app on the new device, go to **Data Backup**, and click **Import Backup** to load your data.

## ⚠️ Troubleshooting

*   **Electron Build Error ("The process cannot access the file"):** Ensure the app is completely closed (check Task Manager for background `electron.exe` processes) and that you don't have the `dist-electron` folder open in File Explorer before running the build command.
