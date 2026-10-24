import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_LANGUAGE = '@villagepulse_language';

export const TRANSLATIONS = {
  hi: {
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    update: 'अपडेट करें',
    submit: 'जमा करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    print: 'प्रिंट करें',
    export: 'एक्सपोर्ट',
    close: 'बंद करें',
    yes: 'हाँ',
    no: 'नहीं',
    back: 'वापस',
    loading: 'लोड हो रहा है...',
    success: 'सफल',
    error: 'त्रुटि',
    required: 'आवश्यक',
    all: 'सभी',
    select: 'चुनें',
    selectAll: 'सभी चुनें',
    deselectAll: 'हटाएं',
    refresh: 'रिफ्रेश करें',
    confirm: 'पुष्टि करें',

    // Roles & Access
    surveyor: 'Surveyor',
    surveyorHi: 'सर्वेक्षक',
    superAdmin: 'Super Administrator',
    superAdminHi: 'सुपर व्यवस्थापक',
    approvalPending: 'खाता सत्यापन लंबित (Approval Pending)',
    approvalPendingDesc: 'आपका खाता अभी व्यवस्थापक (Admin) की स्वीकृति की प्रतीक्षा कर रहा है। व्यवस्थापक द्वारा स्वीकृति और गाँव आवंटन के बाद आपको डेटा दिखाई देगा।',
    allocationPending: 'गाँव आवंटन प्रतीक्षित (Allocation Pending)',
    allocationPendingDesc: 'आपको अभी तक कोई गाँव (समोड़ी या कोटड़ी) आवंटित नहीं किया गया है। कृपया व्यवस्थापक (Admin) से संपर्क करें।',

    // Navigation Tabs
    navHome: 'होम',
    navFamilies: 'परिवार',
    navNewSurvey: 'नया सर्वेक्षण',
    navAnalytics: 'विश्लेषण',
    navProfile: 'प्रोफ़ाइल',

    // Dashboard
    welcome: 'नमस्ते',
    digitalFamilyRecord: 'डिजिटल परिवार रिकॉर्ड',
    allPanchayatData: 'सभी ग्राम पंचायत सर्वेक्षण डेटा',
    censusOverview: 'Census Overview (सर्वेक्षण सांख्यिकी)',
    totalFamilies: 'कुल परिवार',
    population: 'कुल जनसंख्या',
    maleFemale: 'पुरुष / महिला',
    bplHouseholds: 'बीपीएल परिवार',
    quickActions: 'त्वरित कार्य (Quick Actions)',
    actionNewSurvey: 'New Survey',
    actionNewSurveySub: 'नया परिवार जोड़ें',
    actionDataPrint: 'Data Print',
    actionDataPrintSub: 'पीडीएफ व डॉसियर',
    actionSearch: 'Search Data',
    actionSearchSub: 'आईडी / नाम से खोजें',
    actionDirectory: 'Directory',
    actionDirectorySub: 'परिवार सूची देखें',
    casteDistribution: 'Caste Distribution (जातिगत विवरण)',
    recentSurveys: 'Recent Surveys (हाल के सर्वेक्षण)',
    viewAll: 'सभी देखें',
    noSurveysYet: 'कोई हालिया सर्वेक्षण नहीं मिला',

    // Families List & Details
    familiesListTitle: 'परिवार डायरेक्टरी',
    familiesListSub: 'ग्राम पंचायत परिवार रिकॉर्ड',
    searchFamilyPlaceholder: 'परिवार आईडी, मुखिया का नाम, पिता या मोबाइल से खोजें...',
    membersCount: 'सदस्य',
    headOfFamily: 'परिवार मुखिया',
    fatherHusband: 'पिता/पति का नाम',
    village: 'गाँव',
    mohalla: 'मोहल्ला',
    caste: 'जाति',
    bplStatus: 'राशन श्रेणी',
    annualIncome: 'वार्षिक आय',
    monthlyIncome: 'मासिक आय',
    mobileNumber: 'मोबाइल नंबर',
    janAadhaar: 'जन आधार नंबर',
    rationCard: 'राशन कार्ड नंबर',
    houseNumber: 'मकान संख्या',
    familyDetails: 'परिवार विवरण',
    membersList: 'परिवार के सदस्य',
    memberName: 'सदस्य का नाम',
    relation: 'सम्बन्ध',
    age: 'उम्र',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    education: 'शिक्षा',
    occupation: 'व्यवसाय',
    addMember: 'नया सदस्य जोड़ें',
    removeMember: 'सदस्य हटाएं',

    // Survey Forms
    newSurveyTitle: 'New Household Survey',
    newSurveySub: 'नया ग्रामीण परिवार पंजीकरण',
    editSurveyTitle: 'Edit Household Record',
    editSurveySub: 'परिवार सर्वेक्षण विवरण सुधार',
    step1: 'मूल विवरण',
    step2: 'मुखिया विवरण',
    step3: 'सदस्य विवरण',
    step4: 'आर्थिक व आवास',
    saveAndContinue: 'सहेजें और आगे बढ़ें',
    submitSurvey: 'सर्वेक्षण पूर्ण करें',
    surveySubmittedSuccess: 'सर्वेक्षण सफलतापूर्वक दर्ज कर लिया गया है।',

    // Print & PDF
    printScreenTitle: 'Data Print & PDF Export',
    printScreenSub: 'सर्वेक्षण रिपोर्ट एवं परिवार डॉसियर प्रिंट',
    printFormat: 'रिपोर्ट प्रारूप (Print Layout Format)',
    dossierFormat: 'विस्तृत डॉसियर (Detailed Dossier)',
    tableFormat: 'सर्वेक्षण तालिका (Roster Table)',
    filtersAndSearch: 'फ़िल्टर एवं खोज (Filters & Search)',
    selectVillage: 'गाँव चुनें (Village)',
    selectMohalla: 'मोहल्ला चुनें (Mohalla)',
    selectCaste: 'जाति चुनें (Caste)',
    searchPrintPlaceholder: 'उदा. FAM-0001 या मोहन लाल या मोबाइल...',
    selectFamiliesToPrint: 'प्रिंट हेतु परिवार चुनें (Tap to Select/Deselect)',
    selectedCountBadge: 'चयनित',
    totalPopulationPrint: 'कुल जनसंख्या',
    generatePdfBtn: 'PDF / प्रिंट करें',
    generatingPdf: 'पीडीएफ तैयार हो रहा है...',
    noFamiliesSelectedTitle: 'कोई परिवार चयनित नहीं',
    noFamiliesSelectedMsg: 'प्रिंट करने के लिए कृपया कम से कम 1 परिवार का चयन करें।',
    printErrorTitle: 'प्रिंट त्रुटि',

    // Auth Screens
    loginTitle: 'Surveyor & Admin Login',
    loginSub: 'अपने आधिकारिक खाते से लॉगिन करें',
    officialEmail: 'Official Email (आधिकारिक ईमेल)',
    password: 'Password (पासवर्ड)',
    forgotPassword: 'Forgot Password? (पासवर्ड भूल गए?)',
    loginBtn: 'Login to Dashboard (लॉगिन करें)',
    dontHaveAccount: 'नया खाता बनाना चाहते हैं?',
    registerHere: 'पंजीकरण करें (Register)',
    registerTitle: 'New Surveyor Registration',
    registerSub: 'पंचायत क्षेत्र सर्वेक्षक आधिकारिक खाता',
    fullName: 'Full Name (पूरा नाम)',
    confirmPassword: 'Confirm Password (पासवर्ड की पुष्टि करें)',
    registerSubmitBtn: 'पंजीकरण अनुरोध भेजें (Register)',
    alreadyHaveAccount: 'पहले से खाता है? लॉगिन करें',
    forgotTitle: 'Forgot Password',
    forgotSub: 'पासवर्ड रीसेट लिंक प्राप्त करें',
    sendResetLinkBtn: 'पासवर्ड रीसेट लिंक भेजें (Send Link)',
    resetLinkSentTitle: 'रीसेट लिंक भेजा गया',
    resetLinkSentMsg: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है। कृपया अपना इनबॉक्स और स्पैम फ़ोल्डर देखें।',
    backToLogin: 'लॉगिन पर वापस जाएँ',

    // Profile Screen
    profileTitle: 'Surveyor Profile',
    assignedVillages: 'Assigned Villages (आवंटित गाँव)',
    allAccessBadge: 'सभी गाँव (All Access)',
    unassignedBadge: 'आवंटन लंबित (Unassigned)',
    dataAndSync: 'Data & Sync Status',
    firestoreBackend: 'Firestore Backend',
    loadedRecords: 'Loaded Family Records',
    autoSaveMode: 'Auto-Save Mode',
    syncWithCloudBtn: 'Sync with Cloud (सिंक करें)',
    appearanceTitle: 'Appearance & Theme (थीम मोड)',
    appearanceDesc: 'कम रोशनी या रात के समय आंखों के आराम के लिए डार्क मोड को सक्रिय करें',
    darkModeOn: 'डार्क मोड सक्रिय (Dark Mode ON)',
    lightModeOn: 'लाइट मोड सक्रिय (Light Mode ON)',
    languageTitle: 'Language (भाषा)',
    languageDesc: 'ऐप की भाषा हिंदी या अंग्रेजी में बदलें',
    qrScannerTitle: 'QR Code Scanner (क्यूआर कोड स्कैनर)',
    qrScannerDesc: 'परिवार पहचान पत्र या डिजिटल प्रमाण पत्र का QR कोड स्कैन करें',
    openQrScannerBtn: 'कैमरा स्कैनर खोलें (Scan QR Code)',
    openPrintRosterBtn: 'Open Print Roster (डेटा प्रिंट खोलें)',
    adminControlPanel: 'Admin Control Panel (प्रबंधन)',
    adminControlDesc: 'सर्वेक्षक स्वीकृति, गाँव आवंटन एवं हटाए गए रिकॉर्ड्स का प्रबंधन करें',
    userManagementBtn: 'User & Surveyor Control (यूज़र प्रबंधन)',
    recycleBinBtn: 'रीसायकल बिन',
    aboutTitle: 'About VillagePulse',
    aboutDesc: 'VillagePulse ग्रामीण जनगणना और परिवार डेटा प्रबंधन का आधुनिक डिजिटल सिस्टम है।',
    checkUpdatesBtn: 'Check for App Updates (अपडेट जांचें)',
    logoutBtn: 'Log Out from Account (लॉग आउट)',
    logoutConfirmTitle: 'लॉग आउट',
    logoutConfirmMsg: 'क्या आप निश्चित रूप से VillagePulse से लॉग आउट करना चाहते हैं?',

    // Admin User Control
    adminUsersTitle: 'User & Surveyor Control',
    adminUsersSub: 'सर्वेक्षक अनुमोदन एवं गाँव आवंटन',
    totalUsersStat: 'कुल यूज़र',
    activeSurveyorsStat: 'सक्रिय सर्वेक्षक',
    pendingApprovalsStat: 'लंबित अनुमोदन',
    tabAll: 'सभी',
    tabPending: 'लंबित',
    tabActive: 'सक्रिय',
    searchUserPlaceholder: 'नाम, ईमेल या मोबाइल से खोजें...',
    assignVillageBtn: 'Assign Village (गाँव दें)',
    approveSurveyorBtn: 'स्वीकृत करें (Approve)',
    revokeSurveyorBtn: 'निलंबित करें (Suspend)',
    activateSurveyorBtn: 'सक्रिय करें (Activate)',
    deleteUserBtn: 'हटाएं (Delete)',

    // Families & Search Extra
    showingFamilies: 'परिवार दिखाए जा रहे हैं',
    resetFilters: 'फ़िल्टर हटाएं',
    allMohallas: 'सभी मोहल्ले',
    allCastes: 'सभी जातियां',
    noFamiliesFound: 'कोई परिवार रिकॉर्ड नहीं मिला',
    noFamiliesSub: 'फ़िल्टर बदलें या दूसरा खोज शब्द दर्ज करें',
    analyticsTitle: 'Panchayat Analytics',
    analyticsSub: 'जनसंख्या, लिंग एवं जातिगत सांख्यिकी',
    familyDetailTitle: 'परिवार विवरण',
    surveyDetails: 'सर्वेक्षण विवरण',
    headName: 'मुखिया का नाम',
    casteCategory: 'जाति श्रेणी',
    mobileNo: 'मोबाइल नंबर',
    rationCardNo: 'राशन कार्ड',
    janAadhaarNo: 'जन आधार',
    addressInfo: 'स्थान / पता',
    downloadCard: 'पहचान पत्र (ID Card)',
    editRecord: 'रिकॉर्ड सुधारें (Edit)',
    deleteRecord: 'रिकॉर्ड हटाएं (Delete)',
    confirmDeleteFamily: 'क्या आप निश्चित रूप से इस परिवार का रिकॉर्ड हटाना चाहते हैं?',
    deleteSuccess: 'रिकॉर्ड हटा दिया गया।',
    printDossier: 'प्रिंट डॉसियर',
  },

  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    update: 'Update',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    print: 'Print',
    export: 'Export',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    required: 'Required',
    all: 'All',
    select: 'Select',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    refresh: 'Refresh',
    confirm: 'Confirm',

    // Roles & Access
    surveyor: 'Surveyor',
    surveyorHi: 'Surveyor',
    superAdmin: 'Super Administrator',
    superAdminHi: 'Super Administrator',
    approvalPending: 'Approval Pending',
    approvalPendingDesc: 'Your surveyor account is awaiting Administrator approval. You will be able to access census records once approved and a village is assigned.',
    allocationPending: 'Village Allocation Pending',
    allocationPendingDesc: 'No village has been assigned to your account yet. Please contact your Panchayat Administrator.',

    // Navigation Tabs
    navHome: 'Home',
    navFamilies: 'Families',
    navNewSurvey: 'New Survey',
    navAnalytics: 'Analytics',
    navProfile: 'Profile',

    // Dashboard
    welcome: 'Hello',
    digitalFamilyRecord: 'Digital Household Records',
    allPanchayatData: 'All Panchayat Survey Records',
    censusOverview: 'Census Overview',
    totalFamilies: 'Total Families',
    population: 'Population',
    maleFemale: 'Male / Female',
    bplHouseholds: 'BPL Households',
    quickActions: 'Quick Actions',
    actionNewSurvey: 'New Survey',
    actionNewSurveySub: 'Register household',
    actionDataPrint: 'Data Print',
    actionDataPrintSub: 'PDF & dossiers',
    actionSearch: 'Search Data',
    actionSearchSub: 'Find by ID / Name',
    actionDirectory: 'Directory',
    actionDirectorySub: 'Browse all families',
    casteDistribution: 'Caste Distribution',
    recentSurveys: 'Recent Surveys',
    viewAll: 'View All',
    noSurveysYet: 'No recent surveys found',

    // Families List & Details
    familiesListTitle: 'Family Directory',
    familiesListSub: 'Panchayat Household Records',
    searchFamilyPlaceholder: 'Search by family ID, head name, father or mobile...',
    membersCount: 'Members',
    headOfFamily: 'Head of Family',
    fatherHusband: 'Father / Husband Name',
    village: 'Village',
    mohalla: 'Mohalla / Locality',
    caste: 'Caste',
    bplStatus: 'Ration Category',
    annualIncome: 'Annual Income',
    monthlyIncome: 'Monthly Income',
    mobileNumber: 'Mobile Number',
    janAadhaar: 'Jan Aadhaar Number',
    rationCard: 'Ration Card Number',
    houseNumber: 'House Number',
    familyDetails: 'Family Details',
    membersList: 'Family Members',
    memberName: 'Member Name',
    relation: 'Relation',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    education: 'Education',
    occupation: 'Occupation',
    addMember: 'Add Member',
    removeMember: 'Remove Member',

    // Survey Forms
    newSurveyTitle: 'New Household Survey',
    newSurveySub: 'Panchayat Rural Family Registration',
    editSurveyTitle: 'Edit Household Record',
    editSurveySub: 'Update Family Survey Data',
    step1: 'Basic Info',
    step2: 'Head Details',
    step3: 'Members',
    step4: 'Socio-Economic',
    saveAndContinue: 'Save & Continue',
    submitSurvey: 'Complete Survey',
    surveySubmittedSuccess: 'Household survey record saved successfully.',

    // Print & PDF
    printScreenTitle: 'Data Print & PDF Export',
    printScreenSub: 'Census Reports & Family Dossier Export',
    printFormat: 'Print Layout Format',
    dossierFormat: 'Detailed Dossier',
    tableFormat: 'Roster Table',
    filtersAndSearch: 'Filters & Search',
    selectVillage: 'Select Village',
    selectMohalla: 'Select Mohalla',
    selectCaste: 'Select Caste',
    searchPrintPlaceholder: 'e.g. FAM-0001, Mohan Lal, mobile...',
    selectFamiliesToPrint: 'Select Families to Print (Tap to Select/Deselect)',
    selectedCountBadge: 'Selected',
    totalPopulationPrint: 'Total Population',
    generatePdfBtn: 'Print / Export PDF',
    generatingPdf: 'Preparing PDF document...',
    noFamiliesSelectedTitle: 'No Families Selected',
    noFamiliesSelectedMsg: 'Please select at least 1 family to generate a print document.',
    printErrorTitle: 'Print Error',

    // Auth Screens
    loginTitle: 'Surveyor & Admin Login',
    loginSub: 'Sign in with your official account',
    officialEmail: 'Official Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    loginBtn: 'Sign In to Dashboard',
    dontHaveAccount: "Don't have an account?",
    registerHere: 'Register here',
    registerTitle: 'New Surveyor Registration',
    registerSub: 'Panchayat Field Surveyor Account',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    registerSubmitBtn: 'Submit Registration Request',
    alreadyHaveAccount: 'Already registered? Sign in',
    forgotTitle: 'Forgot Password',
    forgotSub: 'Receive password reset link by email',
    sendResetLinkBtn: 'Send Password Reset Link',
    resetLinkSentTitle: 'Reset Link Sent',
    resetLinkSentMsg: 'A password reset link has been dispatched to your official email. Please check your inbox and spam folders.',
    backToLogin: 'Back to Login',

    // Profile Screen
    profileTitle: 'Surveyor Profile',
    assignedVillages: 'Assigned Villages',
    allAccessBadge: 'All Villages (All Access)',
    unassignedBadge: 'Allocation Pending',
    dataAndSync: 'Data & Sync Status',
    firestoreBackend: 'Firestore Backend',
    loadedRecords: 'Loaded Family Records',
    autoSaveMode: 'Auto-Save Mode',
    syncWithCloudBtn: 'Sync with Cloud',
    appearanceTitle: 'Appearance & Theme',
    appearanceDesc: 'Enable dark mode for better comfort in low light conditions',
    darkModeOn: 'Dark Mode Active',
    lightModeOn: 'Light Mode Active',
    languageTitle: 'Language Selection',
    languageDesc: 'Choose your preferred language for the application',
    qrScannerTitle: 'QR Code Scanner',
    qrScannerDesc: 'Scan digital household identity card or certificate QR codes',
    openQrScannerBtn: 'Open QR Scanner',
    openPrintRosterBtn: 'Open Print & Export',
    adminControlPanel: 'Admin Control Panel',
    adminControlDesc: 'Manage surveyor accounts, allocate villages, and handle records',
    userManagementBtn: 'User & Surveyor Management',
    recycleBinBtn: 'Recycle Bin',
    aboutTitle: 'About VillagePulse',
    aboutDesc: 'VillagePulse is a modern rural census and household intelligence system designed for Indian Panchayats.',
    checkUpdatesBtn: 'Check for App Updates',
    logoutBtn: 'Sign Out from Account',
    logoutConfirmTitle: 'Sign Out',
    logoutConfirmMsg: 'Are you sure you want to log out of VillagePulse?',

    // Admin User Control
    adminUsersTitle: 'User & Surveyor Control',
    adminUsersSub: 'Surveyor approvals and village allocation',
    totalUsersStat: 'Total Users',
    activeSurveyorsStat: 'Active Surveyors',
    pendingApprovalsStat: 'Pending Approvals',
    tabAll: 'All',
    tabPending: 'Pending',
    tabActive: 'Active',
    searchUserPlaceholder: 'Search by name, email or mobile...',
    assignVillageBtn: 'Assign Village',
    approveSurveyorBtn: 'Approve',
    revokeSurveyorBtn: 'Suspend',
    activateSurveyorBtn: 'Activate',
    deleteUserBtn: 'Delete',

    // Families & Search Extra
    showingFamilies: 'Families Showing',
    resetFilters: 'Reset Filters',
    allMohallas: 'All Mohallas',
    allCastes: 'All Castes',
    noFamiliesFound: 'No family records found',
    noFamiliesSub: 'Change filters or try a different search keyword',
    analyticsTitle: 'Panchayat Analytics',
    analyticsSub: 'Demographics, gender and caste analytics',
    familyDetailTitle: 'Family Details',
    surveyDetails: 'Survey Details',
    headName: 'Head of Family',
    casteCategory: 'Caste Category',
    mobileNo: 'Mobile Number',
    rationCardNo: 'Ration Card',
    janAadhaarNo: 'Jan Aadhaar',
    addressInfo: 'Address & Location',
    downloadCard: 'ID Card',
    editRecord: 'Edit Record',
    deleteRecord: 'Delete Record',
    confirmDeleteFamily: 'Are you sure you want to delete this family record?',
    deleteSuccess: 'Record deleted successfully.',
    printDossier: 'Print Dossier',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('hi'); // default 'hi'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
        if (saved === 'en' || saved === 'hi') {
          setLanguageState(saved);
        }
      } catch (e) {
        console.log('Error reading language preference:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggleLanguage = async () => {
    try {
      const next = language === 'hi' ? 'en' : 'hi';
      setLanguageState(next);
      await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, next);
    } catch (e) {
      console.log('Error saving language preference:', e);
    }
  };

  const setLanguage = async (lang) => {
    if (lang !== 'hi' && lang !== 'en') return;
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    } catch (e) {
      console.log('Error setting language:', e);
    }
  };

  // Translation helper: t('navHome', 'Home')
  const t = (key, fallback = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key] !== undefined) return dict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict[key] !== undefined) return enDict[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi: language === 'hi',
        isEnglish: language === 'en',
        toggleLanguage,
        setLanguage,
        t,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
