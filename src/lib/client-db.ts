import Dexie, { Table } from 'dexie';

// Types
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  id: string;
  name: string;
  cashAmount: number;
  creditAmount: number;
  categoryId: string;
  recordId: string;
  imageData?: string; // Base64 encoded image data
  imageName?: string; // Original file name
  createdAt: Date;
  updatedAt: Date;
}

export interface Record {
  id: string;
  type: 'income' | 'expense';
  cashAmount: number;
  creditAmount: number;
  date: Date;
  note: string | null;
  lineItems: LineItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Database class
class FinanceDatabase extends Dexie {
  categories!: Table<Category>;
  records!: Table<Record>;
  lineItems!: Table<LineItem>;

  constructor() {
    super('FinanceTrackerDB');
    
    this.version(1).stores({
      categories: 'id, name, type, isDefault',
      records: 'id, type, date, createdAt',
      lineItems: 'id, recordId, categoryId',
    });
  }
}

export const db = new FinanceDatabase();

// Helper functions
const generateId = () => crypto.randomUUID();

// Initialize default categories
export async function initDefaultCategories() {
  const existingCount = await db.categories.count();
  
  if (existingCount === 0) {
    const defaultCategories: Category[] = [
      { id: generateId(), name: 'Default', type: 'income', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Default', type: 'expense', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Salary', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Freelance', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Investment', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Bonus', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Food', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Transport', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Shopping', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Bills', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Entertainment', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Health', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Education', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Rent', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
      { id: generateId(), name: 'Utilities', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    ];
    
    await db.categories.bulkAdd(defaultCategories);
  }
}

// Category operations
export async function getCategories(type?: 'income' | 'expense') {
  if (type) {
    return db.categories.where('type').equals(type).toArray();
  }
  return db.categories.toArray();
}

export async function addCategory(name: string, type: 'income' | 'expense', isDefault: boolean = false) {
  const id = generateId();
  const now = new Date();
  
  if (isDefault) {
    // Remove default from other categories of same type
    await db.categories.where('type').equals(type).modify({ isDefault: false });
  }
  
  await db.categories.add({
    id,
    name,
    type,
    isDefault,
    createdAt: now,
    updatedAt: now,
  });
  
  return id;
}

export async function updateCategory(id: string, updates: Partial<{ name: string; type: 'income' | 'expense'; isDefault: boolean }>) {
  if (updates.isDefault) {
    const cat = await db.categories.get(id);
    if (cat) {
      await db.categories.where('type').equals(cat.type).modify({ isDefault: false });
    }
  }
  
  await db.categories.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteCategory(id: string) {
  // Check if category has line items
  const lineItemsCount = await db.lineItems.where('categoryId').equals(id).count();
  
  if (lineItemsCount > 0) {
    throw new Error('Cannot delete category with existing records');
  }
  
  await db.categories.delete(id);
}

// Record operations
export async function getRecords(month?: number, year?: number) {
  let records = await db.records.toArray();
  
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    records = records.filter(r => {
      const date = new Date(r.date);
      return date >= startDate && date <= endDate;
    });
  } else if (year !== undefined) {
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    
    records = records.filter(r => {
      const date = new Date(r.date);
      return date >= startDate && date <= endDate;
    });
  }
  
  // Get line items for each record
  const recordsWithItems = await Promise.all(
    records.map(async (record) => {
      const lineItems = await db.lineItems.where('recordId').equals(record.id).toArray();
      return { ...record, lineItems };
    })
  );
  
  // Sort by date descending
  return recordsWithItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addRecord(
  type: 'income' | 'expense',
  cashAmount: number,
  creditAmount: number,
  date: Date,
  note: string | null,
  lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[]
) {
  const id = generateId();
  const now = new Date();
  
  // Create unique date key (ignoring time)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Check for existing record of same type on this date
  const existingRecord = await db.records
    .where('type').equals(type)
    .filter(r => {
      const rDate = new Date(r.date);
      return rDate >= startOfDay && rDate <= endOfDay;
    })
    .first();

  if (existingRecord) {
    // Update existing instead of adding
    await updateRecord(existingRecord.id, type, cashAmount, creditAmount, date, note, lineItems);
    return existingRecord.id;
  }

  // Create record
  await db.records.add({
    id,
    type,
    cashAmount,
    creditAmount,
    date,
    note,
    lineItems: [],
    createdAt: now,
    updatedAt: now,
  });
  
  // Add line items
  if (lineItems.length > 0) {
    const lineItemsToAdd = lineItems.map(item => ({
      id: generateId(),
      name: item.name,
      cashAmount: item.cashAmount,
      creditAmount: item.creditAmount,
      categoryId: item.categoryId,
      recordId: id,
      imageData: item.imageData,
      imageName: item.imageName,
      createdAt: now,
      updatedAt: now,
    }));
    
    await db.lineItems.bulkAdd(lineItemsToAdd);
  }
  
  return id;
}

export async function bulkAddRecords(
  records: {
    type: 'income' | 'expense';
    cashAmount: number;
    creditAmount: number;
    date: Date;
    note: string | null;
    lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[];
  }[]
) {
  const now = new Date();
  const recordsToInsert: Record[] = [];
  const lineItemsToInsert: LineItem[] = [];

  for (const recordData of records) {
    // Check if this date already has a record in the current batch or DB
    const startOfDay = new Date(recordData.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordData.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingInDb = await db.records
      .where('type').equals(recordData.type)
      .filter(r => {
        const rDate = new Date(r.date);
        return rDate >= startOfDay && rDate <= endOfDay;
      })
      .first();
    
    if (existingInDb) {
      // Update existing record's totals and line items
      await updateRecord(existingInDb.id, recordData.type, recordData.cashAmount, recordData.creditAmount, recordData.date, recordData.note, recordData.lineItems);
      continue;
    }

    const recordId = generateId();
    recordsToInsert.push({
      id: recordId,
      type: recordData.type,
      cashAmount: recordData.cashAmount,
      creditAmount: recordData.creditAmount,
      date: recordData.date,
      note: recordData.note,
      lineItems: [],
      createdAt: now,
      updatedAt: now,
    });

    if (recordData.lineItems && recordData.lineItems.length > 0) {
      recordData.lineItems.forEach(item => {
        lineItemsToInsert.push({
          id: generateId(),
          name: item.name,
          cashAmount: item.cashAmount,
          creditAmount: item.creditAmount,
          categoryId: item.categoryId,
          recordId: recordId,
          imageData: item.imageData,
          imageName: item.imageName,
          createdAt: now,
          updatedAt: now,
        });
      });
    }
  }

  if (recordsToInsert.length > 0) {
    await db.records.bulkAdd(recordsToInsert);
  }
  if (lineItemsToInsert.length > 0) {
    await db.lineItems.bulkAdd(lineItemsToInsert);
  }
}

export async function updateRecord(
  id: string,
  type: 'income' | 'expense',
  cashAmount: number,
  creditAmount: number,
  date: Date,
  note: string | null,
  lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[]
) {
  const now = new Date();
  
  // Update record
  await db.records.update(id, {
    type,
    cashAmount,
    creditAmount,
    date,
    note,
    updatedAt: now,
  });
  
  // Delete old line items
  await db.lineItems.where('recordId').equals(id).delete();
  
  // Add new line items
  if (lineItems.length > 0) {
    const lineItemsToAdd = lineItems.map(item => ({
      id: generateId(),
      name: item.name,
      cashAmount: item.cashAmount,
      creditAmount: item.creditAmount,
      categoryId: item.categoryId,
      recordId: id,
      imageData: item.imageData,
      imageName: item.imageName,
      createdAt: now,
      updatedAt: now,
    }));
    
    await db.lineItems.bulkAdd(lineItemsToAdd);
  }
}

export async function deleteRecord(id: string) {
  // Delete line items first
  await db.lineItems.where('recordId').equals(id).delete();
  
  // Delete record
  await db.records.delete(id);
}

// Backup and Restore
export async function createBackup() {
  const categories = await db.categories.toArray();
  const records = await db.records.toArray();
  const lineItems = await db.lineItems.toArray();
  
  return {
    version: '2.0',
    timestamp: new Date().toISOString(),
    data: {
      categories,
      records,
      lineItems,
    },
  };
}

export async function restoreBackup(backupData: {
  data: {
    categories: Category[];
    records: Record[];
    lineItems: LineItem[];
  };
}) {
  // Clear existing data
  await db.lineItems.clear();
  await db.records.clear();
  await db.categories.clear();
  
  // Restore data
  if (backupData.data.categories?.length) {
    await db.categories.bulkAdd(backupData.data.categories);
  }
  
  if (backupData.data.records?.length) {
    await db.records.bulkAdd(backupData.data.records);
  }
  
  if (backupData.data.lineItems?.length) {
    await db.lineItems.bulkAdd(backupData.data.lineItems);
  }
}

// Export functions
export async function exportToJSON(month?: number, year?: number) {
  const records = await getRecords(month, year);
  return {
    exportDate: new Date().toISOString(),
    records,
  };
}

export async function exportToCSV(month?: number, year?: number) {
  const records = await getRecords(month, year);
  const categories = await getCategories();
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const headers = ['Date', 'Type', 'Item Name', 'Category', 'Cash Amount', 'Credit Amount', 'Total', 'Note'];
  const csvRows = [headers.join(',')];
  
  for (const record of records) {
    const date = new Date(record.date);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    
    if (record.lineItems.length === 0) {
      const total = (record.cashAmount || 0) + (record.creditAmount || 0);
      const row = [
        formattedDate,
        record.type,
        '',
        '',
        record.cashAmount.toString(),
        record.creditAmount.toString(),
        total.toString(),
        `"${(record.note || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    } else {
      for (const item of record.lineItems) {
        const itemTotal = (item.cashAmount || 0) + (item.creditAmount || 0);
        const row = [
          formattedDate,
          record.type,
          `"${item.name.replace(/"/g, '""')}"`,
          categoryMap.get(item.categoryId) || 'Default',
          item.cashAmount.toString(),
          item.creditAmount.toString(),
          itemTotal.toString(),
          `"${(record.note || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      }
    }
  }
  
  return csvRows.join('\n');
}

// Clear all data
export async function clearAllData() {
  await db.lineItems.clear();
  await db.records.clear();
  await db.categories.clear();
}
