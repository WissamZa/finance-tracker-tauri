import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { translations, TranslationKey } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  initDefaultCategories,
  getCategories,
  addCategory,
  getRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  createBackup,
  restoreBackup,
  exportToJSON,
  exportToCSV,
  clearAllData,
  Category,
  Record,
  Profile,
  getCurrentProfile,
  createLog,
} from '@/lib/db';
import { createSupabaseClient, testSupabaseConnection } from '@/lib/supabase';
import { syncLocalToSupabase } from '@/lib/sync-utils';
import { importFromCSV } from '@/lib/csv-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Shield, ShieldAlert, Plus, Calendar } from 'lucide-react';

// Subcomponents
import { AppHeader } from '@/components/AppHeader';
import { SummaryCards } from '@/components/SummaryCards';
import { RecordsList } from '@/components/RecordsList';
import { AddRecordDialog } from '@/components/AddRecordDialog';
import { CategoryDialog } from '@/components/CategoryDialog';
import { DatabaseSettingsDialog } from '@/components/DatabaseSettingsDialog';
import { Auth } from '@/components/Auth';
import { AdminPanel } from '@/components/AdminPanel';
import { ChartsView } from '@/components/ChartsView';
import { BatchImportDialog } from '@/components/BatchImportDialog';
import { FileUpload } from '@/components/FileUpload';
import { onAuthStateChange, getSession, signOut } from '@/lib/supabase';

// Type definitions moved to lib or shared file in a real app
interface MonthlyData {
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const formatDate = (dateStr: string | Date, t: (key: TranslationKey) => string): { formatted: string; weekday: string } => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const formatted = `${day}/${month}/${year}`;
  const weekdays: TranslationKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekday = t(weekdays[date.getDay()]);
  return { formatted, weekday };
};

const months: TranslationKey[] = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const getMonthName = (month: number, t: (key: TranslationKey) => string): string => {
  return t(months[month]);
};

const formatCurrency = (amount: number, language: 'en' | 'ar'): string => {
  const currency = language === 'ar' ? 'ريال' : 'SAR';
  return `${amount.toLocaleString()} ${currency}`;
};

interface State {
  records: Record[];
  categories: Category[];
  isLoading: boolean;
  activeTab: string;
  isOnline: boolean;
  isAddDialogOpen: boolean;
  isCategoryDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isBatchImportOpen: boolean;
  editingRecord: Record | null;
  deleteRecordId: string | null;
  sortBy: string;
  isConnecting: boolean;
  isSyncing: boolean;
  yearlyData: MonthlyData[];
  signedUrls: { [key: string]: string };
}

