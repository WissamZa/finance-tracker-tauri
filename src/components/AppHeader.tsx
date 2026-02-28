import { useTheme } from 'next-themes';
import {
  Wallet, Settings, Globe, Sun, Moon, Cloud, CloudOff, Tag,
  Download, Upload, FileJson, FileSpreadsheet, Database, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TranslationKey } from '@/lib/i18n';
import { User } from '@supabase/supabase-js';
import { signOut } from '@/lib/supabase';
import { LogOut, User as UserIcon } from 'lucide-react';

interface AppHeaderProps {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  isOnline: boolean;
  isSupabaseConnected: boolean;
  t: (key: TranslationKey) => string;
  onManageCategories: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onImportCSV: () => void;
  onBatchImport: () => void;
  onExport: (format: 'json' | 'csv') => void;
  onOpenDatabaseSettings: () => void;
  onLogoClick?: () => void;
  user?: User | null;
  canEdit?: boolean;
  isAdmin?: boolean;
}

export function AppHeader({
  language,
  setLanguage,
  isOnline,
  isSupabaseConnected,
  t,
  onManageCategories,
  onBackup,
  onRestore,
  onImportCSV,
  onBatchImport,
  onExport,
  onOpenDatabaseSettings,
  onLogoClick,
  user,
  canEdit = true,
  isAdmin = false,
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const isRTL = language === 'ar';

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onLogoClick?.()}
            className="flex items-center gap-2 sm:gap-3 overflow-hidden group transition-opacity hover:opacity-90 cursor-pointer"
          >
            <div className="p-1.5 sm:p-2 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg sm:text-xl font-black bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                {t('appTitle')}
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground font-bold tracking-tight">
                {isSupabaseConnected ? (
                  <>
                    <Cloud className="h-3 w-3 text-emerald-500" />
                    <span className="truncate">{language === 'ar' ? 'متصل بـ Supabase' : 'Connected to Supabase'}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-3 w-3" />
                    <span className="truncate">{language === 'ar' ? 'يعمل محلياً' : 'Works Offline'}</span>
                  </>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user && (
              <div className="hidden md:flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium mr-2">
                {isAdmin && (
                  <Badge variant="outline" className="text-[8px] h-3 px-1 ml-0.5 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 shrink-0">
                    {language === 'ar' ? 'مسؤول' : 'Admin'}
                  </Badge>
                )}
                <UserIcon className="h-3 w-3 shrink-0" />
                <span className="truncate text-xs">{user.email}</span>
              </div>
            )}

            {/* {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window as any).dispatchEvent(new CustomEvent('open-add-dialog'))}
                className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl h-9 w-9 sm:h-10 sm:w-10"
                aria-label={t('addIncome')}
              >
                <Plus className="h-5 w-5" />
              </Button>
            )} */}

            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                aria-label={t('language')}
              >
                <Globe className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                aria-label={t('toggleTheme')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 transition-all" />
                ) : (
                  <Moon className="h-5 w-5 transition-all" />
                )}
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl" aria-label={t('settings')}>
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56 rounded-2xl shadow-2xl border-none bg-background/95 backdrop-blur-xl">
                <div className="sm:hidden grid grid-cols-2 gap-2 p-2 mb-2 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="flex items-center justify-center gap-2 rounded-xl h-10"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">{language === 'en' ? 'العربية' : 'English'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center justify-center gap-2 rounded-xl h-10"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="text-[10px] font-bold uppercase">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                  </Button>
                </div>
                {user && (
                  <div className="flex flex-col px-2 py-2 mb-1 border-b bg-muted/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('profile' as any) || 'Profile'}</span>
                    <span className="text-xs font-semibold truncate text-foreground">{user.email}</span>
                  </div>
                )}
                <DropdownMenuItem onClick={onOpenDatabaseSettings}>
                  <Database className="mr-2 h-4 w-4" />
                  {t('databaseSettings')}
                </DropdownMenuItem>
                {!canEdit && user && (
                  <div className="px-2 py-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 font-medium border-y border-amber-100 dark:border-amber-900/30">
                    {language === 'ar' ? 'وضع العرض فقط' : 'View-only mode'}
                  </div>
                )}
                <DropdownMenuItem onClick={onManageCategories} disabled={!canEdit}>
                  <Tag className="mr-2 h-4 w-4" />
                  {t('manageCategories')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBackup}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('backup')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRestore} disabled={!canEdit}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('restore')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImportCSV} disabled={!canEdit}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('importCSV')}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={onBatchImport} disabled={!canEdit}>
                    <FileJson className="mr-2 h-4 w-4" />
                    {t('batchImport' as any) || 'Batch Import'}
                  </DropdownMenuItem>
                )}
                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-rose-500 focus:text-rose-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header >
  );
}
