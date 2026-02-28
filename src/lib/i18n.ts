export const translations = {
  en: {
    // App title
    appTitle: "Income & Expense Tracker",
    appSubtitle: "Track your finances with ease",
    
    // Navigation
    monthly: "Monthly",
    yearly: "Yearly",
    
    // Income
    income: "Income",
    addIncome: "Add Income",
    cash: "Cash",
    credit: "Credit",
    
    // Expense
    expense: "Expense",
    addExpense: "Add Expense",
    expenses: "Expenses",
    
    // Categories
    category: "Category",
    default: "Default",
    addCategory: "Add Category",
    isDefault: "Is Default",
    noCategories: "No categories found",
    categories: "Categories",
    
    // Form fields
    amount: "Amount",
    date: "Date",
    note: "Note",
    noteOptional: "Note (Optional)",
    paymentType: "Payment Type",
    submit: "Submit",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    
    // Summary
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    balance: "Balance",
    subtotal: "Subtotal",
    
    // Days of week
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    
    // Months
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
    
    // Actions
    backup: "Backup",
    restore: "Restore",
    export: "Export",
    exportJSON: "Export as JSON",
    exportCSV: "Export as CSV",
    import: "Import",
    
    // Database
    databaseSettings: "Database Settings",
    localDatabase: "Local Database",
    cloudDatabase: "Cloud Database",
    connectMySQL: "Connect to MySQL",
    connectSupabase: "Connect to Supabase",
    supabaseUrl: "Supabase URL",
    supabaseKey: "Supabase Anon Key",
    connect: "Connect",
    disconnect: "Disconnect",
    connected: "Connected",
    disconnected: "Disconnected",
    databaseSource: "Database Source",
    useLocalDb: "Use Local Database",
    useSupabase: "Use Supabase",
    connectionError: "Connection Error",
    connectionSuccess: "Connected Successfully",
    notConnected: "Not connected to Supabase",
    enterCredentials: "Enter Supabase credentials",
    
    // Settings
    settings: "Settings",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    english: "English",
    arabic: "العربية",
    
    // Messages
    success: "Success",
    error: "Error",
    recordAdded: "Record added successfully",
    recordUpdated: "Record updated successfully",
    recordDeleted: "Record deleted successfully",
    backupCreated: "Backup created successfully",
    backupRestored: "Backup restored successfully",
    dataExported: "Data exported successfully",
    importCSV: "Import from CSV",
    importSuccess: "Data imported successfully",
    invalidBackupFile: "Invalid backup file",
    batchImport: "Batch Import",
    batchImportDescription: "Paste your daily records here. Format: Date (01/01/2026), Income Cash, Income Credit, Total Expense",
    batchImportHint: "One record per line. Separate values with commas or tabs.",
    pasteDailyData: "Paste daily data",
    process: "Process",
    
    // Confirmation
    confirmDelete: "Are you sure you want to delete this record?",
    
    // Placeholders
    enterAmount: "Enter amount",
    enterNote: "Enter note (optional)",
    selectCategory: "Select category",
    selectDate: "Select date",
    
    // Year view
    month: "Month",
    year: "Year",
    
    // No data
    noRecords: "No records found",
    addFirstRecord: "Add your first record to get started",
    
    // Currency
    currency: "Currency",
    
    // Categories management
    manageCategories: "Manage Categories",
    categoryName: "Category Name",
    categoryType: "Category Type",
    incomeCategory: "Income Category",
    expenseCategory: "Expense Category",
    
    // Items
    items: "Items",
    itemName: "Item Name",
    optional: "Optional",
    addItem: "Add Item",
    removeItem: "Remove Item",
    total: "Total",
    loading: "Loading...",
    records: "Records",
    image: "Image",
    uploadImage: "Upload Image",
    totalCash: "Total Cash",
    totalCredit: "Total Credit",
    sortBy: "Sort By",
    sortByDate: "Date",
    sortByIncomeLow: "Income (Low)",
    sortByIncomeHigh: "Income (High)",
    sortByExpenseLow: "Expense (Low)",
    sortByExpenseHigh: "Expense (High)",
    toggleTheme: "Toggle Theme",
    sync: "Sync to Supabase",
    syncing: "Syncing...",
    connecting: "Connecting...",
    connectToSupabase: "Connect to Supabase and sync your data securely across devices",
    viewImage: "View Image",
    deleteWarning: "This action cannot be undone. This will permanently delete the record.",
    
    // Admin Panel
    adminPanel: "Admin Panel",
    manageUsers: "Manage Users",
    email: "Email",
    role: "Role",
    status: "Status",
    approved: "Approved",
    pending: "Pending",
    makeAdmin: "Make Admin",
    makeUser: "Make User",
    approve: "Approve",
    revokeApproval: "Revoke Approval",
    userManagement: "User Management",
    waitingApproval: "Waiting for Admin Approval",
    notApprovedMessage: "Your account is waiting for approval from an administrator. You will be able to view and edit records once approved.",
    logout: "Logout",
    logs: "Audit Logs",
    details: "Details",
    signIn: "Sign In",
    signUp: "Sign Up",
    login: "Authentication",
    accountCreated: "Account Created",
    checkEmailForVerification: "Please check your email for a verification link.",
    authRateLimit: "Rate limit exceeded. Please wait a while before trying again.",
    charts: "Charts",
    incomeTrend: "Income Trend",
    monthlyComparison: "Income vs Expense",
    categoryBreakdown: "Category Breakdown",
    aboveAverage: "Above Average",
    belowAverage: "Below Average",
    averageIncome: "Average Income",
    fullYear: "Full Year",
    admin: "Admin",
    users: "Users",
  },
  
  ar: {
    // App title
    appTitle: "متتبع الدخل والمصروفات",
    appSubtitle: "تتبع أموالك بسهولة",
    
    // Navigation
    monthly: "شهري",
    yearly: "سنوي",
    
    // Income
    income: "الدخل",
    addIncome: "إضافة دخل",
    cash: "نقدي",
    credit: "آجل",
    
    // Expense
    expense: "المصروفات",
    addExpense: "إضافة مصروف",
    expenses: "المصروفات",
    
    // Categories
    category: "الفئة",
    default: "افتراضي",
    addCategory: "إضافة فئة",
    isDefault: "فئة افتراضية",
    noCategories: "لا توجد فئات",
    categories: "الفئات",
    
    // Form fields
    amount: "المبلغ",
    date: "التاريخ",
    note: "ملاحظة",
    noteOptional: "ملاحظة (اختياري)",
    paymentType: "نوع الدفع",
    submit: "إرسال",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    
    // Summary
    totalIncome: "إجمالي الدخل",
    totalExpense: "إجمالي المصروفات",
    balance: "الرصيد",
    subtotal: "المجموع الفرعي",
    
    // Days of week
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    
    // Months
    january: "يناير",
    february: "فبراير",
    march: "مارس",
    april: "أبريل",
    may: "مايو",
    june: "يونيو",
    july: "يوليو",
    august: "أغسطس",
    september: "سبتمبر",
    october: "أكتوبر",
    november: "نوفمبر",
    december: "ديسمبر",
    
    // Actions
    backup: "نسخ احتياطي",
    restore: "استعادة",
    export: "تصدير",
    exportJSON: "تصدير كـ JSON",
    exportCSV: "تصدير كـ CSV",
    import: "استيراد",
    
    // Database
    databaseSettings: "إعدادات قاعدة البيانات",
    localDatabase: "قاعدة البيانات المحلية",
    cloudDatabase: "قاعدة البيانات السحابية",
    connectMySQL: "اتصال بـ MySQL",
    connectSupabase: "اتصال بـ Supabase",
    supabaseUrl: "رابط Supabase",
    supabaseKey: "مفتاح Supabase",
    connect: "اتصال",
    disconnect: "قطع الاتصال",
    connected: "متصل",
    disconnected: "غير متصل",
    databaseSource: "مصدر قاعدة البيانات",
    useLocalDb: "استخدام قاعدة البيانات المحلية",
    useSupabase: "استخدام Supabase",
    connectionError: "خطأ في الاتصال",
    connectionSuccess: "تم الاتصال بنجاح",
    notConnected: "غير متصل بـ Supabase",
    enterCredentials: "أدخل بيانات Supabase",
    
    // Settings
    settings: "الإعدادات",
    theme: "المظهر",
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    
    // Messages
    success: "نجاح",
    error: "خطأ",
    recordAdded: "تمت إضافة السجل بنجاح",
    recordUpdated: "تم تحديث السجل بنجاح",
    recordDeleted: "تم حذف السجل بنجاح",
    backupCreated: "تم إنشاء النسخة الاحتياطية بنجاح",
    backupRestored: "تم استعادة النسخة الاحتياطية بنجاح",
    dataExported: "تم تصدير البيانات بنجاح",
    importCSV: "استيراد من CSV",
    importSuccess: "تم استيراد البيانات بنجاح",
    invalidBackupFile: "ملف النسخة الاحتياطية غير صالح",
    batchImport: "استيراد دفعات",
    batchImportDescription: "قم بلصق سجلاتك اليومية هنا. التنسيق: التاريخ (01/01/2026)، دخل نقدي، دخل آجل، إجمالي المصروفات",
    batchImportHint: "سجل لكل سطر. افصل بين القيم بفواصل أو مسافات (Tab).",
    pasteDailyData: "لصق البيانات اليومية",
    process: "معالجة",
    
    // Confirmation
    confirmDelete: "هل أنت متأكد من حذف هذا السجل؟",
    
    // Placeholders
    enterAmount: "أدخل المبلغ",
    enterNote: "أدخل ملاحظة (اختياري)",
    selectCategory: "اختر الفئة",
    selectDate: "اختر التاريخ",
    
    // Year view
    month: "الشهر",
    year: "السنة",
    
    // No data
    noRecords: "لا توجد سجلات",
    addFirstRecord: "أضف سجلك الأول للبدء",
    
    // Currency
    currency: "العملة",
    
    // Categories management
    manageCategories: "إدارة الفئات",
    categoryName: "اسم الفئة",
    categoryType: "نوع الفئة",
    incomeCategory: "فئة الدخل",
    expenseCategory: "فئة المصروفات",
    
    // Items
    items: "العناصر",
    itemName: "اسم العنصر",
    optional: "اختياري",
    addItem: "إضافة عنصر",
    removeItem: "حذف عنصر",
    total: "المجموع",
    loading: "جاري التحميل...",
    records: "السجلات",
    image: "صورة",
    uploadImage: "رفع صورة",
    totalCash: "إجمالي النقدي",
    totalCredit: "إجمالي الآجل",
    sortBy: "ترتيب حسب",
    sortByDate: "التاريخ",
    sortByIncomeLow: "الدخل (الأقل)",
    sortByIncomeHigh: "الدخل (الأعلى)",
    sortByExpenseLow: "المصروفات (الأقل)",
    sortByExpenseHigh: "المصروفات (الأعلى)",
    toggleTheme: "تغيير المظهر",
    sync: "مزامنة مع Supabase",
    syncing: "جاري المزامنة...",
    connecting: "جاري الاتصال...",
    connectToSupabase: "اتصل بـ Supabase وقم بمزامنة بياناتك بأمان عبر الأجهزة",
    viewImage: "عرض الصورة",
    deleteWarning: "لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف السجل بشكل دائم.",
    
    // Admin Panel
    adminPanel: "لوحة التحكم",
    manageUsers: "إدارة المستخدمين",
    email: "البريد الإلكتروني",
    role: "الدور",
    status: "الحالة",
    approved: "تمت الموافقة",
    pending: "قيد الانتظار",
    makeAdmin: "تعيين كمسؤول",
    makeUser: "تعيين كمستخدم",
    approve: "موافقة",
    revokeApproval: "إلغاء الموافقة",
    userManagement: "إدارة المستخدمين",
    waitingApproval: "في انتظار موافقة المسؤول",
    notApprovedMessage: "حسابك في انتظار موافقة المسؤول. ستتمكن من عرض وتعديل السجلات بمجرد الموافقة عليك.",
    logout: "تسجيل الخروج",
    logs: "سجلات العمليات",
    canEdit: "الصلاحيات",
    action: "الإجراء",
    details: "التفاصيل",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    login: "المصادقة",
    accountCreated: "تم إنشاء الحساب",
    checkEmailForVerification: "يرجى التحقق من بريدك الإلكتروني للحصول على رابط التحقق.",
    authRateLimit: "تم تجاوز حد الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.",
    charts: "الرسوم البيانية",
    incomeTrend: "اتجاه الدخل",
    monthlyComparison: "الدخل مقابل المصروفات",
    categoryBreakdown: "توزيع الفئات",
    aboveAverage: "أعلى من المعدل",
    belowAverage: "أقل من المعدل",
    averageIncome: "متوسط الدخل",
    fullYear: "السنة كاملة",
    admin: "المسؤول",
    users: "المستخدمين",
  }
};

export type Language = 'en' | 'ar';
export type TranslationKey = keyof typeof translations.en;
