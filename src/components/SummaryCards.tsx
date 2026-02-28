'use client';

import { TrendingUp, TrendingDown, Wallet, Banknote, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { TranslationKey } from '@/lib/i18n';

interface SummaryCardsProps {
  t: (key: TranslationKey) => string;
  formatMoney: (amount: number) => string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCashIncome: number;
  totalCreditIncome: number;
  totalCashExpense: number;
  totalCreditExpense: number;
}

export function SummaryCards({
  t,
  formatMoney,
  totalIncome,
  totalExpense,
  balance,
  totalCashIncome,
  totalCreditIncome,
  totalCashExpense,
  totalCreditExpense,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="relative overflow-hidden border-none bg-linear-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/20 shadow-2xl shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-500 rounded-4xl group border border-emerald-300/30">
        <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
          <TrendingUp className="h-28 w-28 text-emerald-700" />
        </div>
        <CardHeader className="pb-4 relative z-10">
          <CardDescription className="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-[10px]">
            <div className="p-1.5 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <TrendingUp className="h-3 w-3" />
            </div>
            {t('totalIncome')}
          </CardDescription>
          <CardTitle className="text-4xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums tracking-tighter">
            {formatMoney(totalIncome)}
          </CardTitle>
          <div className="flex gap-4 mt-4 pt-4 border-t border-emerald-600/20">
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-700/60 dark:text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <Banknote className="h-3 w-3" /> {t('cash')}
              </span>
              <span className="text-base font-black text-emerald-700 tabular-nums">{formatMoney(totalCashIncome)}</span>
            </div>
            <div className="flex flex-col border-l border-emerald-600/20 pl-4">
              <span className="text-[9px] text-emerald-700/60 dark:text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> {t('credit')}
              </span>
              <span className="text-base font-black text-emerald-700 tabular-nums">{formatMoney(totalCreditIncome)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="relative overflow-hidden border-none bg-linear-to-br from-rose-100 to-rose-200/60 dark:from-rose-900/40 dark:to-rose-800/20 shadow-2xl shadow-rose-500/20 hover:-translate-y-1 transition-all duration-500 rounded-4xl group border border-rose-300/30">
        <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
          <TrendingDown className="h-28 w-28 text-rose-700" />
        </div>
        <CardHeader className="pb-4 relative z-10">
          <CardDescription className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest text-[10px]">
            <div className="p-1.5 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30">
              <TrendingDown className="h-3 w-3" />
            </div>
            {t('totalExpense')}
          </CardDescription>
          <CardTitle className="text-4xl font-black text-rose-800 dark:text-rose-300 tabular-nums tracking-tighter">
            {formatMoney(totalExpense)}
          </CardTitle>
          <div className="flex gap-4 mt-4 pt-4 border-t border-rose-600/20">
            <div className="flex flex-col">
              <span className="text-[9px] text-rose-700/60 dark:text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <Banknote className="h-3 w-3" /> {t('cash')}
              </span>
              <span className="text-base font-black text-rose-700 tabular-nums">{formatMoney(totalCashExpense)}</span>
            </div>
            <div className="flex flex-col border-l border-rose-600/20 pl-4">
              <span className="text-[9px] text-rose-700/60 dark:text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> {t('credit')}
              </span>
              <span className="text-base font-black text-rose-700 tabular-nums">{formatMoney(totalCreditExpense)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="relative overflow-hidden border-none bg-linear-to-br from-blue-100 to-blue-200/60 dark:from-blue-900/40 dark:to-blue-800/20 shadow-2xl shadow-blue-500/20 hover:-translate-y-1 transition-all duration-500 rounded-4xl group border border-blue-300/30">
        <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
          <Wallet className="h-28 w-28 text-blue-700 dark:text-blue-500" />
        </div>
        <CardHeader className="pb-4 relative z-10">
          <CardDescription className="flex items-center gap-2 font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest text-[10px]">
            <div className="p-1.5 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Wallet className="h-3 w-3" />
            </div>
            {t('balance')}
          </CardDescription>
          <CardTitle className="text-4xl font-black text-blue-800 dark:text-blue-300 tabular-nums tracking-tighter">
            {formatMoney(balance)}
          </CardTitle>
          <div className="flex gap-4 mt-4 pt-4 border-t border-blue-600/20">
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-700/60 dark:text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <Banknote className="h-3 w-3" /> {t('totalCash')}
              </span>
              <span className="text-base font-black text-blue-700 tabular-nums">{formatMoney(totalCashIncome - totalCashExpense)}</span>
            </div>
            <div className="flex flex-col border-l border-blue-600/20 pl-4">
              <span className="text-[9px] text-blue-700/60 dark:text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> {t('totalCredit')}
              </span>
              <span className="text-base font-black text-blue-700 tabular-nums">{formatMoney(totalCreditIncome - totalCreditExpense)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
