import { useState, useEffect } from 'react';
import {
  Plus, TrendingUp, TrendingDown, Banknote, CreditCard,
  Image as ImageIcon, X, FileText, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { resolveFileUrl } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TranslationKey } from '@/lib/i18n';
import { Category, Record } from '@/lib/db';

interface AddRecordDialogProps {
  t: (key: TranslationKey) => string;
  formatMoney: (amount: number) => string;
  categories: Category[];
  editingRecord: Record | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface LineItemInput {
  name: string;
  cashAmount: string;
  creditAmount: string;
  categoryId: string;
  imageData?: string;
  imageName?: string;
  file?: File; // Temporary storage for pending upload
}

export function AddRecordDialog({
  t,
  formatMoney,
  categories,
  editingRecord,
  isOpen,
  onOpenChange,
  onSubmit,
  onCancel,
}: AddRecordDialogProps) {
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formCashAmount, setFormCashAmount] = useState('');
  const [formCreditAmount, setFormCreditAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNote, setFormNote] = useState('');
  const [formLineItems, setFormLineItems] = useState<LineItemInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      setFormType(editingRecord.type as 'income' | 'expense');
      setFormCashAmount(editingRecord.cashAmount?.toString() || '');
      setFormCreditAmount(editingRecord.creditAmount?.toString() || '');
      setFormDate(new Date(editingRecord.date).toISOString().split('T')[0]);
      setFormNote(editingRecord.note || '');
      setFormLineItems(
        (editingRecord.lineItems || []).map(item => ({
          name: item.name,
          cashAmount: (item.cashAmount || 0).toString(),
          creditAmount: (item.creditAmount || 0).toString(),
          categoryId: item.categoryId,
          imageData: item.imageData,
          imageName: item.imageName,
        }))
      );
    } else {
      resetForm();
    }
  }, [editingRecord, isOpen]);

  const resetForm = () => {
    setFormCashAmount('');
    setFormCreditAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNote('');
    setFormLineItems([]);
    setFormType('income');
  };

  const addLineItem = () => {
    const defaultCategory = categories.find(c => c.type === formType && c.isDefault);
    setFormLineItems([
      ...formLineItems,
      { name: '', cashAmount: '', creditAmount: '', categoryId: defaultCategory?.id || '' }
    ]);
  };

  const removeLineItem = (index: number) => {
    setFormLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemInput, value: string) => {
    setFormLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateLineItemsTotal = () => {
    return formLineItems.reduce((sum, item) => sum + (parseFloat(item.cashAmount) || 0) + (parseFloat(item.creditAmount) || 0), 0);
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalLineItems = await Promise.all(
        formLineItems
          .filter(item => item.name.trim() && ((parseFloat(item.cashAmount) || 0) > 0 || (parseFloat(item.creditAmount) || 0) > 0))
          .map(async (item) => {
            let finalImageData = item.imageData;

            // If there's a pending file, upload it now
            if (item.file) {
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: item.file.name,
                  contentType: item.file.type,
                  fileSize: item.file.size,
                }),
              });

              if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.error || `Upload failed for ${item.file.name}`);
              }

              const { presignedUrl, key } = await uploadResponse.json();

              const cloudflareRes = await fetch(presignedUrl, {
                method: 'PUT',
                body: item.file,
              });

              if (!cloudflareRes.ok) throw new Error(`Cloudflare upload failed for ${item.file.name}`);

              finalImageData = key;
            }

            return {
              name: item.name,
              cashAmount: parseFloat(item.cashAmount) || 0,
              creditAmount: parseFloat(item.creditAmount) || 0,
              categoryId: item.categoryId,
              imageData: finalImageData,
              imageName: item.imageName,
            };
          })
      );

      onSubmit({
        type: formType,
        cashAmount: parseFloat(formCashAmount) || 0,
        creditAmount: parseFloat(formCreditAmount) || 0,
        date: new Date(formDate),
        note: formNote || null,
        lineItems: finalLineItems,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === formType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <div className={`p-2 rounded-xl text-white ${formType === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {formType === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            {editingRecord ? t('edit') : (formType === 'income' ? t('addIncome') : t('addExpense'))}
          </DialogTitle>
          <DialogDescription>
            {editingRecord ? 'Update your record details below' : 'Record your financial transaction'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={formType === 'income' ? 'default' : 'outline'}
              className={formType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
              onClick={() => setFormType('income')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {t('income')}
            </Button>
            <Button
              type="button"
              variant={formType === 'expense' ? 'default' : 'outline'}
              className={formType === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : ''}
              onClick={() => setFormType('expense')}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              {t('expense')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t('date')}</Label>
              <Input
                id="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>

          {formType === 'income' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cashAmount" className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  {t('cash')} {t('amount')}
                </Label>
                <Input
                  id="cashAmount"
                  type="number"
                  placeholder="0.00"
                  value={formCashAmount}
                  onChange={(e) => setFormCashAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditAmount" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  {t('credit')} {t('amount')}
                </Label>
                <Input
                  id="creditAmount"
                  type="number"
                  placeholder="0.00"
                  value={formCreditAmount}
                  onChange={(e) => setFormCreditAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          {formType === 'expense' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-bold flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                  {t('items') || 'Items'}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="rounded-xl border-rose-200 hover:bg-rose-50 text-rose-600">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addItem')}
                </Button>
              </div>

              {formLineItems.length > 0 ? (
                <div className="space-y-4">
                  {formLineItems.map((item, index) => (
                    <Card key={index} className="relative p-4 border-none bg-muted/30 rounded-3xl overflow-visible">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg z-10"
                        onClick={() => removeLineItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">{t('itemName')}</Label>
                            <Input
                              placeholder={t('itemName')}
                              value={item.name}
                              onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                              className="bg-background rounded-2xl border-none shadow-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">{t('category')}</Label>
                            <Select
                              value={item.categoryId}
                              onValueChange={(v) => updateLineItem(index, 'categoryId', v)}
                            >
                              <SelectTrigger className="bg-background rounded-2xl border-none shadow-xs">
                                <SelectValue placeholder={t('selectCategory')} />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                {filteredCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id} className="rounded-xl">
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 flex items-center gap-1">
                              <Banknote className="h-3 w-3 text-emerald-500" />
                              {t('cash')}
                            </Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.cashAmount}
                              onChange={(e) => updateLineItem(index, 'cashAmount', e.target.value)}
                              className="bg-background rounded-2xl border-none shadow-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-blue-500" />
                              {t('credit')}
                            </Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.creditAmount}
                              onChange={(e) => updateLineItem(index, 'creditAmount', e.target.value)}
                              className="bg-background rounded-2xl border-none shadow-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {t('image')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              id={`image-upload-${index}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 50 * 1024 * 1024) {
                                    toast.error("File exceeds 50MB limit");
                                    return;
                                  }

                                  // Just store the file and a local preview URL for now
                                  const localUrl = URL.createObjectURL(file);
                                  setFormLineItems(prev => {
                                    const updated = [...prev];
                                    updated[index] = {
                                      ...updated[index],
                                      file,
                                      imageData: localUrl,
                                      imageName: file.name
                                    };
                                    return updated;
                                  });
                                }
                                e.target.value = '';
                              }}
                            />
                            {item.imageData ? (
                              <div className="flex items-center gap-2">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-white ring-2 ring-muted group">
                                  {item.imageName?.toLowerCase().endsWith('.pdf') ? (
                                    <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500">
                                      <FileText className="h-6 w-6" />
                                    </div>
                                  ) : (
                                    <img
                                      src={resolveFileUrl(item.imageData)}
                                      alt={item.imageName || 'uploaded'}
                                      className="w-full h-full object-cover transition-opacity hover:opacity-80"
                                    />
                                  )}
                                  <label htmlFor={`image-upload-${index}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                    <Plus className="h-4 w-4 text-white" />
                                  </label>
                                </div>
                                <div className="flex flex-col max-w-[120px]">
                                  <span className="text-[10px] font-medium truncate">{item.imageName}</span>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="h-auto p-0 text-rose-500 text-[10px] justify-start"
                                    onClick={() => {
                                      setFormLineItems(prev => {
                                        const updated = [...prev];
                                        updated[index] = { ...updated[index], file: undefined, imageData: '', imageName: '' };
                                        return updated;
                                      });
                                    }}
                                  >
                                    {t('remove' as any) || 'Remove'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label htmlFor={`image-upload-${index}`} className="cursor-pointer">
                                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-colors group">
                                  <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-accent-foreground" />
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6 rounded-3xl border-rose-200 hover:bg-rose-50 text-rose-600 border-2 border-dashed font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    onClick={addLineItem}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('addItem')}
                  </Button>
                  <div className="p-4 bg-muted/30 rounded-3xl border border-dashed flex justify-between items-center px-6">
                    <span className="text-sm font-bold text-muted-foreground">{t('subtotal')}:</span>
                    <span className="text-xl font-black tabular-nums">{formatMoney(calculateLineItemsTotal())}</span>
                  </div>


                </div>
              ) : (
                <div
                  className="py-10 border-2 border-dashed rounded-4xl flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={addLineItem}
                >
                  <div className="p-3 rounded-2xl bg-muted/50 mb-3">
                    <Plus className="h-6 w-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">{t('addItem')}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">{t('noteOptional')}</Label>
            <Textarea
              id="note"
              placeholder={t('enterNote')}
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg">
            {formType === 'income' && (
              <>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>{t('cash')}:</span>
                  <span>{formatMoney(parseFloat(formCashAmount) || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>{t('credit')}:</span>
                  <span>{formatMoney(parseFloat(formCreditAmount) || 0)}</span>
                </div>
              </>
            )}
            {formType === 'expense' && formLineItems.length > 0 && (
              <div className="flex justify-between items-center text-sm mb-2">
                <span>{t('items')} {t('total')}:</span>
                <span>{formatMoney(calculateLineItemsTotal())}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>{t('total')}:</span>
              <span className={formType === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                {formatMoney(
                  formType === 'income'
                    ? (parseFloat(formCashAmount) || 0) + (parseFloat(formCreditAmount) || 0)
                    : calculateLineItemsTotal()
                )}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>

          <Button
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className={formType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving' as any) || 'Saving...'}
              </>
            ) : (
              editingRecord ? t('save') : t('submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
