# VillagePulse (GramPulse) — Project Master Guide & AI Context Manual

> **Purpose of this Document:**  
> This file contains the complete architectural blueprint, data schema, security model, feature inventory, and git commit history for **VillagePulse**. Any AI assistant reading this file can instantly understand the entire repository without needing to scan or re-analyze the codebase.

---

## 1. Executive Summary

- **Project Name:** VillagePulse (formerly GramPulse)
- **Live Deployment:** [https://villagepulse.netlify.app](https://villagepulse.netlify.app)
- **Repository:** `https://github.com/nareshkumarregar89-bit/GramPulse.git` (Branch: `main`)
- **Core Mission:** A smart, cloud-synchronized rural survey and family intelligence management system designed for Indian villages (Panchayats), field surveyors, and administrators. It digitizes household surveys, family genealogies, socioeconomic status, and government IDs (Jan Aadhaar, Ration Card), providing real-time data sync, multi-tier RBAC, and official A4 printing.

---

## 2. Technology Stack & Key Libraries

| Layer | Technology | Version / Details |
|---|---|---|
| **Frontend Framework** | React (SPA) | `^18.3.1` with Hooks & Context API |
| **Bundler & Tooling** | Vite | `^5.4.11` with HMR & PWA plugins |
| **Styling** | Tailwind CSS | `3.4.17` (Dark mode via `class` strategy) |
| **Backend & Database** | Firebase Cloud Firestore | `^13.0.0` (Real-time NoSQL collections) |
| **Authentication** | Firebase Auth | Email/Password & Google Sign-In with RBAC |
| **Icons** | Lucide React | `^0.468.0` (Consistent modern iconography) |
| **PWA & Offline** | vite-plugin-pwa | `^2.0.0` (Service Worker, Cache headers, Update Toast) |
| **Reporting & Export** | Custom CSS Print + jsPDF + XLSX | Dedicated `@media print` styling + React Portals |

---

## 3. Directory Architecture

```text
GramPulse/
├── public/                       # PWA icons, manifest, favicon, official logo.png
├── src/
│   ├── components/
│   │   ├── ExcelImportModal.jsx  # Bulk family import with Excel parsing
│   │   ├── PrintDataModal.jsx    # Production A4 print engine with React Portal
│   │   ├── TiltCard.jsx          # Interactive 3D physics cards with hover parallax
│   │   ├── UpdatePrompt.jsx      # Service Worker PWA update toast notification
│   │   └── UserProfileModal.jsx  # Profile editor & password management modal
│   ├── contexts/
│   │   ├── AuthContext.jsx       # RBAC, login/register, Google auth, realtime role sync
│   │   ├── DataContext.jsx       # Families, villages, mohallas, castes, sync listeners
│   │   └── ToastContext.jsx      # Global toast notification provider
│   ├── data/
│   │   ├── castes.js             # Pre-configured caste list (Regar, Ahir, etc.)
│   │   ├── mohallas.js           # Pre-configured approved mohalla list
│   │   ├── villageData.js        # Initial production seed records
│   │   └── villages.js           # Initial active villages (Samodi, Kotdi)
│   ├── hooks/
│   │   └── useLocalStorage.js    # Persistent localStorage sync hook
│   ├── layouts/
│   │   ├── BottomNavigation.jsx  # Modern floating capsule mobile dock with elevated New Survey FAB
│   │   ├── Layout.jsx            # App shell with desktop sidebar & main view wrapper
│   │   ├── Sidebar.jsx           # Collapsible desktop navigation sidebar
│   │   └── TopNavbar.jsx         # Top navigation bar (village switcher, dark mode, language, profile)
│   ├── pages/
│   │   ├── AdminPanel.jsx        # User management, village allocation, wiping
│   │   ├── Castes.jsx            # Caste analytics and demographic distribution
│   │   ├── Dashboard.jsx         # Overview KPIs, isometric village hero, charts
│   │   ├── DeletedRecords.jsx    # Recycle bin / soft delete restoration system
│   │   ├── Families.jsx          # Paginated family directory with filters & print
│   │   ├── FamilyProfile.jsx     # Individual family dossier & government IDs
│   │   ├── Login.jsx             # Dual authentication (Email/Password & Google)
│   │   ├── Mohallas.jsx          # Mohalla demographics & population breakdown
│   │   ├── NewSurvey.jsx         # Multi-step household survey wizard with GPS capture
│   │   ├── Reports.jsx           # Statistical analytical reports & export
│   │   ├── Search.jsx            # Advanced multi-parameter fuzzy search
│   │   ├── Settings.jsx          # App configurations, config sync, cache purge
│   │   └── VillageManagement.jsx # Dynamic village CRUD & status toggling
│   ├── firebase.js               # Initialized Firebase app, Firestore db, and auth instance
│   ├── index.css                 # Global styling, 3D animations, and print stylesheets
│   └── main.jsx                  # React DOM root entry
├── PROJECT_MASTER_DOCUMENTATION.docx # Generated Word document manual for AI & stakeholders
├── PROJECT_MASTER_GUIDE.md           # This document
├── netlify.toml                  # Netlify deployment & SPA routing configuration
└── package.json                  # Project dependencies and npm scripts
```

---

## 4. Database Schema & Data Models

### 4.1. `families` Collection (Firestore)
Each document represents a household family unit.
```typescript
interface Family {
  id: string;                         // e.g. "FAM-0001" or Firestore Auto-ID
  village: string;                    // e.g. "समौड़ी (Samodi)"
  villageId: string;                  // "samodi" | "kotdi" | custom id
  familyHeadName: string;             // Bilingual display name
  familyHeadNameEnglish: string;      // English name of family head
  familyHeadNameHindi: string;        // Hindi name of family head
  fatherName: string;                 // Father/Husband name (bilingual)
  fatherNameEnglish: string;          // Father/Husband name in English
  fatherNameHindi: string;            // Father/Husband name in Hindi
  mohalla: string;                    // e.g. "Regar Mohalla"
  caste: string;                      // e.g. "Regar"
  houseNumber?: string;               // Optional house/ward number
  bplStatus?: "Yes" | "No";           // Below Poverty Line status
  incomeGroup?: string;               // e.g. "< 50,000", "50k-1L", etc.
  janAadhaar?: string;                // 10-digit Rajasthan Jan Aadhaar ID
  rationCard?: string;                // 12-digit Government Ration Card ID
  mobileNumber?: string;              // Primary contact mobile number
  surveyorId: string;                 // UID of the surveyor who conducted survey
  surveyorName: string;               // Name of surveyor
  surveyorEmail?: string;             // Email of surveyor
  surveyDate: string;                 // ISO date string
  location?: {                        // Geotagged coordinates
    latitude: number;
    longitude: number;
  };
  members: Array<{                    // List of family members
    id?: string;
    name: string;                     // Full name
    nameEnglish?: string;
    nameHindi?: string;
    relation: string;                 // "Head", "Wife", "Son", "Daughter", "Father", "Mother", etc.
    gender: "Male" | "Female" | "Other";
    age: string | number;
    dob?: string;                     // "DD-MM-YYYY"
    maritalStatus?: string;           // "Married", "Unmarried", "Widowed"
    education?: string;               // "Primary", "Secondary", "Graduate", "Illiterate"
    occupation?: string;              // "Agriculture", "Labor", "Business", "Student"
    aadhaar?: string;                 // 12-digit Aadhaar number
    mobile?: string;
  }>;
}
```

### 4.2. `users` Collection (Firestore)
Stores user permissions and profile information.
```typescript
interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "surveyor";
  status: "active" | "inactive" | "pending";
  assignedVillages: string[];         // e.g. ["समौड़ी (Samodi)", "कोटड़ी (Kotdi)"]
  createdAt: string;
}
```

### 4.3. `settings/villageConfig` Document
Global configuration document storing dynamic arrays:
- `mohallas`: Array of strings (e.g. `["Regar Mohalla", "Ahir Mohalla", "Bheel Mohalla", "Gurjar Mohalla"]`)
- `castes`: Array of strings (e.g. `["Regar", "Ahir", "Bheel", "Gurjar", "Brahmin", "Rajput"]`)

---

## 5. Security & Role-Based Access Control (RBAC)

1. **Super Admin Role (`admin`)**:
   - Matches hardcoded `ADMIN_UID = "sJwiZZ6cf8Ze8YAmMMK8T1FwF232"` or `userProfile.role === 'admin'`.
   - Has unrestricted access to view all families, edit village configurations, assign villages to surveyors, delete users, and wipe data.
2. **Surveyor Role (`surveyor`)**:
   - Field surveyors can only record surveys and view families assigned to their village or created under their `surveyorId`.
   - Data queries automatically filter by `where('surveyorId', '==', currentUser.uid)`.
3. **Real-time Permissions Sync**:
   - `AuthContext` uses `onSnapshot` on `doc(db, 'users', currentUser.uid)` to dynamically sync permissions without requiring a page reload or re-login.

---

## 6. Official Print Architecture

- **Problem solved:** In standard web printing, background UI elements (dashboards, headers, sidebars) bleed into the print output.
- **Solution implementation:**
  - `PrintDataModal.jsx` uses `ReactDOM.createPortal(<PrintDocument />, document.body)` to mount the printable report at the top level with class `.print-portal-area`.
  - In `src/index.css`:
    ```css
    @media print {
      body.is-printing-report #root {
        display: none !important;
      }
      .print-portal-area {
        display: block !important;
        position: static !important;
        width: 100% !important;
      }
    }
    ```
  - This ensures 100% clean, professional A4 government-style documents with official headers, tables, bilingual headings, and page counters.

---

## 7. Mobile UX & Floating Navigation Dock

- **Desktop Layout:** Kept stable and intact with collapsible left sidebar (`Sidebar.jsx`) and extensive analytics.
- **Mobile Layout:** Upgraded with a modern floating capsule taskbar (`BottomNavigation.jsx`):
  - Elevated center Action Button (`/survey`) with emerald gradient pill and active animations.
  - Glassmorphism backdrop blur (`backdrop-blur-2xl bg-white/90 dark:bg-gray-900/90`).
  - Active indicator dot with emerald glow.
  - Safe-area bottom inset padding (`mb-[env(safe-area-inset-bottom)]`).

---

## 8. Complete Commit Log & Milestones

1. `ef7b304` — **fix(print): portal print document to body and hide root; remove dummy data; modernize mobile bottom bar** (Current production release)
2. `a8b2c6d` — feat: add on-demand dummy data toggle feature for demo preview
3. `30fa1a1` — fix: import Clock icon from lucide-react in AdminPanel
4. `8f6d17b` — feat: eliminate mock data auto-seeding and add clearAllSurveyData for database purge
5. `470e912` — fix: ensure update button immediately reloads with controllerchange and guaranteed fallback
6. `4bb580c` — style: hide netlify drawer and feedback badge in global css
7. `e2daf68` — chore: rename app from GramPulse to VillagePulse across all files and components
8. `f691993` — feat: add premium responsive top-bar refresh button for desktop and mobile
9. `d4220fd` — feat: enable realtime role and profile sync without page refresh via onSnapshot
10. `09c44ee` — feat: add pwa update prompt with netlify cache headers and remove vercel config
11. `103f07d` — feat: complete Firebase Auth user deletion and unassigned new user workflow
12. `7072244` — fix: surface error message on user deletion in AdminPanel
13. `00e8610` — fix: robust user deletion fallback and enhanced Firestore auth check
14. `317a1a0` — feat: add user deletion in admin panel and responsive mobile UI for deleted records
15. `ba79b3a` — feat: implement premium 3D UI, isometric village hero, interactive tilt cards, and SaaS animations
16. `be8f3cb` — feat: add premium cursor animation, click ripple effect, and card hover transitions
17. `0d1f098` — feat: set default mohallas to only Regar, Ahir, Bheel, and Gurjar Mohalla
18. `150c4e3` — feat: dynamic village management with Samodi and Kotdi, secure admin panel, and strict user privacy
19. `0499f2e` — Add Google Sign-In authentication support with Firebase
20. `6361fb0` — Add Professional Data Printing Feature with A4 layout, multi-selection, and family dossier printing
21. `6ff445b` — Optimize mobile navbar and add User Profile Card and dedicated profile view
22. `e16943b` — Fix dark mode class syncing and polish mobile UI with responsive stepper and bottom navigation
23. `7660729` — Add multi-user RBAC, village-wise data isolation, user management, and Excel bulk import
24. `51b3dd6` — Add official GramPulse logo to navbar, sidebar, login, PWA icons and favicon
25. `ed8360e` — Add Firebase Authentication with roles (Admin UID configured), Surveyor tracking, and GPS Geotagging
26. `bbec6d9` — Configure PWA with VitePWA plugin, manifest, service worker and install banner
27. `d224b37` — Integrate Firebase Firestore for global real-time multi-user data synchronization
28. `81f5340` — Fix undefined charAt error by normalizing family and member names with fallbacks
29. `3982964` — Add netlify.toml with build and SPA redirect configuration
30. `16ad7b5` — Fix JSX syntax in DeletedRecords and add vercel.json rewrite rule
31. `2203faa` — Add dual language support, deleted records page, updated data structure
32. `6e59942` — Add _redirects for Netlify client-side routing
33. `2ab58a5` — Initial commit - GramPulse Village Survey System

---

## 9. Crucial Directives for Future AI Agents

- **No Mock or Dummy Data:** Do not add fake data loops, dummy generators, or mock toggle buttons. The application operates solely on real production Firestore data.
- **Desktop Layout Invariance:** Keep the desktop layout stable. Do not disrupt desktop responsiveness when making mobile adjustments.
- **Bilingual Field Integrity:** Always preserve both English and Hindi fields (`nameEnglish`, `nameHindi`, `familyHeadNameEnglish`, `familyHeadNameHindi`).
- **Portal Print Pattern:** Never render `<PrintDocument>` directly within nested application cards. Always portal it directly to `document.body` with class `.print-portal-area` and apply `.is-printing-report` to body during print.
