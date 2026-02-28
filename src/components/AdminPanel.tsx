'use client';

import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  getProfiles, updateProfile, Profile, getAuditLogs, AuditLog, clearAdminCache,
  getCategories, addCategory, updateCategory, deleteCategory, Category
} from '@/lib/supabase-db';
import { TranslationKey } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  User, Shield, ShieldAlert, CheckCircle2, XCircle, MoreVertical,
  Loader2, RefreshCcw, Users, History, FileText, Database, Settings, LogIn, Plus, Pencil, Trash2, Tag,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

interface AdminPanelProps {
  t: (key: TranslationKey) => string;
  language: string;
}

export function AdminPanel({ t, language }: AdminPanelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'users' | 'logs' | 'categories'>('users');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('income');
  const [newCatIsDefault, setNewCatIsDefault] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
      clearAdminCache();
    } else {
      setLoading(true);
    }

    try {
      const [profilesData, logsData, categoriesData] = await Promise.all([
        getProfiles(),
        getAuditLogs(),
        getCategories()
      ]);
      setProfiles(profilesData);
      setLogs(logsData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await updateProfile(id, { isApproved: !currentStatus });
      setProfiles(profiles.map(p => p.id === id ? { ...p, isApproved: !currentStatus } : p));
      toast.success(t('success'));
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    }
  };

  const handleToggleEdit = async (id: string, currentStatus: boolean) => {
    try {
      await updateProfile(id, { canEdit: !currentStatus });
      setProfiles(profiles.map(p => p.id === id ? { ...p, canEdit: !currentStatus } : p));
      toast.success(t('success'));
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    }
  };

  const handleToggleRole = async (id: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateProfile(id, { role: newRole });
      setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p));
      toast.success(t('success'));
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    }
  };

  const handleSaveCategory = async () => {
    if (!newCatName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: newCatName,
          type: newCatType,
          isDefault: newCatIsDefault
        });
        toast.success(t('recordUpdated' as any));
      } else {
        await addCategory(newCatName, newCatType, newCatIsDefault);
        toast.success(t('recordAdded' as any));
      }

      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setNewCatName('');
      setNewCatType('income');
      setNewCatIsDefault(false);

      // Refresh categories
      const updatedCats = await getCategories();
      setCategories(updatedCats);
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t('confirmDelete' as any))) return;

    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success(t('recordDeleted' as any));
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatType('income');
    setNewCatIsDefault(false);
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatType(cat.type);
    setNewCatIsDefault(cat.isDefault);
    setIsCategoryDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-muted-foreground animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  const isRTL = language === 'ar';

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'UPDATE': return <Pencil className="h-4 w-4 text-amber-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-rose-500" />;
      case 'SIGNUP': return <User className="h-4 w-4 text-blue-500" />;
      case 'LOGIN': return <LogIn className="h-4 w-4 text-indigo-500" />;
      default: return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatLogAction = (log: AuditLog) => {
    const action = log.action;
    const table = log.entity_type;
    return (
      <div className="flex items-center gap-2">
        {getActionIcon(action)}
        <span className="font-semibold">{action}</span>
        <span className="text-muted-foreground uppercase text-[10px] opacity-70">{table || 'system'}</span>
      </div>
    );
  };

  const getLogDetails = (log: AuditLog) => {
    const details = log.details;
    if (!details) return '-';

    const oldVal = details.old || {};
    const newVal = details.new || {};
    const entity = log.entity_type;

    // 1. Records (Financial)
    if (entity === 'records') {
      const date = newVal.date || oldVal.date;
      const cash = newVal.cashAmount ?? oldVal.cashAmount;
      const credit = newVal.creditAmount ?? oldVal.creditAmount;
      const type = newVal.type || oldVal.type;

      return (
        <div className="flex flex-col items-center gap-1">
          <Badge variant="outline" className="gap-1 font-mono text-[10px]">
            <Calendar className="h-3 w-3" />
            {date ? new Date(date).toLocaleDateString() : 'No Date'}
          </Badge>
          {(cash > 0 || credit > 0) && (
            <span className={`text-[10px] font-bold ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {type === 'income' ? '+' : '-'}{(cash + credit).toLocaleString()}
            </span>
          )}
        </div>
      );
    }

    // 2. Line Items
    if (entity === 'line_items') {
      const name = newVal.name || oldVal.name;
      const amount = (newVal.cashAmount || 0) + (newVal.creditAmount || 0) || (oldVal.cashAmount || 0) + (oldVal.creditAmount || 0);
      return (
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium truncate max-w-[120px]">{name}</span>
          {amount > 0 && <span className="text-[9px] text-muted-foreground">{amount.toLocaleString()}</span>}
        </div>
      );
    }

    // 3. Profiles (Status Changes)
    if (entity === 'profiles') {
      if (log.action === 'UPDATE') {
        if (oldVal.isApproved !== newVal.isApproved) {
          return (
            <Badge className={newVal.isApproved ? 'bg-emerald-500' : 'bg-amber-500'}>
              {newVal.isApproved ? 'Approved' : 'Unapproved'}
            </Badge>
          );
        }
        if (oldVal.role !== newVal.role) {
          return <Badge variant="outline">{newVal.role}</Badge>;
        }
      }
      return <span className="text-xs">{newVal.email || oldVal.email}</span>;
    }

    // 4. Categories
    if (entity === 'categories') {
      return <span className="text-xs font-semibold">{newVal.name || oldVal.name}</span>;
    }

    // 5. General Actions (Login/Signup)
    if (log.action === 'LOGIN' || log.action === 'SIGNUP') {
      return <span className="text-xs text-muted-foreground italic">{log.action === 'LOGIN' ? 'Session Started' : 'Account Created'}</span>;
    }

    return <span className="text-[10px] text-muted-foreground opacity-50 italic">System Event</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('adminPanel' as any)}</h2>
            <p className="text-muted-foreground">{t('manageUsers')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="rounded-full hover:rotate-180 transition-transform duration-500"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            {t('userManagement' as any)}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            {t('categories')}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            {t('logs' as any)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0 focus-visible:ring-0">
          <Card className="overflow-hidden border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl">
            <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('email')}</TableHead>
                      <TableHead className="text-center">{t('role')}</TableHead>
                      <TableHead className="text-center">{t('status')}</TableHead>
                      <TableHead className="text-center">{t('canEdit' as any)}</TableHead>
                      <TableHead className={isRTL ? 'text-left' : 'text-right'}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {profiles.map((profile) => (
                        <motion.tr
                          key={profile.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          layout
                          className="group hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                {profile.email?.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[200px] sm:max-w-none">{profile.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={profile.role === 'admin' ? 'default' : 'secondary'}
                              className={`gap-1 px-2.5 py-0.5 ${profile.role === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                            >
                              {profile.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                              {profile.role === 'admin' ? (language === 'ar' ? 'مسؤول' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'User')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={profile.isApproved}
                                onCheckedChange={() => handleToggleApproval(profile.id, profile.isApproved)}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                              <span className={`text-xs font-semibold ${profile.isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {profile.isApproved ? (
                                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {t('approved')}</span>
                                ) : (
                                  <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> {t('pending')}</span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={profile.canEdit}
                                disabled={profile.role === 'admin'}
                                onCheckedChange={() => handleToggleEdit(profile.id, profile.canEdit)}
                                className="data-[state=checked]:bg-blue-500"
                              />
                              <Badge variant="outline" className="text-[10px]">
                                {profile.canEdit || profile.role === 'admin' ? (language === 'ar' ? 'تعديل' : 'Edit') : (language === 'ar' ? 'عرض' : 'View')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48 p-1">
                                <DropdownMenuItem
                                  onClick={() => handleToggleApproval(profile.id, profile.isApproved)}
                                  className="gap-2 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                >
                                  {profile.isApproved ? (
                                    <><XCircle className="h-4 w-4 text-amber-500" /> {t('revokeApproval')}</>
                                  ) : (
                                    <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t('approve')}</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleRole(profile.id, profile.role)}
                                  className="gap-2 cursor-pointer focus:bg-indigo-50 dark:focus:bg-indigo-900/20"
                                >
                                  {profile.role === 'admin' ? (
                                    <><User className="h-4 w-4 text-slate-500" /> {t('makeUser')}</>
                                  ) : (
                                    <><ShieldAlert className="h-4 w-4 text-indigo-500" /> {t('makeAdmin')}</>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4 p-4">
                {profiles.map((profile) => (
                  <Card key={profile.id} className="p-4 border-none bg-muted/30 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                          {profile.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[150px]">{profile.email}</span>
                          <Badge
                            variant={profile.role === 'admin' ? 'default' : 'secondary'}
                            className="text-[9px] w-fit"
                          >
                            {profile.role === 'admin' ? (language === 'ar' ? 'مسؤول' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'User')}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                          <DropdownMenuItem
                            onClick={() => handleToggleApproval(profile.id, profile.isApproved)}
                            className="gap-2 cursor-pointer"
                          >
                            {profile.isApproved ? (
                              <><XCircle className="h-4 w-4 text-amber-500" /> {t('revokeApproval')}</>
                            ) : (
                              <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t('approve')}</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleRole(profile.id, profile.role)}
                            className="gap-2 cursor-pointer"
                          >
                            {profile.role === 'admin' ? (
                              <><User className="h-4 w-4 text-slate-500" /> {t('makeUser')}</>
                            ) : (
                              <><ShieldAlert className="h-4 w-4 text-indigo-500" /> {t('makeAdmin')}</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('status')}</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={profile.isApproved}
                            onCheckedChange={() => handleToggleApproval(profile.id, profile.isApproved)}
                          />
                          <span className="text-xs font-bold">{profile.isApproved ? t('approved') : t('pending')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('canEdit' as any)}</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={profile.canEdit}
                            disabled={profile.role === 'admin'}
                            onCheckedChange={() => handleToggleEdit(profile.id, profile.canEdit)}
                          />
                          <span className="text-xs font-bold">{profile.canEdit || profile.role === 'admin' ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-0 space-y-6 focus-visible:ring-0">
          <div className="flex justify-end px-4 sm:px-0">
            <Button onClick={openAddCategory} className="gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-11 shadow-lg shadow-indigo-500/20">
              <Plus className="h-4 w-4" />
              {t('addCategory')}
            </Button>
          </div>

          <Card className="overflow-hidden border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl">
            <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('categoryName')}</TableHead>
                      <TableHead className="text-center">{t('categoryType')}</TableHead>
                      <TableHead className="text-center">{t('isDefault')}</TableHead>
                      <TableHead className={isRTL ? 'text-left' : 'text-right'}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {categories.map((cat) => (
                        <motion.tr
                          key={cat.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          layout
                          className="group hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                <Tag className="h-4 w-4" />
                              </div>
                              <span>{cat.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={cat.type === 'income' ? 'default' : 'destructive'} className="text-[10px]">
                              {cat.type === 'income' ? t('income') : t('expense')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={cat.isDefault}
                              onCheckedChange={() => {
                                updateCategory(cat.id, { isDefault: !cat.isDefault }).then(() => {
                                  getCategories().then(setCategories);
                                  toast.success(t('success'));
                                }).catch(err => toast.error(err.message));
                              }}
                              className="data-[state=checked]:bg-indigo-500"
                            />
                          </TableCell>
                          <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full"
                                onClick={() => openEditCategory(cat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4 p-4">
                {categories.map((cat) => (
                  <Card key={cat.id} className="p-4 border-none bg-muted/30 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-md ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        <Tag className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={cat.type === 'income' ? 'default' : 'destructive'} className="px-1.5 py-0 text-[8px] uppercase font-black">
                            {cat.type === 'income' ? t('income') : t('expense')}
                          </Badge>
                          {cat.isDefault && (
                            <Badge variant="outline" className="px-1.5 py-0 text-[8px] uppercase font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                              {t('default')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-amber-600 rounded-2xl bg-white dark:bg-slate-800 shadow-xs"
                        onClick={() => openEditCategory(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-rose-600 rounded-2xl bg-white dark:bg-slate-800 shadow-xs"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {categories.length === 0 && (
            <div className="text-center py-20 bg-muted/10 rounded-4xl border-2 border-dashed border-muted/30">
              <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground font-medium">{t('noCategories')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-0 focus-visible:ring-0">
          <Card className="overflow-hidden border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl">
            <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('email')}</TableHead>
                      <TableHead className="text-center">{t('action' as any) || (language === 'ar' ? 'الإجراء' : 'Action')}</TableHead>
                      <TableHead className="text-center">{t('details')}</TableHead>
                      <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.user_email || 'System'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{log.userId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {formatLogAction(log)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getLogDetails(log)}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                          <div className="flex flex-col text-[10px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                          {t('noRecords')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4 p-4">
                {logs.map((log) => (
                  <Card key={log.id} className="p-4 border-none bg-muted/30 rounded-3xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-background shadow-xs">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">{log.action}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-muted/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{language === 'ar' ? 'الهدف' : 'Target'}</span>
                        <span className="text-xs font-bold uppercase opacity-70">{log.entity_type || 'System'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{t('details')}</span>
                        <div className="text-xs opacity-80">{getLogDetails(log)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold truncate max-w-[150px]">{log.user_email || 'System'}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    {t('noRecords')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {profiles.length === 0 && activeView === 'users' && !loading && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
          <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground font-medium">{t('noRecords')}</p>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('edit') : t('addCategory')}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details' : 'Create a new category for all users'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="catName">{t('categoryName')}</Label>
              <Input
                id="catName"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Rent, Salary..."
                className="col-span-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catType">{t('categoryType')}</Label>
              <Select value={newCatType} onValueChange={(v: any) => setNewCatType(v)}>
                <SelectTrigger id="catType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{t('income')}</SelectItem>
                  <SelectItem value="expense">{t('expense')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="catDefault"
                checked={newCatIsDefault}
                onCheckedChange={setNewCatIsDefault}
              />
              <Label htmlFor="catDefault">{t('isDefault')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveCategory} className="bg-indigo-600 hover:bg-indigo-700">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
