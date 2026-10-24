# VillagePulse Mobile (विलेज पल्स)
### Smart Rural Census & Family Dossier Management System
Built with **React Native**, **Expo SDK 51**, **Firebase Firestore**, and **React Navigation**.

---

## 📂 Project Architecture

```text
VillagePulseMobile/
├── App.js                         # Root App setup (SafeAreaProvider, AuthProvider, DataProvider)
├── app.json                       # Expo application metadata (package: com.villagepulse.mobile)
├── babel.config.js                # Babel configuration
├── metro.config.js                # Metro bundler with Firebase .cjs resolver
├── package.json                   # Dependencies & npm scripts
├── BUILD_AND_RUN_STEPS.md         # Detailed build and run instructions
├── assets/                        # App logo, adaptive icons, splash screens
└── src/
    ├── config/
    │   └── firebase.js            # Initialized Firebase Auth & Firestore with AsyncStorage
    ├── constants/
    │   ├── theme.js               # Color tokens (Emerald green, Slate, Saffron), Shadows, Radii
    │   ├── villages.js            # Village definitions, canonical resolution helpers
    │   ├── castes.js              # Pre-configured Rajasthan caste list
    │   ├── mohallas.js            # Pre-configured approved mohalla list
    │   └── initialData.js         # Production initial seed records
    ├── contexts/
    │   ├── AuthContext.js         # RBAC (Super Admin vs Field Surveyor), auth persistence
    │   └── DataContext.js         # Realtime Firestore families sync, caching & CRUD operations
    ├── navigation/
    │   ├── AppNavigator.js        # Root stack (Auth stack + Main Tab stack)
    │   └── BottomTabNavigator.js  # Floating bottom dock with center elevated Survey FAB
    ├── components/
    │   ├── Header.js              # Universal app bar with Village Switcher dropdown
    │   ├── VillagePickerModal.js  # Village selection bottom sheet modal
    │   ├── StatCard.js            # Visual KPI metric card
    │   ├── FamilyCard.js          # Interactive family directory card with member count & badges
    │   └── MemberRow.js           # Member detail and editing row
    └── screens/
        ├── auth/
        │   ├── LoginScreen.js     # Login with 1-tap demo shortcuts for Admin & Surveyor
        │   └── RegisterScreen.js  # Field Surveyor registration form
        ├── dashboard/
        │   └── DashboardScreen.js # KPIs, Quick Actions, Caste breakdown, Recent surveys
        ├── families/
        │   ├── FamiliesListScreen.js # Directory with live search, Mohalla & Caste filter chips
        │   └── FamilyDetailScreen.js # Complete dossier, Jan Aadhaar, member cards, call button
        ├── survey/
        │   ├── NewSurveyScreen.js    # 4-Step survey wizard with dynamic member adding
        │   └── EditSurveyScreen.js   # Edit existing household survey record
        ├── analytics/
        │   └── AnalyticsScreen.js    # Demographics: Gender ratios, Caste bars, Mohallas
        ├── search/
        │   └── SearchScreen.js       # Multi-parameter fuzzy search
        └── profile/
            └── ProfileScreen.js      # User profile, role permissions, sync status, logout
```

---

## 🚀 Quick Start

```bash
cd "d:\gram-pulse project\GramPulse\GramPulseMobile"
npx expo start
```
Scan the QR code with **Expo Go** on Android or iOS.

For complete building and `.apk` compilation instructions, see [BUILD_AND_RUN_STEPS.md](file:///d:/gram-pulse%20project/GramPulse/GramPulseMobile/BUILD_AND_RUN_STEPS.md).
