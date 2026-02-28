'use client';

import {
  Calendar, ArrowUpDown, Banknote, CreditCard, MoreVertical,
  Edit, Trash2, TrendingUp, TrendingDown, Tag, FileText
} from 'lucide-react';
import { resolveFileUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { TranslationKey } from '@/lib/i18n';
import { Category, Record } from '@/lib/db';
import Image from 'next/image';

interface RecordsListProps {
  t: (key: TranslationKey) => string;
  formatMoney: (amount: number) => string;
  formatDate: (dateStr: string | Date, t: (key: TranslationKey) => string) => { formatted: string; weekday: string };
  isLoading: boolean;
  sortedGroupedRecords: any[];
  categories: Category[];
  sortBy: string;
  setSortBy: (val: string) => void;
  onEdit: (record: Record) => void;
  onDelete: (id: string) => void;
  isRTL: boolean;
  canEdit?: boolean;
  averageIncome?: number;
  isAdmin?: boolean;
  onFileDelete?: (key: string) => Promise<void>;
  signedUrls?: { [key: string]: string };
}

function RecordsListSkeleton({ isRTL, t }: { isRTL: boolean, t: any }) {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
            <div className="h-px flex-1 bg-muted/50" />
          </div>
          <div className="space-y-2">
            {[1, 2].map(j => (
              <div key={j} className="h-20 bg-muted/30 animate-pulse rounded-2xl border border-muted/20" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecordsList({
  t,
  formatMoney,
  formatDate,
  isLoading,
  sortedGroupedRecords,
  categories,
  sortBy,
  setSortBy,
  onEdit,
  onDelete,
  isRTL,
  canEdit = true,
  averageIncome = 0,
  isAdmin = false,
  onFileDelete,
  signedUrls = {},
}: RecordsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('monthly')} {t('records')}
          </CardTitle>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">{t('sortByDate')}</SelectItem>
              <SelectItem value="income-low">{t('sortByIncomeLow')}</SelectItem>
              <SelectItem value="income-high">{t('sortByIncomeHigh')}</SelectItem>
              <SelectItem value="expense-low">{t('sortByExpenseLow')}</SelectItem>
              <SelectItem value="expense-high">{t('sortByExpenseHigh')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <RecordsListSkeleton isRTL={isRTL} t={t} />
        ) : sortedGroupedRecords.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-3xl bg-muted/30 mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <div className="text-muted-foreground mb-2 text-xl font-semibold">{t('noRecords')}</div>
            <div className="text-sm text-muted-foreground/60">{t('addFirstRecord')}</div>
          </div>
        ) : (
          <ScrollArea className="h-[70vh] sm:h-[calc(100vh-450px)] min-h-[500px] pr-4 -mr-4">
            <div className="space-y-6 pb-20 sm:pb-4">
              {sortedGroupedRecords.map((group) => {
                const { formatted, weekday } = formatDate(group.dateObj, t);

                return (
                  <div key={group.date} className="group relative">
                    <div className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-3 mb-4 flex items-center justify-between border border-emerald-100/50 dark:border-slate-800/50 rounded-3xl shadow-xl shadow-emerald-500/5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-black text-base tracking-tight text-slate-900 dark:text-slate-100">{weekday}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{formatted}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        {group.totalIncome > 0 && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-emerald-600/70 uppercase font-black tracking-widest">{t('income')}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums text-base">
                              +{formatMoney(group.totalIncome)}
                            </span>
                          </div>
                        )}
                        {group.totalExpense > 0 && (
                          <div className="flex flex-col items-end border-l border-emerald-100/50 dark:border-slate-800/50 pl-4">
                            <span className="text-[10px] text-rose-600/70 uppercase font-black tracking-widest">{t('expense')}</span>
                            <span className="text-rose-600 dark:text-rose-400 font-black tabular-nums text-base">
                              -{formatMoney(group.totalExpense)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 px-1">
                      {group.incomeRecords.map((record: Record) => (
                        <Card key={record.id} className="overflow-hidden border-none bg-linear-to-br from-emerald-100 to-white dark:from-emerald-900/30 dark:to-transparent hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-500 rounded-4xl border border-emerald-200/40 dark:border-emerald-800/20">
                          <div className="p-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
                                  <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{t('income')}</span>
                                  <div className="font-black text-2xl text-emerald-800 dark:text-emerald-400 tabular-nums tracking-tighter">
                                    {formatMoney((record.cashAmount || 0) + (record.creditAmount || 0))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {averageIncome > 0 && (
                                  <div className="hidden sm:flex flex-col items-end gap-1 min-w-[80px]">
                                    {((record.cashAmount || 0) + (record.creditAmount || 0)) > averageIncome ? (
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 animate-pulse">
                                        <TrendingUp className="h-3 w-3" />
                                        {t('aboveAverage')}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-70">
                                        <TrendingDown className="h-3 w-3" />
                                        {t('belowAverage')}
                                      </div>
                                    )}
                                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-500 ${((record.cashAmount || 0) + (record.creditAmount || 0)) > averageIncome ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                        style={{ width: `${Math.min(100, (((record.cashAmount || 0) + (record.creditAmount || 0)) / (averageIncome * 1.5)) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20">
                                      <MoreVertical className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="rounded-2xl border-emerald-100 dark:border-emerald-900/30">
                                    <DropdownMenuItem onClick={() => onEdit(record)} disabled={!canEdit} className="rounded-xl">
                                      <Edit className="mr-2 h-4 w-4" />
                                      {t('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onDelete(record.id)}
                                      className="text-rose-600 rounded-xl"
                                      disabled={!canEdit}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t('delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {record.cashAmount > 0 && (
                                <Badge variant="outline" className="bg-white/50 dark:bg-slate-900/50 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-full px-3 py-0.5">
                                  <Banknote className="h-3 w-3 mr-1" />
                                  {formatMoney(record.cashAmount)}
                                </Badge>
                              )}
                              {record.creditAmount > 0 && (
                                <Badge variant="outline" className="bg-white/50 dark:bg-slate-900/50 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-full px-3 py-0.5">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {formatMoney(record.creditAmount)}
                                </Badge>
                              )}
                            </div>

                            {record.note && (
                              <div className="mt-3 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/30 text-sm text-muted-foreground border border-emerald-100/10 italic">
                                &ldquo;{record.note}&rdquo;
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}

                      {group.expenseRecords.map((record: Record) => (
                        <Card key={record.id} className="overflow-hidden border-none bg-linear-to-br from-rose-100 to-white dark:from-rose-900/30 dark:to-transparent hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-500 rounded-4xl border border-rose-200/40 dark:border-rose-800/20">
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-600/30">
                                  <TrendingDown className="h-5 w-5" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{t('expense')}</span>
                                  <div className="font-black text-2xl text-rose-800 dark:text-rose-400 tabular-nums tracking-tighter">
                                    {formatMoney((record.lineItems || []).reduce((sum, item) =>
                                      sum + (item.cashAmount || 0) + (item.creditAmount || 0), 0))}
                                  </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-rose-100/50 dark:hover:bg-rose-900/20">
                                    <MoreVertical className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="rounded-2xl border-rose-100 dark:border-rose-900/30">
                                  <DropdownMenuItem onClick={() => onEdit(record)} disabled={!canEdit} className="rounded-xl">
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDelete(record.id)}
                                    className="text-rose-600 rounded-xl"
                                    disabled={!canEdit}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {record.lineItems && record.lineItems.length > 0 && (
                              <div className="space-y-2 mt-4">
                                {record.lineItems.map((item) => {
                                  const cat = categories.find(c => c.id === item.categoryId);
                                  return (
                                    <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/40 gap-3">
                                      <div className="flex items-center gap-3">
                                        {item.imageData ? (
                                          <div
                                            className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-md border-2 border-white ring-2 ring-muted bg-muted"
                                            onClick={() => window.open(signedUrls[item.imageData!] || resolveFileUrl(item.imageData!), '_blank')}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' || e.key === ' ') {
                                                window.open(signedUrls[item.imageData!] || resolveFileUrl(item.imageData!), '_blank');
                                              }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={t('viewImage') || 'View image'}
                                          >
                                            {item.imageName?.toLowerCase().endsWith('.pdf') ? (
                                              <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500">
                                                <FileText className="h-6 w-6" />
                                              </div>
                                            ) : (
                                              <Image
                                                src={signedUrls[item.imageData!] || resolveFileUrl(item.imageData!)}
                                                alt={item.imageName || 'image'}
                                                fill
                                                className="object-cover transition-transform hover:scale-110"
                                              />
                                            )}
                                            {isAdmin && onFileDelete && (
                                              <div
                                                className="absolute top-1 right-1 z-20"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(t('confirmDelete' as any) || 'Delete this file?')) {
                                                    onFileDelete(item.imageData!);
                                                  }
                                                }}
                                              >
                                                <Button
                                                  variant="destructive"
                                                  size="icon"
                                                  className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/50 flex items-center justify-center">
                                            <Tag className="h-4 w-4 text-muted-foreground/40" />
                                          </div>
                                        )}
                                        <div className="flex flex-col">
                                          <span className="font-bold text-sm text-foreground">{item.name}</span>
                                          <Badge variant="outline" className="w-fit text-[10px] h-4 leading-none bg-muted/30 border-none px-1.5 font-medium rounded-sm">
                                            {cat?.name || t('default')}
                                          </Badge>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {item.cashAmount > 0 && (
                                          <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                              <Banknote className="h-2 w-2" />
                                              {t('cash')}
                                            </div>
                                            <span className="text-xs font-bold tabular-nums">{formatMoney(item.cashAmount)}</span>
                                          </div>
                                        )}
                                        {item.creditAmount > 0 && (
                                          <div className="flex flex-col items-end border-l pl-2 dark:border-slate-800">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                              <CreditCard className="h-2 w-2" />
                                              {t('credit')}
                                            </div>
                                            <span className="text-xs font-bold tabular-nums">{formatMoney(item.creditAmount)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {record.note && (
                              <div className="mt-4 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/30 text-sm text-muted-foreground border border-rose-100/10 italic leading-relaxed">
                                &ldquo;{record.note}&rdquo;
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
