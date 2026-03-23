export type Language = 'en' | 'hi' | 'mr';

export const translations = {
  en: {
    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    soilReport: 'Soil Report',
    crops: 'Crops',
    calendar: 'Calendar',
    community: 'Community',
    news: 'News',
    profile: 'Profile',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    
    // Hero
    heroTitle: 'AI-Powered Smart Agriculture',
    heroSubtitle: 'Get personalized crop recommendations, fertilizer plans, and farming insights based on your soil analysis',
    uploadSoilReport: 'Upload Soil Report',
    viewCalendar: 'View Crop Calendar',
    
    // Features
    features: 'Features',
    ocrAnalysis: 'OCR Soil Analysis',
    ocrDesc: 'Upload soil reports and extract data automatically',
    cropRecommendations: 'Crop Recommendations',
    cropDesc: 'AI-powered crop suggestions based on soil data',
    fertilizerPlanner: 'Fertilizer Planner',
    fertilizerDesc: 'Optimized fertilizer schedules for your crops',
    smartCalendar: 'Smart Calendar',
    calendarDesc: 'Plan your farming activities with reminders',
    farmerCommunity: 'Farmer Community',
    communityDesc: 'Connect and share with other farmers',
    dailyNews: 'Daily News',
    newsDesc: 'Stay updated with agriculture news',
    
    // Soil Report
    dragDropHere: 'Drag & drop your soil report here',
    orBrowse: 'or browse files',
    supportedFormats: 'Supports PDF, JPG, PNG images',
    captureCamera: 'Capture from Camera',
    runOcr: 'Run OCR & Analyze',
    analyzing: 'Analyzing...',
    soilParameters: 'Soil Parameters',
    getRecommendations: 'Get Recommendations',
    
    // Soil Parameters
    ph: 'pH Level',
    nitrogen: 'Nitrogen (N)',
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
    organicCarbon: 'Organic Carbon',
    electricalConductivity: 'EC (dS/m)',
    moisture: 'Moisture (%)',
    texture: 'Soil Texture',
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    rainfall: 'Rainfall (mm)',
    
    // Recommendations
    topCrops: 'Top Recommended Crops',
    matchScore: 'Match Score',
    soilCompatibility: 'Soil Compatibility',
    seasonSuitability: 'Season Suitability',
    waterNeeds: 'Water Requirements',
    addToCalendar: 'Add to Calendar',
    viewDetails: 'View Details',
    
    // Fertilizer
    fertilizerPlan: 'Fertilizer Plan',
    stage: 'Growth Stage',
    fertilizerType: 'Fertilizer Type',
    amount: 'Amount',
    method: 'Application Method',
    timing: 'Timing',
    exportCsv: 'Export CSV',
    exportPdf: 'Export PDF',
    
    // Calendar
    cropCalendar: 'Crop Calendar',
    addCrop: 'Add Crop',
    sowing: 'Sowing',
    fertilizing: 'Fertilizing',
    irrigation: 'Irrigation',
    harvest: 'Harvest',
    
    // Community
    createPost: 'Create Post',
    whatsHappening: "What's happening on your farm?",
    post: 'Post',
    like: 'Like',
    comment: 'Comment',
    share: 'Share',
    
    // Profile
    editProfile: 'Edit Profile',
    myPosts: 'My Posts',
    settings: 'Settings',
    language: 'Language',
    accountType: 'Account Type',
    farmer: 'Farmer',
    agribusiness: 'Agribusiness',
    student: 'Student',
    agronomist: 'Agronomist',
    
    // Auth
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    phoneNumber: 'Phone Number',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    sendOtp: 'Send OTP',
    verifyOtp: 'Verify OTP',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    noData: 'No data available',
    success: 'Success',
    error: 'Error',
    loginRequired: 'Login Required',
  },
  hi: {
    // Navigation
    home: 'होम',
    soilReport: 'मिट्टी रिपोर्ट',
    crops: 'फसलें',
    calendar: 'कैलेंडर',
    community: 'समुदाय',
    news: 'समाचार',
    profile: 'प्रोफ़ाइल',
    login: 'लॉगिन',
    signup: 'साइन अप',
    logout: 'लॉगआउट',
    
    // Hero
    heroTitle: 'AI-संचालित स्मार्ट कृषि',
    heroSubtitle: 'अपने मिट्टी विश्लेषण के आधार पर व्यक्तिगत फसल सिफारिशें, उर्वरक योजनाएं और खेती की अंतर्दृष्टि प्राप्त करें',
    uploadSoilReport: 'मिट्टी रिपोर्ट अपलोड करें',
    viewCalendar: 'फसल कैलेंडर देखें',
    
    // Features
    features: 'विशेषताएं',
    ocrAnalysis: 'OCR मिट्टी विश्लेषण',
    ocrDesc: 'मिट्टी रिपोर्ट अपलोड करें और स्वचालित रूप से डेटा निकालें',
    cropRecommendations: 'फसल सिफारिशें',
    cropDesc: 'मिट्टी डेटा पर आधारित AI-संचालित फसल सुझाव',
    fertilizerPlanner: 'उर्वरक योजनाकार',
    fertilizerDesc: 'आपकी फसलों के लिए अनुकूलित उर्वरक अनुसूचियां',
    smartCalendar: 'स्मार्ट कैलेंडर',
    calendarDesc: 'रिमाइंडर के साथ अपनी खेती गतिविधियों की योजना बनाएं',
    farmerCommunity: 'किसान समुदाय',
    communityDesc: 'अन्य किसानों से जुड़ें और साझा करें',
    dailyNews: 'दैनिक समाचार',
    newsDesc: 'कृषि समाचार से अपडेट रहें',
    
    // Soil Report
    dragDropHere: 'अपनी मिट्टी रिपोर्ट यहां खींचें और छोड़ें',
    orBrowse: 'या फ़ाइलें ब्राउज़ करें',
    supportedFormats: 'PDF, JPG, PNG छवियों का समर्थन करता है',
    captureCamera: 'कैमरे से कैप्चर करें',
    runOcr: 'OCR चलाएं और विश्लेषण करें',
    analyzing: 'विश्लेषण हो रहा है...',
    soilParameters: 'मिट्टी पैरामीटर',
    getRecommendations: 'सिफारिशें प्राप्त करें',
    
    // Soil Parameters
    ph: 'pH स्तर',
    nitrogen: 'नाइट्रोजन (N)',
    phosphorus: 'फॉस्फोरस (P)',
    potassium: 'पोटैशियम (K)',
    organicCarbon: 'जैविक कार्बन',
    electricalConductivity: 'EC (dS/m)',
    moisture: 'नमी (%)',
    texture: 'मिट्टी बनावट',
    temperature: 'तापमान (°C)',
    humidity: 'आर्द्रता (%)',
    rainfall: 'वर्षा (mm)',
    
    // Recommendations
    topCrops: 'शीर्ष अनुशंसित फसलें',
    matchScore: 'मैच स्कोर',
    soilCompatibility: 'मिट्टी अनुकूलता',
    seasonSuitability: 'मौसम उपयुक्तता',
    waterNeeds: 'पानी की आवश्यकताएं',
    addToCalendar: 'कैलेंडर में जोड़ें',
    viewDetails: 'विवरण देखें',
    
    // Fertilizer
    fertilizerPlan: 'उर्वरक योजना',
    stage: 'विकास चरण',
    fertilizerType: 'उर्वरक प्रकार',
    amount: 'मात्रा',
    method: 'आवेदन विधि',
    timing: 'समय',
    exportCsv: 'CSV निर्यात करें',
    exportPdf: 'PDF निर्यात करें',
    
    // Calendar
    cropCalendar: 'फसल कैलेंडर',
    addCrop: 'फसल जोड़ें',
    sowing: 'बुवाई',
    fertilizing: 'उर्वरक',
    irrigation: 'सिंचाई',
    harvest: 'कटाई',
    
    // Community
    createPost: 'पोस्ट बनाएं',
    whatsHappening: 'आपके खेत में क्या हो रहा है?',
    post: 'पोस्ट',
    like: 'पसंद',
    comment: 'टिप्पणी',
    share: 'शेयर',
    
    // Profile
    editProfile: 'प्रोफ़ाइल संपादित करें',
    myPosts: 'मेरी पोस्ट',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    accountType: 'खाता प्रकार',
    farmer: 'किसान',
    agribusiness: 'कृषि व्यवसाय',
    student: 'छात्र',
    agronomist: 'कृषि विज्ञानी',
    
    // Auth
    welcomeBack: 'वापसी पर स्वागत है',
    createAccount: 'खाता बनाएं',
    phoneNumber: 'फोन नंबर',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    sendOtp: 'OTP भेजें',
    verifyOtp: 'OTP सत्यापित करें',
    
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    loading: 'लोड हो रहा है...',
    noData: 'कोई डेटा उपलब्ध नहीं',
    success: 'सफलता',
    error: 'त्रुटि',
    loginRequired: 'लॉगिन आवश्यक',
  },
  mr: {
    // Navigation
    home: 'होम',
    soilReport: 'माती अहवाल',
    crops: 'पिके',
    calendar: 'कॅलेंडर',
    community: 'समुदाय',
    news: 'बातम्या',
    profile: 'प्रोफाइल',
    login: 'लॉगिन',
    signup: 'साइन अप',
    logout: 'लॉगआउट',
    
    // Hero
    heroTitle: 'AI-संचालित स्मार्ट शेती',
    heroSubtitle: 'तुमच्या माती विश्लेषणावर आधारित वैयक्तिक पीक शिफारसी, खत योजना आणि शेती अंतर्दृष्टी मिळवा',
    uploadSoilReport: 'माती अहवाल अपलोड करा',
    viewCalendar: 'पीक कॅलेंडर पहा',
    
    // Features
    features: 'वैशिष्ट्ये',
    ocrAnalysis: 'OCR माती विश्लेषण',
    ocrDesc: 'माती अहवाल अपलोड करा आणि स्वयंचलितपणे डेटा काढा',
    cropRecommendations: 'पीक शिफारसी',
    cropDesc: 'माती डेटावर आधारित AI-संचालित पीक सूचना',
    fertilizerPlanner: 'खत नियोजक',
    fertilizerDesc: 'तुमच्या पिकांसाठी अनुकूलित खत वेळापत्रक',
    smartCalendar: 'स्मार्ट कॅलेंडर',
    calendarDesc: 'स्मरणपत्रांसह तुमच्या शेती क्रियाकलापांचे नियोजन करा',
    farmerCommunity: 'शेतकरी समुदाय',
    communityDesc: 'इतर शेतकऱ्यांशी जोडा आणि शेअर करा',
    dailyNews: 'दैनिक बातम्या',
    newsDesc: 'कृषी बातम्यांसह अपडेट रहा',
    
    // Soil Report
    dragDropHere: 'तुमचा माती अहवाल येथे ड्रॅग आणि ड्रॉप करा',
    orBrowse: 'किंवा फाइल्स ब्राउझ करा',
    supportedFormats: 'PDF, JPG, PNG प्रतिमांना समर्थन देते',
    captureCamera: 'कॅमेऱ्यातून कॅप्चर करा',
    runOcr: 'OCR चालवा आणि विश्लेषण करा',
    analyzing: 'विश्लेषण होत आहे...',
    soilParameters: 'माती मापदंड',
    getRecommendations: 'शिफारसी मिळवा',
    
    // Soil Parameters
    ph: 'pH पातळी',
    nitrogen: 'नायट्रोजन (N)',
    phosphorus: 'फॉस्फरस (P)',
    potassium: 'पोटॅशियम (K)',
    organicCarbon: 'सेंद्रिय कार्बन',
    electricalConductivity: 'EC (dS/m)',
    moisture: 'ओलावा (%)',
    texture: 'माती पोत',
    temperature: 'तापमान (°C)',
    humidity: 'आर्द्रता (%)',
    rainfall: 'पाऊस (mm)',
    
    // Recommendations
    topCrops: 'शीर्ष शिफारस केलेली पिके',
    matchScore: 'जुळणी स्कोअर',
    soilCompatibility: 'माती अनुकूलता',
    seasonSuitability: 'हंगाम योग्यता',
    waterNeeds: 'पाण्याची आवश्यकता',
    addToCalendar: 'कॅलेंडरमध्ये जोडा',
    viewDetails: 'तपशील पहा',
    
    // Fertilizer
    fertilizerPlan: 'खत योजना',
    stage: 'वाढीचा टप्पा',
    fertilizerType: 'खत प्रकार',
    amount: 'प्रमाण',
    method: 'वापर पद्धत',
    timing: 'वेळ',
    exportCsv: 'CSV निर्यात करा',
    exportPdf: 'PDF निर्यात करा',
    
    // Calendar
    cropCalendar: 'पीक कॅलेंडर',
    addCrop: 'पीक जोडा',
    sowing: 'पेरणी',
    fertilizing: 'खत',
    irrigation: 'सिंचन',
    harvest: 'कापणी',
    
    // Community
    createPost: 'पोस्ट तयार करा',
    whatsHappening: 'तुमच्या शेतात काय चालू आहे?',
    post: 'पोस्ट',
    like: 'आवडले',
    comment: 'टिप्पणी',
    share: 'शेअर',
    
    // Profile
    editProfile: 'प्रोफाइल संपादित करा',
    myPosts: 'माझ्या पोस्ट',
    settings: 'सेटिंग्ज',
    language: 'भाषा',
    accountType: 'खाते प्रकार',
    farmer: 'शेतकरी',
    agribusiness: 'कृषी व्यवसाय',
    student: 'विद्यार्थी',
    agronomist: 'कृषी शास्त्रज्ञ',
    
    // Auth
    welcomeBack: 'परत स्वागत आहे',
    createAccount: 'खाते तयार करा',
    phoneNumber: 'फोन नंबर',
    username: 'वापरकर्ता नाव',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड पुष्टी करा',
    sendOtp: 'OTP पाठवा',
    verifyOtp: 'OTP सत्यापित करा',
    
    // Common
    save: 'सेव्ह करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    loading: 'लोड होत आहे...',
    noData: 'कोणताही डेटा उपलब्ध नाही',
    success: 'यश',
    error: 'त्रुटी',
    loginRequired: 'लॉगिन आवश्यक',
  },
};

export type TranslationKey = keyof typeof translations.en;

export const getTranslation = (lang: Language, key: TranslationKey): string => {
  return translations[lang]?.[key] || translations.en[key] || key;
};
