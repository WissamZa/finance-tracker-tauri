

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { TranslationKey } from '@/lib/i18n';
import { DatabaseSource } from '@/lib/store';
import { bulkAddRecords, getCategories } from '@/lib/db';
import { toast } from 'sonner';

interface BatchImportDialogProps {
  t: (key: TranslationKey) => string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  databaseSource: DatabaseSource;
  currentYear: number;
  onSuccess: () => void;
}

export function BatchImportDialog({
  t,
  isOpen,
  onOpenChange,
  databaseSource,
  currentYear,
  onSuccess
}: BatchImportDialogProps) {
  const [data, setData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!data.trim()) return;
    
    setIsProcessing(true);
    try {
      const lines = data.split('\n');
      const categories = await getCategories(databaseSource);
      
      const defaultIncomeCat = categories.find(c => c.type === 'income' && c.isDefault)?.id || categories.find(c => c.type === 'income')?.id || '';
      const defaultExpenseCat = categories.find(c => c.type === 'expense' && c.isDefault)?.id || categories.find(c => c.type === 'expense')?.id || '';

      const recordsByDate = new Map<string, { incomeCash: number; incomeCredit: number; totalExpense: number; timestamp: number }>();

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Split by comma or tab
        const parts = line.split(/[,\t]/).map(p => p.trim());
        if (parts.length < 2) continue;

        const dateStr = parts[0];
        const incomeCash = parseFloat(parts[1]) || 0;
        const incomeCredit = parts.length > 2 ? parseFloat(parts[2]) || 0 : 0;
        const totalExpense = parts.length > 3 ? parseFloat(parts[3]) || 0 : 0;

        // Skip if everything is zero
        if (incomeCash === 0 && incomeCredit === 0 && totalExpense === 0) continue;

        // Parse date DD/MM/YYYY
        let dateObj: Date;
        if (dateStr.includes('/')) {
          const dateParts = dateStr.split('/');
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = dateParts.length > 2 ? parseInt(dateParts[2], 10) : currentYear;
          // Set to 12:00 PM to avoid day shifting in different timezones
          dateObj = new Date(year, month - 1, day, 12, 0, 0);
        } else {
          dateObj = new Date(dateStr);
          dateObj.setHours(12, 0, 0, 0);
        }

        if (isNaN(dateObj.getTime())) continue;

        // Group by local date string to preserve the intended day
        const dateKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;
        const existing = recordsByDate.get(dateKey) || { incomeCash: 0, incomeCredit: 0, totalExpense: 0, timestamp: dateObj.getTime() };
        
        recordsByDate.set(dateKey, {
          incomeCash: existing.incomeCash + incomeCash,
          incomeCredit: existing.incomeCredit + incomeCredit,
          totalExpense: existing.totalExpense + totalExpense,
          timestamp: existing.timestamp
        });
      }

      const recordsToSave: any[] = [];
      for (const entry of Array.from(recordsByDate.values())) {
        const date = new Date(entry.timestamp);

        // Add Income record if any
        if (entry.incomeCash > 0 || entry.incomeCredit > 0) {
          recordsToSave.push({
            type: 'income',
            cashAmount: entry.incomeCash,
            creditAmount: entry.incomeCredit,
            date,
            note: 'Batch Import',
            lineItems: [{
              name: 'Income',
              cashAmount: entry.incomeCash,
              creditAmount: entry.incomeCredit,
              categoryId: defaultIncomeCat
            }]
          });
        }

        // Add Expense record if any
        if (entry.totalExpense > 0) {
          recordsToSave.push({
            type: 'expense',
            cashAmount: entry.totalExpense,
            creditAmount: 0,
            date,
            note: 'Batch Import',
            lineItems: [{
              name: 'Expense',
              cashAmount: entry.totalExpense,
              creditAmount: 0,
              categoryId: defaultExpenseCat
            }]
          });
        }
      }

      if (recordsToSave.length > 0) {
        await bulkAddRecords(databaseSource, recordsToSave);
        toast.success(t('success'), { description: `${recordsToSave.length} records added` });
        setData('');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(t('error'), { description: 'No valid records found' });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('error'), { description: String(error) });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('batchImport' as any) || 'Batch Import'}</DialogTitle>
          <DialogDescription>
            {t('batchImportDescription' as any) || 'Paste your daily records here. Format: Date (DD/MM), Income Cash, Income Credit, Total Expense'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="batch-data">{t('pasteDailyData' as any) || 'Paste daily data'}</Label>
            <Textarea
              id="batch-data"
              placeholder="01/01/2026, 100, 50, 80&#10;02/01/2026, 120, 60, 90"
              className="h-64 font-mono text-sm"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('batchImportHint' as any) || 'One record per line. Separate values with commas or tabs.'}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {t('cancel')}
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleImport}
            disabled={isProcessing || !data.trim()}
          >
            {isProcessing ? t('loading') : (t('process' as any) || 'Process')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
