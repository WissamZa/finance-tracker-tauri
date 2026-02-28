'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { TranslationKey } from '@/lib/i18n';
import { Category } from '@/lib/db';

interface CategoryDialogProps {
  t: (key: TranslationKey) => string;
  categories: Category[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (name: string, type: 'income' | 'expense') => void;
}

export function CategoryDialog({
  t,
  categories,
  isOpen,
  onOpenChange,
  onAddCategory,
}: CategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('income');

  const handleAdd = () => {
    if (categoryName.trim()) {
      onAddCategory(categoryName.trim(), categoryType);
      setCategoryName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('manageCategories')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('manageCategories')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('categoryName')}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Select value={categoryType} onValueChange={(v) => setCategoryType(v as 'income' | 'expense')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">{t('income')}</SelectItem>
                <SelectItem value="expense">{t('expense')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} size="icon" aria-label={t('addCategory') || 'Add Category'}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Badge variant={cat.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                      {cat.type === 'income' ? t('income') : t('expense')}
                    </Badge>
                    <span>{cat.name}</span>
                    {cat.isDefault && (
                      <Badge variant="outline" className="text-xs">{t('default')}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
