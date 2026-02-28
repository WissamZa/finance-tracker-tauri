import { bulkAddRecords, getCategories } from './db';
import { DatabaseSource } from './store';

// Simple CSV parser that handles quotes and escaped quotes
export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
};

interface ImportedRecord {
  type: 'income' | 'expense';
  cashAmount: number;
  creditAmount: number;
  date: Date;
  note: string;
  lineItems: {
    name: string;
    cashAmount: number;
    creditAmount: number;
    categoryId: string;
  }[];
}

export async function importFromCSV(source: DatabaseSource, csvContent: string) {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length < 2) return;

  const headers = parseCSVLine(lines[0]);
  
  // Get existing categories to map names to IDs
  const categories = await getCategories(source);
  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
  const defaultIncomeCat = categories.find(c => c.type === 'income' && c.isDefault)?.id || categories.find(c => c.type === 'income')?.id || '';
  const defaultExpenseCat = categories.find(c => c.type === 'expense' && c.isDefault)?.id || categories.find(c => c.type === 'expense')?.id || '';

  // Header indices
  const dateIdx = headers.indexOf('Date');
  const typeIdx = headers.indexOf('Type');
  const itemNameIdx = headers.indexOf('Item Name');
  const categoryIdx = headers.indexOf('Category');
  const cashAmountIdx = headers.indexOf('Cash Amount');
  const creditAmountIdx = headers.indexOf('Credit Amount');
  const noteIdx = headers.indexOf('Note');

  if (dateIdx === -1 || typeIdx === -1) {
    throw new Error('Invalid CSV format: Date and Type columns are required');
  }

  // Group by Date, Type, and Note to reconstruct records with multiple line items
  const groupedRecords = new Map<string, ImportedRecord>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const dateStr = values[dateIdx];
    if (!dateStr) continue;

    const typeStr = values[typeIdx]?.toLowerCase();
    const type = (typeStr === 'income' || typeStr === 'expense') ? typeStr : 'expense';
    const itemName = itemNameIdx !== -1 ? values[itemNameIdx] : '';
    const categoryName = categoryIdx !== -1 ? values[categoryIdx] : '';
    const cashAmount = cashAmountIdx !== -1 ? parseFloat(values[cashAmountIdx]) || 0 : 0;
    const creditAmount = creditAmountIdx !== -1 ? parseFloat(values[creditAmountIdx]) || 0 : 0;
    const note = noteIdx !== -1 ? values[noteIdx]?.replace(/^"|"$/g, '') || '' : '';

    // Parse date DD/MM/YYYY
    let date: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) continue;

    const groupKey = `${date.getTime()}-${type}-${note}`;

    if (!groupedRecords.has(groupKey)) {
      groupedRecords.set(groupKey, {
        type,
        cashAmount: 0,
        creditAmount: 0,
        date,
        note,
        lineItems: []
      });
    }

    const record = groupedRecords.get(groupKey)!;
    
    if (itemName || categoryName || cashAmount > 0 || creditAmount > 0) {
      const categoryId = (categoryName && categoryMap.get(categoryName.toLowerCase())) || 
                         (type === 'income' ? defaultIncomeCat : defaultExpenseCat);
      
      record.lineItems.push({
        name: itemName || 'Item',
        cashAmount,
        creditAmount,
        categoryId
      });
      
      record.cashAmount += cashAmount;
      record.creditAmount += creditAmount;
    }
  }

  const finalRecords = Array.from(groupedRecords.values());
  
  // Final check: if we want to ensure records with zero amounts are ignored
  const filteredRecords = finalRecords.filter(r => r.cashAmount > 0 || r.creditAmount > 0 || r.lineItems.length > 0);
  
  if (filteredRecords.length > 0) {
    // Map to the format expected by bulkAddRecords
    const recordsToSave = filteredRecords.map(r => ({
      ...r,
      note: r.note || null,
      lineItems: r.lineItems.map(li => ({ ...li, imageData: undefined, imageName: undefined }))
    }));
    
    await bulkAddRecords(source, recordsToSave);
  }
}
