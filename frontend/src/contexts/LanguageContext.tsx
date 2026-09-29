import React, { createContext, useContext, useState } from 'react';

export type LanguageCode =
  | 'en-IN' // English (India)
  | 'hi'    // Hindi (हिन्दी)
  | 'bn'    // Bengali (বাংলা)
  | 'ta'    // Tamil (தமிழ்)
  | 'te'    // Telugu (తెలుగు)
  | 'mr'    // Marathi (मराठी)
  | 'gu'    // Gujarati (ગુજરાતી)
  | 'kn'    // Kannada (ಕನ್ನಡ)
  | 'ml'    // Malayalam (മലയാളം)
  | 'pa';   // Punjabi (ਪੰਜਾਬੀ)

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', name: 'English (India)', nativeName: '' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  'en-IN': {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.scanner': 'Food Scanner',
    'nav.recommendations': 'Recommendations',
    'nav.aiAssistant': 'AI Assistant',
    'nav.reports': 'Health Reports',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign Out',
    'nav.account': 'Account',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account settings and preferences.',
    'settings.tab.account': 'Account',
    'settings.tab.preferences': 'Preferences',
    'settings.tab.notifications': 'Notifications',
    'settings.tab.security': 'Security',
    'settings.appPreferences': 'App Preferences',
    'settings.appPreferencesDesc': 'Customize your Cura+ experience.',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDesc': 'Toggle dark appearance across the application.',
    'settings.language': 'Language',
    'settings.languageDesc': 'Select your preferred Indian language.',
    'settings.saveChanges': 'Save Changes',
    'settings.saving': 'Saving...',
    'settings.notificationsPref': 'Notification Preferences',
    'settings.notificationsDesc': 'Choose what alerts you want to receive.',
    'settings.savePreferences': 'Save Preferences',
    'settings.securityTitle': 'Security',
    'settings.securityDesc': 'Manage your password and security settings.',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmPassword': 'Confirm New Password',
    'settings.updatePassword': 'Update Password',

    // Recommendations
    'rec.title': 'Recommended For You',
    'rec.subtitle': 'Personalized Indian nutrition based on your health profile, dietary preferences, and allergies.',
    'rec.all': 'All',
    'rec.breakfast': 'Breakfast',
    'rec.lunch': 'Lunch',
    'rec.dinner': 'Dinner',
    'rec.snack': 'Snack',
    'rec.aiSuggest': 'AI Suggest',
    'rec.searchPlaceholder': 'Search food, ingredients, tags...',
    'rec.logMeal': 'Log Meal',
    'rec.logged': 'Logged',
    'rec.calories': 'Calories',
    'rec.protein': 'Protein',
    'rec.carbs': 'Carbs',
    'rec.fat': 'Fat',
    'rec.match': 'Match',

    // Dashboard
    'dash.welcome': 'Welcome back',
    'dash.subtitle': 'Here is your daily personalized health and nutrition summary.',
    'dash.calorieTarget': 'Calorie Target',
    'dash.protein': 'Protein',
    'dash.carbs': 'Carbohydrates',
    'dash.fat': 'Fat',
    'dash.quickActions': 'Quick Actions',
    'dash.scanFood': 'Scan Food',
    'dash.viewRecs': 'View Recommendations',
    'dash.askAi': 'Ask AI Assistant',
  },

  'hi': {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.scanner': 'फ़ूड स्कैनर',
    'nav.recommendations': 'आहार सुझाव',
    'nav.aiAssistant': 'एआई सहायक',
    'nav.reports': 'स्वास्थ्य रिपोर्ट्स',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.settings': 'सेटिंग्स',
    'nav.signOut': 'साइन आउट',
    'nav.account': 'खाता',

    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपनी खाता सेटिंग्स और प्राथमिकताओं का प्रबंधन करें।',
    'settings.tab.account': 'खाता',
    'settings.tab.preferences': 'प्राथमिकताएं',
    'settings.tab.notifications': 'सूचनाएं',
    'settings.tab.security': 'सुरक्षा',
    'settings.appPreferences': 'ऐप प्राथमिकताएं',
    'settings.appPreferencesDesc': 'अपने Cura+ अनुभव को अनुकूलित करें।',
    'settings.darkMode': 'डार्क मोड',
    'settings.darkModeDesc': 'डार्क और लाइट थीम के बीच स्विच करें।',
    'settings.language': 'भाषा',
    'settings.languageDesc': 'अपनी पसंदीदा भारतीय भाषा चुनें।',
    'settings.saveChanges': 'बदलाव सहेजें',
    'settings.saving': 'सहेजा जा रहा है...',
    'settings.notificationsPref': 'सूचना प्राथमिकताएं',
    'settings.notificationsDesc': 'चुनें कि आप कौन से अलर्ट प्राप्त करना चाहते हैं।',
    'settings.savePreferences': 'प्राथमिकताएं सहेजें',
    'settings.securityTitle': 'सुरक्षा',
    'settings.securityDesc': 'अपना पासवर्ड और सुरक्षा सेटिंग्स प्रबंधित करें।',
    'settings.currentPassword': 'वर्तमान पासवर्ड',
    'settings.newPassword': 'नया पासवर्ड',
    'settings.confirmPassword': 'नए पासवर्ड की पुष्टि करें',
    'settings.updatePassword': 'पासवर्ड अपडेट करें',

    // Recommendations
    'rec.title': 'आपके लिए अनुशंसित आहार',
    'rec.subtitle': 'आपके स्वास्थ्य प्रोफाइल, एलर्जी और प्राथमिकताओं पर आधारित व्यक्तिगत भारतीय पोषण।',
    'rec.all': 'सभी',
    'rec.breakfast': 'नाश्ता',
    'rec.lunch': 'दोपहर का भोजन',
    'rec.dinner': 'रात का भोजन',
    'rec.snack': 'स्नैक',
    'rec.aiSuggest': 'एआई सुझाव',
    'rec.searchPlaceholder': 'भोजन, सामग्री, टैग खोजें...',
    'rec.logMeal': 'भोजन दर्ज करें',
    'rec.logged': 'दर्ज किया गया',
    'rec.calories': 'कैलोरी',
    'rec.protein': 'प्रोटीन',
    'rec.carbs': 'कार्ब्स',
    'rec.fat': 'फैट',
    'rec.match': 'मैच',

    // Dashboard
    'dash.welcome': 'वापसी पर स्वागत है',
    'dash.subtitle': 'यहाँ आपका दैनिक स्वास्थ्य और पोषण सारांश है।',
    'dash.calorieTarget': 'कैलोरी लक्ष्य',
    'dash.protein': 'प्रोटीन',
    'dash.carbs': 'कार्बोहाइड्रेट',
    'dash.fat': 'फैट',
    'dash.quickActions': 'त्वरित क्रियाएँ',
    'dash.scanFood': 'भोजन स्कैन करें',
    'dash.viewRecs': 'आहार सुझाव देखें',
    'dash.askAi': 'एआई से पूछें',
  },

  'bn': {
    // Navigation
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.scanner': 'ফুড স্ক্যানার',
    'nav.recommendations': 'খাদ্য সুপারিশ',
    'nav.aiAssistant': 'এআই সহকারী',
    'nav.reports': 'স্বাস্থ্য রিপোর্ট',
    'nav.profile': 'প্রোফাইল',
    'nav.settings': 'সেটিংস',
    'nav.signOut': 'সাইন আউট',
    'nav.account': 'অ্যাকাউন্ট',

    // Settings
    'settings.title': 'সেটিংস',
    'settings.subtitle': 'আপনার অ্যাকাউন্টের বিবরণ এবং পছন্দসমূহ পরিচালনা করুন।',
    'settings.tab.account': 'অ্যাকাউন্ট',
    'settings.tab.preferences': 'পছন্দসমূহ',
    'settings.tab.notifications': 'বিজ্ঞপ্তি',
    'settings.tab.security': 'নিরাপত্তা',
    'settings.appPreferences': 'অ্যাপ পছন্দসমূহ',
    'settings.appPreferencesDesc': 'আপনার Cura+ অভিজ্ঞতা কাস্টমাইজ করুন।',
    'settings.darkMode': 'ডার্ক মোড',
    'settings.darkModeDesc': 'ডার্ক ও লাইট থিমের মধ্যে পরিবর্তন করুন।',
    'settings.language': 'ভাষা',
    'settings.languageDesc': 'আপনার পছন্দের ভারতীয় ভাষা নির্বাচন করুন।',
    'settings.saveChanges': 'সংরক্ষণ করুন',
    'settings.saving': 'সংরক্ষণ করা হচ্ছে...',
    'settings.notificationsPref': 'বিজ্ঞপ্তি সেটিংস',
    'settings.notificationsDesc': 'আপনি কী ধরণের অ্যালার্ট পেতে চান তা বেছে নিন।',
    'settings.savePreferences': 'পছন্দ সংরক্ষণ করুন',
    'settings.securityTitle': 'নিরাপত্তা',
    'settings.securityDesc': 'পাসওয়ার্ড এবং নিরাপত্তা সেটিংস পরিচালনা করুন।',
    'settings.currentPassword': 'বর্তমান পাসওয়ার্ড',
    'settings.newPassword': 'নতুন পাসওয়ার্ড',
    'settings.confirmPassword': 'নতুন পাসওয়ার্ড নিশ্চিত করুন',
    'settings.updatePassword': 'পাসওয়ার্ড পরিবর্তন করুন',

    // Recommendations
    'rec.title': 'আপনার জন্য প্রস্তাবিত খাবার',
    'rec.subtitle': 'আপনার স্বাস্থ্য প্রোফাইল, অ্যালার্জি এবং খাদ্যাভ্যাসের উপর ভিত্তি করে তৈরি ভারতীয় পুষ্টি তালিকা।',
    'rec.all': 'সমস্ত',
    'rec.breakfast': 'প্রাতরাশ',
    'rec.lunch': 'দুপুরের খাবার',
    'rec.dinner': 'রাতের খাবার',
    'rec.snack': 'জলখাবার',
    'rec.aiSuggest': 'এআই পরামর্শ',
    'rec.searchPlaceholder': 'খাবার, উপকরণ খুঁজুন...',
    'rec.logMeal': 'খাবার যুক্ত করুন',
    'rec.logged': 'যুক্ত হয়েছে',
    'rec.calories': 'ক্যালোরি',
    'rec.protein': 'প্রোটিন',
    'rec.carbs': 'কার্বস',
    'rec.fat': 'ফ্যাট',
    'rec.match': 'ম্যাচ',

    // Dashboard
    'dash.welcome': 'স্বাগতম',
    'dash.subtitle': 'এখানে আপনার দৈনিক পুষ্টি ও স্বাস্থ্যের সামগ্রিক বিবরণ।',
    'dash.calorieTarget': 'ক্যালোরি লক্ষ্য',
    'dash.protein': 'প্রোটিন',
    'dash.carbs': 'কার্বোহাইড্রেট',
    'dash.fat': 'ফ্যাট',
    'dash.quickActions': 'দ্রুত অ্যাকশন',
    'dash.scanFood': 'খাবার স্ক্যান করুন',
    'dash.viewRecs': 'সুপারিশ দেখুন',
    'dash.askAi': 'এআই কে জিজ্ঞাসা করুন',
  },

  'ta': {
    // Navigation
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.scanner': 'உணவு ஸ்கேனர்',
    'nav.recommendations': 'உணவு பரிந்துரைகள்',
    'nav.aiAssistant': 'AI உதவியாளர்',
    'nav.reports': 'சுகாதார அறிக்கைகள்',
    'nav.profile': 'சுயவிவரம்',
    'nav.settings': 'அமைப்புகள்',
    'nav.signOut': 'வெளியேறு',
    'nav.account': 'கணக்கு',

    // Settings
    'settings.title': 'அமைப்புகள்',
    'settings.subtitle': 'உங்கள் கணக்கு அமைப்புகள் மற்றும் விருப்பங்களை நிர்வகிக்கவும்.',
    'settings.tab.account': 'கணக்கு',
    'settings.tab.preferences': 'விருப்பத்தேர்வுகள்',
    'settings.tab.notifications': 'அறிவிப்புகள்',
    'settings.tab.security': 'பாதுகாப்பு',
    'settings.appPreferences': 'பயன்பாட்டு விருப்பங்கள்',
    'settings.appPreferencesDesc': 'உங்கள் Cura+ அனுபவத்தை தனிப்பயனாக்குங்கள்.',
    'settings.darkMode': 'டார்க் பயன்முறை',
    'settings.darkModeDesc': 'டார்க் அல்லது லைட் தோற்றத்திற்கு மாறவும்.',
    'settings.language': 'மொழி',
    'settings.languageDesc': 'உங்கள் விருப்பமான இந்திய மொழியைத் தேர்ந்தெடுக்கவும்.',
    'settings.saveChanges': 'மாற்றங்களைச் சேமிக்கவும்',
    'settings.saving': 'சேமிக்கப்படுகிறது...',
    'settings.notificationsPref': 'அறிவிப்பு விருப்பத்தேர்வுகள்',
    'settings.notificationsDesc': 'நீங்கள் பெற விரும்பும் விழிப்பூட்டல்களைத் தேர்ந்தெடுக்கவும்.',
    'settings.savePreferences': 'விருப்பங்களைச் சேமிக்கவும்',
    'settings.securityTitle': 'பாதுகாப்பு',
    'settings.securityDesc': 'உங்கள் கடவுச்சொல் மற்றும் பாதுகாப்பு அமைப்புகளை நிர்வகிக்கவும்.',
    'settings.currentPassword': 'தற்போதைய கடவுச்சொல்',
    'settings.newPassword': 'புதிய கடவுச்சொல்',
    'settings.confirmPassword': 'புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    'settings.updatePassword': 'கடவுச்சொல்லைப் புதுப்பிக்கவும்',

    // Recommendations
    'rec.title': 'உங்களுக்காக பரிந்துரைக்கப்பட்டவை',
    'rec.subtitle': 'உங்கள் சுகாதார சுயவிவரம் மற்றும் உணவு விருப்பங்களின் அடிப்படையிலான ஊட்டச்சத்து.',
    'rec.all': 'அனைத்தும்',
    'rec.breakfast': 'காலை உணவு',
    'rec.lunch': 'மதிய உணவு',
    'rec.dinner': 'இரவு உணவு',
    'rec.snack': 'சிற்றுண்டி',
    'rec.aiSuggest': 'AI பரிந்துரை',
    'rec.searchPlaceholder': 'உணவைத் தேடுங்கள்...',
    'rec.logMeal': 'உணவைப் பதிவுசெய்க',
    'rec.logged': 'பதிவுசெய்யப்பட்டது',
    'rec.calories': 'கலோரிகள்',
    'rec.protein': 'புரதம்',
    'rec.carbs': 'கார்போஹைட்ரேட்',
    'rec.fat': 'கொழுப்பு',
    'rec.match': 'பொருத்தம்',

    // Dashboard
    'dash.welcome': 'மீண்டும் வருக',
    'dash.subtitle': 'உங்கள் தினசரி தனிப்பயனாக்கப்பட்ட சுகாதார சுருக்கம் இங்கே.',
    'dash.calorieTarget': 'கலோரி இலக்கு',
    'dash.protein': 'புரதம்',
    'dash.carbs': 'கார்போஹைட்ரேட்',
    'dash.fat': 'கொழுப்பு',
    'dash.quickActions': 'விரைவு செயல்கள்',
    'dash.scanFood': 'உணவை ஸ்கேன் செய்',
    'dash.viewRecs': 'பரிந்துரைகளைக் காண்க',
    'dash.askAi': 'AI இடம் கேட்கவும்',
  },

  'te': {
    // Navigation
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.scanner': 'ఫుడ్ స్కానర్',
    'nav.recommendations': 'ఆహార సిఫార్సులు',
    'nav.aiAssistant': 'AI సహాయకుడు',
    'nav.reports': 'ఆరోగ్య నివేదికలు',
    'nav.profile': 'ప్రొఫైల్',
    'nav.settings': 'సెట్టింగ్‌లు',
    'nav.signOut': 'సైన్ అవుట్',
    'nav.account': 'ఖాతా',

    // Settings
    'settings.title': 'సెట్టింగ్‌లు',
    'settings.subtitle': 'మీ ఖాతా సెట్టింగ్‌లు మరియు ప్రాధాన్యతలను నిర్వహించండి.',
    'settings.tab.account': 'ఖాతా',
    'settings.tab.preferences': 'ప్రాధాన్యతలు',
    'settings.tab.notifications': 'నోటిఫికేషన్‌లు',
    'settings.tab.security': 'భద్రత',
    'settings.appPreferences': 'యాప్ ప్రాధాన్యతలు',
    'settings.appPreferencesDesc': 'మీ Cura+ అనుభవాన్ని అనుకూలీకరించండి.',
    'settings.darkMode': 'డార్క్ మోడ్',
    'settings.darkModeDesc': 'డార్క్ మరియు లైట్ థీమ్‌లను మార్చండి.',
    'settings.language': 'భాష',
    'settings.languageDesc': 'మీకు ఇష్టమైన భారతీయ భాషను ఎంచుకోండి.',
    'settings.saveChanges': 'మార్పులను సేవ్ చేయండి',
    'settings.saving': 'సేవ్ అవుతోంది...',
    'settings.notificationsPref': 'నోటిఫికేషన్ ప్రాధాన్యతలు',
    'settings.notificationsDesc': 'మీరు ఏ హెచ్చరికలను అందుకోవాలనుకుంటున్నారో ఎంచుకోండి.',
    'settings.savePreferences': 'ప్రాధాన్యతలను సేవ్ చేయండి',
    'settings.securityTitle': 'భద్రత',
    'settings.securityDesc': 'మీ పాస్‌వర్డ్ మరియు భద్రతా సెట్టింగ్‌లను నిర్వహించండి.',
    'settings.currentPassword': 'ప్రస్తుత పాస్‌వర్డ్',
    'settings.newPassword': 'కొత్త పాస్‌వర్డ్',
    'settings.confirmPassword': 'కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి',
    'settings.updatePassword': 'పాస్‌వర్డ్‌ను అప్‌డేట్ చేయండి',

    // Recommendations
    'rec.title': 'మీ కోసం సిఫార్సు చేసినవి',
    'rec.subtitle': 'మీ ఆరోగ్య ప్రొఫైల్ ఆధారంగా రూపొందించిన భారతీయ పోషకాహారం.',
    'rec.all': 'అన్నీ',
    'rec.breakfast': 'అల్పాహారం',
    'rec.lunch': 'మధ్యాహ్న భోజనం',
    'rec.dinner': 'రాత్రి భోజనం',
    'rec.snack': 'స్నాక్',
    'rec.aiSuggest': 'AI సూచన',
    'rec.searchPlaceholder': 'ఆహారం లేదా పదార్ధాలను వెతకండి...',
    'rec.logMeal': 'భోజనాన్ని నమోదు చేయండి',
    'rec.logged': 'నమోదు చేయబడింది',
    'rec.calories': 'కేలరీలు',
    'rec.protein': 'ప్రోటీన్',
    'rec.carbs': 'కార్బోహైడ్రేట్లు',
    'rec.fat': 'కొవ్వు',
    'rec.match': 'సరిపోలిక',

    // Dashboard
    'dash.welcome': 'తిరిగి స్వాగతం',
    'dash.subtitle': 'మీ రోజువారీ వ్యక్తిగతీకరించిన ఆరోగ్య సారాంశం ఇక్కడ ఉంది.',
    'dash.calorieTarget': 'కేలరీల లక్ష్యం',
    'dash.protein': 'ప్రోటీన్',
    'dash.carbs': 'కార్బోహైడ్రేట్లు',
    'dash.fat': 'కొవ్వు',
    'dash.quickActions': 'త్వరిత చర్యలు',
    'dash.scanFood': 'ఆహారాన్ని స్కాన్ చేయండి',
    'dash.viewRecs': 'సిఫార్సులను చూడండి',
    'dash.askAi': 'AI ని అడగండి',
  },

  'mr': {
    // Navigation
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.scanner': 'अन्न स्कॅनर',
    'nav.recommendations': 'आहार शिफारसी',
    'nav.aiAssistant': 'एआय सहाय्यक',
    'nav.reports': 'आरोग्य अहवाल',
    'nav.profile': 'प्रोफाइल',
    'nav.settings': 'सेटिंग्ज',
    'nav.signOut': 'बाहेर पडा',
    'nav.account': 'खाते',

    // Settings
    'settings.title': 'सेटिंग्ज',
    'settings.subtitle': 'तुमची खाते सेटिंग्ज आणि प्राधान्ये व्यवस्थापित करा.',
    'settings.tab.account': 'खाते',
    'settings.tab.preferences': 'प्राधान्ये',
    'settings.tab.notifications': 'सूचना',
    'settings.tab.security': 'सुरक्षा',
    'settings.appPreferences': 'ॲप प्राधान्ये',
    'settings.appPreferencesDesc': 'तुमचा Cura+ अनुभव सानुकूलित करा.',
    'settings.darkMode': 'डार्क मोड',
    'settings.darkModeDesc': 'डार्क आणि लाइट मोड स्विच करा.',
    'settings.language': 'भाषा',
    'settings.languageDesc': 'तुमची पसंतीची भारतीय भाषा निवडा.',
    'settings.saveChanges': 'बदल जतन करा',
    'settings.saving': 'जतन करत आहे...',
    'settings.notificationsPref': 'सूचना प्राधान्ये',
    'settings.notificationsDesc': 'तुम्हाला कोणत्या सूचना हव्या आहेत ते निवडा.',
    'settings.savePreferences': 'प्राधान्ये जतन करा',
    'settings.securityTitle': 'सुरक्षा',
    'settings.securityDesc': 'तुमचा पासवर्ड आणि सुरक्षा सेटिंग्ज व्यवस्थापित करा.',
    'settings.currentPassword': 'सध्याचा पासवर्ड',
    'settings.newPassword': 'नवीन पासवर्ड',
    'settings.confirmPassword': 'नवीन पासवर्डची पुष्टी करा',
    'settings.updatePassword': 'पासवर्ड अपडेट करा',

    // Recommendations
    'rec.title': 'तुमच्यासाठी शिफारस केलेले आहार',
    'rec.subtitle': 'तुमच्या आरोग्य प्रोफाइल आणि आहारावर आधारित भारतीय पोषण.',
    'rec.all': 'सर्व',
    'rec.breakfast': 'नाश्ता',
    'rec.lunch': 'दुपारचे जेवण',
    'rec.dinner': 'रात्रीचे जेवण',
    'rec.snack': 'स्नॅक्स',
    'rec.aiSuggest': 'एआय सल्ला',
    'rec.searchPlaceholder': 'अन्न किंवा साहित्य शोधा...',
    'rec.logMeal': 'जेवण नोंदवा',
    'rec.logged': 'नोंदवले',
    'rec.calories': 'कॅलरीज',
    'rec.protein': 'प्रथिने',
    'rec.carbs': 'कर्बोदके',
    'rec.fat': 'चरबी',
    'rec.match': 'साम्य',

    // Dashboard
    'dash.welcome': 'पुन्हा स्वागत आहे',
    'dash.subtitle': 'येथे तुमचा दैनंदिन पोषण आणि आरोग्य सारांश आहे.',
    'dash.calorieTarget': 'कॅलरी लक्ष्य',
    'dash.protein': 'प्रथिने',
    'dash.carbs': 'कर्बोदके',
    'dash.fat': 'चरबी',
    'dash.quickActions': 'जलद कृती',
    'dash.scanFood': 'अन्न स्कॅन करा',
    'dash.viewRecs': 'शिफारसी पहा',
    'dash.askAi': 'एआय ला विचारा',
  },

  'gu': {
    // Navigation
    'nav.dashboard': 'ડેશબોર્ડ',
    'nav.scanner': 'ફૂડ સ્કેનર',
    'nav.recommendations': 'ખોરાકની ભલામણો',
    'nav.aiAssistant': 'AI સહાયક',
    'nav.reports': 'આરોગ્ય અહેવાલો',
    'nav.profile': 'પ્રોફાઇલ',
    'nav.settings': 'સેટિંગ્સ',
    'nav.signOut': 'સાઇન આઉટ',
    'nav.account': 'ખાતું',

    // Settings
    'settings.title': 'સેટિંગ્સ',
    'settings.subtitle': 'તમારા એકાઉન્ટ સેટિંગ્સ અને પસંદગીઓનું સંચાલન કરો.',
    'settings.tab.account': 'ખાતું',
    'settings.tab.preferences': 'પસંદગીઓ',
    'settings.tab.notifications': 'સૂચનાઓ',
    'settings.tab.security': 'સુરક્ષા',
    'settings.appPreferences': 'એપ્લિકેશન પસંદગીઓ',
    'settings.appPreferencesDesc': 'તમારા Cura+ અનુભવને કસ્ટમાઇઝ કરો.',
    'settings.darkMode': 'ડાર્ક મોડ',
    'settings.darkModeDesc': 'ડાર્ક અથવા લાઇટ મોડ વચ્ચે ફેરબદલ કરો.',
    'settings.language': 'ભાષા',
    'settings.languageDesc': 'તમારી પસંદગીની ભારતીય ભાષા પસંદ કરો.',
    'settings.saveChanges': 'ફેરફારો સાચવો',
    'settings.saving': 'સાચવી રહ્યું છે...',
    'settings.notificationsPref': 'સૂચના પસંદગીઓ',
    'settings.notificationsDesc': 'તમે કયા ચેતવણીઓ મેળવવા માંગો છો તે પસંદ કરો.',
    'settings.savePreferences': 'પસંદગીઓ સાચવો',
    'settings.securityTitle': 'સુરક્ષા',
    'settings.securityDesc': 'તમારો પાસવર્ડ અને સુરક્ષા સેટિંગ્સ મેનેજ કરો.',
    'settings.currentPassword': 'વર્તમાન પાસવર્ડ',
    'settings.newPassword': 'નવો પાસવર્ડ',
    'settings.confirmPassword': 'નવા પાસવર્ડની પુષ્ટિ કરો',
    'settings.updatePassword': 'પાસવર્ડ અપડેટ કરો',

    // Recommendations
    'rec.title': 'તમારા માટે ભલામણ કરેલ',
    'rec.subtitle': 'તમારી આરોગ્ય પ્રોફાઇલ પર આધારિત વ્યક્તિગત ભારતીય પોષણ.',
    'rec.all': 'બધા',
    'rec.breakfast': 'સવારનો નાસ્તો',
    'rec.lunch': 'બપોરનું ભોજન',
    'rec.dinner': 'રાત્રિભોજન',
    'rec.snack': 'નાસ્તો',
    'rec.aiSuggest': 'AI સૂચન',
    'rec.searchPlaceholder': 'ખોરાક શોધો...',
    'rec.logMeal': 'ભોજન નોંધો',
    'rec.logged': 'નોંધાયેલ',
    'rec.calories': 'કેલરી',
    'rec.protein': 'પ્રોટીન',
    'rec.carbs': 'કાર્બોહાઇડ્રેટ',
    'rec.fat': 'ચરબી',
    'rec.match': 'મેચ',

    // Dashboard
    'dash.welcome': 'પુનઃ સ્વાગત છે',
    'dash.subtitle': 'અહીં તમારો દૈનિક સ્વાસ્થ્ય સારાંશ છે.',
    'dash.calorieTarget': 'કેલરી લક્ષ્ય',
    'dash.protein': 'પ્રોટીન',
    'dash.carbs': 'કાર્બોહાઇડ્રેટ',
    'dash.fat': 'ચરબી',
    'dash.quickActions': 'ઝડપી ક્રિયાઓ',
    'dash.scanFood': 'ખોરાક સ્કેન કરો',
    'dash.viewRecs': 'ભલામણો જુઓ',
    'dash.askAi': 'AI ને પૂછો',
  },

  'kn': {
    // Navigation
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.scanner': 'ಫುಡ್ ಸ್ಕ್ಯಾನರ್',
    'nav.recommendations': 'ಆಹಾರ ಶಿಫಾರಸುಗಳು',
    'nav.aiAssistant': 'AI ಸಹಾಯಕ',
    'nav.reports': 'ಆರೋಗ್ಯ ವರದಿಗಳು',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'nav.signOut': 'ಸೈನ್ ಔಟ್',
    'nav.account': 'ಖಾತೆ',

    // Settings
    'settings.title': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'settings.subtitle': 'ನಿಮ್ಮ ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.',
    'settings.tab.account': 'ಖಾತೆ',
    'settings.tab.preferences': 'ಆದ್ಯತೆಗಳು',
    'settings.tab.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'settings.tab.security': 'ಭದ್ರತೆ',
    'settings.appPreferences': 'ಅಪ್ಲಿಕೇಶನ್ ಆದ್ಯತೆಗಳು',
    'settings.appPreferencesDesc': 'ನಿಮ್ಮ Cura+ ಅನುಭವವನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಿ.',
    'settings.darkMode': 'ಡಾರ್ಕ್ ಮೋಡ್',
    'settings.darkModeDesc': 'ಡಾರ್ಕ್ ಮತ್ತು ಲೈಟ್ ಮೋಡ್ ನಡುವೆ ಬದಲಾಯಿಸಿ.',
    'settings.language': 'ಭಾಷೆ',
    'settings.languageDesc': 'ನಿಮ್ಮ ನೆಚ್ಚಿನ ಭಾರತೀಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    'settings.saveChanges': 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    'settings.saving': 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
    'settings.notificationsPref': 'ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳು',
    'settings.notificationsDesc': 'ನೀವು ಸ್ವೀಕರಿಸಲು ಬಯಸುವ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಆರಿಸಿ.',
    'settings.savePreferences': 'ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ',
    'settings.securityTitle': 'ಭದ್ರತೆ',
    'settings.securityDesc': 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು ಭದ್ರತಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ.',
    'settings.currentPassword': 'ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್',
    'settings.newPassword': 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
    'settings.confirmPassword': 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    'settings.updatePassword': 'ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ',

    // Recommendations
    'rec.title': 'ನಿಮಗಾಗಿ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ',
    'rec.subtitle': 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್ ಆಧಾರಿತ ಭಾರತೀಯ ಪೌಷ್ಟಿಕಾಂಶ.',
    'rec.all': 'ಎಲ್ಲಾ',
    'rec.breakfast': 'ಉಪಾಹಾರ',
    'rec.lunch': 'ಮಧ್ಯಾಹ್ನದ ಊಟ',
    'rec.dinner': 'ರಾತ್ರಿಯ ಊಟ',
    'rec.snack': 'ಲಘು ಉಪಾಹಾರ',
    'rec.aiSuggest': 'AI ಸಲಹೆ',
    'rec.searchPlaceholder': 'ಆಹಾರವನ್ನು ಹುಡುಕಿ...',
    'rec.logMeal': 'ಊಟ ದಾಖಲಿಸಿ',
    'rec.logged': 'ದಾಖಲಿಸಲಾಗಿದೆ',
    'rec.calories': 'ಕ್ಯಾಲೋರಿಗಳು',
    'rec.protein': 'ಪ್ರೋಟೀನ್',
    'rec.carbs': 'ಕಾರ್ಬ್ಸ್',
    'rec.fat': 'ಕೊಬ್ಬು',
    'rec.match': 'ಹೊಂದಾಣಿಕೆ',

    // Dashboard
    'dash.welcome': 'ಮರಳಿ ಸುಸ್ವಾಗತ',
    'dash.subtitle': 'ಇಲ್ಲಿ ನಿಮ್ಮ ದೈನಂದಿನ ಆರೋಗ್ಯ ಸಾರಾಂಶವಿದೆ.',
    'dash.calorieTarget': 'ಕ್ಯಾಲೋರಿ ಗುರಿ',
    'dash.protein': 'ಪ್ರೋಟೀನ್',
    'dash.carbs': 'ಕಾರ್ಬೋಹೈಡ್ರೇಟ್ಗಳು',
    'dash.fat': 'ಕೊಬ್ಬು',
    'dash.quickActions': 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    'dash.scanFood': 'ಆಹಾರ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    'dash.viewRecs': 'ಶಿಫಾರಸುಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'dash.askAi': 'AI ಅನ್ನು ಕೇಳಿ',
  },

  'ml': {
    // Navigation
    'nav.dashboard': 'ഡാഷ്‌ബോർഡ്',
    'nav.scanner': 'ഫുഡ് സ്കാനർ',
    'nav.recommendations': 'ഭക്ഷണ നിർദ്ദേശങ്ങൾ',
    'nav.aiAssistant': 'AI സഹായി',
    'nav.reports': 'ആരോഗ്യ റിപ്പോർട്ടുകൾ',
    'nav.profile': 'പ്രൊഫൈൽ',
    'nav.settings': 'ക്രമീകരണങ്ങൾ',
    'nav.signOut': 'ലോഗ് ഔട്ട്',
    'nav.account': 'അക്കൗണ്ട്',

    // Settings
    'settings.title': 'ക്രമീകരണങ്ങൾ',
    'settings.subtitle': 'നിങ്ങളുടെ അക്കൗണ്ട് ക്രമീകരണങ്ങളും മുൻഗണനകളും കൈകാര്യം ചെയ്യുക.',
    'settings.tab.account': 'അക്കൗണ്ട്',
    'settings.tab.preferences': 'മുൻഗണനകൾ',
    'settings.tab.notifications': 'അറിയിപ്പുകൾ',
    'settings.tab.security': 'സുരക്ഷ',
    'settings.appPreferences': 'ആപ്പ് മുൻഗണനകൾ',
    'settings.appPreferencesDesc': 'നിങ്ങളുടെ Cura+ അനുഭവം ഇഷ്ടാനുസൃതമാക്കുക.',
    'settings.darkMode': 'ഡാർക്ക് മോഡ്',
    'settings.darkModeDesc': 'ഡാർക്ക് മോഡും ലൈറ്റ് മോഡും തമ്മിൽ മാറ്റുക.',
    'settings.language': 'ഭാഷ',
    'settings.languageDesc': 'നിങ്ങളുടെ പ്രിയപ്പെട്ട ഇന്ത്യൻ ഭാഷ തിരഞ്ഞെടുക്കുക.',
    'settings.saveChanges': 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
    'settings.saving': 'സംരക്ഷിക്കുന്നു...',
    'settings.notificationsPref': 'അറിയിപ്പ് മുൻഗണനകൾ',
    'settings.notificationsDesc': 'നിങ്ങൾക്ക് ലഭിക്കേണ്ട മുന്നറിയിപ്പുകൾ തിരഞ്ഞെടുക്കുക.',
    'settings.savePreferences': 'മുൻഗണനകൾ സംരക്ഷിക്കുക',
    'settings.securityTitle': 'സുരക്ഷ',
    'settings.securityDesc': 'നിങ്ങളുടെ പാസ്‌വേഡും സുരക്ഷാ ക്രമീകരണങ്ങളും കൈകാര്യം ചെയ്യുക.',
    'settings.currentPassword': 'നിലവിലെ പാസ്‌വേഡ്',
    'settings.newPassword': 'പുതിയ പാസ്‌വേഡ്',
    'settings.confirmPassword': 'പുതിയ പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക',
    'settings.updatePassword': 'പാസ്‌വേഡ് അപ്‌ഡേറ്റ് ചെയ്യുക',

    // Recommendations
    'rec.title': 'നിങ്ങൾക്കായി ശുപാർശ ചെയ്തവ',
    'rec.subtitle': 'നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ള പോഷകാഹാരം.',
    'rec.all': 'എല്ലാം',
    'rec.breakfast': 'പ്രഭാതഭക്ഷണം',
    'rec.lunch': 'ഉച്ചഭക്ഷണം',
    'rec.dinner': 'അത്താഴം',
    'rec.snack': 'ലഘുഭക്ഷണം',
    'rec.aiSuggest': 'AI നിർദ്ദേശം',
    'rec.searchPlaceholder': 'ഭക്ഷണം തിരയുക...',
    'rec.logMeal': 'ഭക്ഷണം രേഖപ്പെടുത്തുക',
    'rec.logged': 'രേഖപ്പെടുത്തി',
    'rec.calories': 'കലോറി',
    'rec.protein': 'പ്രോട്ടീൻ',
    'rec.carbs': 'കാർബോഹൈഡ്രേറ്റ്',
    'rec.fat': 'കൊഴുപ്പ്',
    'rec.match': 'പൊരുത്തം',

    // Dashboard
    'dash.welcome': 'സ്വാഗതം',
    'dash.subtitle': 'ഇതാ നിങ്ങളുടെ ദൈനംദിന ആരോഗ്യ സംഗ്രഹം.',
    'dash.calorieTarget': 'കലോറി ലക്ഷ്യം',
    'dash.protein': 'പ്രോട്ടീൻ',
    'dash.carbs': 'കാർബോഹൈഡ്രേറ്റ്',
    'dash.fat': 'കൊഴുപ്പ്',
    'dash.quickActions': 'ദ്രുത പ്രവർത്തനങ്ങൾ',
    'dash.scanFood': 'ഭക്ഷണം സ്കാൻ ചെയ്യുക',
    'dash.viewRecs': 'നിർദ്ദേശങ്ങൾ കാണുക',
    'dash.askAi': 'AI യോട് ചോദിക്കുക',
  },

  'pa': {
    // Navigation
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.scanner': 'ਫੂਡ ਸਕੈਨਰ',
    'nav.recommendations': 'ਭੋਜਨ ਸਿਫ਼ਾਰਸ਼ਾਂ',
    'nav.aiAssistant': 'AI ਸਹਾਇਕ',
    'nav.reports': 'ਸਿਹਤ ਰਿਪੋਰਟਾਂ',
    'nav.profile': 'ਪ੍ਰੋਫਾਈਲ',
    'nav.settings': 'ਸੈਟਿੰਗਾਂ',
    'nav.signOut': 'ਸਾਈਨ ਆਉਟ',
    'nav.account': 'ਖਾਤਾ',

    // Settings
    'settings.title': 'ਸੈਟਿੰਗਾਂ',
    'settings.subtitle': 'ਆਪਣੀਆਂ ਖਾਤਾ ਸੈਟਿੰਗਾਂ ਅਤੇ ਤਰਜੀਹਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ।',
    'settings.tab.account': 'ਖਾਤਾ',
    'settings.tab.preferences': 'ਤਰਜੀਹਾਂ',
    'settings.tab.notifications': 'ਸੂਚਨਾਵਾਂ',
    'settings.tab.security': 'ਸੁਰੱਖਿਆ',
    'settings.appPreferences': 'ਐਪ ਤਰਜੀਹਾਂ',
    'settings.appPreferencesDesc': 'ਆਪਣੇ Cura+ ਅਨੁਭਵ ਨੂੰ ਅਨੁਕੂਲਿਤ ਕਰੋ।',
    'settings.darkMode': 'ਡਾਰਕ ਮੋਡ',
    'settings.darkModeDesc': 'ਡਾਰਕ ਅਤੇ ਲਾਈਟ ਮੋਡ ਵਿੱਚ ਬਦਲੋ।',
    'settings.language': 'ਭਾਸ਼ਾ',
    'settings.languageDesc': 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਰਤੀ ਭਾਸ਼ਾ ਚੁਣੋ।',
    'settings.saveChanges': 'ਤਬਦੀਲੀਆਂ ਸੰਭਾਲੋ',
    'settings.saving': 'ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...',
    'settings.notificationsPref': 'ਸੂਚਨਾ ਤਰਜੀਹਾਂ',
    'settings.notificationsDesc': 'ਚੁਣੋ ਕਿ ਤੁਸੀਂ ਕਿਹੜੇ ਅਲਰਟ ਪ੍ਰਾਪਤ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ।',
    'settings.savePreferences': 'ਤਰਜੀਹਾਂ ਸੰਭਾਲੋ',
    'settings.securityTitle': 'ਸੁਰੱਖਿਆ',
    'settings.securityDesc': 'ਆਪਣਾ ਪਾਸਵਰਡ ਅਤੇ ਸੁਰੱਖਿਆ ਸੈਟਿੰਗਾਂ ਪ੍ਰਬੰਧਿਤ ਕਰੋ।',
    'settings.currentPassword': 'ਮੌਜੂਦਾ ਪਾਸਵਰਡ',
    'settings.newPassword': 'ਨਵਾਂ ਪਾਸਵਰਡ',
    'settings.confirmPassword': 'ਨਵੇਂ ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    'settings.updatePassword': 'ਪਾਸਵਰਡ ਅੱਪਡੇਟ ਕਰੋ',

    // Recommendations
    'rec.title': 'ਤੁਹਾਡੇ ਲਈ ਸਿਫ਼ਾਰਸ਼ ਕੀਤਾ ਗਿਆ',
    'rec.subtitle': 'ਤੁਹਾਡੀ ਸਿਹਤ ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਭੋਜਨ ਤਰਜੀਹਾਂ ਤੇ ਆਧਾਰਿਤ ਪੋਸ਼ਣ।',
    'rec.all': 'ਸਾਰੇ',
    'rec.breakfast': 'ਨਾਸ਼ਤਾ',
    'rec.lunch': 'ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ',
    'rec.dinner': 'ਰਾਤ ਦਾ ਖਾਣਾ',
    'rec.snack': 'ਸਨੈਕ',
    'rec.aiSuggest': 'AI ਸੁਝਾਅ',
    'rec.searchPlaceholder': 'ਭੋਜਨ ਖੋਜੋ...',
    'rec.logMeal': 'ਭੋਜਨ ਦਰਜ ਕਰੋ',
    'rec.logged': 'ਦਰਜ ਕੀਤਾ ਗਿਆ',
    'rec.calories': 'ਕੈਲੋਰੀ',
    'rec.protein': 'ਪ੍ਰੋਟੀਨ',
    'rec.carbs': 'ਕਾਰਬੋਹਾਈਡ੍ਰੇਟ',
    'rec.fat': 'ਚਰਬੀ',
    'rec.match': 'ਮੇਲ',

    // Dashboard
    'dash.welcome': 'ਜੀ ਆਇਆਂ ਨੂੰ',
    'dash.subtitle': 'ਇੱਥੇ ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਸਿਹਤ ਸਾਰਾਂਸ਼ ਹੈ।',
    'dash.calorieTarget': 'ਕੈਲੋਰੀ ਟੀਚਾ',
    'dash.protein': 'ਪ੍ਰੋਟੀਨ',
    'dash.carbs': 'ਕਾਰਬੋਹਾਈਡ੍ਰੇਟ',
    'dash.fat': 'ਚਰਬੀ',
    'dash.quickActions': 'ਤੇਜ਼ ਕਾਰਵਾਈਆਂ',
    'dash.scanFood': 'ਭੋਜਨ ਸਕੈਨ ਕਰੋ',
    'dash.viewRecs': 'ਸਿਫ਼ਾਰਸ਼ਾਂ ਵੇਖੋ',
    'dash.askAi': 'AI ਨੂੰ ਪੁੱਛੋ',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en-IN',
  setLanguage: () => { },
  t: (key: string, defaultText?: string) => defaultText || key,
  languages: INDIAN_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem('cura_language') as LanguageCode;
      if (stored && TRANSLATIONS[stored]) return stored;
    } catch (e) {
      // Ignore
    }
    return 'en-IN';
  });

  const setLanguage = (newLang: LanguageCode) => {
    if (TRANSLATIONS[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem('cura_language', newLang);
      } catch (e) {
        // Ignore
      }
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English (India)
    const enDict = TRANSLATIONS['en-IN'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: INDIAN_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
