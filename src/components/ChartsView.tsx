

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TranslationKey } from '@/lib/i18n';
import { Category, Record } from '@/lib/db';
import { Maximize2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ChartsViewProps {
  t: (key: TranslationKey) => string;
  records: Record[];
  categories: Category[];
  language: string;
  yearlyData?: { month: number; totalIncome: number; totalExpense: number; balance: number }[];
}

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const getMonthName = (month: number, t: (key: TranslationKey) => string): string => {
  const months: TranslationKey[] = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  return t(months[month]);
};

export function ChartsView({ t, records, categories, language, yearlyData }: ChartsViewProps) {
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  // 1. Monthly Income vs Expense Trend (Day by Day)
  const daysInMonth = new Map<string, { date: string, income: number, expense: number, timestamp: number }>();

  records.forEach(r => {
    const d = new Date(r.date);
    const dateStr = d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
    const sortKey = d.toISOString().split('T')[0];
    const existing = daysInMonth.get(sortKey) || { date: dateStr, income: 0, expense: 0, timestamp: d.getTime() };

    if (r.type === 'income') {
      existing.income += (r.cashAmount || 0) + (r.creditAmount || 0);
    } else {
      existing.expense += (r.lineItems || []).reduce((sum, item) => sum + (item.cashAmount || 0) + (item.creditAmount || 0), 0);
    }
    daysInMonth.set(sortKey, existing);
  });

  const dailyData = Array.from(daysInMonth.values()).sort((a, b) => a.timestamp - b.timestamp);

  // 2. Category Distribution
  const categoryDataMap = new Map<string, number>();
  records.filter(r => r.type === 'expense').forEach(r => {
    (r.lineItems || []).forEach(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      const name = cat?.name || t('default');
      categoryDataMap.set(name, (categoryDataMap.get(name) || 0) + (item.cashAmount || 0) + (item.creditAmount || 0));
    });
  });

  const categoryData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({ name, value }));

  // 3. Yearly Data Formatting
  const formattedYearlyData = yearlyData?.map(d => ({
    name: getMonthName(d.month, t),
    income: d.totalIncome,
    expense: d.totalExpense,
  }));

  const renderTrendChart = (height: number | `${number}%` = "100%") => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={dailyData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
        <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
        <Tooltip
          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Line
          type="monotone"
          dataKey="income"
          name={t('income')}
          stroke="#10b981"
          strokeWidth={4}
          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name={t('expense')}
          stroke="#f43f5e"
          strokeWidth={4}
          dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = (height: number | `${number}%` = "100%") => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={categoryData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={8}
          dataKey="value"
          stroke="none"
        >
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderYearlyChart = (height: number | `${number}%` = "100%") => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formattedYearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
        <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 10 }}
          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Bar dataKey="income" name={t('income')} fill="#10b981" radius={[10, 10, 0, 0]} barSize={20} />
        <Bar dataKey="expense" name={t('expense')} fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderDailyBarChart = (height: number | `${number}%` = "100%") => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
        <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 10 }}
          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Bar dataKey="income" name={t('income')} fill="#10b981" radius={[10, 10, 0, 0]} barSize={15} />
        <Bar dataKey="expense" name={t('expense')} fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={15} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-2xl border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl overflow-hidden hover:shadow-blue-500/10 transition-all duration-500 border border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {t('incomeTrend')}
              </CardTitle>
              <CardDescription className="font-medium">{t('monthlyComparison')}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFullscreenChart('trend')} className="rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600">
              <Maximize2 className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="h-[320px] sm:h-[400px] px-2 sm:px-6 pb-6 mt-4">
            {renderTrendChart()}
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl overflow-hidden hover:shadow-purple-500/10 transition-all duration-500 border border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                {t('categoryBreakdown')}
              </CardTitle>
              <CardDescription className="font-medium">{t('expenses')}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFullscreenChart('pie')} className="rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600">
              <Maximize2 className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="h-[320px] sm:h-[400px] px-2 sm:px-6 pb-6 mt-4">
            {renderPieChart()}
          </CardContent>
        </Card>
      </div>

      {formattedYearlyData && (
        <Card className="shadow-2xl border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl overflow-hidden hover:shadow-orange-500/10 transition-all duration-500 border border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                {t('yearly')} {t('incomeTrend')}
              </CardTitle>
              <CardDescription className="font-medium">{t('monthlyComparison')} ({t('fullYear') || 'Full Year'})</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFullscreenChart('yearly')} className="rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600">
              <Maximize2 className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="h-[320px] sm:h-[450px] px-2 sm:px-6 pb-6 mt-4">
            {renderYearlyChart()}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-2xl border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl overflow-hidden hover:shadow-emerald-500/10 transition-all duration-500 border border-white/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {t('monthlyComparison')}
            </CardTitle>
            <CardDescription className="font-medium">{t('total')} {t('income')} vs {t('expense')}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setFullscreenChart('daily')} className="rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600">
            <Maximize2 className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="h-[320px] sm:h-[400px] px-2 sm:px-6 pb-6 mt-4">
          {renderDailyBarChart()}
        </CardContent>
      </Card>

      <Dialog open={!!fullscreenChart} onOpenChange={(open) => !open && setFullscreenChart(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[80vh] sm:h-[90vh] rounded-4xl border-none shadow-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-8 overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black">
              {fullscreenChart === 'trend' && t('incomeTrend')}
              {fullscreenChart === 'pie' && t('categoryBreakdown')}
              {fullscreenChart === 'yearly' && `${t('yearly')} ${t('incomeTrend')}`}
              {fullscreenChart === 'daily' && t('monthlyComparison')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0 w-full mt-4">
            {fullscreenChart === 'trend' && renderTrendChart("90%")}
            {fullscreenChart === 'pie' && renderPieChart("90%")}
            {fullscreenChart === 'yearly' && renderYearlyChart("90%")}
            {fullscreenChart === 'daily' && renderDailyBarChart("90%")}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