type Action =
  | { type: 'SET_RECORDS'; payload: Record[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_ADD_DIALOG'; payload: boolean }
  | { type: 'SET_CATEGORY_DIALOG'; payload: boolean }
  | { type: 'SET_SETTINGS_DIALOG'; payload: boolean }
  | { type: 'SET_BATCH_IMPORT_DIALOG'; payload: boolean }
  | { type: 'SET_EDITING_RECORD'; payload: Record | null }
  | { type: 'SET_DELETE_RECORD_ID'; payload: string | null }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_YEARLY_DATA'; payload: MonthlyData[] }
  | { type: 'SET_SIGNED_URLS'; payload: { [key: string]: string } }
  | { type: 'SET_ADMIN_VIEW' };

const initialState: State = {
  records: [],
  categories: [],
  isLoading: true,
  activeTab: 'monthly',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isAddDialogOpen: false,
  isCategoryDialogOpen: false,
  isSettingsDialogOpen: false,
  isBatchImportOpen: false,
  editingRecord: null,
  deleteRecordId: null,
  sortBy: 'date',
  isConnecting: false,
  isSyncing: false,
  yearlyData: [],
  signedUrls: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_RECORDS': return { ...state, records: action.payload };
    case 'SET_CATEGORIES': return { ...state, categories: action.payload };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
    case 'SET_ONLINE': return { ...state, isOnline: action.payload };
    case 'SET_ADD_DIALOG': return { ...state, isAddDialogOpen: action.payload };
    case 'SET_CATEGORY_DIALOG': return { ...state, isCategoryDialogOpen: action.payload };
    case 'SET_SETTINGS_DIALOG': return { ...state, isSettingsDialogOpen: action.payload };
    case 'SET_BATCH_IMPORT_DIALOG': return { ...state, isBatchImportOpen: action.payload };
    case 'SET_EDITING_RECORD': return { ...state, editingRecord: action.payload };
    case 'SET_DELETE_RECORD_ID': return { ...state, deleteRecordId: action.payload };
    case 'SET_SORT_BY': return { ...state, sortBy: action.payload };
    case 'SET_CONNECTING': return { ...state, isConnecting: action.payload };
    case 'SET_SYNCING': return { ...state, isSyncing: action.payload };
    case 'SET_YEARLY_DATA': return { ...state, yearlyData: action.payload };
    case 'SET_SIGNED_URLS': return { ...state, signedUrls: { ...state.signedUrls, ...action.payload } };
    case 'SET_ADMIN_VIEW': return { ...state, activeTab: 'admin' };
    default: return state;
  }
}

function App() {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    language, setLanguage, currentMonth, setCurrentMonth,
    currentYear, setCurrentYear, databaseSource, setDatabaseSource,
    supabaseConfig, setSupabaseConfig, isSupabaseConnected, setIsSupabaseConnected,
    user, session, profile, setAuth
  } = useAppStore();

  const t = useCallback((key: TranslationKey): string => translations[language][key] || key, [language]);
  const formatMoney = useCallback((amount: number) => formatCurrency(amount, language), [language]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const authInitializedRef = useRef(false);
  const hadSessionOnStartRef = useRef<boolean | null>(null);

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await importFromCSV(databaseSource, content);
        toast.success(t('success'), { description: t('importSuccess') });
        fetchRecords(); fetchCategories();
      } catch (err) { toast.error(t('error'), { description: String(err) }); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleOpenAdd = () => dispatch({ type: 'SET_ADD_DIALOG', payload: true });
    window.addEventListener('open-add-dialog', handleOpenAdd);
    return () => window.removeEventListener('open-add-dialog', handleOpenAdd);
  }, []);

  // Auth session listener
  useEffect(() => {
    if (!mounted) return;

    // Listen for auth state changes - this fires immediately on subscription
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      // Update session state in ref to track transitions
      const prevHadSession = hadSessionOnStartRef.current;

      if (event === 'INITIAL_SESSION') {
        hadSessionOnStartRef.current = !!session;
        authInitializedRef.current = true;
        setAuth(session?.user ?? null, session, session ? await getCurrentProfile() : null);
        setIsSupabaseConnected(!!session);
        return;
      }

      let profileData: Profile | null = null;
      if (session) {
        profileData = await getCurrentProfile();

        // Log login if the event is SIGNED_IN and we previously had NO session
        // (This prevents logging on page refresh which fires INITIAL_SESSION then SIGNED_IN)
        if (event === 'SIGNED_IN' && prevHadSession === false) {
          createLog('LOGIN', { email: session.user.email });
        }
        hadSessionOnStartRef.current = true;
      } else {
        hadSessionOnStartRef.current = false;
      }

      setAuth(session?.user ?? null, session, profileData);
      setIsSupabaseConnected(!!session);
    });

    return () => {
      subscription.unsubscribe();
      authInitializedRef.current = false;
    };
  }, [mounted, setAuth, setIsSupabaseConnected]);

  const fetchRecords = useCallback(async () => {
    try {
      const data = await getRecords(databaseSource, currentMonth, currentYear);
      dispatch({ type: 'SET_RECORDS', payload: data });

      // Note: Batch pre-fetch signed URLs for files is handled differently in Tauri
      // The API route /api/files/batch-sign is not available in Tauri
      // File signing should be handled through Tauri commands or direct Supabase calls
      const keys = [...new Set(data.flatMap(r => (r.lineItems || []).map(li => li.imageData)).filter(Boolean) as string[])];
      if (keys.length > 0 && databaseSource === 'supabase') {
        // TODO: Implement file signing for Tauri (e.g., via Tauri command or direct Supabase SDK)
        console.log('File signing needed for keys:', keys);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      dispatch({ type: 'SET_RECORDS', payload: [] });
    }
  }, [databaseSource, currentMonth, currentYear]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories(databaseSource);
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (error) {
      console.error('Error fetching categories:', error);
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, [databaseSource]);

  const fetchYearlyData = useCallback(async () => {
    try {
      const allRecords = await getRecords(databaseSource, undefined, currentYear);
      const monthlyData: MonthlyData[] = [];
      for (let month = 0; month < 12; month++) {
        const monthRecords = allRecords.filter(r => new Date(r.date).getMonth() === month);
        const income = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + (r.cashAmount || 0) + (r.creditAmount || 0), 0);
        const expense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + (r.lineItems || []).reduce((itemSum, item) => itemSum + (item.cashAmount || 0) + (item.creditAmount || 0), 0), 0);
        monthlyData.push({ month, totalIncome: income, totalExpense: expense, balance: income - expense });
      }
      dispatch({ type: 'SET_YEARLY_DATA', payload: monthlyData });
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    }
  }, [databaseSource, currentYear]);

  useEffect(() => {
    if (mounted) {
      const loadData = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        await initDefaultCategories(databaseSource);
        await Promise.all([fetchRecords(), fetchCategories()]);
        dispatch({ type: 'SET_LOADING', payload: false });
      };
      loadData();
    }
  }, [mounted, fetchRecords, fetchCategories, databaseSource]);

  // Derived state
  const totals = state.records.reduce((acc, r) => {
    const isIncome = r.type === 'income';
    const cash = isIncome ? (r.cashAmount || 0) : (r.lineItems || []).reduce((s, i) => s + (i.cashAmount || 0), 0);
    const credit = isIncome ? (r.creditAmount || 0) : (r.lineItems || []).reduce((s, i) => s + (i.creditAmount || 0), 0);
    if (isIncome) {
      acc.totalIncome += cash + credit;
      acc.totalCashIncome += cash;
      acc.totalCreditIncome += credit;
    } else {
      acc.totalExpense += cash + credit;
      acc.totalCashExpense += cash;
      acc.totalCreditExpense += credit;
    }
    return acc;
  }, { totalIncome: 0, totalExpense: 0, totalCashIncome: 0, totalCreditIncome: 0, totalCashExpense: 0, totalCreditExpense: 0 });

  const incomeRecords = state.records.filter(r => r.type === 'income');
  const averageIncome = incomeRecords.length > 0 ? totals.totalIncome / incomeRecords.length : 0;

  const sortedGroupedRecords = (() => {
    const groups = new Map<string, any>();
    state.records.forEach(record => {
      const dateKey = new Date(record.date).toDateString();
      const existing = groups.get(dateKey);
      const recordTotal = record.type === 'income'
        ? (record.cashAmount || 0) + (record.creditAmount || 0)
        : (record.lineItems || []).reduce((sum, item) => sum + (item.cashAmount || 0) + (item.creditAmount || 0), 0);

      if (existing) {
        if (record.type === 'income') { existing.incomeRecords.push(record); existing.totalIncome += recordTotal; }
        else { existing.expenseRecords.push(record); existing.totalExpense += recordTotal; }
      } else {
        groups.set(dateKey, {
          date: dateKey, dateObj: new Date(record.date),
          incomeRecords: record.type === 'income' ? [record] : [],
          expenseRecords: record.type === 'expense' ? [record] : [],
          totalIncome: record.type === 'income' ? recordTotal : 0,
          totalExpense: record.type === 'expense' ? recordTotal : 0,
        });
      }
    });
    return Array.from(groups.values()).sort((a, b) => {
      switch (state.sortBy) {
        case 'income-low': return a.totalIncome - b.totalIncome;
        case 'income-high': return b.totalIncome - a.totalIncome;
        case 'expense-low': return a.totalExpense - b.totalExpense;
        case 'expense-high': return b.totalExpense - a.totalExpense;
        default: return b.dateObj.getTime() - a.dateObj.getTime();
      }
    });
  })();

  // Handlers
  const handleBackup = async () => {
    try {
      const data = await createBackup(databaseSource);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(t('success'), { description: t('backupCreated') });
    } catch { toast.error(t('error')); }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await restoreBackup(databaseSource, data);
        toast.success(t('success'), { description: t('backupRestored') });
        fetchRecords(); fetchCategories();
      } catch (err) { toast.error(t('error'), { description: String(err) }); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = format === 'csv' ? await exportToCSV(databaseSource, currentMonth, currentYear) : JSON.stringify(await exportToJSON(databaseSource, currentMonth, currentYear), null, 2);
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `finance-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(t('success'), { description: t('dataExported') });
    } catch { toast.error(t('error')); }
  };

  const handleSupabaseConnect = async (url: string, key: string) => {
    dispatch({ type: 'SET_CONNECTING', payload: true });
    try {
      const result = await testSupabaseConnection(url, key);
      if (result.success) {
        createSupabaseClient(url, key);
        setSupabaseConfig({ url, key });
        setIsSupabaseConnected(true);
        toast.success(t('connectionSuccess'));
        fetchRecords(); fetchCategories();
      } else { toast.error(t('connectionError'), { description: result.error }); }
    } catch (err) { toast.error(t('connectionError'), { description: String(err) }); }
    finally { dispatch({ type: 'SET_CONNECTING', payload: false }); }
  };

  const handleSyncToSupabase = async () => {
    if (!isSupabaseConnected) return toast.error(t('error'), { description: t('notConnected') });
    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      const result = await syncLocalToSupabase();
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        toast.success(t('success'), { description: 'Sync completed successfully' });
        if (databaseSource === 'supabase') { fetchRecords(); fetchCategories(); }
      } else { throw new Error(result && typeof result === 'object' && 'error' in result ? String(result.error) : 'Sync failed'); }
    } catch (error) { toast.error(t('error'), { description: String(error) }); }
    finally { dispatch({ type: 'SET_SYNCING', payload: false }); }
  };

  if (!mounted) return null;

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* Premium Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-emerald-200/40 dark:bg-emerald-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-200/40 dark:bg-blue-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/30 dark:bg-purple-600/5 rounded-3xl blur-[80px]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-white/10 via-background/20 to-background/60" />
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore} />
      <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />

      <AppHeader
        language={language}
        setLanguage={setLanguage}
        isOnline={state.isOnline}
        isSupabaseConnected={isSupabaseConnected}
        t={t}
        user={user}
        canEdit={profile?.canEdit || profile?.role === 'admin' || !user}
        isAdmin={profile?.role === 'admin'}
        onManageCategories={() => dispatch({ type: 'SET_CATEGORY_DIALOG', payload: true })}
        onBackup={handleBackup}
        onRestore={() => fileInputRef.current?.click()}
        onImportCSV={() => csvInputRef.current?.click()}
        onBatchImport={() => dispatch({ type: 'SET_BATCH_IMPORT_DIALOG', payload: true })}
        onExport={handleExport}
        onOpenDatabaseSettings={() => dispatch({ type: 'SET_SETTINGS_DIALOG', payload: true })}
        onLogoClick={() => {
          // In Tauri, we just reset to monthly tab instead of navigating
          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'monthly' });
        }}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-1 sm:px-6 py-6 pb-10 relative z-10">
        {databaseSource === 'supabase' && !session ? (
          <Auth t={t} language={language} />
        ) : databaseSource === 'supabase' && session && !profile?.isApproved ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-lg mx-auto p-8 rounded-4xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-500">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight">{t('waitingApproval' as any)}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">{t('notApprovedMessage' as any)}</p>
            </div>
            <Button variant="outline" onClick={() => signOut()} className="rounded-full px-8 h-12 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all duration-300">
              {t('logout' as any) || 'Logout'}
            </Button>
          </div>
        ) : (
          <Tabs value={state.activeTab} onValueChange={(v) => { dispatch({ type: 'SET_ACTIVE_TAB', payload: v }); if (v === 'yearly' || v === 'charts') fetchYearlyData(); }} className="space-y-8">
            <TabsList className={`grid w-full mx-auto p-1 bg-muted/50 backdrop-blur-md rounded-2xl ${user && profile?.role === 'admin' ? 'max-w-2xl grid-cols-5 h-14' : 'max-w-lg grid-cols-4 h-12'}`}>
              <TabsTrigger value="monthly" className="rounded-xl font-bold uppercase tracking-tighter text-[10px] sm:text-xs">{t('monthly')}</TabsTrigger>
              <TabsTrigger value="charts" className="rounded-xl font-bold uppercase tracking-tighter text-[10px] sm:text-xs">{t('charts')}</TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-xl font-bold uppercase tracking-tighter text-[10px] sm:text-xs">{t('yearly')}</TabsTrigger>
              <TabsTrigger value="files" className="rounded-xl font-bold uppercase tracking-tighter text-[10px] sm:text-xs">Files</TabsTrigger>
              {user && profile?.role === 'admin' && (
                <TabsTrigger value="admin" className="gap-2 rounded-xl font-bold uppercase tracking-tighter text-[10px] sm:text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  {t('admin')}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="monthly" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:ring-0">
              <div className="flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/80 shrink-0" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(p => p - 1); } else { setCurrentMonth(p => p - 1); } }}>
                  {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>

                <div className="flex items-center justify-center gap-2">
                  <Select value={String(currentMonth)} onValueChange={(v) => setCurrentMonth(parseInt(v))}>
                    <SelectTrigger className="h-auto px-6 py-2 rounded-2xl border border-white/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg font-black transition-all hover:scale-[1.02] focus:ring-0">
                      <div className="flex items-center justify-center gap-2 text-center">
                        <span className="text-xl sm:text-2xl bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                          {getMonthName(currentMonth, t)}
                        </span>
                        <span className="text-xs font-bold opacity-30">({String(currentMonth + 1).padStart(2, '0')})</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {months.map((m, i) => (
                        <SelectItem key={m} value={String(i)} className="rounded-xl font-bold">
                          <div className="flex items-center justify-between w-full min-w-[120px]">
                            <span>{t(m)}</span>
                            <span className="text-[10px] opacity-40 ml-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(parseInt(v))}>
                    <SelectTrigger className="h-auto px-6 py-2 rounded-2xl border border-white/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg font-bold transition-all hover:scale-[1.02] focus:ring-0">
                      <div className="text-muted-foreground tracking-widest text-xs sm:text-sm uppercase opacity-60 text-center">
                        {currentYear}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {Array.from({ length: 5 }, (_, i) => 2025 + i).map(y => (
                        <SelectItem key={y} value={String(y)} className="rounded-xl font-bold">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/80 shrink-0" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(p => p + 1); } else { setCurrentMonth(p => p + 1); } }}>
                  {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
              </div>

              <SummaryCards t={t} formatMoney={formatMoney} balance={totals.totalIncome - totals.totalExpense} {...totals} />

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-4 sm:px-0">
                  <h3 className="text-xl font-black tracking-tight">{t('transactions' as any) || 'History'}</h3>
                  <div className="h-px flex-1 mx-4 bg-linear-to-r from-muted to-transparent" />
                </div>

                <RecordsList
                  t={t} formatMoney={formatMoney} formatDate={formatDate}
                  isLoading={state.isLoading} sortedGroupedRecords={sortedGroupedRecords}
                  categories={state.categories} sortBy={state.sortBy}
                  setSortBy={(v) => dispatch({ type: 'SET_SORT_BY', payload: v })}
                  onEdit={(record) => { dispatch({ type: 'SET_EDITING_RECORD', payload: record }); dispatch({ type: 'SET_ADD_DIALOG', payload: true }); }}
                  onDelete={(id) => dispatch({ type: 'SET_DELETE_RECORD_ID', payload: id })}
                  isRTL={isRTL}
                  canEdit={profile?.canEdit || profile?.role === 'admin' || !user}
                  averageIncome={averageIncome}
                  isAdmin={profile?.role === 'admin'}
                  signedUrls={state.signedUrls}
                  onFileDelete={async (key) => {
                    // Note: File deletion via API route is not available in Tauri
                    // TODO: Implement file deletion via Tauri command or direct Supabase call
                    try {
                      console.log('File deletion needed for key:', key);
                      toast.info('File deletion - implement via Tauri command');
                      fetchRecords();
                    } catch (error) {
                      toast.error('Failed to delete file');
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:ring-0">
              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/80" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(p => p - 1); } else { setCurrentMonth(p => p - 1); } }}>
                  {isRTL ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </Button>

                <div className="flex flex-col items-center gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-10 py-4 rounded-4xl border border-white/20 shadow-xl">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent text-center">{t('charts')}</h2>
                  <div className="flex items-center justify-center gap-3">
                    <Select value={String(currentMonth)} onValueChange={(v) => setCurrentMonth(parseInt(v))}>
                      <SelectTrigger className="h-auto px-4 py-1.5 rounded-xl border border-white/10 bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm transition-all focus:ring-0">
                        <div className="flex items-center justify-center gap-1.5 text-center">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{getMonthName(currentMonth, t)}</span>
                          <span className="text-[10px] font-bold opacity-30 tabular-nums">({String(currentMonth + 1).padStart(2, '0')})</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {months.map((m, i) => (
                          <SelectItem key={m} value={String(i)} className="rounded-xl font-bold">
                            <div className="flex items-center justify-between w-full min-w-[100px]">
                              <span>{t(m)}</span>
                              <span className="text-[10px] opacity-40 ml-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />

                    <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(parseInt(v))}>
                      <SelectTrigger className="h-auto px-4 py-1.5 rounded-xl border border-white/10 bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm transition-all focus:ring-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 text-center w-full">{currentYear}</span>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {Array.from({ length: 16 }, (_, i) => 2020 + i).map(y => (
                          <SelectItem key={y} value={String(y)} className="rounded-xl font-bold">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/80" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(p => p + 1); } else { setCurrentMonth(p => p + 1); } }}>
                  {isRTL ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                </Button>
              </div>

              <ChartsView
                t={t}
                records={state.records}
                categories={state.categories}
                language={language}
                yearlyData={state.yearlyData}
              />
            </TabsContent>

            <TabsContent value="yearly" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:ring-0">
              <div className="flex items-center justify-center gap-6">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-muted/80 transition-all" onClick={() => setCurrentYear(p => p - 1)}>
                  {isRTL ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </Button>
                <div className="text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-10 py-4 rounded-4xl border border-white/20 shadow-xl">
                  <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(parseInt(v))}>
                    <SelectTrigger className="w-auto h-auto p-0 border-none bg-transparent hover:bg-transparent shadow-none focus:ring-0">
                      <h2 className="text-4xl font-black tracking-tighter bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">{currentYear}</h2>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {Array.from({ length: 16 }, (_, i) => 2020 + i).map(y => (
                        <SelectItem key={y} value={String(y)} className="rounded-xl font-bold">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60 mt-1">{t('yearlyOverview' as any) || 'Annual Summary'}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-muted/80 transition-all" onClick={() => setCurrentYear(p => p + 1)}>
                  {isRTL ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                </Button>
              </div>

              <SummaryCards
                t={t}
                formatMoney={formatMoney}
                balance={state.yearlyData.reduce((sum, m) => sum + m.balance, 0)}
                totalIncome={state.yearlyData.reduce((sum, m) => sum + m.totalIncome, 0)}
                totalExpense={state.yearlyData.reduce((sum, m) => sum + m.totalExpense, 0)}
                totalCashIncome={0}
                totalCreditIncome={0}
                totalCashExpense={0}
                totalCreditExpense={0}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.yearlyData.map((monthData) => (
                  <Card
                    key={monthData.month}
                    className="group relative overflow-hidden border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-4xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => { setCurrentMonth(monthData.month); dispatch({ type: 'SET_ACTIVE_TAB', payload: 'monthly' }); }}
                  >
                    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${monthData.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {monthData.balance >= 0 ? <TrendingUp className="h-16 w-16" /> : <TrendingDown className="h-16 w-16" />}
                    </div>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-black tracking-tight flex items-center justify-between">
                        {getMonthName(monthData.month, t)}
                        <span className="text-xs font-bold opacity-30 tabular-nums">{String(monthData.month + 1).padStart(2, '0')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" /> {t('income')}
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(monthData.totalIncome)}</span>
                        </div>
                        <div className="h-1 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (monthData.totalIncome / (state.yearlyData.reduce((max, m) => Math.max(max, m.totalIncome), 0) || 1)) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-rose-500" /> {t('expense')}
                          </span>
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatMoney(monthData.totalExpense)}</span>
                        </div>
                        <div className="h-1 w-full bg-rose-500/10 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (monthData.totalExpense / (state.yearlyData.reduce((max, m) => Math.max(max, m.totalExpense), 0) || 1)) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-muted">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest">{t('balance')}</span>
                          <span className={`text-lg font-black tabular-nums ${monthData.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{formatMoney(monthData.balance)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:ring-0">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <h2 className="text-4xl font-black tracking-tighter bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">File Management</h2>
                  <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">Upload and download files securely via R2</p>
                </div>

                <div className="w-full max-w-lg">
                  <FileUpload onUploadComplete={(key) => {
                    console.log("Uploaded file key:", key);
                  }} />
                </div>
              </div>
            </TabsContent>

            {user && profile?.role === 'admin' && (
              <TabsContent value="admin" className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:ring-0">
                <AdminPanel t={t} language={language} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>

      <AddRecordDialog
        isOpen={state.isAddDialogOpen}
        onOpenChange={(open) => {
          dispatch({ type: 'SET_ADD_DIALOG', payload: open });
          if (!open) dispatch({ type: 'SET_EDITING_RECORD', payload: null });
        }}
        onSubmit={async (data) => {
          try {
            if (state.editingRecord) {
              await updateRecord(
                databaseSource,
                state.editingRecord.id,
                data.type,
                data.cashAmount,
                data.creditAmount,
                data.date,
                data.note,
                data.lineItems
              );
              toast.success(t('success'), { description: t('recordUpdated') });
            } else {
              await addRecord(
                databaseSource,
                data.type,
                data.cashAmount,
                data.creditAmount,
                data.date,
                data.note,
                data.lineItems
              );
              toast.success(t('success'), { description: t('recordAdded') });
            }
            fetchRecords();
            dispatch({ type: 'SET_ADD_DIALOG', payload: false });
            dispatch({ type: 'SET_EDITING_RECORD', payload: null });
          } catch (error) {
            console.error('Error saving record:', error);
            toast.error(t('error'));
          }
        }}
        onCancel={() => {
          dispatch({ type: 'SET_ADD_DIALOG', payload: false });
          dispatch({ type: 'SET_EDITING_RECORD', payload: null });
        }}
        categories={state.categories}
        t={t}
        formatMoney={formatMoney}
        editingRecord={state.editingRecord}
      />

      <CategoryDialog
        t={t} categories={state.categories} isOpen={state.isCategoryDialogOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_CATEGORY_DIALOG', payload: open })}
        onAddCategory={async (name, type) => {
          try {
            await addCategory(databaseSource, name, type, false);
            toast.success(t('success'));
            fetchCategories();
          } catch { toast.error(t('error')); }
        }}
      />

      <DatabaseSettingsDialog
        t={t} language={language} databaseSource={databaseSource} setDatabaseSource={setDatabaseSource}
        isSupabaseConnected={isSupabaseConnected} setIsSupabaseConnected={setIsSupabaseConnected}
        setSupabaseConfig={setSupabaseConfig} isOpen={state.isSettingsDialogOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_SETTINGS_DIALOG', payload: open })}
        onSync={handleSyncToSupabase} onConnect={handleSupabaseConnect}
        isConnecting={state.isConnecting} isSyncing={state.isSyncing}
      />

      <BatchImportDialog
        t={t}
        isOpen={state.isBatchImportOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_BATCH_IMPORT_DIALOG', payload: open })}
        databaseSource={databaseSource}
        currentYear={currentYear}
        onSuccess={() => fetchRecords()}
      />

      <AlertDialog open={!!state.deleteRecordId} onOpenChange={(open) => !open && dispatch({ type: 'SET_DELETE_RECORD_ID', payload: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!state.deleteRecordId) return;
                try {
                  await deleteRecord(databaseSource, state.deleteRecordId);
                  toast.success(t('success'), { description: t('recordDeleted') });
                  fetchRecords();
                } catch { toast.error(t('error')); }
                finally { dispatch({ type: 'SET_DELETE_RECORD_ID', payload: null }); }
              }}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button */}
      {(!user || profile?.canEdit || profile?.role === 'admin') && (
        <Button
          size="icon"
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} h-14 w-14 rounded-full shadow-2xl bg-linear-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all hover:scale-110 active:scale-95 z-50`}
          onClick={() => dispatch({ type: 'SET_ADD_DIALOG', payload: true })}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

export default App;
