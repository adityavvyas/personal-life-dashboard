const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

const translations = {
  en: {
    nav: { dashboard: "Dashboard", market: "Market", expenses: "Expenses", accounts: "Accounts", goals: "Goals", bills: "Bills", fuel: "Fuel", routines: "Routines", settings: "Settings" },
    dashboard: { 
      greeting: "Good Morning,", greeting_evening: "Good Evening,", greeting_afternoon: "Good Afternoon,", 
      subtitle: "Here's your financial summary.", search: "Search...", add: "Add",
      kpi: { 
        totalBalance: "TOTAL BALANCE", totalBalanceDesc: "Across all accounts",
        safeToSpend: "SAFE TO SPEND", safeToSpendDesc: "Balance - Upcoming Bills",
        notionalBalance: "NOTIONAL BALANCE", notionalBalanceDesc: "After All-Time Expenses",
        monthlyExpenses: "MONTHLY EXPENSES", thisMonth: "This Month",
        dailyAllowance: "DAILY ALLOWANCE", spent: "Spent", of: "of",
        emergencyFund: "EMERGENCY FUND", building: "Building", goal: "Goal"
      },
      recentTransactions: "Recent Transactions", noRecent: "No recent transactions.", viewAll: "View All",
      upcomingBills: "Upcoming Bills", noUpcoming: "No upcoming bills.",
      addMenu: { logExpense: "Log Expense", logFuel: "Log Fuel", addAccount: "Add Account", addBill: "Add Bill", addGoal: "Add Goal", addRoutine: "Add Routine" },
      modal: { title: "Budget & Allowances", desc: "Set your daily spending limits for the dashboard.", weekday: "Weekday", weekend: "Weekend", cancel: "Cancel", save: "Save Changes" }
    },
    settings: { title: "Settings", subtitle: "Manage your preferences", profile: "Profile Setup", nameLabel: "Your Name", updateName: "Update Name", languageTitle: "Language Preferences", languageLabel: "Application Language", notificationsTitle: "Desktop Notifications", notificationsLabel: "Enable Desktop Notifications", notificationsDesc: "Get reminders for routines and bills.", security: "Security", pinLabel: "Set PIN (4-digits)", updatePin: "Update PIN", clearData: "Clear All Data", clearWarning: "This will permanently delete all your data." }
  },
  hi: {
    nav: { dashboard: "डैशबोर्ड", market: "बाज़ार", expenses: "खर्चे", accounts: "खाते", goals: "लक्ष्य", bills: "बिल", fuel: "ईंधन", routines: "दिनचर्या", settings: "सेटिंग्स" },
    dashboard: { 
      greeting: "सुप्रभात,", greeting_evening: "शुभ संध्या,", greeting_afternoon: "शुभ दोपहर,", 
      subtitle: "यहाँ आपका वित्तीय सारांश है।", search: "खोजें...", add: "जोड़ें",
      kpi: { 
        totalBalance: "कुल शेष", totalBalanceDesc: "सभी खातों में",
        safeToSpend: "खर्च करने के लिए सुरक्षित", safeToSpendDesc: "शेष - आगामी बिल",
        notionalBalance: "काल्पनिक शेष", notionalBalanceDesc: "सभी खर्चों के बाद",
        monthlyExpenses: "मासिक खर्चे", thisMonth: "इस महीने",
        dailyAllowance: "दैनिक भत्ता", spent: "खर्च किया", of: "में से",
        emergencyFund: "आपातकालीन निधि", building: "निर्माण", goal: "लक्ष्य"
      },
      recentTransactions: "हाल के लेनदेन", noRecent: "कोई हालिया लेनदेन नहीं।", viewAll: "सभी देखें",
      upcomingBills: "आगामी बिल", noUpcoming: "कोई आगामी बिल नहीं।",
      addMenu: { logExpense: "खर्च लॉग करें", logFuel: "ईंधन लॉग करें", addAccount: "खाता जोड़ें", addBill: "बिल जोड़ें", addGoal: "लक्ष्य जोड़ें", addRoutine: "दिनचर्या जोड़ें" },
      modal: { title: "बजट और भत्ते", desc: "डैशबोर्ड के लिए अपनी दैनिक खर्च सीमा निर्धारित करें।", weekday: "कार्यदिवस", weekend: "सप्ताहांत", cancel: "रद्द करें", save: "परिवर्तन सहेजें" }
    },
    settings: { title: "सेटिंग्स", subtitle: "अपनी प्राथमिकताएं प्रबंधित करें", profile: "प्रोफ़ाइल", nameLabel: "आपका नाम", updateName: "नाम अपडेट करें", languageTitle: "भाषा", languageLabel: "एप्लिकेशन भाषा", notificationsTitle: "सूचनाएं", notificationsLabel: "सूचनाएं सक्षम करें", notificationsDesc: "दिनचर्या और बिलों के लिए अनुस्मारक प्राप्त करें।", security: "सुरक्षा", pinLabel: "पिन सेट करें", updatePin: "पिन अपडेट करें", clearData: "सभी डेटा मिटाएं", clearWarning: "यह आपके सभी डेटा को स्थायी रूप से हटा देगा।" }
  },
  bn: {
    nav: { dashboard: "ড্যাশবোর্ড", market: "বাজার", expenses: "খরচ", accounts: "অ্যাকাউন্ট", goals: "লক্ষ্য", bills: "বিল", fuel: "জ্বালানী", routines: "রুটিন", settings: "সেটিংস" },
    dashboard: { 
      greeting: "সুপ্রভাত,", greeting_evening: "শুভ সন্ধ্যা,", greeting_afternoon: "শুভ অপরাহ্ন,", 
      subtitle: "এখানে আপনার আর্থিক সারসংক্ষেপ।", search: "অনুসন্ধান...", add: "যোগ করুন",
      kpi: { 
        totalBalance: "মোট ব্যালেন্স", totalBalanceDesc: "সমস্ত অ্যাকাউন্ট জুড়ে",
        safeToSpend: "খরচ করার জন্য নিরাপদ", safeToSpendDesc: "ব্যালেন্স - আসন্ন বিল",
        notionalBalance: "কাল্পনিক ব্যালেন্স", notionalBalanceDesc: "সর্বকালের খরচের পর",
        monthlyExpenses: "মাসিক খরচ", thisMonth: "এই মাসে",
        dailyAllowance: "দৈনিক ভাতা", spent: "ব্যয়িত", of: "এর মধ্যে",
        emergencyFund: "জরুরী তহবিল", building: "নির্মাণ", goal: "লক্ষ্য"
      },
      recentTransactions: "সাম্প্রতিক লেনদেন", noRecent: "কোনো সাম্প্রতিক লেনদেন নেই।", viewAll: "সব দেখুন",
      upcomingBills: "আসন্ন বিল", noUpcoming: "কোনো আসন্ন বিল নেই।",
      addMenu: { logExpense: "লগ খরচ", logFuel: "লগ জ্বালানী", addAccount: "অ্যাকাউন্ট যোগ করুন", addBill: "বিল যোগ করুন", addGoal: "লক্ষ্য যোগ করুন", addRoutine: "রুটিন যোগ করুন" },
      modal: { title: "বাজেট এবং ভাতা", desc: "ড্যাশবোর্ডের জন্য আপনার দৈনিক খরচের সীমা নির্ধারণ করুন।", weekday: "কাজের দিন", weekend: "সাপ্তাহিক ছুটি", cancel: "বাতিল", save: "পরিবর্তন সংরক্ষণ করুন" }
    },
    settings: { title: "সেটিংস", subtitle: "পছন্দসমূহ পরিচালনা করুন", profile: "প্রোফাইল", nameLabel: "আপনার নাম", updateName: "নাম আপডেট করুন", languageTitle: "ভাষা", languageLabel: "অ্যাপ্লিকেশন ভাষা", notificationsTitle: "বিজ্ঞপ্তি", notificationsLabel: "বিজ্ঞপ্তি সক্ষম করুন", notificationsDesc: "রুটিন এবং বিলের জন্য অনুস্মারক পান।", security: "নিরাপত্তা", pinLabel: "পিন সেট করুন", updatePin: "পিন আপডেট করুন", clearData: "সমস্ত ডেটা মুছুন", clearWarning: "এটি আপনার সমস্ত ডেটা স্থায়ীভাবে মুছে ফেলবে।" }
  },
  te: {
    nav: { dashboard: "డాష్‌బోర్డ్", market: "మార్కెట్", expenses: "ఖర్చులు", accounts: "ఖాతాలు", goals: "లక్ష్యాలు", bills: "బిల్లులు", fuel: "ఇంధనం", routines: "దినచర్యలు", settings: "సెట్టింగ్‌లు" },
    dashboard: { 
      greeting: "శుభోదయం,", greeting_evening: "శుభ సాయంత్రం,", greeting_afternoon: "శుభ మధ్యాహ్నం,", 
      subtitle: "ఇక్కడ మీ ఆర్థిక సారాంశం ఉంది.", search: "శోధించండి...", add: "జోడించండి",
      kpi: { 
        totalBalance: "మొత్తం బ్యాలెన్స్", totalBalanceDesc: "అన్ని ఖాతాలలో",
        safeToSpend: "ఖర్చు చేయడానికి సురక్షితం", safeToSpendDesc: "బ్యాలెన్స్ - రాబోయే బిల్లులు",
        notionalBalance: "ఊహాత్మక బ్యాలెన్స్", notionalBalanceDesc: "అన్ని ఖర్చుల తర్వాత",
        monthlyExpenses: "నెలవారీ ఖర్చులు", thisMonth: "ఈ నెల",
        dailyAllowance: "రోజువారీ భత్యం", spent: "ఖర్చు చేశారు", of: "లో",
        emergencyFund: "అత్యవసర నిధి", building: "నిర్మాణం", goal: "లక్ష్యం"
      },
      recentTransactions: "ఇటీవలి లావాదేవీలు", noRecent: "ఇటీవలి లావాదేవీలు లేవు.", viewAll: "అన్ని చూడండి",
      upcomingBills: "రాబోయే బిల్లులు", noUpcoming: "రాబోయే బిల్లులు లేవు.",
      addMenu: { logExpense: "ఖర్చు లాగ్ చేయండి", logFuel: "ఇంధనాన్ని లాగ్ చేయండి", addAccount: "ఖాతాను జోడించండి", addBill: "బిల్లును జోడించండి", addGoal: "లక్ష్యాన్ని జోడించండి", addRoutine: "దినచర్యను జోడించండి" },
      modal: { title: "బడ్జెట్ & భత్యాలు", desc: "డాష్‌బోర్డ్ కోసం మీ రోజువారీ ఖర్చు పరిమితులను సెట్ చేయండి.", weekday: "పనిదినం", weekend: "వారాంతం", cancel: "రద్దు చేయి", save: "మార్పులను సేవ్ చేయండి" }
    },
    settings: { title: "సెట్టింగ్‌లు", subtitle: "ప్రాధాన్యతలను నిర్వహించండి", profile: "ప్రొఫైల్", nameLabel: "మీ పేరు", updateName: "పేరు నవీకరించండి", languageTitle: "భాష", languageLabel: "అప్లికేషన్ భాష", notificationsTitle: "నోటిఫికేషన్‌లు", notificationsLabel: "నోటిఫికేషన్‌లను ప్రారంభించండి", notificationsDesc: "దినచర్యలు మరియు బిల్లుల కోసం రిమైండర్‌లను పొందండి.", security: "భద్రత", pinLabel: "పిన్ సెట్ చేయండి", updatePin: "పిన్ నవీకరించండి", clearData: "మొత్తం డేటాను క్లియర్ చేయండి", clearWarning: "ఇది మీ డేటాను శాశ్వతంగా తొలగిస్తుంది." }
  },
  mr: {
    nav: { dashboard: "डॅशबोर्ड", market: "बाजार", expenses: "खर्च", accounts: "खाती", goals: "ध्येये", bills: "बिले", fuel: "इंधन", routines: "दिनचर्या", settings: "सेटिंग्ज" },
    dashboard: { 
      greeting: "शुभ सकाळ,", greeting_evening: "शुभ संध्याकाळ,", greeting_afternoon: "शुभ दुपार,", 
      subtitle: "येथे तुमचा आर्थिक सारांश आहे.", search: "शोधा...", add: "जोडा",
      kpi: { 
        totalBalance: "एकूण शिल्लक", totalBalanceDesc: "सर्व खात्यांमध्ये",
        safeToSpend: "खर्च करण्यास सुरक्षित", safeToSpendDesc: "शिल्लक - आगामी बिले",
        notionalBalance: "काल्पनिक शिल्लक", notionalBalanceDesc: "सर्व खर्चांनंतर",
        monthlyExpenses: "मासिक खर्च", thisMonth: "या महिन्यात",
        dailyAllowance: "दैनिक भत्ता", spent: "खर्च केले", of: "पैकी",
        emergencyFund: "आणीबाणी निधी", building: "बांधकाम", goal: "ध्येय"
      },
      recentTransactions: "अलीकडील व्यवहार", noRecent: "कोणतेही अलीकडील व्यवहार नाहीत.", viewAll: "सर्व पहा",
      upcomingBills: "आगामी बिले", noUpcoming: "कोणतीही आगामी बिले नाहीत.",
      addMenu: { logExpense: "खर्च लॉग करा", logFuel: "इंधन लॉग करा", addAccount: "खाते जोडा", addBill: "बिल जोडा", addGoal: "ध्येय जोडा", addRoutine: "दिनचर्या जोडा" },
      modal: { title: "बजेट आणि भत्ते", desc: "डॅशबोर्डसाठी तुमची दैनंदिन खर्च मर्यादा सेट करा.", weekday: "कामाचा दिवस", weekend: "शनिवार व रविवार", cancel: "रद्द करा", save: "बदल जतन करा" }
    },
    settings: { title: "सेटिंग्ज", subtitle: "प्राधान्ये व्यवस्थापित करा", profile: "प्रोफाइल", nameLabel: "तुमचे नाव", updateName: "नाव अपडेट करा", languageTitle: "भाषा", languageLabel: "अॅप भाषा", notificationsTitle: "सूचना", notificationsLabel: "सूचना सक्षम करा", notificationsDesc: "बिले आणि दिनचर्यांसाठी स्मरणपत्रे मिळवा.", security: "सुरक्षा", pinLabel: "पिन सेट करा", updatePin: "पिन अपडेट करा", clearData: "सर्व डेटा साफ करा", clearWarning: "हे तुमचा सर्व डेटा कायमचा हटवेल." }
  },
  ta: {
    nav: { dashboard: "டாஷ்போர்டு", market: "சந்தை", expenses: "செலவுகள்", accounts: "கணக்குகள்", goals: "இலக்குகள்", bills: "பில்கள்", fuel: "எரிபொருள்", routines: "வழக்கங்கள்", settings: "அமைப்புகள்" },
    dashboard: { 
      greeting: "காலை வணக்கம்,", greeting_evening: "மாலை வணக்கம்,", greeting_afternoon: "மதிய வணக்கம்,", 
      subtitle: "உங்கள் நிதி சுருக்கம் இங்கே.", search: "தேடு...", add: "சேர்",
      kpi: { 
        totalBalance: "மொத்த இருப்பு", totalBalanceDesc: "அனைத்து கணக்குகளிலும்",
        safeToSpend: "செலவிட பாதுகாப்பானது", safeToSpendDesc: "இருப்பு - வரவிருக்கும் பில்கள்",
        notionalBalance: "கற்பனை இருப்பு", notionalBalanceDesc: "அனைத்து செலவுகளுக்கும் பிறகு",
        monthlyExpenses: "மாதாந்திர செலவுகள்", thisMonth: "இந்த மாதம்",
        dailyAllowance: "தினசரி கொடுப்பனவு", spent: "செலவிடப்பட்டது", of: "இல்",
        emergencyFund: "அவசரகால நிதி", building: "கட்டிடம்", goal: "இலக்கு"
      },
      recentTransactions: "சமீபத்திய பரிவர்த்தனைகள்", noRecent: "சமீபத்திய பரிவர்த்தனைகள் இல்லை.", viewAll: "அனைத்தையும் காண்க",
      upcomingBills: "வரவிருக்கும் பில்கள்", noUpcoming: "வரவிருக்கும் பில்கள் இல்லை.",
      addMenu: { logExpense: "செலவை பதிவு செய்", logFuel: "எரிபொருளை பதிவு செய்", addAccount: "கணக்கை சேர்", addBill: "பில்லை சேர்", addGoal: "இலக்கை சேர்", addRoutine: "வழக்கத்தை சேர்" },
      modal: { title: "பட்ஜெட் & கொடுப்பனவுகள்", desc: "டாஷ்போர்டிற்கான உங்கள் தினசரி செலவு வரம்புகளை அமைக்கவும்.", weekday: "வேலை நாள்", weekend: "வார இறுதி", cancel: "ரத்து செய்", save: "மாற்றங்களைச் சேமி" }
    },
    settings: { title: "அமைப்புகள்", subtitle: "விருப்பங்களை நிர்வகிக்கவும்", profile: "சுயவிவரம்", nameLabel: "உங்கள் பெயர்", updateName: "பெயரை புதுப்பிக்கவும்", languageTitle: "மொழி", languageLabel: "செயலி மொழி", notificationsTitle: "அறிவிப்புகள்", notificationsLabel: "அறிவிப்புகளை இயக்கு", notificationsDesc: "பில்களுக்கான நினைவூட்டல்களைப் பெறுக.", security: "பாதுகாப்பு", pinLabel: "பின் அமைக்கவும்", updatePin: "பின் புதுப்பிக்கவும்", clearData: "தரவை அழிக்கவும்", clearWarning: "இது உங்கள் தரவை நிரந்தரமாக அழிக்கும்." }
  },
  ur: {
    nav: { dashboard: "ڈیش بورڈ", market: "مارکیٹ", expenses: "اخراجات", accounts: "اکاؤنٹس", goals: "اہداف", bills: "بلز", fuel: "ایندھن", routines: "معمولات", settings: "ترتیبات" },
    dashboard: { 
      greeting: "صبح بخیر,", greeting_evening: "شام بخیر,", greeting_afternoon: "دوپہر بخیر,", 
      subtitle: "یہاں آپ کا مالیاتی خلاصہ ہے۔", search: "تلاش کریں...", add: "شامل کریں",
      kpi: { 
        totalBalance: "کل بیلنس", totalBalanceDesc: "تمام اکاؤنٹس میں",
        safeToSpend: "خرچ کرنے کے لیے محفوظ", safeToSpendDesc: "بیلنس - آنے والے بل",
        notionalBalance: "فرضی بیلنس", notionalBalanceDesc: "تمام اخراجات کے بعد",
        monthlyExpenses: "ماہانہ اخراجات", thisMonth: "اس مہینے",
        dailyAllowance: "یومیہ الاؤنس", spent: "خرچ کیا", of: "میں سے",
        emergencyFund: "ہنگامی فنڈ", building: "عمارت", goal: "ہدف"
      },
      recentTransactions: "حالیہ لین دین", noRecent: "کوئی حالیہ لین دین نہیں۔", viewAll: "سب دیکھیں",
      upcomingBills: "آنے والے بل", noUpcoming: "کوئی آنے والے بل نہیں۔",
      addMenu: { logExpense: "خرچ لاگ کریں", logFuel: "ایندھن لاگ کریں", addAccount: "اکاؤنٹ شامل کریں", addBill: "بل شامل کریں", addGoal: "ہدف شامل کریں", addRoutine: "روٹین شامل کریں" },
      modal: { title: "بجٹ اور الاؤنسز", desc: "ڈیش بورڈ کے لیے اپنی یومیہ خرچ کی حد مقرر کریں۔", weekday: "کام کا دن", weekend: "ویک اینڈ", cancel: "منسوخ کریں", save: "تبدیلیاں محفوظ کریں" }
    },
    settings: { title: "ترتیبات", subtitle: "ترجیحات کا نظم کریں", profile: "پروفائل", nameLabel: "آپ کا نام", updateName: "نام اپ ڈیٹ کریں", languageTitle: "زبان", languageLabel: "ایپلی کیشن کی زبان", notificationsTitle: "اطلاعات", notificationsLabel: "اطلاعات کو فعال کریں", notificationsDesc: "روٹین اور بلوں کے لیے یاد دہانیاں حاصل کریں۔", security: "سیکیورٹی", pinLabel: "پن سیٹ کریں", updatePin: "پن اپ ڈیٹ کریں", clearData: "تمام ڈیٹا صاف کریں", clearWarning: "یہ آپ کا سارا ڈیٹا مستقل طور پر حذف کر دے گا۔" }
  },
  gu: {
    nav: { dashboard: "ડેશબોર્ડ", market: "બજાર", expenses: "ખર્ચ", accounts: "ખાતા", goals: "લક્ષ્યો", bills: "બિલ", fuel: "ઇંધણ", routines: "દિનચર્યા", settings: "સેટિંગ્સ" },
    dashboard: { 
      greeting: "સુપ્રભાત,", greeting_evening: "શુભ સાંજ,", greeting_afternoon: "શુભ બપોર,", 
      subtitle: "અહીં તમારો નાણાકીય સારાંશ છે.", search: "શોધો...", add: "ઉમેરો",
      kpi: { 
        totalBalance: "કુલ બેલેન્સ", totalBalanceDesc: "બધા ખાતામાં",
        safeToSpend: "ખર્ચ કરવા સુરક્ષિત", safeToSpendDesc: "બેલેન્સ - આગામી બિલ",
        notionalBalance: "કાલ્પનિક બેલેન્સ", notionalBalanceDesc: "બધા ખર્ચ પછી",
        monthlyExpenses: "માસિક ખર્ચ", thisMonth: "આ મહિને",
        dailyAllowance: "દૈનિક ભથ્થું", spent: "ખર્ચ્યા", of: "માંથી",
        emergencyFund: "ઇમરજન્સી ફંડ", building: "નિર્માણ", goal: "લક્ષ્ય"
      },
      recentTransactions: "તાજેતરના વ્યવહારો", noRecent: "કોઈ તાજેતરના વ્યવહારો નથી.", viewAll: "બધા જુઓ",
      upcomingBills: "આગામી બિલ", noUpcoming: "કોઈ આગામી બિલ નથી.",
      addMenu: { logExpense: "ખર્ચ લોગ કરો", logFuel: "ઇંધણ લોગ કરો", addAccount: "ખાતું ઉમેરો", addBill: "બિલ ઉમેરો", addGoal: "લક્ષ્ય ઉમેરો", addRoutine: "દિનચર્યા ઉમેરો" },
      modal: { title: "બજેટ અને ભથ્થાં", desc: "ડેશબોર્ડ માટે તમારી દૈનિક ખર્ચ મર્યાદા સેટ કરો.", weekday: "કામકાજનો દિવસ", weekend: "સપ્તાહાંત", cancel: "રદ કરો", save: "ફેરફારો સાચવો" }
    },
    settings: { title: "સેટિંગ્સ", subtitle: "પસંદગીઓ સંચાલિત કરો", profile: "પ્રોફાઇલ", nameLabel: "તમારું નામ", updateName: "નામ અપડેટ કરો", languageTitle: "ભાષા", languageLabel: "એપ્લિકેશન ભાષા", notificationsTitle: "સૂચનાઓ", notificationsLabel: "સૂચનાઓ સક્ષમ કરો", notificationsDesc: "બિલ માટે રિમાઇન્ડર મેળવો.", security: "સુરક્ષા", pinLabel: "પિન સેટ કરો", updatePin: "પિન અપડેટ કરો", clearData: "બધો ડેટા સાફ કરો", clearWarning: "આ તમારો બધો ડેટા કાયમ માટે કાઢી નાખશે." }
  },
  kn: {
    nav: { dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", market: "ಮಾರುಕಟ್ಟೆ", expenses: "ವೆಚ್ಚಗಳು", accounts: "ಖಾತೆಗಳು", goals: "ಗುರಿಗಳು", bills: "ಬಿಲ್‌ಗಳು", fuel: "ಇಂಧನ", routines: "ದಿನಚರಿಗಳು", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು" },
    dashboard: { 
      greeting: "ಶುಭೋದಯ,", greeting_evening: "ಶುಭ ಸಂಜೆ,", greeting_afternoon: "ಶುಭ ಮಧ್ಯಾಹ್ನ,", 
      subtitle: "ಇಲ್ಲಿ ನಿಮ್ಮ ಆರ್ಥಿಕ ಸಾರಾಂಶವಿದೆ.", search: "ಹುಡುಕಿ...", add: "ಸೇರಿಸಿ",
      kpi: { 
        totalBalance: "ಒಟ್ಟು ಬ್ಯಾಲೆನ್ಸ್", totalBalanceDesc: "ಎಲ್ಲಾ ಖಾತೆಗಳಲ್ಲಿ",
        safeToSpend: "ಖರ್ಚು ಮಾಡಲು ಸುರಕ್ಷಿತ", safeToSpendDesc: "ಬ್ಯಾಲೆನ್ಸ್ - ಮುಂಬರುವ ಬಿಲ್‌ಗಳು",
        notionalBalance: "ಕಾಲ್ಪನಿಕ ಬ್ಯಾಲೆನ್ಸ್", notionalBalanceDesc: "ಎಲ್ಲಾ ವೆಚ್ಚಗಳ ನಂತರ",
        monthlyExpenses: "ಮಾಸಿಕ ವೆಚ್ಚಗಳು", thisMonth: "ಈ ತಿಂಗಳು",
        dailyAllowance: "ದೈನಂದಿನ ಭತ್ಯೆ", spent: "ಖರ್ಚು ಮಾಡಲಾಗಿದೆ", of: "ರಲ್ಲಿ",
        emergencyFund: "ತುರ್ತು ನಿಧಿ", building: "ನಿರ್ಮಾಣ", goal: "ಗುರಿ"
      },
      recentTransactions: "ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳು", noRecent: "ಯಾವುದೇ ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳಿಲ್ಲ.", viewAll: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ",
      upcomingBills: "ಮುಂಬರುವ ಬಿಲ್‌ಗಳು", noUpcoming: "ಯಾವುದೇ ಮುಂಬರುವ ಬಿಲ್‌ಗಳಿಲ್ಲ.",
      addMenu: { logExpense: "ವೆಚ್ಚ ಲಾಗ್ ಮಾಡಿ", logFuel: "ಇಂಧನ ಲಾಗ್ ಮಾಡಿ", addAccount: "ಖಾತೆ ಸೇರಿಸಿ", addBill: "ಬಿಲ್ ಸೇರಿಸಿ", addGoal: "ಗುರಿ ಸೇರಿಸಿ", addRoutine: "ದಿನಚರಿ ಸೇರಿಸಿ" },
      modal: { title: "ಬಜೆಟ್ ಮತ್ತು ಭತ್ಯೆಗಳು", desc: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಾಗಿ ನಿಮ್ಮ ದೈನಂದಿನ ಖರ್ಚು ಮಿತಿಗಳನ್ನು ಹೊಂದಿಸಿ.", weekday: "ವಾರದ ದಿನ", weekend: "ವಾರಾಂತ್ಯ", cancel: "ರದ್ದುಮಾಡಿ", save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ" }
    },
    settings: { title: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", subtitle: "ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ", profile: "ಪ್ರೊಫೈಲ್", nameLabel: "ನಿಮ್ಮ ಹೆಸರು", updateName: "ಹೆಸರು ನವೀಕರಿಸಿ", languageTitle: "ಭಾಷೆ", languageLabel: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ", notificationsTitle: "ಅಧಿಸೂಚನೆಗಳು", notificationsLabel: "ಅಧಿಸೂಚನೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ", notificationsDesc: "ಬಿಲ್‌ಗಳಿಗಾಗಿ ಜ್ಞಾಪನೆಗಳನ್ನು ಪಡೆಯಿರಿ.", security: "ಭದ್ರತೆ", pinLabel: "ಪಿನ್ ಹೊಂದಿಸಿ", updatePin: "ಪಿನ್ ನವೀಕರಿಸಿ", clearData: "ಎಲ್ಲಾ ಡೇಟಾವನ್ನು ತೆರವುಗೊಳಿಸಿ", clearWarning: "ಇದು ನಿಮ್ಮ ಡೇಟಾವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ." }
  },
  ml: {
    nav: { dashboard: "ഡാഷ്‌ബോർഡ്", market: "മാർക്കറ്റ്", expenses: "ചെലവുകൾ", accounts: "അക്കൗണ്ടുകൾ", goals: "ലക്ഷ്യങ്ങൾ", bills: "ബില്ലുകൾ", fuel: "ഇന്ധനം", routines: "ദിനചര്യകൾ", settings: "ക്രമീകരണങ്ങൾ" },
    dashboard: { 
      greeting: "സുപ്രഭാതം,", greeting_evening: "ശുഭ സായാഹ്നം,", greeting_afternoon: "ശുഭ ഉച്ചതിരിഞ്ഞ്,", 
      subtitle: "നിങ്ങളുടെ സാമ്പത്തിക സംഗ്രഹം ഇതാ.", search: "തിരയുക...", add: "ചേർക്കുക",
      kpi: { 
        totalBalance: "മൊത്തം ബാലൻസ്", totalBalanceDesc: "എല്ലാ അക്കൗണ്ടുകളിലും",
        safeToSpend: "ചെലവഴിക്കാൻ സുരക്ഷിതം", safeToSpendDesc: "ബാലൻസ് - വരാനിരിക്കുന്ന ബില്ലുകൾ",
        notionalBalance: "സാങ്കൽപ്പിക ബാലൻസ്", notionalBalanceDesc: "എല്ലാ ചെലവുകൾക്കും ശേഷം",
        monthlyExpenses: "പ്രതിമാസ ചെലവുകൾ", thisMonth: "ഈ മാസം",
        dailyAllowance: "പ്രതിദിന അലവൻസ്", spent: "ചെലവഴിച്ചു", of: "ൽ",
        emergencyFund: "അടിയന്തര ഫണ്ട്", building: "നിർമ്മാണം", goal: "ലക്ഷ്യം"
      },
      recentTransactions: "സമീപകാല ഇടപാടുകൾ", noRecent: "സമീപകാല ഇടപാടുകളൊന്നുമില്ല.", viewAll: "എല്ലാം കാണുക",
      upcomingBills: "വരാനിരിക്കുന്ന ബില്ലുകൾ", noUpcoming: "വരാനിരിക്കുന്ന ബില്ലുകളില്ല.",
      addMenu: { logExpense: "ചെലവ് രേഖപ്പെടുത്തുക", logFuel: "ഇന്ധനം രേഖപ്പെടുത്തുക", addAccount: "അക്കൗണ്ട് ചേർക്കുക", addBill: "ബിൽ ചേർക്കുക", addGoal: "ലക്ഷ്യം ചേർക്കുക", addRoutine: "ദിനചര്യ ചേർക്കുക" },
      modal: { title: "ബജറ്റും അലവൻസുകളും", desc: "ഡാഷ്‌ബോർഡിനായി നിങ്ങളുടെ പ്രതിദിന ചെലവ് പരിധികൾ സജ്ജമാക്കുക.", weekday: "പ്രവൃത്തിദിവസം", weekend: "വാരാന്ത്യം", cancel: "റദ്ദാക്കുക", save: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക" }
    },
    settings: { title: "ക്രമീകരണങ്ങൾ", subtitle: "മുൻഗണനകൾ നിയന്ത്രിക്കുക", profile: "പ്രൊഫൈൽ", nameLabel: "നിങ്ങളുടെ പേര്", updateName: "പേര് പുതുക്കുക", languageTitle: "ഭാഷ", languageLabel: "ആപ്ലിക്കേഷൻ ഭാഷ", notificationsTitle: "അറിയിപ്പുകൾ", notificationsLabel: "അറിയിപ്പുകൾ ഓണാക്കുക", notificationsDesc: "ബില്ലുകൾക്കായി ഓർമ്മപ്പെടുത്തലുകൾ നേടുക.", security: "സുരക്ഷ", pinLabel: "പിൻ സജ്ജമാക്കുക", updatePin: "പിൻ പുതുക്കുക", clearData: "എല്ലാ ഡാറ്റയും മായ്‌ക്കുക", clearWarning: "ഇത് നിങ്ങളുടെ ഡാറ്റ ശാശ്വതമായി ഇല്ലാതാക്കും." }
  },
  pa: {
    nav: { dashboard: "ਡੈਸ਼ਬੋਰਡ", market: "ਮਾਰਕੀਟ", expenses: "ਖਰਚੇ", accounts: "ਖਾਤੇ", goals: "ਟੀਚੇ", bills: "ਬਿੱਲ", fuel: "ਈਂਧਨ", routines: "ਰੁਟੀਨ", settings: "ਸੈਟਿੰਗਾਂ" },
    dashboard: { 
      greeting: "ਸ਼ੁਭ ਸਵੇਰ,", greeting_evening: "ਸ਼ੁਭ ਸ਼ਾਮ,", greeting_afternoon: "ਦੁਪਹਿਰ ਦੀ ਰਾਮ ਰਾਮ,", 
      subtitle: "ਇਹ ਤੁਹਾਡਾ ਵਿੱਤੀ ਸੰਖੇਪ ਹੈ।", search: "ਖੋਜ...", add: "ਜੋੜੋ",
      kpi: { 
        totalBalance: "ਕੁੱਲ ਬਕਾਇਆ", totalBalanceDesc: "ਸਾਰੇ ਖਾਤਿਆਂ ਵਿੱਚ",
        safeToSpend: "ਖਰਚਣ ਲਈ ਸੁਰੱਖਿਅਤ", safeToSpendDesc: "ਬਕਾਇਆ - ਆਉਣ ਵਾਲੇ ਬਿੱਲ",
        notionalBalance: "ਕਾਲਪਨਿਕ ਬਕਾਇਆ", notionalBalanceDesc: "ਸਾਰੇ ਖਰਚਿਆਂ ਤੋਂ ਬਾਅਦ",
        monthlyExpenses: "ਮਾਸਿਕ ਖਰਚੇ", thisMonth: "ਇਸ ਮਹੀਨੇ",
        dailyAllowance: "ਰੋਜ਼ਾਨਾ ਭੱਤਾ", spent: "ਖਰਚ ਕੀਤਾ", of: "ਵਿੱਚੋਂ",
        emergencyFund: "ਐਮਰਜੈਂਸੀ ਫੰਡ", building: "ਉਸਾਰੀ", goal: "ਟੀਚਾ"
      },
      recentTransactions: "ਹਾਲੀਆ ਲੈਣ-ਦੇਣ", noRecent: "ਕੋਈ ਹਾਲੀਆ ਲੈਣ-ਦੇਣ ਨਹੀਂ।", viewAll: "ਸਾਰੇ ਦੇਖੋ",
      upcomingBills: "ਆਉਣ ਵਾਲੇ ਬਿੱਲ", noUpcoming: "ਕੋਈ ਆਉਣ ਵਾਲੇ ਬਿੱਲ ਨਹੀਂ।",
      addMenu: { logExpense: "ਖਰਚਾ ਲੌਗ ਕਰੋ", logFuel: "ਈਂਧਨ ਲੌਗ ਕਰੋ", addAccount: "ਖਾਤਾ ਜੋੜੋ", addBill: "ਬਿੱਲ ਜੋੜੋ", addGoal: "ਟੀਚਾ ਜੋੜੋ", addRoutine: "ਰੁਟੀਨ ਜੋੜੋ" },
      modal: { title: "ਬਜਟ ਅਤੇ ਭੱਤੇ", desc: "ਡੈਸ਼ਬੋਰਡ ਲਈ ਆਪਣੀਆਂ ਰੋਜ਼ਾਨਾ ਖਰਚ ਸੀਮਾਵਾਂ ਸੈਟ ਕਰੋ।", weekday: "ਹਫ਼ਤੇ ਦਾ ਦਿਨ", weekend: "ਵੀਕਐਂਡ", cancel: "ਰੱਦ ਕਰੋ", save: "ਤਬਦੀਲੀਆਂ ਸੁਰੱਖਿਅਤ ਕਰੋ" }
    },
    settings: { title: "ਸੈਟਿੰਗਾਂ", subtitle: "ਆਪਣੀਆਂ ਤਰਜੀਹਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ", profile: "ਪ੍ਰੋਫਾਈਲ", nameLabel: "ਤੁਹਾਡਾ ਨਾਮ", updateName: "ਨਾਮ ਅੱਪਡੇਟ ਕਰੋ", languageTitle: "ਭਾਸ਼ਾ", languageLabel: "ਐਪਲੀਕੇਸ਼ਨ ਭਾਸ਼ਾ", notificationsTitle: "ਸੂਚਨਾਵਾਂ", notificationsLabel: "ਸੂਚਨਾਵਾਂ ਚਾਲੂ ਕਰੋ", notificationsDesc: "ਬਿੱਲਾਂ ਲਈ ਰੀਮਾਈਂਡਰ ਪ੍ਰਾਪਤ ਕਰੋ.", security: "ਸੁਰੱਖਿਆ", pinLabel: "ਪਿੰਨ ਸੈੱਟ ਕਰੋ", updatePin: "ਪਿੰਨ ਅੱਪਡੇਟ ਕਰੋ", clearData: "ਸਾਰਾ ਡੇਟਾ ਮਿਟਾਓ", clearWarning: "ਇਹ ਤੁਹਾਡਾ ਸਾਰਾ ਡੇਟਾ ਪੱਕੇ ਤੌਰ 'ਤੇ ਮਿਟਾ ਦੇਵੇਗਾ।" }
  },
  or: {
    nav: { dashboard: "ଡ୍ୟାସବୋର୍ଡ", market: "ବଜାର", expenses: "ଖର୍ଚ୍ଚ", accounts: "ଖାତା", goals: "ଲକ୍ଷ୍ୟ", bills: "ବିଲ୍", fuel: "ଇନ୍ଧନ", routines: "ଦୈନନ୍ଦିନ", settings: "ସେଟିଂସ" },
    dashboard: { 
      greeting: "ଶୁଭ ସକାଳ,", greeting_evening: "ଶୁଭ ସନ୍ଧ୍ୟା,", greeting_afternoon: "ଶୁଭ ଅପରାହ୍ନ,", 
      subtitle: "ଏଠାରେ ଆପଣଙ୍କର ଆର୍ଥିକ ସାରାଂଶ |", search: "ସନ୍ଧାନ...", add: "ଯୋଡନ୍ତୁ",
      kpi: { 
        totalBalance: "ମୋଟ ବାଲାନ୍ସ", totalBalanceDesc: "ସମସ୍ତ ଖାତାରେ",
        safeToSpend: "ଖର୍ଚ୍ଚ କରିବାକୁ ସୁରକ୍ଷିତ", safeToSpendDesc: "ବାଲାନ୍ସ - ଆଗାମୀ ବିଲ୍",
        notionalBalance: "କାଳ୍ପନିକ ବାଲାନ୍ସ", notionalBalanceDesc: "ସମସ୍ତ ଖର୍ଚ୍ଚ ପରେ",
        monthlyExpenses: "ମାସିକ ଖର୍ଚ୍ଚ", thisMonth: "ଏହି ମାସ",
        dailyAllowance: "ଦୈନିକ ଭତ୍ତା", spent: "ଖର୍ଚ୍ଚ ହୋଇଛି", of: "ରୁ",
        emergencyFund: "ଜରୁରୀକାଳୀନ ପାଣ୍ଠି", building: "ନିର୍ମାଣ", goal: "ଲକ୍ଷ୍ୟ"
      },
      recentTransactions: "ସାମ୍ପ୍ରତିକ କାରବାର", noRecent: "କୌଣସି ସାମ୍ପ୍ରତିକ କାରବାର ନାହିଁ |", viewAll: "ସମସ୍ତ ଦେଖନ୍ତୁ",
      upcomingBills: "ଆଗାମୀ ବିଲ୍", noUpcoming: "କୌଣସି ଆଗାମୀ ବିଲ୍ ନାହିଁ |",
      addMenu: { logExpense: "ଖର୍ଚ୍ଚ ଲଗ୍ କରନ୍ତୁ", logFuel: "ଇନ୍ଧନ ଲଗ୍ କରନ୍ତୁ", addAccount: "ଖାତା ଯୋଡନ୍ତୁ", addBill: "ବିଲ୍ ଯୋଡନ୍ତୁ", addGoal: "ଲକ୍ଷ୍ୟ ଯୋଡନ୍ତୁ", addRoutine: "ଦୈନନ୍ଦିନ ଯୋଡନ୍ତୁ" },
      modal: { title: "ବଜେଟ୍ ଏବଂ ଭତ୍ତା", desc: "ଡ୍ୟାସବୋର୍ଡ ପାଇଁ ଆପଣଙ୍କର ଦୈନିକ ଖର୍ଚ୍ଚ ସୀମା ସେଟ୍ କରନ୍ତୁ |", weekday: "କାର୍ଯ୍ୟ ଦିବସ", weekend: "ସପ୍ତାହ ଶେଷ", cancel: "ବାତିଲ୍", save: "ପରିବର୍ତ୍ତନଗୁଡିକ ସେଭ୍ କରନ୍ତୁ" }
    },
    settings: { title: "ସେଟିଂସ", subtitle: "ପସନ୍ଦ ପରିଚାଳନା କରନ୍ତୁ", profile: "ପ୍ରୋଫାଇଲ୍", nameLabel: "ଆପଣଙ୍କ ନାମ", updateName: "ନାମ ଅପଡେଟ୍ କରନ୍ତୁ", languageTitle: "ଭାଷା", languageLabel: "ଆପ୍ ଭାଷା", notificationsTitle: "ବିଜ୍ଞପ୍ତି", notificationsLabel: "ବିଜ୍ଞପ୍ତି ସକ୍ଷମ କରନ୍ତୁ", notificationsDesc: "ବିଲ୍ ପାଇଁ ରିମାଇଣ୍ଡର ପାଆନ୍ତୁ |", security: "ସୁରକ୍ଷା", pinLabel: "ପିନ୍ ସେଟ୍ କରନ୍ତୁ", updatePin: "ପିନ୍ ଅପଡେଟ୍ କରନ୍ତୁ", clearData: "ସମସ୍ତ ଡାଟା ସଫା କରନ୍ତୁ", clearWarning: "ଏହା ଆପଣଙ୍କର ସମସ୍ତ ଡାଟା ସ୍ଥାୟୀ ଭାବରେ ଡିଲିଟ୍ କରିବ |" }
  }
};

Object.keys(translations).forEach(lang => {
  fs.writeFileSync(path.join(localesDir, `${lang}.json`), JSON.stringify(translations[lang], null, 2));
});

console.log("Locales generated!");
