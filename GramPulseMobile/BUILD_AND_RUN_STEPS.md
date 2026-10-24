# VillagePulse Mobile App — Complete Build & Setup Guide
> **Panchayat Household Census & Family Intelligence System**  
> Built with **React Native & Expo** for Android, iOS, and Web.

---

## 📱 1. Fast Preview on Your Phone (Using Expo Go)

You can run this app directly on your physical Android or iPhone in under **60 seconds** without compiling native code!

### Step 1: Install Expo Go on your mobile
- **Android**: Install [Expo Go from Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iPhone (iOS)**: Install [Expo Go from Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Open terminal and navigate to the mobile app folder
```bash
cd "d:\gram-pulse project\GramPulse\GramPulseMobile"
```

### Step 3: Start the Expo Development Server
```bash
npx expo start
```
*(or run `npm start`)*

### Step 4: Connect your phone
1. Ensure your computer and your phone are connected to the **same Wi-Fi network**.
2. **Android**: Open the **Expo Go** app and tap **"Scan QR code"**, then scan the QR code printed in your terminal or browser.
3. **iPhone**: Open the default **Camera app**, point it at the QR code, and tap the yellow banner to launch in Expo Go.

---

## 💻 2. Running on Android Emulator / Web Preview

### Option A: Run on Android Emulator
If you have Android Studio with an active emulator:
```bash
npm run android
```

### Option B: Run on Web Browser (Instant Preview)
```bash
npm run web
```
*(Press `w` in the terminal when `npx expo start` is running to launch in your browser)*

---

## 📦 3. How to Build an Installable Android APK (`.apk`)

To generate an official `.apk` file that anyone in the Panchayat or surveyors can download and install:

### Method 1: Cloud Build with EAS (Recommended — Free & No Android Studio needed)

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to your Expo account:**
   ```bash
   eas login
   ```
   *(If you don't have an Expo account, create a free one at [expo.dev/signup](https://expo.dev/signup))*

3. **Configure the build project:**
   ```bash
   eas build:configure
   ```

4. **Trigger the standalone APK build:**
   ```bash
   eas build -p android --profile preview
   ```
   EAS will compile your Android APK in the cloud and give you a direct download link (and QR code) to install the `.apk` on any Android device!

---

### Method 2: Local Native Build (`npx expo run:android`)

If you have Android Studio and Android SDK installed locally:
```bash
npx expo prebuild
npx expo run:android
```
The APK will be generated inside:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔑 4. Demo Login Credentials

The app includes **1-Tap Quick Demo Access** on the login screen, or you can use:

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@villagepulse.gov.in` | *(Tap "Demo Admin" button)* |
| **Field Surveyor** | `surveyor.samodi@villagepulse.gov.in` | *(Tap "Demo Surveyor" button)* |

---

## 🌟 5. What's Included in This Mobile App

1. **Top Village Switcher:**
   - Seamlessly switch between **समोड़ी (Samodi)**, **कोटड़ी (Kotdi)**, or **All Panchayats**.
2. **Dashboard KPIs:**
   - Live population counter, Male/Female ratio, BPL household tally, Caste distribution bars.
3. **Family Directory:**
   - Real-time search across Jan Aadhaar, Ration Card, mobile, or head of family name.
   - Filter chips for Mohallas and Castes.
4. **Comprehensive Family Dossier:**
   - Full family details, socio-economic status, amenities checklist, individual member list with age, gender, education, relation, and 1-tap phone dialer.
5. **New Survey Wizard (Multi-Step Form):**
   - Step 1: Village, Mohalla, Caste, Head & Father name (Hindi & English), Mobile, House No.
   - Step 2: Jan Aadhaar (10 digits), Ration Card, BPL status, Monthly Income, Amenities.
   - Step 3: Dynamic Family Members (Add / Remove family members).
   - Step 4: Geotagging & Instant Firestore sync!
6. **Edit Survey:**
   - Update existing survey records directly.
7. **Offline Cache:**
   - Powered by `@react-native-async-storage/async-storage` for reliable survey collection even in remote rural areas with poor connectivity.
